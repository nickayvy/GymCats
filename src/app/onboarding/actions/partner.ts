"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";
import type { ActionResult } from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

const UNAVAILABLE_ERROR = "Partner pairing is unavailable: Supabase is not configured.";
const INVITE_CODE_PATTERN = /^[A-Z0-9]{6}$/;

// @supabase/ssr 0.6.1 returns a client typed with the older SupabaseClient
// generic order, which makes rpc() argument types collapse to undefined under
// the lockfile's @supabase/supabase-js 2.114. Re-type it to Database so the
// RPC signatures in src/types/database.ts apply.
async function createRpcClient(): Promise<SupabaseClient<Database>> {
  return (await createClient()) as unknown as SupabaseClient<Database>;
}

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "Your session expired. Please log in again.";
  }
  if (message.includes("invalid_code")) {
    return "That invite code doesn't exist.";
  }
  if (message.includes("own_code")) {
    return "That's your own invite code — send it to your partner.";
  }
  if (message.includes("already_paired")) {
    return "You're already paired with a partner.";
  }
  if (message.includes("couple_full")) {
    return "That couple already has two members.";
  }
  return "Something went wrong. Please try again.";
}

export async function createInvite(): Promise<ActionResult<{ code: string }>> {
  if (!getSupabaseConfig()) {
    return { ok: false, error: UNAVAILABLE_ERROR };
  }

  const supabase = await createRpcClient();
  const { data, error } = await supabase.rpc("create_couple");

  if (error) {
    return { ok: false, error: mapRpcError(error.message) };
  }

  return { ok: true, data: { code: data } };
}

export async function joinWithCode(code: string): Promise<ActionResult> {
  if (!getSupabaseConfig()) {
    return { ok: false, error: UNAVAILABLE_ERROR };
  }

  const normalized = code.trim().toUpperCase();
  if (!INVITE_CODE_PATTERN.test(normalized)) {
    return { ok: false, error: "Invite codes are 6 letters or numbers." };
  }

  const supabase = await createRpcClient();
  const { error } = await supabase.rpc("join_couple", { p_code: normalized });

  if (error) {
    return { ok: false, error: mapRpcError(error.message) };
  }

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
