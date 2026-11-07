"use client";

import { useActionState } from "react";
import { signup, type AuthFormState } from "@/app/login/actions";
import { ButtonHint } from "@/components/ui";

const initialState: AuthFormState = { error: null, message: null };

/** Labelled gc-input used by the log-in and sign-up forms. */
export function AuthField({
  id,
  label,
  type,
  autoComplete,
  minLength,
  placeholder,
}: {
  id: string;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  minLength?: number;
  placeholder?: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="gc-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={placeholder}
        className="gc-input"
      />
    </div>
  );
}

/** Full-width parchment submit pill with an (A) key hint. */
export function AuthSubmit({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}): React.JSX.Element {
  return (
    <button type="submit" disabled={pending} className="gc-btn gc-btn-primary gc-btn-lg mt-2 w-full">
      <ButtonHint glyph="A" className="bg-[#17140c]! text-[#fbf3dc]!" />
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SignupForm(): React.JSX.Element {
  const [state, action, pending] = useActionState(signup, initialState);

  return (
    <form action={action} className="flex w-full flex-col gap-4 text-left">
      <AuthField id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" />
      <AuthField id="password" label="Password" type="password" autoComplete="new-password" minLength={6} />
      <AuthField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        minLength={6}
      />

      {state.error ? (
        <p role="alert" className="text-sm italic text-ember">
          {state.error}
        </p>
      ) : null}

      <AuthSubmit pending={pending} label="Create account" pendingLabel="Creating account…" />
    </form>
  );
}
