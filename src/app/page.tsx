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

  return <HeroSection session={session} />;
}
