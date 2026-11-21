"use client";

import { useRef } from "react";

import {
  describeGrowth,
  formatSets,
  growthTargets,
  isGrowth,
  MAX_EXERCISE_NAME,
  MAX_REPS,
  MAX_SETS,
  MAX_WEIGHT_LB,
  type WorkoutSet,
} from "@/lib/workouts/growth";
import type { ExerciseHistoryEntry } from "@/lib/workouts/schema";
import { chipClass, chipOffClass, inputClass } from "@/components/onboarding/styles";
import { ItemSlot } from "@/components/ui";
import { ExerciseIcon } from "./exerciseIcon";
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

/** Reps must be a whole number from 1 to MAX_REPS. */
function repsInvalid(reps: string): boolean {
  const n = reps.trim() === "" ? NaN : Number(reps);
  return !Number.isInteger(n) || n < 1 || n > MAX_REPS;
}

/** Blank weight is bodyweight, so only a filled-in bad value is invalid. */
function weightInvalid(weight: string): boolean {
  if (weight.trim() === "") return false;
  const n = Number(weight);
  return !Number.isFinite(n) || n < 0 || n > MAX_WEIGHT_LB;
}

/** Stops a scroll wheel over a focused number field from changing its value. */
function blurOnWheel(e: React.WheelEvent<HTMLInputElement>): void {
  e.currentTarget.blur();
}

const cellInputClass = `${inputClass} lg-cell`;

/** "135×8", or "BW×8" for bodyweight: last time's set, compact. */
function shortSet(set: WorkoutSet): string {
  const weight = set.weightLb === 0 ? "BW" : String(Math.round(set.weightLb * 10) / 10);
  return `${weight}×${set.reps}`;
}

