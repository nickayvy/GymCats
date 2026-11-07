import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { getTeam, type TeamMember } from "@/lib/team/getTeam";

export const metadata: Metadata = { title: "Onboarding · GymCats" };

export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const config = getSupabaseConfig();
  let initialDisplayName = "";
  let partner: TeamMember | null = null;
  let savedAvatarUrl: string | null = null;
  let inviteCode: string | null = null;
  let resumeAtPartnerStep = false;

  if (config !== null) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.onboarded_at) {
      redirect("/hub");
    }

    initialDisplayName = profile?.display_name ?? user.email?.split("@")[0]?.slice(0, 40) ?? "";
    resumeAtPartnerStep = profile !== null;

    const team = await getTeam(supabase, user.id);
    partner = team.partner;
    savedAvatarUrl = team.me?.avatarUrl ?? null;
    inviteCode = team.inviteCode;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative z-10 flex w-full flex-col items-center gap-4">
        {config === null ? (
          <p className="rounded-lg border border-accent/30 bg-card/80 px-4 py-2 font-mono text-xs text-accent">
            Preview mode: Supabase isn&apos;t configured, so nothing will be saved.
          </p>
        ) : null}
        <OnboardingWizard
          configured={config !== null}
          initialDisplayName={initialDisplayName}
          partner={partner}
          inviteCode={inviteCode}
          resumeAtPartnerStep={resumeAtPartnerStep}
          savedAvatarUrl={savedAvatarUrl}
        />
      </div>
    </main>
  );
}
