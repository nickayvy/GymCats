import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { AuthCard } from "@/components/AuthCard";

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
  if (getSupabaseConfig() !== null) {
    const { data } = await (await createClient()).auth.getUser();
    if (data.user) {
      redirect("/");
    }
  }

  const params = await searchParams;
  const notice = noticeFor(params);
  const initialMode = notice === null && params.mode === "signup" ? "signup" : "login";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <AuthCard initialMode={initialMode} notice={notice} />
    </main>
  );
}
