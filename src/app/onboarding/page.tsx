import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { getTeam } from "@/lib/team/getTeam";
import "@/app/styles/onboarding.css";

export const metadata: Metadata = { title: "Onboarding · GymCats" };

export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const config = getSupabaseConfig();
  let initialDisplayName = "";
  let partnerName: string | null = null;
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
    partnerName = team.partner?.displayName ?? null;
    inviteCode = team.inviteCode;
  }

  return (
    <main className="relative flex min-h-screen justify-center overflow-x-clip px-4 py-8 sm:items-center sm:px-6 sm:py-14">
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-5">
        {config === null ? (
          <p className="gc-panel gc-fade flex items-center gap-2 rounded-sm px-4 py-2 text-xs italic text-gold">
            <span aria-hidden="true">◆</span>
            Preview mode: Supabase isn&apos;t configured, so nothing will be saved.
          </p>
        ) : null}
        <OnboardingWizard
          configured={config !== null}
          initialDisplayName={initialDisplayName}
          partnerName={partnerName}
          inviteCode={inviteCode}
          resumeAtPartnerStep={resumeAtPartnerStep}
        />
      </div>
    </main>
  );
}
