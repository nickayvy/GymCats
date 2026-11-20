import type { ExerciseDraft } from "./ExerciseCard";

// An unsaved workout survives a reload or a trip to the battle screen. It
// lives in this browser only and is cleared once the workout is logged.

const VERSION = 1;
/** Drafts older than this are dropped: they belong to a past session. */
const MAX_AGE_MS = 18 * 60 * 60 * 1000;

type StoredDraft = {
  v: number;
  savedAt: number;
  exercises: { name: string; sets: { reps: string; weight: string }[] }[];
};

function storageKey(userId: string | null): string {
  return `gymcats:log-draft:${userId ?? "preview"}`;
}

export function isBlankExercise(e: ExerciseDraft): boolean {
  return e.name.trim() === "" && e.sets.every((s) => s.reps.trim() === "" && s.weight.trim() === "");
}

/** Saves the draft, or removes it when nothing has been entered. */
export function saveDraft(userId: string | null, exercises: ExerciseDraft[]): void {
  try {
    const key = storageKey(userId);
    if (exercises.every(isBlankExercise)) {
      window.localStorage.removeItem(key);
      return;
    }
    const value: StoredDraft = {
      v: VERSION,
      savedAt: Date.now(),
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: e.sets.map((s) => ({ reps: s.reps, weight: s.weight })),
      })),
    };
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode). The draft is a convenience.
  }
}

/** The saved draft with fresh ids, or null if there is none worth restoring. */
export function loadDraft(userId: string | null, newId: () => string): ExerciseDraft[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<StoredDraft>;
    if (
      value.v !== VERSION ||
      typeof value.savedAt !== "number" ||
      Date.now() - value.savedAt > MAX_AGE_MS ||
      !Array.isArray(value.exercises)
    ) {
      clearDraft(userId);
      return null;
    }
    const exercises: ExerciseDraft[] = value.exercises.slice(0, 20).map((e) => ({
      id: newId(),
      name: typeof e?.name === "string" ? e.name : "",
      sets: (Array.isArray(e?.sets) && e.sets.length > 0 ? e.sets.slice(0, 20) : [{ reps: "", weight: "" }]).map(
        (s) => ({
          id: newId(),
          reps: typeof s?.reps === "string" ? s.reps : "",
          weight: typeof s?.weight === "string" ? s.weight : "",
        }),
      ),
    }));
    return exercises.length > 0 && !exercises.every(isBlankExercise) ? exercises : null;
  } catch {
    return null;
  }
}

export function clearDraft(userId: string | null): void {
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // Ignore: see saveDraft.
  }
}
