/**
 * Growth rules for logged exercises.
 *
 * A session "grows" over the previous session of the same exercise when it has
 * a heavier top set, more total volume (reps x weight), or, for bodyweight
 * work (0 lb), more total reps. That covers +1 rep, +2 reps, an extra set,
 * an extra set at a lighter weight, and more weight with fewer sets.
 *
 * The database function `log_workout` applies the same rule and is the source
 * of truth for spins. This module mirrors it for live previews and targets.
 * Weights are compared in whole tenths of a pound, matching the database's
 * numeric(…,1) rounding, so the two never disagree on float drift.
 */

export type WorkoutSet = { reps: number; weightLb: number };

export type SetStats = {
  setCount: number;
  totalReps: number;
  topWeightTenths: number;
  volumeTenths: number;
};

/** Pounds added for a "+weight" growth target. */
export const WEIGHT_STEP_LB = 5;

export const MAX_EXERCISES = 20;
export const MAX_SETS = 20;
export const MAX_REPS = 1000;
export const MAX_WEIGHT_LB = 2000;
export const MAX_EXERCISE_NAME = 60;

export function normalizeExerciseName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function exerciseKey(name: string): string {
  return normalizeExerciseName(name).toLowerCase();
}

function toTenths(weightLb: number): number {
  return Math.round(weightLb * 10);
}

export function computeStats(sets: WorkoutSet[]): SetStats {
  let totalReps = 0;
  let topWeightTenths = 0;
  let volumeTenths = 0;
  for (const set of sets) {
    const tenths = toTenths(set.weightLb);
    totalReps += set.reps;
    topWeightTenths = Math.max(topWeightTenths, tenths);
    volumeTenths += set.reps * tenths;
  }
  return { setCount: sets.length, totalReps, topWeightTenths, volumeTenths };
}

export function isGrowth(previous: WorkoutSet[], current: WorkoutSet[]): boolean {
  const prev = computeStats(previous);
  const curr = computeStats(current);
  return (
    curr.topWeightTenths > prev.topWeightTenths ||
    curr.volumeTenths > prev.volumeTenths ||
    (curr.topWeightTenths === 0 &&
      prev.topWeightTenths === 0 &&
      curr.totalReps > prev.totalReps)
  );
}

function formatTenths(tenths: number): string {
  return Number.isInteger(tenths / 10) ? String(tenths / 10) : (tenths / 10).toFixed(1);
}

export function formatWeight(weightLb: number): string {
  return weightLb === 0 ? "BW" : `${formatTenths(toTenths(weightLb))} lb`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${Math.abs(n) === 1 ? "" : "s"}`;
}

/** "3 × 5 @ 185 lb", or "5, 5, 4 reps @ 185 lb", or a per-set list when mixed. */
export function formatSets(sets: WorkoutSet[]): string {
  if (sets.length === 0) return "";
  const sameWeight = sets.every((s) => toTenths(s.weightLb) === toTenths(sets[0].weightLb));
  const sameReps = sets.every((s) => s.reps === sets[0].reps);
  if (sameWeight && sameReps) {
    return `${sets.length} × ${sets[0].reps} @ ${formatWeight(sets[0].weightLb)}`;
  }
  if (sameWeight) {
    return `${sets.map((s) => s.reps).join(", ")} reps @ ${formatWeight(sets[0].weightLb)}`;
  }
  return sets.map((s) => `${s.reps} @ ${formatWeight(s.weightLb)}`).join(", ");
}

/** Short, positive descriptions of what improved, e.g. ["+5 lb top weight", "+1 rep"]. */
export function describeGrowth(previous: WorkoutSet[], current: WorkoutSet[]): string[] {
  const prev = computeStats(previous);
  const curr = computeStats(current);
  const changes: string[] = [];
  const weightDiff = curr.topWeightTenths - prev.topWeightTenths;
  const repDiff = curr.totalReps - prev.totalReps;
  const setDiff = curr.setCount - prev.setCount;
  const volumeDiff = curr.volumeTenths - prev.volumeTenths;
  if (weightDiff > 0) changes.push(`+${formatTenths(weightDiff)} lb top weight`);
  if (setDiff > 0) changes.push(`+${plural(setDiff, "set")}`);
  if (repDiff > 0) changes.push(`+${plural(repDiff, "rep")}`);
  if (volumeDiff > 0 && curr.topWeightTenths > 0) {
    changes.push(`+${formatTenths(volumeDiff)} lb volume`);
  }
  return changes;
}

export type GrowthTarget = {
  id: "rep1" | "rep2" | "weight" | "set";
  label: string;
  sets: WorkoutSet[];
};

/**
 * Ways to beat the previous session, each as a ready-to-use set list built
 * from that session. Every target satisfies `isGrowth(previous, target.sets)`.
 */
export function growthTargets(previous: WorkoutSet[]): GrowthTarget[] {
  if (previous.length === 0) return [];
  const copy = (): WorkoutSet[] => previous.map((s) => ({ ...s }));
  const last = previous.length - 1;
  const top = Math.max(...previous.map((s) => s.weightLb));
  const targets: GrowthTarget[] = [];

  const plusOne = copy();
  plusOne[last].reps += 1;
  targets.push({ id: "rep1", label: "+1 rep", sets: plusOne });

  const plusTwo = copy();
  plusTwo[last].reps += 2;
  targets.push({ id: "rep2", label: "+2 reps", sets: plusTwo });

  if (top > 0) {
    const heavier = copy().map((s) =>
      s.weightLb === top ? { ...s, weightLb: s.weightLb + WEIGHT_STEP_LB } : s,
    );
    targets.push({ id: "weight", label: `+${WEIGHT_STEP_LB} lb`, sets: heavier });
  }

  if (previous.length < MAX_SETS) {
    targets.push({ id: "set", label: "+1 set", sets: [...copy(), { ...previous[last] }] });
  }

  return targets.filter((t) =>
    t.sets.every((s) => s.reps <= MAX_REPS && s.weightLb <= MAX_WEIGHT_LB),
  );
}

export const COMMON_EXERCISES = [
  "Back Squat",
  "Front Squat",
  "Deadlift",
  "Romanian Deadlift",
  "Bench Press",
  "Incline Bench Press",
  "Overhead Press",
  "Barbell Row",
  "Pull-up",
  "Chin-up",
  "Lat Pulldown",
  "Seated Cable Row",
  "Dumbbell Shoulder Press",
  "Dumbbell Curl",
  "Tricep Pushdown",
  "Leg Press",
  "Leg Extension",
  "Leg Curl",
  "Hip Thrust",
  "Walking Lunge",
  "Calf Raise",
  "Push-up",
  "Dip",
  "Chest Fly Machine",
] as const;
