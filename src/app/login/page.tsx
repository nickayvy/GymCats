import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Log in · GymCats" };

export default async function LoginPage(): Promise<React.JSX.Element> {
  if (getSupabaseConfig() !== null) {
    const { data } = await (await createClient()).auth.getUser();
    if (data.user) {
      redirect("/");
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="title-card relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-10 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">GymCats</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Log in</h1>
        <LoginForm />
        <Link href="/" className="font-mono text-xs text-foreground/50 hover:text-accent">← Back home</Link>
      </div>
    </main>
  );
}
