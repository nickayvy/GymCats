"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { distanceMeters } from "@/lib/battle/rules";
import { getGymPlace, searchGyms, searchRadius } from "@/lib/battle/places";
import { mapRpcError, loadBattleState } from "@/lib/battle/server";
import type { BattleState, NearbyGym, SpinResult } from "@/lib/battle/state";
import { getGoogleMapsApiKey, getSupabaseConfig } from "@/lib/env";
import type { ActionResult } from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";

const UNAVAILABLE_ERROR = "Battles are unavailable: Supabase is not configured.";

const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100_000),
});

export type LocationFix = z.infer<typeof locationSchema>;

const gymSchema = z.object({
  name: z.string().trim().min(1).max(60),
  placeId: z.string().min(1).max(300).nullable(),
  fix: locationSchema,
});

const SEARCH_ERROR = "Couldn't search for gyms right now. Try again in a moment.";

type Client = Awaited<ReturnType<typeof createClient>>;

async function withClient<T>(
  run: (supabase: Client) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  if (getSupabaseConfig() === null) {
    return { ok: false, error: UNAVAILABLE_ERROR };
  }
  const supabase = await createClient();
  return run(supabase);
}

async function afterMutation(supabase: Client): Promise<ActionResult<BattleState>> {
  revalidatePath("/hub");
  return loadBattleState(supabase);
}

export async function refreshBattle(): Promise<ActionResult<BattleState>> {
  return withClient((supabase) => loadBattleState(supabase));
}

/**
 * Gyms near the player. `configured: false` means there's no Places API key,
 * and the UI falls back to typing a gym name.
 */
export async function findNearbyGyms(
  fix: LocationFix,
  query?: string,
): Promise<ActionResult<{ configured: boolean; gyms: NearbyGym[] }>> {
  const parsed = locationSchema.safeParse(fix);
  if (!parsed.success) return { ok: false, error: mapRpcError("invalid_location") };
  if (getSupabaseConfig() === null) return { ok: false, error: UNAVAILABLE_ERROR };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: mapRpcError("not_authenticated") };

  const text = typeof query === "string" ? query.trim().slice(0, 100) : "";
  const result = await searchGyms(parsed.data.lat, parsed.data.lng, parsed.data.accuracy, text || undefined);
  if (result.status === "not_configured") return { ok: true, data: { configured: false, gyms: [] } };
  if (result.status === "error") return { ok: false, error: SEARCH_ERROR };
  return { ok: true, data: { configured: true, gyms: result.gyms } };
}

/**
 * Saves the player's gym. With a Places key, it must be a gym Google lists
 * within a mile of the player's fix, so you can't save your couch.
 */
export async function setGym(input: {
  name: string;
  placeId: string | null;
  fix: LocationFix;
}): Promise<ActionResult<BattleState>> {
  const parsed = gymSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Give your gym a name (up to 60 characters)." };
  }
  const { name, placeId, fix } = parsed.data;

  return withClient(async (supabase) => {
    // With Places, check-ins are measured from the gym's own location,
    // looked up here by ID (never taken from the client). Without Places,
    // from where the player stood when they saved.
    let center = { lat: fix.lat, lng: fix.lng, placeId: null as string | null };
    const lookup = placeId === null ? null : await getGymPlace(placeId);
    if (lookup === null) {
      if (getGoogleMapsApiKey() !== null) {
        return { ok: false, error: "Pick your gym from the list first." };
      }
    } else if (lookup.status === "error") {
      return { ok: false, error: SEARCH_ERROR };
    } else if (lookup.status === "not_found" || (lookup.status === "ok" && !lookup.gym.isGym)) {
      return { ok: false, error: "That place isn't listed as a gym. Pick another one." };
    } else if (lookup.status === "ok") {
      const { gym } = lookup;
      if (distanceMeters(fix.lat, fix.lng, gym.lat, gym.lng) > searchRadius(fix.accuracy)) {
        return { ok: false, error: "That gym isn't within a mile of you. Pick one from the list." };
      }
      center = { lat: gym.lat, lng: gym.lng, placeId: gym.placeId };
    }

    const { error } = await supabase.rpc("set_my_gym", {
      p_name: name,
      p_lat: center.lat,
      p_lng: center.lng,
      ...(center.placeId !== null ? { p_place_id: center.placeId } : {}),
    });
    if (error) return { ok: false, error: mapRpcError(error.message) };
    return afterMutation(supabase);
  });
}

export async function checkIn(fix: LocationFix): Promise<ActionResult<BattleState>> {
  const parsed = locationSchema.safeParse(fix);
  if (!parsed.success) return { ok: false, error: mapRpcError("invalid_location") };
  return withClient(async (supabase) => {
    const { error } = await supabase.rpc("gym_check_in", {
      p_lat: parsed.data.lat,
      p_lng: parsed.data.lng,
      p_accuracy: parsed.data.accuracy,
    });
    if (error) return { ok: false, error: mapRpcError(error.message) };
    return afterMutation(supabase);
  });
}

export async function heartbeat(fix: LocationFix): Promise<ActionResult<BattleState>> {
  const parsed = locationSchema.safeParse(fix);
  if (!parsed.success) return { ok: false, error: mapRpcError("invalid_location") };
  return withClient(async (supabase) => {
    const { error } = await supabase.rpc("gym_heartbeat", {
      p_lat: parsed.data.lat,
      p_lng: parsed.data.lng,
      p_accuracy: parsed.data.accuracy,
    });
    if (error) return { ok: false, error: mapRpcError(error.message) };
    return afterMutation(supabase);
  });
}

/** Ends the session. Pass a fix taken at the gym to bank the time since the last check. */
export async function checkOut(fix: LocationFix | null): Promise<ActionResult<BattleState>> {
  const parsed = fix === null ? null : locationSchema.safeParse(fix);
  const args =
    parsed?.success === true
      ? { p_lat: parsed.data.lat, p_lng: parsed.data.lng, p_accuracy: parsed.data.accuracy }
      : {};
  return withClient(async (supabase) => {
    const { error } = await supabase.rpc("gym_check_out", args);
    if (error) return { ok: false, error: mapRpcError(error.message) };
    return afterMutation(supabase);
  });
}

export async function rollSpin(): Promise<ActionResult<{ spin: SpinResult; state: BattleState }>> {
  return withClient(async (supabase) => {
    const { data, error } = await supabase.rpc("roll_spin");
    if (error || data === null) {
      return { ok: false, error: mapRpcError(error?.message ?? "") };
    }
    const state = await afterMutation(supabase);
    if (!state.ok) return state;
    // Shape is defined by roll_spin() in the boss_battles migration.
    return { ok: true, data: { spin: data as unknown as SpinResult, state: state.data } };
  });
}
