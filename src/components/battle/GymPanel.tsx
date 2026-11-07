"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkIn, checkOut, heartbeat, type LocationFix } from "@/app/battle/actions";
import { GymPicker } from "@/components/battle/GymPicker";
import { buttonClass, getFix, ghostButtonClass, useNow } from "@/components/battle/shared";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";
import { Meter, Panel } from "@/components/ui";
import {
  HEARTBEAT_INTERVAL_MS,
  MAX_CREDITED_GAP_MINUTES,
  MINUTES_PER_SPIN,
  formatDuration,
  sessionProgress,
  type SessionProgress,
} from "@/lib/battle/rules";
import { PREVIEW_SPINS, type BattleState } from "@/lib/battle/state";

export interface GymPanelProps {
  state: BattleState;
  preview: boolean;
  onState: (state: BattleState) => void;
}

export function GymPanel({ state, preview, onState }: GymPanelProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const session = state.session;
  const sessionActive = session !== null;
  const tick = useNow(sessionActive);
  const now = tick ?? (session ? Date.parse(session.lastPingAt) : 0);
  const inFlight = useRef(false);

  const run = useCallback(
    async (
      action: (fix: LocationFix) => Promise<{ ok: true; data: BattleState } | { ok: false; error: string }>,
      opts: { quiet?: boolean } = {},
    ): Promise<BattleState | null> => {
      if (inFlight.current) return null;
      inFlight.current = true;
      if (!opts.quiet) setBusy(true);
      try {
        const fix = await getFix();
        const result = await action(fix);
        if (!result.ok) {
          setError(result.error);
          return null;
        }
        setError(null);
        onState(result.data);
        return result.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        return null;
      } finally {
        inFlight.current = false;
        if (!opts.quiet) setBusy(false);
      }
    },
    [onState],
  );

  // Heartbeats while the page is visible, plus one as soon as it comes back.
  // Browsers pause location in the background, so a locked phone banks its
  // time (up to MAX_CREDITED_GAP_MINUTES) at the next check.
  const beat = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    const next = await run(heartbeat, { quiet: true });
    if (next && next.session === null) {
      setNotice("Looks like you left the gym, so your session ended. Nice work!");
    }
  }, [run]);

  useEffect(() => {
    if (!sessionActive || preview) return;
    const id = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionActive, preview, beat]);

  // When the countdown hits zero, check right away so the new attack lands
  // now instead of at the next minute's check.
  const progress = session ? sessionProgress(session, now) : null;
  const attackDue =
    session !== null &&
    progress !== null &&
    progress.attacksFromTime > Math.floor(session.creditedSeconds / (MINUTES_PER_SPIN * 60));
  useEffect(() => {
    if (attackDue && !preview) void beat();
  }, [attackDue, preview, beat]);

  // Keep the screen awake during a session so the heartbeats keep going.
  useEffect(() => {
    if (!sessionActive || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) void next.release();
        else lock = next;
      } catch {
        // Denied (e.g. low battery). Heartbeats on return still bank time.
      }
    };
    void acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void lock?.release();
    };
  }, [sessionActive]);

  async function handleCheckIn(): Promise<void> {
    setNotice(null);
    const next = await run(checkIn);
    if (next?.session) {
      setNotice(next.session.bonusSpin ? "Checked in! +1 attack." : "Checked in! Your time is counting.");
    }
  }

  async function handleCheckOut(): Promise<void> {
    setNotice(null);
    setBusy(true);
    let fix: LocationFix | null = null;
    try {
      fix = await getFix();
    } catch {
      // Check out anyway; the time since the last check just isn't banked.
    }
    const result = await checkOut(fix);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onState(result.data);
    setNotice("Checked out. See you next time!");
  }

  function handlePicked(next: BattleState, gymName: string): void {
    setPicking(false);
    onState(next);
    setNotice(
      next.session?.bonusSpin ? `Checked in at ${gymName}! +1 attack.` : `Checked in at ${gymName}! Your time is counting.`,
    );
  }

  const partner = state.partner;

  return (
    <Panel as="section" className="w-full px-4 py-4 sm:px-5" aria-labelledby="gym-heading">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="gym-heading" className="gc-title flex items-center gap-2 text-lg">
          <PixelSprite sheet={ITEM_SPRITES["map-pin"]} scale={1.5} />
          Gym Check-in
        </h2>
        {partner && (
          <p className="text-xs italic">
            {partner.atGym ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-moss/40 bg-black/45 px-2.5 py-1 text-moss">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-moss shadow-[0_0_8px_#9bd36a]" />
                {partner.displayName} is at the gym
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-white/60">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full border border-white/50" />
                {partner.displayName} isn&apos;t at the gym
              </span>
            )}
          </p>
        )}
      </div>
      <span aria-hidden="true" className="-mt-1 mb-3 block h-px w-full bg-gradient-to-r from-white/40 via-white/15 to-transparent" />

      {preview ? (
        <p className="text-sm italic text-white/65">
          Gym check-ins need Supabase. Preview mode gives you <span className="gc-gold">{PREVIEW_SPINS} demo attacks</span>{" "}
          and saves nothing.
        </p>
      ) : session === null && (state.gym === null || picking) ? (
        <GymPicker
          currentGymName={state.gym?.name ?? null}
          onCheckedIn={handlePicked}
          onCancel={state.gym === null ? undefined : () => setPicking(false)}
        />
      ) : session === null ? (
        <div className="space-y-3">
          <div className="gc-row">
            <span className="gap-2">
              <PixelSprite sheet={ITEM_SPRITES["map-pin"]} scale={1} />
              Your gym
            </span>
            <span className="px-3">
              <span className="min-w-0 truncate font-semibold italic text-ink">{state.gym?.name}</span>
            </span>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm italic text-white/70">
              At <span className="gc-key">{state.gym?.name}</span>? Check in for an attack, then earn one more every{" "}
              {MINUTES_PER_SPIN} minutes.
            </p>
            <button type="button" onClick={handleCheckIn} disabled={busy} className={`${buttonClass} shrink-0`}>
              {busy ? "Locating…" : "Check in"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice(null);
              setPicking(true);
            }}
            disabled={busy}
            className="text-sm italic text-glow underline-offset-4 hover:underline disabled:opacity-50"
          >
            At a different gym? Switch gyms
          </button>
        </div>
      ) : (
        progress && (
          <SessionView
            session={session}
            progress={progress}
            gymName={state.gym?.name ?? "the gym"}
            now={now}
            busy={busy}
            onCheckOut={handleCheckOut}
          />
        )
      )}

      {notice && (
        <p role="status" className="mt-3 text-sm italic text-glow">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm italic text-[#ff8a74]">
          {error}
        </p>
      )}
    </Panel>
  );
}

