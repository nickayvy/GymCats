"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";

export function AuthCard({
  initialMode,
  notice,
}: {
  initialMode: "login" | "signup";
  notice: string | null;
}): React.JSX.Element {
  const [mode, setMode] = useState(initialMode);

  return (
    <div
      className={`title-card relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-10 text-center transition-shadow ${mode === "signup" ? "shadow-[0_0_60px_rgba(201,168,108,0.35)]" : ""}`}
    >
      <div
        key={mode}
        className="flex w-full flex-col items-center gap-6 motion-safe:[animation:battle-enter-up_300ms_ease-out_both]"
      >
        {mode === "login" ? (
          <>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">Welcome back</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Log in</h1>
            <LoginForm notice={notice} />
            <p className="font-mono text-xs text-foreground/60">
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-accent underline-offset-4 hover:text-accent-glow hover:underline"
              >
                Create an account
              </button>
            </p>
          </>
        ) : (
          <>
            <span className="rounded-full border border-accent/50 bg-accent/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-accent-glow">
              Sign up is free
            </span>
            <h1 className="bg-gradient-to-b from-accent-glow to-accent bg-clip-text text-3xl font-bold tracking-tight text-transparent">
              Begin your journey
            </h1>
            <p className="-mt-3 text-sm text-foreground/60">
              Create your account and meet your pixel-art spotters.
            </p>
            <SignupForm />
            <p className="font-mono text-xs text-foreground/60">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-accent underline-offset-4 hover:text-accent-glow hover:underline"
              >
                Log in
              </button>
            </p>
          </>
        )}
      </div>
      <Link href="/" className="font-mono text-xs text-foreground/50 hover:text-accent">← Back home</Link>
    </div>
  );
}
