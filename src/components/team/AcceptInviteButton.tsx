"use client";

import { useActionState } from "react";
import { acceptInvite, type InviteActionState } from "@/app/invite/actions";
import { ButtonHint } from "@/components/ui";

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
        className="gc-btn gc-btn-primary gc-btn-lg gc-shine w-full"
      >
        <ButtonHint glyph="A" className="bg-[#17140c]! text-[#fbf3dc]!" />
        {pending ? "Joining…" : `Team up with ${partnerName}`}
      </button>
      {state.error ? (
        <p role="alert" className="text-sm italic text-ember">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
