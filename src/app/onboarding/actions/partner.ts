"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/env";
import type { ActionResult } from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";
import { INVITE_COOKIE, normalizeInviteCode } from "@/lib/team/inviteCode";
import { mapPairingError } from "@/lib/team/rpcErrors";

const UNAVAILABLE_ERROR = "Partner pairing is unavailable: Supabase is not configured.";

export async function createInvite(): Promise<ActionResult<{ code: string }>> {
  if (!getSupabaseConfig()) {
    return { ok: false, error: UNAVAILABLE_ERROR };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_couple");

  if (error) {
    return { ok: false, error: mapPairingError(error.message) };
  }

  return { ok: true, data: { code: data } };
}

export async function joinWithCode(code: string): Promise<ActionResult> {
  if (!getSupabaseConfig()) {
    return { ok: false, error: UNAVAILABLE_ERROR };
  }

  const normalized = normalizeInviteCode(code);
  if (!normalized) {
    return { ok: false, error: "Invite codes are 6 letters or numbers." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple", { p_code: normalized });

  if (error) {
    return { ok: false, error: mapPairingError(error.message) };
  }

  (await cookies()).delete(INVITE_COOKIE);
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
