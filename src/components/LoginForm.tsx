"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthFormState } from "@/app/login/actions";

const initialState: AuthFormState = { error: null, message: null };

export function LoginForm(): React.JSX.Element {
  const [loginState, loginAction, loginPending] = useActionState(login, initialState);
  const [signupState, signupAction, signupPending] = useActionState(signup, initialState);
  const pending = loginPending || signupPending;
  const [lastAction, setLastAction] = useState<"login" | "signup">("login");
  const activeState = lastAction === "login" ? loginState : signupState;

  return (
    <form className="flex w-full flex-col gap-4 text-left">
      <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-accent/80">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="w-full rounded-lg border border-accent/30 bg-background/60 px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
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
        className="w-full rounded-lg border border-accent/30 bg-background/60 px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
      />

      {activeState.error ? (
        <p role="alert" className="text-sm text-red-400">
          {activeState.error}
        </p>
      ) : null}

      {activeState.message ? (
        <p role="status" className="text-sm text-accent-glow">
          {activeState.message}
        </p>
      ) : null}

      <button
        type="submit"
        formAction={loginAction}
        onClick={() => setLastAction("login")}
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-semibold text-background transition hover:bg-accent-glow disabled:opacity-50"
      >
        {loginPending ? "Logging in…" : "Log in"}
      </button>

      <button
        type="submit"
        formAction={signupAction}
        onClick={() => setLastAction("signup")}
        disabled={pending}
        className="rounded-lg border border-accent/40 px-4 py-2 font-semibold text-accent transition hover:border-accent disabled:opacity-50"
      >
        {signupPending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
