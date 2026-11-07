"use client";

import { useFormStatus } from "react-dom";
import { leaveTeam } from "@/app/partner/actions";

function SubmitButton({ partnerName }: { partnerName: string }): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(`Leave your team with ${partnerName}? You'll need a new invite to team up again.`)) {
          event.preventDefault();
        }
      }}
      className="gc-btn gc-btn-ghost gc-btn-sm hover:border-ember/60! hover:text-ember! focus-visible:text-ember!"
    >
      {pending ? "Leaving…" : "Leave team"}
    </button>
  );
}

export function LeaveTeamButton({ partnerName }: { partnerName: string }): React.JSX.Element {
  return (
    <form action={leaveTeam}>
      <SubmitButton partnerName={partnerName} />
    </form>
  );
}
