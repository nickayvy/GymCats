"use client";

import Link from "next/link";
import { describeGrowth, formatSets, growthTargets } from "@/lib/workouts/growth";
import type { LogWorkoutResult } from "@/lib/workouts/schema";
import { primaryButtonClass, secondaryButtonClass } from "@/components/onboarding/styles";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";
import { ItemSlot, Starburst, TitleBanner } from "@/components/ui";
import { ExerciseIcon } from "./exerciseIcon";

export function LogResult({
  result,
  onLogAnother,
}: {
  result: LogWorkoutResult;
  onLogAnother: () => void;
}): React.JSX.Element {
  const earned = result.spinsEarned;

  const attacksWord = earned === 1 ? "attack" : "attacks";

  return (
    <section className="gc-panel gc-panel-strong gc-rise relative flex flex-col items-center gap-6 overflow-hidden px-4 py-7 text-center sm:px-8">
      <TitleBanner as="h2" size="sm" eyebrow="Quest complete" title="Workout logged" />

      <div role="status" className="flex w-full flex-col items-center gap-4">
        <div className="relative mt-2 flex h-48 w-full items-center justify-center">
          {earned > 0 && (
            <Starburst className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 opacity-60" />
          )}
          <p
            className="lg-reward gc-pop relative flex flex-col items-center gap-1"
            data-zero={earned > 0 ? undefined : true}
            style={{ "--d": "200ms" } as React.CSSProperties}
          >
            <span className="text-7xl sm:text-8xl">+{earned}</span>{" "}
            <span className="font-display text-xl uppercase tracking-[0.2em]">{attacksWord}</span>
          </p>
        </div>
        <p
          className="gc-toast gc-panel gc-panel-strong flex w-full max-w-md items-center gap-3 rounded-sm px-4 py-3 text-left"
          style={{ animationDelay: "650ms" }}
        >
          <span className="flex shrink-0 items-center justify-center">
            <PixelSprite
              sheet={earned > 0 ? ITEM_SPRITES.star : ITEM_SPRITES.hourglass}
              scale={2}
              label=""
              animate
            />
          </span>
          <span className="min-w-0">
            <span className={`block font-semibold italic ${earned > 0 ? "text-gold" : "text-ink"}`}>
              {earned > 0 ? "Attacks earned" : "No attacks this time"}
            </span>
            <span className="block text-sm italic text-white/70">
              {earned > 0
                ? `You grew! You now have ${result.spinsBalance} ${result.spinsBalance === 1 ? "attack" : "attacks"}.`
                : "No growth this time. Beat today's numbers next session to earn an attack."}
            </span>
          </span>
        </p>
      </div>

      <ul className="flex w-full flex-col gap-2 text-left">
        {result.exercises.map((e, i) => {
          const next = growthTargets(e.sets).map((t) => t.label);
          let status: string;
          let tone: string;
          if (e.previousSets === null) {
            status = "Baseline set. Beat it next time for an attack.";
            tone = "text-white/65";
          } else if (e.spinAwarded) {
            status = `▲ ${describeGrowth(e.previousSets, e.sets).join(" · ")}`;
            tone = "text-moss";
          } else if (e.grew) {
            status = "▲ Growth! You already earned an attack for this lift in the last 20 hours.";
            tone = "text-moss/80";
          } else {
            status = `Held at or below last time (${formatSets(e.previousSets)}).`;
            tone = "text-white/65";
          }
          return (
            <li
              key={e.name}
              className="lg-last gc-rise flex items-start gap-3 p-3"
              style={{ "--d": `${900 + i * 110}ms` } as React.CSSProperties}
            >
              <ItemSlot size={44} className="lg-slot" selected={e.spinAwarded}>
                <ExerciseIcon name={e.name} />
              </ItemSlot>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink">{e.name}</span>
                  {e.spinAwarded && (
                    <span className="lg-badge-gold gc-pop" style={{ "--d": `${1100 + i * 110}ms` } as React.CSSProperties}>
                      +1 attack
                    </span>
                  )}
                </div>
                <span className="gc-num text-sm italic text-white/75">{formatSets(e.sets)}</span>
                <span className={`text-sm italic ${tone}`}>{status}</span>
                {next.length > 0 && (
                  <span className="mt-1 font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-glow/85">
                    Next time: {next.join(" · ")}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/hub" className={`${primaryButtonClass} text-center`}>
          Back to hub
        </Link>
        <button type="button" onClick={onLogAnother} className={`${secondaryButtonClass} lg-add`}>
          Log another workout
        </button>
      </div>
    </section>
  );
}
