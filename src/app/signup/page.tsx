import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/env";
import { SignupForm } from "@/components/SignupForm";

export const metadata: Metadata = { title: "Create account · GymCats" };

export default async function SignupPage(): Promise<React.JSX.Element> {
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create account</h1>
        <SignupForm />
        <p className="font-mono text-xs text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent-glow">
            Log in
          </Link>
        </p>
        <Link href="/" className="font-mono text-xs text-foreground/50 hover:text-accent">← Back home</Link>
      </div>
    </main>
  );
}
