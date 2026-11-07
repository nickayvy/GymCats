"use client";

import { useActionState } from "react";
import { login, type AuthFormState } from "@/app/login/actions";

const initialState: AuthFormState = { error: null, message: null };

export function LoginForm({ notice }: { notice?: string | null }): React.JSX.Element {
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);

  return (
    <form action={loginAction} className="flex w-full flex-col gap-4 text-left">
      <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-accent/80">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="rpg-input px-4 py-2"
      />

      <label htmlFor="password" className="font-mono text-xs uppercase tracking-widest text-accent/80">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={6}
        className="rpg-input px-4 py-2"
      />

      {loginState.error ? (
        <p role="alert" className="text-sm text-red-400">
          {loginState.error}
        </p>
      ) : null}

      {notice ? (
        <p role="status" className="text-sm text-accent-glow">
          {notice}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loginPending}
        className="rpg-btn rpg-btn-gold px-4 py-2"
      >
        {loginPending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
