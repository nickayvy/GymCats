"use client";

import { useState } from "react";
import { InvitePanel } from "@/components/team/InvitePanel";
import { CAT_SPRITES, PixelSprite } from "@/components/sprites";
import { ButtonHint, Starburst } from "@/components/ui";
import { primaryButtonClass, secondaryButtonClass } from "./styles";

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
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="relative flex items-end justify-center gap-2 pt-2">
          <Starburst className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 opacity-60" />
          <div className="gc-float relative">
            <PixelSprite sheet={CAT_SPRITES.siamese} scale={3} label="Your cat" animate />
          </div>
          <div className="gc-float relative" style={{ animationDelay: "-1.6s" }}>
            <PixelSprite sheet={CAT_SPRITES.tuxedo} scale={3} label="Your partner's cat" animate flip />
          </div>
        </div>
        <p className="gc-pop relative text-lg italic">
          {partnerName ? (
            <>
              You&apos;re teamed up with <strong className="gc-title gc-gold not-italic">{partnerName}</strong>
            </>
          ) : (
            <>You&apos;re paired!</>
          )}
        </p>
        <p className="gc-fade relative text-sm italic text-white/65" style={{ "--d": "250ms" } as React.CSSProperties}>
          You&apos;ll take on this week&apos;s boss together.
        </p>
        <button type="button" onClick={onFinish} className={`${primaryButtonClass} gc-btn-lg relative`}>
          Let&apos;s go
          <ButtonHint glyph="A" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="gc-rise text-sm italic leading-relaxed text-white/75">
        GymCats is better together. Send your partner your invite link so you can take on a boss
        every week as a team.
      </p>

      <div className="gc-rise" style={{ "--d": "90ms" } as React.CSSProperties}>
        <InvitePanel initialInviteCode={initialInviteCode} onJoined={() => setJoined(true)} />
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/10 pt-5">
        <button type="button" onClick={onFinish} className={`${primaryButtonClass} min-w-40`}>
          Finish
          <ButtonHint glyph="A" />
        </button>
        <button type="button" onClick={onFinish} className={`${secondaryButtonClass} gc-btn-ghost gc-btn-sm`}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
