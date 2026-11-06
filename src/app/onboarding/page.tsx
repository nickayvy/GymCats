import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";

export const metadata: Metadata = { title: "Onboarding · GymCats" };

export default async function OnboardingPage(): Promise<React.JSX.Element> {
  const config = getSupabaseConfig();
  let initialDisplayName = "";

  if (config !== null) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      redirect("/login");
    }

    // overrideTypes: the ssr client's inferred schema resolves to `never` for
    // this select, so the row type is stated explicitly here.
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle()
      .overrideTypes<{ onboarded_at: string | null }, { merge: false }>();

    if (profile?.onboarded_at) {
      redirect("/hub");
    }

    initialDisplayName = user.email?.split("@")[0]?.slice(0, 40) ?? "";
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
        />
      </div>
    </main>
  );
}
