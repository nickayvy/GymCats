"use client";

import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { Panel, TitleBanner, Toggle } from "@/components/ui";

const MODES = [
  { value: "login", label: "Log in" },
  { value: "signup", label: "Sign up" },
] as const;

export function AuthCard({
  initialMode,
  notice,
  invitedBy = null,
}: {
  initialMode: "login" | "signup";
  notice: string | null;
  invitedBy?: string | null;
}): React.JSX.Element {
  const [mode, setMode] = useState(initialMode);

  return (
    <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6">
      <TitleBanner
        key={mode}
        size="lg"
        eyebrow={mode === "login" ? "Welcome back" : "Sign up is free"}
        title={mode === "login" ? "Log in" : "Begin your journey"}
        subtitle={
          mode === "login"
            ? "Pick up where your party left off."
            : "Create your account and meet your pixel-art spotters."
        }
      />

      <Panel
        className={`gc-rise flex w-full max-w-md flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 ${mode === "signup" ? "shadow-[0_0_60px_rgba(255,236,170,0.12)]" : ""}`}
        style={{ "--d": "150ms" } as React.CSSProperties}
      >
        {invitedBy ? (
          <p className="rounded-[3px] border border-glow/40 bg-glow/10 px-4 py-2.5 text-center text-sm italic text-[#e9fffd]">
            You&apos;re joining <strong className="gc-key">{invitedBy}</strong>&apos;s team.{" "}
            {mode === "signup" ? "Create an account" : "Log in"} to accept the invite.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="gc-caps text-center">Profile</span>
          <Toggle options={MODES} value={mode} onChange={setMode} label="Log in or sign up" />
        </div>

        <div key={mode} className="gc-rise w-full">
          {mode === "login" ? <LoginForm notice={notice} /> : <SignupForm />}
        </div>

        <span aria-hidden="true" className="gc-divider text-[0.5rem]">
          ◆
        </span>

        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="gc-btn gc-btn-ghost gc-btn-sm -ml-2 shrink-0 whitespace-nowrap">
            Back home
          </Link>
          <p className="gc-eyebrow text-right text-xs">
            {mode === "login" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => setMode("signup")} className="gc-key hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Have an account?{" "}
                <button type="button" onClick={() => setMode("login")} className="gc-key hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>
        </div>
      </Panel>
    </div>
  );
}
