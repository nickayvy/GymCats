"use client";

import { useActionState, useState } from "react";
import { signup, type AuthFormState } from "@/app/login/actions";
import { AuthField, AuthSubmit } from "@/components/AuthFields";

const initialState: AuthFormState = { error: null, message: null };

export function SignupForm(): React.JSX.Element {
  const [state, action, pending] = useActionState(signup, initialState);
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="flex w-full flex-col gap-4 text-left">
      <AuthField id="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onValueChange={setEmail} />
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
