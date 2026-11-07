"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { logWorkout } from "@/app/log/actions";
import { SpinBadge } from "@/components/hub/SpinBadge";
import { TitleBanner, PreviewNotice } from "@/components/ui";
import "@/app/styles/log.css";
import { errorClass, secondaryButtonClass } from "@/components/onboarding/styles";
import { COMMON_EXERCISES, exerciseKey, MAX_EXERCISES } from "@/lib/workouts/growth";
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
  type ExerciseDraft,
} from "./ExerciseCard";
import { LogResult } from "./LogResult";
import { RecentWorkouts } from "./RecentWorkouts";

function isBlank(e: ExerciseDraft): boolean {
  return e.name.trim() === "" && e.sets.every((s) => s.reps.trim() === "" && s.weight.trim() === "");
}

export function WorkoutLogger({
  preview,
  spins,
  lastSessions,
  recentWorkouts,
}: {
  preview: boolean;
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

  const [exercises, setExercises] = useState<ExerciseDraft[]>(() => [blankExercise()]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LogWorkoutResult | null>(null);
  const [pending, startTransition] = useTransition();

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

  function updateExercise(id: string, next: ExerciseDraft): void {
    setExercises((list) => list.map((e) => (e.id === id ? next : e)));
  }

  function removeExercise(id: string): void {
    setExercises((list) => list.filter((e) => e.id !== id));
  }

  function submit(): void {
    setError(null);
    const filled = exercises.filter((e) => !isBlank(e));
    const payload = filled.map((e) => ({
      name: e.name,
      sets: e.sets.map((s) => parseSet(s) ?? { reps: NaN, weightLb: NaN }),
    }));
    const parsed = workoutLogSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const badSet = issue?.path.includes("sets") && issue.path.length > 3;
      setError(badSet ? "Enter whole-number reps (and a weight, or leave it blank for bodyweight) for every set." : firstIssue(parsed.error));
      return;
    }
    startTransition(async () => {
      const res = await logWorkout(parsed.data);
      if (res.ok) {
        setResult(res.data);
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

  return (
    <main className="relative min-h-screen overflow-x-clip px-4 py-6 sm:px-6 sm:py-10">
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <Link href="/hub" className="gc-btn gc-btn-ghost gc-btn-sm -ml-2">
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
            className="flex flex-col gap-4"
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

            {exercises.map((exercise, i) => (
              <ExerciseCard
                key={exercise.id}
                index={i}
                exercise={exercise}
                lastSession={historyByKey.get(exerciseKey(exercise.name))}
                canRemove={exercises.length > 1}
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

            {error && (
              <p role="alert" className={`${errorClass} gc-fade flex items-center gap-2`}>
                <span aria-hidden="true">◆</span>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || preview}
              className="gc-btn gc-btn-moss gc-btn-lg"
            >
              {pending ? "Saving…" : "Log workout"}
            </button>
          </form>
        )}

        <RecentWorkouts workouts={recentWorkouts} />
      </div>
    </main>
  );
}
