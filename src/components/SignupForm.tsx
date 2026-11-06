"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/login/actions";

const initialState: AuthFormState = { error: null, message: null };

export function SignupForm(): React.JSX.Element {
  const [state, action, pending] = useActionState(signup, initialState);

  return (
    <form action={action} className="flex w-full flex-col gap-4 text-left">
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
        autoComplete="new-password"
        required
        minLength={6}
        className="w-full rounded-lg border border-accent/30 bg-background/60 px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
      />

      <label htmlFor="confirmPassword" className="font-mono text-xs uppercase tracking-widest text-accent/80">
        Confirm password
      </label>
      <input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={6}
        className="w-full rounded-lg border border-accent/30 bg-background/60 px-4 py-2 text-foreground placeholder:text-foreground/40 focus:border-accent focus:outline-none"
      />

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2 font-semibold text-background transition hover:bg-accent-glow disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
