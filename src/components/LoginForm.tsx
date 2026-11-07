"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/login/actions";
import { AuthField, AuthSubmit } from "@/components/SignupForm";

const initialState: AuthFormState = { error: null, message: null };

export function LoginForm({ notice }: { notice?: string | null }): React.JSX.Element {
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);

  return (
    <form action={loginAction} className="flex w-full flex-col gap-4 text-left">
      {notice ? (
        <p role="status" className="rounded-[3px] border border-glow/40 bg-glow/10 px-3 py-2 text-sm italic text-[#e9fffd]">
          {notice}
        </p>
      ) : null}

      <AuthField id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
      <AuthField id="password" label="Password" type="password" autoComplete="current-password" minLength={6} />

      {loginState.error ? (
        <p role="alert" className="text-sm italic text-ember">
          {loginState.error}
        </p>
      ) : null}

      <AuthSubmit pending={loginPending} label="Log in" pendingLabel="Logging in…" />
    </form>
  );
}
