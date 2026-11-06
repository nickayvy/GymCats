import { z } from "zod";
import {
  MAX_EXERCISE_NAME,
  MAX_EXERCISES,
  MAX_REPS,
  MAX_SETS,
  MAX_WEIGHT_LB,
  exerciseKey,
  normalizeExerciseName,
  type WorkoutSet,
} from "./growth";

export const workoutSetSchema = z.object({
  reps: z
    .number({ error: "Enter reps for every set." })
    .int("Reps must be a whole number.")
    .min(1, "Reps must be at least 1.")
    .max(MAX_REPS, `Reps must be ${MAX_REPS} or fewer.`),
  weightLb: z
    .number({ error: "Enter a weight for every set (0 for bodyweight)." })
    .min(0, "Weight can't be negative.")
    .max(MAX_WEIGHT_LB, `Weight must be ${MAX_WEIGHT_LB} lb or less.`),
});

export const loggedExerciseSchema = z.object({
  name: z
    .string()
    .transform(normalizeExerciseName)
    .pipe(
      z
        .string()
        .min(1, "Name every exercise.")
        .max(MAX_EXERCISE_NAME, `Exercise names must be ${MAX_EXERCISE_NAME} characters or fewer.`),
    ),
  sets: z
    .array(workoutSetSchema)
    .min(1, "Add at least one set to every exercise.")
    .max(MAX_SETS, `Log ${MAX_SETS} sets or fewer per exercise.`),
});

export const workoutLogSchema = z
  .array(loggedExerciseSchema)
  .min(1, "Add at least one exercise.")
  .max(MAX_EXERCISES, `Log ${MAX_EXERCISES} exercises or fewer.`)
  .refine((list) => new Set(list.map((e) => exerciseKey(e.name))).size === list.length, {
    message: "Each exercise can only appear once. Add more sets instead.",
  });

export type WorkoutLogInput = z.infer<typeof workoutLogSchema>;

export type ExerciseOutcome = {
  name: string;
  sets: WorkoutSet[];
  previousSets: WorkoutSet[] | null;
  grew: boolean;
  spinAwarded: boolean;
};

export type LogWorkoutResult = {
  spinsEarned: number;
  spinsBalance: number;
  exercises: ExerciseOutcome[];
};

/** Previous session of one exercise, as shown on the log screen. */
export type ExerciseHistoryEntry = {
  key: string;
  name: string;
  sets: WorkoutSet[];
  performedAt: string;
};

export type RecentWorkout = {
  id: string;
  performedAt: string;
  spinsEarned: number;
  exercises: { name: string; sets: WorkoutSet[]; grew: boolean }[];
};

const dbSetSchema = z.object({ reps: z.number(), weight_lb: z.number() });

/** Parses a `sets` jsonb value from the database. Returns [] if malformed. */
export function parseDbSets(value: unknown): WorkoutSet[] {
  const parsed = z.array(dbSetSchema).safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.map((s) => ({ reps: s.reps, weightLb: s.weight_lb }));
}
