"use client";

import { useEffect, useState, useTransition } from "react";
import { createInvite, joinWithCode } from "@/app/onboarding/actions/partner";
import {
  errorClass,
  fieldClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./styles";

interface PartnerStepProps {
  onFinish: () => void;
}

export function PartnerStep({ onFinish }: PartnerStepProps): React.JSX.Element {
  const [code, setCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [paired, setPaired] = useState(false);

  const [creating, startCreate] = useTransition();
  const [joining, startJoin] = useTransition();

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

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

  async function handleCopy(): Promise<void> {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // Clipboard unavailable; the code is still visible to copy by hand.
    }
  }

  function handleJoin(): void {
    startJoin(async () => {
      setJoinError(null);
      const result = await joinWithCode(inviteCode);
      if (result.ok) {
        setPaired(true);
      } else {
        setJoinError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-foreground/70">
        GymCats is better together. Team up with your partner to take on a boss every week.
      </p>

      <section className="flex flex-col gap-3">
        <h2 className={labelClass}>Invite your partner</h2>
        {code ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-mono text-3xl tracking-[0.4em] text-accent-glow">{code}</p>
            <button type="button" onClick={handleCopy} className={secondaryButtonClass}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className={secondaryButtonClass}
          >
            {creating ? "Getting code…" : "Get my invite code"}
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
              className={`${inputClass} font-mono tracking-[0.3em]`}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || paired}
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
        {paired ? <p className="text-sm text-accent-glow">You&apos;re paired! 🎉</p> : null}
      </section>

      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={onFinish} className={primaryButtonClass}>
          {paired ? "Let's go" : "Finish"}
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
