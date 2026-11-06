import { redirect } from "next/navigation";
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
      // overrideTypes: see src/app/onboarding/page.tsx.
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarded_at")
        .eq("id", userData.user.id)
        .maybeSingle()
        .overrideTypes<{ onboarded_at: string | null }, { merge: false }>();

      redirect(profile?.onboarded_at ? "/hub" : "/onboarding");
    }
  }

  return <HeroSection session={session} />;
}