function SessionView({
  session,
  progress,
  gymName,
  now,
  busy,
  onCheckOut,
}: {
  session: NonNullable<BattleState["session"]>;
  progress: SessionProgress;
  gymName: string;
  now: number;
  busy: boolean;
  onCheckOut: () => void;
}): React.JSX.Element {
  const elapsed = (now - Date.parse(session.startedAt)) / 1000;
  const earned = progress.attacksFromTime + (session.bonusSpin ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm italic text-white/70">
            <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-moss shadow-[0_0_8px_#9bd36a]" />
            <span className="truncate">At {gymName}</span>
          </p>
          <p className="gc-num font-mono text-4xl font-bold text-ink">{formatDuration(elapsed)}</p>
        </div>
        <button type="button" onClick={onCheckOut} disabled={busy} className={`${ghostButtonClass} shrink-0`}>
          {busy ? "Checking out…" : "Check out"}
        </button>
      </div>
      <div className="space-y-[3px]">
        <div className="gc-row">
          <span className="gap-2">
            <PixelSprite sheet={ITEM_SPRITES.claw} scale={1} />
            Earned
          </span>
          <span className="gc-num px-3 font-mono text-sm text-white/80">
            {Math.floor(progress.estimatedSeconds / 60)} min ·{" "}
            <span className="ml-1 font-semibold text-gold">
              {earned} {earned === 1 ? "attack" : "attacks"}
            </span>
          </span>
        </div>
        <div className="gc-row">
          <span className="gap-2">
            <PixelSprite sheet={ITEM_SPRITES.hourglass} scale={1} />
            Next attack
          </span>
          <span className={`gc-num px-3 font-mono text-sm ${progress.secondsUntilNext === null ? "text-white/70" : "text-glow"}`}>
            {progress.secondsUntilNext === null
              ? "Session maxed"
              : `in ${formatDuration(progress.secondsUntilNext)}`}
          </span>
        </div>
      </div>
      <Meter
        value={Math.round(progress.fraction * 1000)}
        max={1000}
        label="Progress to the next attack"
        tone="glow"
        height={10}
      />
      <p className="text-xs italic leading-relaxed text-white/50">
        Keep this screen open and we&apos;ll check your location every minute. Phone locked? Open GymCats at least
        every {MAX_CREDITED_GAP_MINUTES} minutes and before you leave, so your time counts.
      </p>
    </div>
  );
}
