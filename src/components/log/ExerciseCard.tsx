"use client";

import {
  describeGrowth,
  formatSets,
  growthTargets,
  isGrowth,
  MAX_EXERCISE_NAME,
  MAX_SETS,
  type WorkoutSet,
} from "@/lib/workouts/growth";
import type { ExerciseHistoryEntry } from "@/lib/workouts/schema";
import { chipClass, chipOffClass, inputClass } from "@/components/onboarding/styles";
import { LocalDate } from "./LocalDate";

export type SetDraft = { id: string; reps: string; weight: string };
export type ExerciseDraft = { id: string; name: string; sets: SetDraft[] };

export const EXERCISE_OPTIONS_ID = "exercise-options";

/** Parses one draft set. Empty weight counts as bodyweight (0 lb). */
export function parseSet(set: SetDraft): WorkoutSet | null {
  const reps = set.reps.trim() === "" ? NaN : Number(set.reps);
  const weightLb = set.weight.trim() === "" ? 0 : Number(set.weight);
  if (!Number.isInteger(reps) || reps < 1 || !Number.isFinite(weightLb) || weightLb < 0) {
    return null;
  }
  return { reps, weightLb };
}

/** All sets parsed, or null if any set is incomplete. */
export function parseSets(sets: SetDraft[]): WorkoutSet[] | null {
  const parsed = sets.map(parseSet);
  return parsed.every((s): s is WorkoutSet => s !== null) ? parsed : null;
}

const cellInputClass = `${inputClass} px-3 text-center tabular-nums`;

export function ExerciseCard({
  index,
  exercise,
  lastSession,
  canRemove,
  newId,
  onChange,
  onRemove,
}: {
  index: number;
  exercise: ExerciseDraft;
  lastSession: ExerciseHistoryEntry | undefined;
  canRemove: boolean;
  newId: () => string;
  onChange: (next: ExerciseDraft) => void;
  onRemove: () => void;
}): React.JSX.Element {
  const label = exercise.name.trim() || `Exercise ${index + 1}`;
  const current = parseSets(exercise.sets);
  const previous = lastSession?.sets ?? [];
  const grows = lastSession && current ? isGrowth(previous, current) : false;
  const changes = grows && current ? describeGrowth(previous, current) : [];

  function updateSet(id: string, patch: Partial<SetDraft>): void {
    onChange({
      ...exercise,
      sets: exercise.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function addSet(): void {
    const last = exercise.sets[exercise.sets.length - 1];
    onChange({
      ...exercise,
      sets: [...exercise.sets, { id: newId(), reps: last?.reps ?? "", weight: last?.weight ?? "" }],
    });
  }

  function removeSet(id: string): void {
    onChange({ ...exercise, sets: exercise.sets.filter((s) => s.id !== id) });
  }

  function applyTarget(sets: WorkoutSet[]): void {
    onChange({
      ...exercise,
      sets: sets.map((s) => ({
        id: newId(),
        reps: String(s.reps),
        weight: s.weightLb === 0 ? "" : String(s.weightLb),
      })),
    });
  }

  return (
    <section
      aria-label={label}
      className="title-card flex flex-col gap-4 rounded-2xl p-4 text-left sm:p-5"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          list={EXERCISE_OPTIONS_ID}
          value={exercise.name}
          maxLength={MAX_EXERCISE_NAME}
          placeholder="Exercise (e.g. Back Squat)"
          aria-label={`Exercise ${index + 1} name`}
          autoComplete="off"
          onChange={(e) => onChange({ ...exercise, name: e.target.value })}
          className={`${inputClass} font-semibold`}
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="shrink-0 rounded-lg px-3 py-2 text-foreground/50 transition hover:text-red-400"
          >
            ✕
          </button>
        )}
      </div>

      {lastSession ? (
        <div className="flex flex-col gap-2 rounded-xl border border-accent/20 bg-background/40 p-3">
          <p className="text-sm text-foreground/70">
            <span className="font-mono text-xs uppercase tracking-widest text-accent/80">
              Last time · <LocalDate iso={lastSession.performedAt} />
            </span>
            <br />
            {formatSets(lastSession.sets)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest text-emerald-300/80">
              Grow it:
            </span>
            {growthTargets(lastSession.sets).map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => applyTarget(target.sets)}
                title={formatSets(target.sets)}
                className={`${chipClass} ${chipOffClass} hover:border-emerald-400/60 hover:text-emerald-200`}
              >
                {target.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        exercise.name.trim() !== "" && (
          <p className="text-sm text-foreground/60">
            First time logging this. Today sets your baseline; beat it next time to earn a spin.
          </p>
        )
      )}

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
          <span>Set</span>
          <span className="text-center">Weight (lb)</span>
          <span className="text-center">Reps</span>
          <span />
        </div>
        {exercise.sets.map((set, i) => (
          <div key={set.id} className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2">
            <span className="font-mono text-sm text-foreground/60">{i + 1}</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="BW"
              aria-label={`${label} set ${i + 1} weight in pounds`}
              value={set.weight}
              onChange={(e) => updateSet(set.id, { weight: e.target.value })}
              className={cellInputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="0"
              aria-label={`${label} set ${i + 1} reps`}
              value={set.reps}
              onChange={(e) => updateSet(set.id, { reps: e.target.value })}
              className={cellInputClass}
            />
            {exercise.sets.length > 1 ? (
              <button
                type="button"
                onClick={() => removeSet(set.id)}
                aria-label={`Remove ${label} set ${i + 1}`}
                className="text-foreground/40 transition hover:text-red-400"
              >
                ✕
              </button>
            ) : (
              <span />
            )}
          </div>
        ))}
        {exercise.sets.length < MAX_SETS && (
          <button
            type="button"
            onClick={addSet}
            className="self-start font-mono text-xs uppercase tracking-widest text-accent transition hover:text-accent-glow"
          >
            + Add set
          </button>
        )}
      </div>

      {lastSession && current && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 text-sm ${
            grows
              ? "border border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : "border border-foreground/10 bg-background/40 text-foreground/60"
          }`}
        >
          {grows
            ? `▲ Growth! ${changes.join(" · ")}`
            : "Not beating last time yet. Tap a “Grow it” option or add a rep."}
        </p>
      )}
    </section>
  );
}