export function ExerciseCard({
  index,
  exercise,
  lastSession,
  canRemove,
  showErrors,
  duplicate,
  quickPicks,
  quickPicksLabel,
  newId,
  onChange,
  onRemove,
}: {
  index: number;
  exercise: ExerciseDraft;
  lastSession: ExerciseHistoryEntry | undefined;
  canRemove: boolean;
  /** Highlight invalid fields (set after a failed submit). */
  showErrors: boolean;
  /** Another exercise in this workout has the same name. */
  duplicate: boolean;
  /** Exercise names to offer as one-tap picks while the name is empty. */
  quickPicks: string[];
  quickPicksLabel: string;
  newId: () => string;
  onChange: (next: ExerciseDraft) => void;
  onRemove: () => void;
}): React.JSX.Element {
  const label = exercise.name.trim() || `Exercise ${index + 1}`;
  const nameEmpty = exercise.name.trim() === "";
  const touched = !nameEmpty || exercise.sets.some((s) => s.reps.trim() !== "" || s.weight.trim() !== "");
  const flag = showErrors && touched;
  const nameError = flag && (nameEmpty || duplicate);
  const current = parseSets(exercise.sets);
  const previous = lastSession?.sets ?? [];
  const hasPrevious = previous.length > 0;
  // Tailwind needs whole class names, so both layouts are spelled out.
  // Below 380px (iPhone SE) the columns tighten so the weight still fits.
  const gridClass = hasPrevious
    ? "grid grid-cols-[1.5rem_3.5rem_1fr_1fr_2.25rem] items-center gap-1.5 min-[380px]:grid-cols-[2rem_4.5rem_1fr_1fr_2.75rem] min-[380px]:gap-2"
    : "grid grid-cols-[2rem_1fr_1fr_2.75rem] items-center gap-2";
  const sectionRef = useRef<HTMLElement>(null);
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

  function pickName(name: string): void {
    onChange({ ...exercise, name });
    // The chip that had focus disappears once the card has a name. Keep focus
    // on this card (without opening the keyboard) rather than losing it.
    window.requestAnimationFrame(() => sectionRef.current?.focus({ preventScroll: true }));
  }

  function copyPrevious(id: string, set: WorkoutSet): void {
    updateSet(id, { reps: String(set.reps), weight: set.weightLb === 0 ? "" : String(set.weightLb) });
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
      ref={sectionRef}
      tabIndex={-1}
      aria-label={label}
      className="gc-panel lg-card gc-rise flex flex-col gap-4 p-4 text-left outline-none sm:p-5"
    >
      <div className="flex items-center gap-3">
        <ItemSlot size={48} className="lg-slot" selected={grows}>
          {exercise.name.trim() !== "" ? <ExerciseIcon name={exercise.name} /> : undefined}
        </ItemSlot>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span aria-hidden="true" className="gc-caps">
            {`Exercise ${index + 1}`}
          </span>
          <input
            type="text"
            list={EXERCISE_OPTIONS_ID}
            value={exercise.name}
            maxLength={MAX_EXERCISE_NAME}
            placeholder="Exercise (e.g. Back Squat)"
            aria-label={`Exercise ${index + 1} name`}
            autoComplete="off"
            onChange={(e) => onChange({ ...exercise, name: e.target.value })}
            aria-invalid={nameError || undefined}
            className={`${inputClass} lg-name`}
          />
          {nameError && (
            <span className="text-xs italic text-ember">
              {nameEmpty ? "Name this exercise." : "Already in this workout. Add sets to the other one instead."}
            </span>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="lg-x shrink-0 self-start mt-5"
          >
            ✕
          </button>
        )}
      </div>

      {nameEmpty && quickPicks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="gc-caps">{quickPicksLabel}</span>
          {quickPicks.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => pickName(name)}
              className={`${chipClass} lg-pick`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {lastSession ? (
        <div className="lg-last flex flex-col gap-2.5 p-3">
          <p className="flex flex-col gap-0.5 text-sm">
            <span className="gc-caps">
              Last time · <LocalDate iso={lastSession.performedAt} />
            </span>
            <span className="gc-num italic text-ink">{formatSets(lastSession.sets)}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="gc-caps">
              <span className="text-moss">Grow it:</span>
            </span>
            {growthTargets(lastSession.sets).map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => applyTarget(target.sets)}
                title={formatSets(target.sets)}
                className={`${chipClass} ${chipOffClass} lg-grow`}
              >
                <span aria-hidden="true">▲</span>
                {target.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        exercise.name.trim() !== "" && (
          <p className="text-sm italic text-white/65">
            First time logging this. Today sets your baseline; beat it next time to earn an attack.
          </p>
        )
      )}

      <div className="flex flex-col gap-2">
        <div className={`gc-caps ${gridClass}`}>
          <span>Set</span>
          {hasPrevious && <span className="text-center">Last</span>}
          <span className="text-center">{hasPrevious ? "lb" : "Weight (lb)"}</span>
          <span className="text-center">Reps</span>
          <span />
        </div>
        {exercise.sets.map((set, i) => (
          <div key={set.id} className={gridClass}>
            <span className="lg-setno">{i + 1}</span>
            {hasPrevious &&
              (previous[i] ? (
                <button
                  type="button"
                  onClick={() => copyPrevious(set.id, previous[i])}
                  aria-label={`Use last time's set ${i + 1} (${shortSet(previous[i])}) for set ${i + 1}`}
                  title="Use last time's numbers"
                  className="lg-prev"
                >
                  {shortSet(previous[i])}
                </button>
              ) : (
                <span className="lg-prev" data-empty aria-hidden="true">
                  –
                </span>
              ))}
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="BW"
              aria-label={`${label} set ${i + 1} weight in pounds`}
              value={set.weight}
              onChange={(e) => updateSet(set.id, { weight: e.target.value })}
              onWheel={blurOnWheel}
              aria-invalid={(flag && weightInvalid(set.weight)) || undefined}
              className={cellInputClass}
            />
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="–"
              aria-label={`${label} set ${i + 1} reps`}
              value={set.reps}
              onChange={(e) => updateSet(set.id, { reps: e.target.value })}
              onWheel={blurOnWheel}
              aria-invalid={(flag && repsInvalid(set.reps)) || undefined}
              className={cellInputClass}
            />
            {exercise.sets.length > 1 ? (
              <button
                type="button"
                onClick={() => removeSet(set.id)}
                aria-label={`Remove ${label} set ${i + 1}`}
                className="lg-x"
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
            className={`${chipClass} lg-add-set mt-1 self-start`}
          >
            + Add set
          </button>
        )}
      </div>

      {lastSession && current && (
        <p
          role="status"
          data-grows={grows || undefined}
          className="lg-status flex items-start gap-2 px-3 py-2 text-sm italic"
        >
          {grows
            ? `▲ Growth! ${changes.join(" · ")}`
            : "Not beating last time yet. Tap a “Grow it” option or add a rep."}
        </p>
      )}
    </section>
  );
}
