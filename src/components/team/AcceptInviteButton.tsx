"use client";

import { useActionState } from "react";
import { acceptInvite, type InviteActionState } from "@/app/invite/actions";

const initialState: InviteActionState = { error: null };

export function AcceptInviteButton({
  code,
  partnerName,
}: {
  code: string;
  partnerName: string;
}): React.JSX.Element {
  const [state, formAction, pending] = useActionState(acceptInvite, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col items-center gap-3">
      <input type="hidden" name="code" value={code} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-gradient-to-b from-accent-glow to-accent px-8 py-4 text-lg font-bold uppercase tracking-[0.2em] text-background shadow-[0_0_40px_rgba(201,168,108,0.35)] transition hover:scale-105 active:scale-95 disabled:opacity-60 motion-reduce:transition-none"
      >
        {pending ? "Joining…" : `Team up with ${partnerName}`}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
