"use client";

import Link from "next/link";
import { describeGrowth, formatSets, growthTargets } from "@/lib/workouts/growth";
import type { LogWorkoutResult } from "@/lib/workouts/schema";
import { primaryButtonClass, secondaryButtonClass } from "@/components/onboarding/styles";

export function LogResult({
  result,
  onLogAnother,
}: {
  result: LogWorkoutResult;
  onLogAnother: () => void;
}): React.JSX.Element {
  const earned = result.spinsEarned;

  return (
    <section className="title-card flex flex-col items-center gap-6 rounded-2xl p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.15em] text-accent/80">Workout logged</p>
      <div role="status" className="flex flex-col items-center gap-1">
        <p
          className={`spin-pop text-5xl font-bold ${earned > 0 ? "text-emerald-300" : "text-foreground/70"}`}
        >
          +{earned} {earned === 1 ? "attack" : "attacks"}
        </p>
        <p className="text-sm text-foreground/60">
          {earned > 0
            ? `You grew! You now have ${result.spinsBalance} ${result.spinsBalance === 1 ? "attack" : "attacks"}.`
            : "No growth this time. Beat today's numbers next session to earn an attack."}
        </p>
      </div>

      <ul className="flex w-full flex-col gap-3 text-left">
        {result.exercises.map((e) => {
          const next = growthTargets(e.sets).map((t) => t.label);
          let status: string;
          let tone: string;
          if (e.previousSets === null) {
            status = "Baseline set. Beat it next time for an attack.";
            tone = "text-foreground/60";
          } else if (e.spinAwarded) {
            status = `▲ ${describeGrowth(e.previousSets, e.sets).join(" · ")}`;
            tone = "text-emerald-300";
          } else if (e.grew) {
            status = "▲ Growth! You already earned an attack for this lift in the last 20 hours.";
            tone = "text-emerald-300/80";
          } else {
            status = `Held at or below last time (${formatSets(e.previousSets)}).`;
            tone = "text-foreground/60";
          }
          return (
            <li
              key={e.name}
              className="flex flex-col gap-1 rounded-xl border border-accent/20 bg-background/40 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{e.name}</span>
                {e.spinAwarded && (
                  <span className="rounded-sm bg-emerald-500/20 px-2 py-0.5 font-mono text-xs text-emerald-200">
                    +1 attack
                  </span>
                )}
              </div>
              <span className="text-sm text-foreground/70">{formatSets(e.sets)}</span>
              <span className={`text-sm ${tone}`}>{status}</span>
              {next.length > 0 && (
                <span className="font-mono text-xs text-accent/80">
                  Next time: {next.join(" · ")}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/hub" className={`${primaryButtonClass} text-center`}>
          Back to hub
        </Link>
        <button type="button" onClick={onLogAnother} className={secondaryButtonClass}>
          Log another workout
        </button>
      </div>
    </section>
  );
}
