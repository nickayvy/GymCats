"use client";

import { useState } from "react";
import { InvitePanel } from "@/components/team/InvitePanel";
import { primaryButtonClass } from "./styles";

interface PartnerStepProps {
  onFinish: () => void;
  /** Set when the user already joined a partner (e.g. through an invite link). */
  partnerName: string | null;
  /** The user's existing invite code, if they created one before. */
  initialInviteCode: string | null;
}

export function PartnerStep({
  onFinish,
  partnerName,
  initialInviteCode,
}: PartnerStepProps): React.JSX.Element {
  const [joined, setJoined] = useState(false);

  if (partnerName || joined) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-lg">
          {partnerName ? (
            <>
              You&apos;re teamed up with <strong className="text-accent-glow">{partnerName}</strong> 🎉
            </>
          ) : (
            <>You&apos;re paired! 🎉</>
          )}
        </p>
        <p className="text-sm text-foreground/70">You&apos;ll take on this week&apos;s boss together.</p>
        <button type="button" onClick={onFinish} className={primaryButtonClass}>
          Let&apos;s go
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-foreground/70">
        GymCats is better together. Send your partner your invite link so you can take on a boss
        every week as a team.
      </p>

      <InvitePanel initialInviteCode={initialInviteCode} onJoined={() => setJoined(true)} />

      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={onFinish} className={primaryButtonClass}>
          Finish
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="text-sm text-foreground/50 transition hover:text-accent"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
