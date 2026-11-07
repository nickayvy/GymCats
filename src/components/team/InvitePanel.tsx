"use client";

import { useState, useTransition } from "react";
import { createInvite, joinWithCode } from "@/app/onboarding/actions/partner";
import {
  errorClass,
  fieldClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/onboarding/styles";
import { InviteLinkCard } from "./InviteLinkCard";

/** Invite a partner by link, or join a partner with their code. */
export function InvitePanel({
  initialInviteCode,
  onJoined,
}: {
  initialInviteCode: string | null;
  onJoined: () => void;
}): React.JSX.Element {
  const [code, setCode] = useState<string | null>(initialInviteCode);
  const [createError, setCreateError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const [creating, startCreate] = useTransition();
  const [joining, startJoin] = useTransition();

  function handleCreate(): void {
    startCreate(async () => {
      setCreateError(null);
      const result = await createInvite();
      if (result.ok) {
        setCode(result.data.code);
      } else {
        setCreateError(result.error);
      }
    });
  }

  function handleJoin(): void {
    startJoin(async () => {
      setJoinError(null);
      const result = await joinWithCode(inviteCode);
      if (result.ok) {
        onJoined();
      } else {
        setJoinError(result.error);
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className={labelClass}>Invite your partner</h2>
        {code ? (
          <InviteLinkCard code={code} />
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className={secondaryButtonClass}
          >
            {creating ? "Creating link…" : "Get my invite link"}
          </button>
        )}
        {createError ? (
          <p role="alert" className={errorClass}>
            {createError}
          </p>
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={labelClass}>Have a code?</h2>
        <div className={fieldClass}>
          <label htmlFor="inviteCode" className={labelClass}>
            Partner&apos;s invite code
          </label>
          <div className="flex gap-3">
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              maxLength={6}
              autoComplete="off"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              className={`${inputClass} font-mono tracking-[0.15em]`}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className={primaryButtonClass}
            >
              {joining ? "Joining…" : "Join"}
            </button>
          </div>
        </div>
        {joinError ? (
          <p role="alert" className={errorClass}>
            {joinError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
