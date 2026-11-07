import type { SupabaseClient } from "@supabase/supabase-js";
import type { BattleState } from "@/lib/battle/state";
import type { Database } from "@/types/database";

const RPC_ERRORS: Record<string, string> = {
  not_authenticated: "Your session expired. Please log in again.",
  no_gym_set: "Set your gym first.",
  not_at_gym: "You're not at your gym yet. You need to be within 150 m of it.",
  location_too_imprecise:
    "Your location is too fuzzy right now. Turn on Wi-Fi or step near a window and try again.",
  invalid_location: "Couldn't read your location. Try again.",
  invalid_gym_name: "Give your gym a name (up to 60 characters).",
  invalid_place: "That gym couldn't be saved. Pick it from the list again.",
  session_active: "Check out of your gym session before switching gyms.",
  // Only until 20261113000000_free_gym_switching.sql is applied.
  gym_change_cooldown: "Switching gyms isn't enabled yet. Try again later.",
  no_active_session: "You're not checked in.",
  no_spins: "No attacks left. Hit the gym to earn more!",
  boss_defeated: "This boss is already defeated. A new one arrives Monday.",
};

export function mapRpcError(message: string): string {
  for (const [code, text] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) return text;
  }
  return "Something went wrong. Please try again.";
}

export async function loadBattleState(
  supabase: SupabaseClient<Database>,
): Promise<{ ok: true; data: BattleState } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("get_battle_state");
  if (error || data === null) {
    console.error("get_battle_state failed", error);
    return { ok: false, error: mapRpcError(error?.message ?? "") };
  }
  // Shape is defined by get_battle_state() in the boss_battles migration.
  return { ok: true, data: data as unknown as BattleState };
}
