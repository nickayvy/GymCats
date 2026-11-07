"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { InvitePanel } from "@/components/team/InvitePanel";
import type { TeamMember } from "@/lib/team/getTeam";
import { MeetPartner } from "./MeetPartner";
import { primaryButtonClass } from "./styles";

interface PartnerStepProps {
  onFinish: () => void;
  /** Set when the user already has a partner (e.g. joined through an invite link). */
  partner: TeamMember | null;
  /** The user's existing invite code, if they created one before. */
  initialInviteCode: string | null;
  myName: string;
  myAvatarUrl: string | null;
}

export function PartnerStep({
  onFinish,
  partner,
  initialInviteCode,
  myName,
  myAvatarUrl,
}: PartnerStepProps): React.JSX.Element {
  const router = useRouter();
  const [joined, setJoined] = useState(false);

  if (partner) {
    return (
      <MeetPartner partner={partner} myName={myName} myAvatarUrl={myAvatarUrl} onFinish={onFinish} />
    );
  }

  if (joined) {
    // Joined with a code just now; the partner's details arrive with the refresh.
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-lg">You&apos;re paired! 🎉</p>
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

      <InvitePanel
        initialInviteCode={initialInviteCode}
        onJoined={() => {
          setJoined(true);
          router.refresh();
        }}
      />

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
