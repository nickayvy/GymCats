"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { logWorkout } from "@/app/log/actions";
import { SpinBadge } from "@/components/hub/SpinBadge";
import { TitleBanner, PreviewNotice } from "@/components/ui";
import "@/app/styles/log.css";
import { errorClass, secondaryButtonClass } from "@/components/onboarding/styles";
import { COMMON_EXERCISES, exerciseKey, isGrowth, MAX_EXERCISES } from "@/lib/workouts/growth";
import {
  workoutLogSchema,
  type ExerciseHistoryEntry,
  type LogWorkoutResult,
  type RecentWorkout,
} from "@/lib/workouts/schema";
import { firstIssue } from "@/lib/onboarding/schema";
import {
  EXERCISE_OPTIONS_ID,
  ExerciseCard,
  parseSet,
  parseSets,
  type ExerciseDraft,
} from "./ExerciseCard";
import { clearDraft, isBlankExercise, loadDraft, saveDraft } from "./draft";
import { LogResult } from "./LogResult";
import { RecentWorkouts } from "./RecentWorkouts";

/** One-tap exercise picks on an unnamed card: your own lifts, or popular ones. */
const RECENT_PICKS = 6;
const POPULAR_PICKS = 4;
/** How long "Undo" stays up after removing an exercise. */
const UNDO_MS = 8000;

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function WorkoutLogger({
  preview,
  userId,
  spins,
  lastSessions,
  recentWorkouts,
}: {
  preview: boolean;
  userId: string | null;
  spins: number;
  lastSessions: ExerciseHistoryEntry[];
  recentWorkouts: RecentWorkout[];
}): React.JSX.Element {
  const counter = useRef(0);
  const newId = (): string => `k${counter.current++}`;
  const blankExercise = (): ExerciseDraft => ({
    id: newId(),
    name: "",
    sets: [{ id: newId(), reps: "", weight: "" }],
  });

  const formRef = useRef<HTMLFormElement>(null);
  const [exercises, setExercises] = useState<ExerciseDraft[]>(() => [blankExercise()]);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [result, setResult] = useState<LogWorkoutResult | null>(null);
  const [restored, setRestored] = useState(false);
  const [removed, setRemoved] = useState<{ exercise: ExerciseDraft; index: number } | null>(null);
  const [pending, startTransition] = useTransition();
  // Drafts are read after mount (localStorage isn't available on the server).
  // Saving waits for a render where draftReady is true, which is also the
  // first render that holds the restored exercises, so the blank initial
  // state can never overwrite a saved draft.
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (draftReady) return;
    const draft = loadDraft(userId, newId);
    if (draft) {
      setExercises(draft);
      setRestored(true);
    }
    setDraftReady(true);
    // newId only reads a ref.
  }, [userId, draftReady]);

  useEffect(() => {
    if (!draftReady || result) return;
    saveDraft(userId, exercises);
  }, [userId, exercises, result, draftReady]);

  useEffect(() => {
    if (!removed) return;
    const timer = window.setTimeout(() => setRemoved(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [removed]);

  const historyByKey = useMemo(
    () => new Map(lastSessions.map((s) => [s.key, s])),
    [lastSessions],
  );

  const exerciseOptions = useMemo(() => {
    const names = lastSessions.map((s) => s.name);
    const keys = new Set(lastSessions.map((s) => s.key));
    for (const name of COMMON_EXERCISES) {
      if (!keys.has(exerciseKey(name))) names.push(name);
    }
    return names;
  }, [lastSessions]);

  const usedKeys = useMemo(
    () => new Set(exercises.map((e) => exerciseKey(e.name)).filter((k) => k !== "")),
    [exercises],
  );

  const duplicateKeys = useMemo(() => {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const e of exercises) {
      const key = exerciseKey(e.name);
      if (key === "") continue;
      if (seen.has(key)) dupes.add(key);
      seen.add(key);
    }
    return dupes;
  }, [exercises]);

  // Your own recent lifts first; common lifts until you have some history.
  const quickPicks = useMemo(() => {
    const recent = lastSessions.length > 0;
    const source = recent ? lastSessions.map((s) => s.name) : [...COMMON_EXERCISES];
    return source
      .filter((name) => !usedKeys.has(exerciseKey(name)))
      .slice(0, recent ? RECENT_PICKS : POPULAR_PICKS);
  }, [lastSessions, usedKeys]);
  const quickPicksLabel = lastSessions.length > 0 ? "Recent" : "Popular";

  const summary = useMemo(() => {
    const filled = exercises.filter((e) => !isBlankExercise(e));
    let growing = 0;
    let comparable = 0;
    for (const e of filled) {
      const last = historyByKey.get(exerciseKey(e.name));
      if (!last) continue;
      comparable += 1;
      const sets = parseSets(e.sets);
      if (sets && isGrowth(last.sets, sets)) growing += 1;
    }
    return { count: filled.length, growing, comparable };
  }, [exercises, historyByKey]);

  function updateExercise(id: string, next: ExerciseDraft): void {
    setExercises((list) => list.map((e) => (e.id === id ? next : e)));
    // The highlighted fields keep showing what's left to fix.
    setError(null);
  }

  function removeExercise(id: string): void {
    const index = exercises.findIndex((e) => e.id === id);
    const exercise = exercises[index];
    if (!exercise) return;
    setExercises((list) => list.filter((e) => e.id !== id));
    setRemoved(isBlankExercise(exercise) ? null : { exercise, index });
  }

  function undoRemove(): void {
    if (!removed) return;
    setExercises((list) => {
      const next = [...list];
      next.splice(Math.min(removed.index, next.length), 0, removed.exercise);
      return next.slice(0, MAX_EXERCISES);
    });
    setRemoved(null);
  }

  function startOver(): void {
    clearDraft(userId);
    setExercises([blankExercise()]);
    setRestored(false);
    setShowErrors(false);
    setError(null);
    setRemoved(null);
  }

  function focusFirstInvalid(): void {
    window.requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]');
      if (!field) return;
      field.scrollIntoView({ block: "center", behavior: "smooth" });
      field.focus({ preventScroll: true });
    });
  }

  function submit(): void {
    setError(null);
    const filled = exercises.filter((e) => !isBlankExercise(e));
    const payload = filled.map((e) => ({
      name: e.name,
      sets: e.sets.map((s) => parseSet(s) ?? { reps: NaN, weightLb: NaN }),
    }));
    const parsed = workoutLogSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const badSet = issue?.path.includes("sets") && issue.path.length > 3;
      setShowErrors(true);
      setError(
        badSet
          ? "Some sets are missing reps. Fill in the highlighted fields (leave weight blank for bodyweight)."
          : firstIssue(parsed.error),
      );
      focusFirstInvalid();
      return;
    }
    startTransition(async () => {
      const res = await logWorkout(parsed.data);
      if (res.ok) {
        clearDraft(userId);
        setResult(res.data);
        setShowErrors(false);
        setRestored(false);
        setRemoved(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(res.error);
      }
    });
  }

  function logAnother(): void {
    setResult(null);
    setExercises([blankExercise()]);
  }

  // Enter moves to the next field, like a spreadsheet, instead of submitting
  // a half-filled workout. On the last field it just closes the keyboard.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>): void {
    const target = e.target as HTMLElement;
    if (e.key !== "Enter" || e.nativeEvent.isComposing || !(target instanceof HTMLInputElement)) return;
    e.preventDefault();
    const fields = Array.from(formRef.current?.querySelectorAll<HTMLInputElement>("input") ?? []);
    const next = fields[fields.indexOf(target) + 1];
    if (next) next.focus();
    else target.blur();
  }

  const canSubmit = !pending && !preview && summary.count > 0;

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-6 sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <Link href="/hub" className="gc-btn gc-btn-sm">
            Hub
          </Link>
          <SpinBadge spins={result ? result.spinsBalance : spins} />
        </header>

        <TitleBanner
          eyebrow="Quest Log"
          title={
            <>
              Log <span className="text-moss">&amp; Grow</span>
            </>
          }
          subtitle="Beat your last session on any lift (one more rep, a little more weight, or an extra set) and earn an attack."
          size="md"
        />

        {preview && (
          <PreviewNotice detail="so workouts can't be saved." className="self-center" />
        )}

        {result ? (
          <LogResult result={result} onLogAnother={logAnother} />
        ) : (
          <form
            ref={formRef}
            noValidate
            className="flex flex-col gap-4"
            onKeyDown={handleKeyDown}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <datalist id={EXERCISE_OPTIONS_ID}>
              {exerciseOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>

            {restored && (
              <div className="lg-note gc-fade flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm italic">
                <span>Picked up your unsaved workout where you left off.</span>
                <button type="button" onClick={startOver} className="lg-link">
                  Start over
                </button>
              </div>
            )}

            {exercises.map((exercise, i) => (
              <ExerciseCard
                key={exercise.id}
                index={i}
                exercise={exercise}
                lastSession={historyByKey.get(exerciseKey(exercise.name))}
                canRemove={exercises.length > 1}
                showErrors={showErrors}
                duplicate={duplicateKeys.has(exerciseKey(exercise.name))}
                quickPicks={quickPicks}
                quickPicksLabel={quickPicksLabel}
                newId={newId}
                onChange={(next) => updateExercise(exercise.id, next)}
                onRemove={() => removeExercise(exercise.id)}
              />
            ))}

            {exercises.length < MAX_EXERCISES && (
              <button
                type="button"
                onClick={() => setExercises((list) => [...list, blankExercise()])}
                className={`${secondaryButtonClass} lg-add`}
              >
                + Add exercise
              </button>
            )}

            {/* Stays in reach of your thumb while you scroll through a long workout. */}
            <div className="lg-dock sticky bottom-0 z-20 -mx-4 flex flex-col gap-2 px-4 pt-3 sm:mx-0 sm:px-0">
              {removed && (
                <div role="status" className="lg-note gc-fade flex items-center justify-between gap-3 px-3 py-2 text-sm italic">
                  <span className="min-w-0 truncate">
                    Removed {removed.exercise.name.trim() || "exercise"}.
                  </span>
                  <button type="button" onClick={undoRemove} className="lg-link shrink-0">
                    Undo
                  </button>
                </div>
              )}

              {error && (
                <p role="alert" className={`${errorClass} gc-fade flex items-center gap-2`}>
                  <span aria-hidden="true">◆</span>
                  {error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 text-sm italic leading-snug text-white/70" aria-live="polite">
                  {summary.count === 0 ? (
                    "Add an exercise to log."
                  ) : (
                    <>
                      <span className="block text-ink">{plural(summary.count, "exercise")}</span>
                      {summary.growing > 0 ? (
                        <span className="block text-moss">▲ {summary.growing} beating last time</span>
                      ) : summary.comparable > 0 ? (
                        <span className="block">Not beating last time yet</span>
                      ) : (
                        <span className="block">Sets your baseline</span>
                      )}
                    </>
                  )}
                </p>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="gc-btn gc-btn-moss gc-btn-lg shrink-0 px-6"
                >
                  {pending ? "Saving…" : "Log workout"}
                </button>
              </div>
            </div>
          </form>
        )}

        <RecentWorkouts workouts={recentWorkouts} />
      </div>
    </main>
  );
}
