import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { INVITE_COOKIE, normalizeInviteCode } from "./inviteCode";

export interface PendingInvite {
  code: string;
  inviterName: string;
}

/**
 * The invite this browser is carrying (set when a visitor taps "Accept" on an
 * invite link), if it can still be accepted. Only reveals the inviter's
 * display name, and only while the team has a free spot.
 */
export async function getPendingInvite(
  supabase: SupabaseClient<Database>,
): Promise<PendingInvite | null> {
  const code = normalizeInviteCode((await cookies()).get(INVITE_COOKIE)?.value);
  if (!code) return null;

  const { data: preview } = await supabase.rpc("get_invite_preview", { p_code: code });
  const row = preview?.[0];
  if (row?.status !== "open") return null;

  return { code, inviterName: row.inviter_name ?? "Your partner" };
}
