"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkIn, checkOut, heartbeat, setGym, type LocationFix } from "@/app/battle/actions";
import {
  HEARTBEAT_INTERVAL_MS,
  MAX_CREDITED_GAP_MINUTES,
  MAX_SESSION_MINUTES,
  MINUTES_PER_SPIN,
} from "@/lib/battle/rules";
import { PREVIEW_SPINS, type BattleState } from "@/lib/battle/state";

function getFix(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser can't share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location is blocked. Allow location for this site in your browser settings."));
        } else {
          reject(new Error("Couldn't get a location fix. Try again in a moment."));
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 15_000 },
    );
  });
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

const buttonClass =
  "rounded-xl bg-accent px-5 py-3 font-semibold text-background transition hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-50";
const ghostButtonClass =
  "rounded-xl border border-white/15 px-5 py-3 text-sm text-foreground/80 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";

export interface GymPanelProps {
  state: BattleState;
  preview: boolean;
  onState: (state: BattleState) => void;
}

export function GymPanel({ state, preview, onState }: GymPanelProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const session = state.session;
  const sessionActive = session !== null;
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

  // Tick the session clock.
  useEffect(() => {
    if (!sessionActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [sessionActive]);

  // Heartbeats while the page is visible, plus one as soon as it comes back.
  // Browsers pause location in the background, so a locked phone banks its
  // time (up to MAX_CREDITED_GAP_MINUTES) at the next check.
  useEffect(() => {
    if (!sessionActive || preview) return;
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      const next = await run(heartbeat, { quiet: true });
      if (next && next.session === null) {
        setNotice("Looks like you left the gym, so your session ended. Nice work!");
      }
    };
    const id = window.setInterval(beat, HEARTBEAT_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void beat();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [sessionActive, preview, run]);

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

  async function handleSetGym(): Promise<void> {
    setNotice(null);
    const name = gymName.trim();
    if (!name) {
      setError("Give your gym a name first.");
      return;
    }
    const next = await run((fix) => setGym({ name, lat: fix.lat, lng: fix.lng }));
    if (next) setNotice(`Saved ${name} as your gym. Check in whenever you're here.`);
  }

  async function handleCheckIn(): Promise<void> {
    setNotice(null);
    const next = await run(checkIn);
    if (next?.session) {
      setNotice(next.session.bonusSpin ? "Checked in! +1 spin." : "Checked in! Your time is counting.");
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

  const partner = state.partner;

  return (
    <section className="title-card w-full rounded-2xl px-5 py-5" aria-labelledby="gym-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="gym-heading" className="font-mono text-xs uppercase tracking-[0.3em] text-accent/80">
          Gym check-in
        </h2>
        {partner && (
          <p className="text-xs text-foreground/60">
            {partner.atGym ? (
              <span className="text-green-400">● {partner.displayName} is at the gym</span>
            ) : (
              <span>○ {partner.displayName} isn&apos;t at the gym</span>
            )}
          </p>
        )}
      </div>

      {preview ? (
        <p className="mt-3 text-sm text-foreground/60">
          Gym check-ins need Supabase. Preview mode gives you {PREVIEW_SPINS} demo spins and saves nothing.
        </p>
      ) : state.gym === null ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-foreground/70">
            Stand inside your gym and save it. Check-ins only work within about 150 m of it, and you can change it once
            a week.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              maxLength={60}
              placeholder="e.g. 24 Hour Fitness Downtown"
              aria-label="Gym name"
              className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <button type="button" onClick={handleSetGym} disabled={busy} className={buttonClass}>
              {busy ? "Locating…" : "I'm here, save it"}
            </button>
          </div>
        </div>
      ) : session === null ? (
        <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/70">
            At <span className="text-foreground">{state.gym.name}</span>? Check in for a spin, then earn one more every{" "}
            {MINUTES_PER_SPIN} minutes.
          </p>
          <button type="button" onClick={handleCheckIn} disabled={busy} className={buttonClass}>
            {busy ? "Locating…" : "Check in"}
          </button>
        </div>
      ) : (
        <SessionView
          session={session}
          gymName={state.gym.name}
          now={now}
          busy={busy}
          onCheckOut={handleCheckOut}
        />
      )}

      {notice && (
        <p role="status" className="mt-3 text-sm text-accent-glow">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}

function SessionView({
  session,
  gymName,
  now,
  busy,
  onCheckOut,
}: {
  session: NonNullable<BattleState["session"]>;
  gymName: string;
  now: number;
  busy: boolean;
  onCheckOut: () => void;
}): React.JSX.Element {
  const elapsed = (now - Date.parse(session.startedAt)) / 1000;
  const spinSeconds = MINUTES_PER_SPIN * 60;
  const capped = session.creditedSeconds >= MAX_SESSION_MINUTES * 60;
  const progress = capped ? 1 : (session.creditedSeconds % spinSeconds) / spinSeconds;
  const spinsFromTime = Math.floor(session.creditedSeconds / spinSeconds);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-foreground/70">
            <span className="text-green-400">●</span> At {gymName}
          </p>
          <p className="font-mono text-3xl font-bold tabular-nums">{formatDuration(elapsed)}</p>
        </div>
        <button type="button" onClick={onCheckOut} disabled={busy} className={ghostButtonClass}>
          {busy ? "Checking out…" : "Check out"}
        </button>
      </div>
      <div>
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-widest text-foreground/60">
          <span>
            Banked {Math.floor(session.creditedSeconds / 60)} min · {spinsFromTime + (session.bonusSpin ? 1 : 0)}{" "}
            {spinsFromTime + (session.bonusSpin ? 1 : 0) === 1 ? "spin" : "spins"} earned
          </span>
          <span>{capped ? "Session maxed" : "Next spin"}</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
      <p className="text-xs text-foreground/50">
        Keep this screen open and we&apos;ll check your location every minute. Phone locked? Open GymCats at least
        every {MAX_CREDITED_GAP_MINUTES} minutes and before you leave, so your time counts.
      </p>
    </div>
  );
}
