import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { AuthCard } from "@/components/AuthCard";
import { INVITE_COOKIE, normalizeInviteCode } from "@/lib/team/inviteCode";

export const metadata: Metadata = { title: "Log in · GymCats" };

function noticeFor(params: { created?: string; confirmed?: string }): string | null {
  if (params.created === "confirm") {
    return "Account created! Check your email to confirm it, then log in.";
  }
  if (params.created === "ready") {
    return "Account created! Log in to continue.";
  }
  if (params.confirmed === "1") {
    return "Email confirmed. Log in to continue.";
  }
  return null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; confirmed?: string; mode?: string }>;
}): Promise<React.JSX.Element> {
  let invitedBy: string | null = null;
  if (getSupabaseConfig() !== null) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      redirect("/");
    }

    const pendingInvite = normalizeInviteCode((await cookies()).get(INVITE_COOKIE)?.value);
    if (pendingInvite) {
      const { data: preview } = await supabase.rpc("get_invite_preview", { p_code: pendingInvite });
      if (preview?.[0]?.status === "open") {
        invitedBy = preview[0].inviter_name ?? "Your partner";
      }
    }
  }

  const params = await searchParams;
  const notice = noticeFor(params);
  const initialMode = notice === null && params.mode === "signup" ? "signup" : "login";

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-x-hidden px-4 py-10 sm:py-16">
      <AuthCard initialMode={initialMode} notice={notice} invitedBy={invitedBy} />
    </main>
  );
}
