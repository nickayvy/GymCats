import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { LoginForm } from "@/components/LoginForm";

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
  searchParams: Promise<{ created?: string; confirmed?: string }>;
}): Promise<React.JSX.Element> {
  if (getSupabaseConfig() !== null) {
    const { data } = await (await createClient()).auth.getUser();
    if (data.user) {
      redirect("/");
    }
  }

  const notice = noticeFor(await searchParams);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="title-card relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">GymCats</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Log in</h1>
        <LoginForm notice={notice} />
        <p className="font-mono text-xs text-foreground/60">
          New here?{" "}
          <Link href="/signup" className="text-accent hover:text-accent-glow">
            Create an account
          </Link>
        </p>
        <Link href="/" className="font-mono text-xs text-foreground/50 hover:text-accent">← Back home</Link>
      </div>
    </main>
  );
}
