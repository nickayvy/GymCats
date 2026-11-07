"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  INVITE_COOKIE,
  INVITE_COOKIE_MAX_AGE,
  normalizeInviteCode,
} from "@/lib/team/inviteCode";
import { mapPairingError } from "@/lib/team/rpcErrors";

export type InviteActionState = { error: string | null };

/**
 * Remembers the invite in an httpOnly cookie, then sends the visitor to sign
 * up (or log in). After auth, the home page brings them back to the invite.
 */
export async function continueToAuth(formData: FormData): Promise<void> {
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  const mode = formData.get("mode") === "login" ? "login" : "signup";

  if (code) {
    (await cookies()).set(INVITE_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
    });
  }

  redirect(mode === "signup" ? "/login?mode=signup" : "/login");
}

export async function acceptInvite(
  _prev: InviteActionState,
  formData: FormData,
): Promise<InviteActionState> {
  if (!getSupabaseConfig()) {
    return { error: "Partner pairing is unavailable: Supabase is not configured." };
  }

  const code = normalizeInviteCode(String(formData.get("code") ?? ""));
  if (!code) {
    return { error: "That invite link is broken." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_couple", { p_code: code });
  if (error) {
    return { error: mapPairingError(error.message) };
  }

  (await cookies()).delete(INVITE_COOKIE);
  revalidatePath("/", "layout");
  // Not onboarded yet? "/" sends them to onboarding, otherwise to the hub.
  redirect("/");
}

export async function dismissInvite(): Promise<void> {
  (await cookies()).delete(INVITE_COOKIE);
  redirect("/");
}
