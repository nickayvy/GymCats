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
        className="rpg-input px-4 py-2"
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
        className="rpg-input px-4 py-2"
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
        className="rpg-input px-4 py-2"
      />

      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rpg-btn rpg-btn-gold px-4 py-2"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
