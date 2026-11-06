import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { INVITE_COOKIE, invitePath, normalizeInviteCode } from "@/lib/team/inviteCode";
import { HeroSection } from "@/components/HeroSection";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import type { Session } from "@supabase/supabase-js";

async function getSession(): Promise<Session | null> {
  if (!getSupabaseConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export default async function Home(): Promise<React.JSX.Element> {
  const session = await getSession();

  if (getSupabaseConfig() !== null) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (userData.user) {
      // Arrived through a partner's invite link before signing in? Finish
      // pairing first. The invite page clears the cookie once handled.
      const pendingInvite = normalizeInviteCode((await cookies()).get(INVITE_COOKIE)?.value);
      if (pendingInvite) {
        const { data: coupleId } = await supabase.rpc("my_couple_id");
        if (!coupleId) {
          redirect(invitePath(pendingInvite));
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", userData.user.id)
        .maybeSingle();

      redirect(profile?.onboarded_at ? "/hub" : "/onboarding");
    }
  }

  return <HeroSection session={session} />;
}
