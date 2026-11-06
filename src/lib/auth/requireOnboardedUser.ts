import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for pages that only onboarded users may see.
 *
 * - Supabase not configured: preview mode, nothing is checked or saved.
 * - Logged out: redirects to /login.
 * - Signed in but not onboarded: redirects to /onboarding.
 *
 * `redirect` throws internally, so it must never be wrapped in try/catch.
 */
export async function requireOnboardedUser(): Promise<{
  preview: boolean;
  userId: string | null;
}> {
  if (!getSupabaseConfig()) {
    return { preview: true, userId: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // The explicit row type is needed: with the locked @supabase/ssr 0.6.1 +
  // supabase-js 2.114 pair, the client's schema resolves to `never` and the
  // generated Database row types are not inferred from `.from("profiles")`.
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle<{ onboarded_at: string | null }>();

  if (error) {
    throw new Error(`Failed to load profile: ${error.message}`);
  }

  if (!profile?.onboarded_at) {
    redirect("/onboarding");
  }

  return { preview: false, userId: user.id };
}
