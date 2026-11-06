"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mapRpcError, loadBattleState } from "@/lib/battle/server";
import type { BattleState, SpinResult } from "@/lib/battle/state";
import { getSupabaseConfig } from "@/lib/env";
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
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

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

export async function setGym(input: { name: string; lat: number; lng: number }): Promise<ActionResult<BattleState>> {
  const parsed = gymSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Give your gym a name (up to 60 characters)." };
  }
  return withClient(async (supabase) => {
    const { error } = await supabase.rpc("set_my_gym", {
      p_name: parsed.data.name,
      p_lat: parsed.data.lat,
      p_lng: parsed.data.lng,
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
