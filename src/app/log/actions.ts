"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/env";
import { firstIssue, type ActionResult } from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";
import {
  parseDbSets,
  workoutLogSchema,
  type LogWorkoutResult,
} from "@/lib/workouts/schema";

const rpcResultSchema = z.object({
  spins_earned: z.number(),
  spins_balance: z.number(),
  exercises: z.array(
    z.object({
      name: z.string(),
      grew: z.boolean(),
      spin_awarded: z.boolean(),
      previous_sets: z.unknown(),
    }),
  ),
});

const RPC_ERRORS: Record<string, string> = {
  not_authenticated: "Your session expired. Please log in again.",
  duplicate_exercise: "Each exercise can only appear once. Add more sets instead.",
  invalid_exercise_name: "Check your exercise names.",
  invalid_sets: "Check your sets: reps must be whole numbers and weights 0–2000 lb.",
  invalid_exercises: "Add between 1 and 20 exercises.",
};

export async function logWorkout(input: unknown): Promise<ActionResult<LogWorkoutResult>> {
  if (getSupabaseConfig() === null) {
    return { ok: false, error: "Saving is unavailable: Supabase is not configured." };
  }

  const parsed = workoutLogSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }
  const exercises = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: RPC_ERRORS.not_authenticated };
  }

  const { data, error } = await supabase.rpc("log_workout", {
    p_exercises: exercises.map((e) => ({
      name: e.name,
      sets: e.sets.map((s) => ({ reps: s.reps, weight_lb: Math.round(s.weightLb * 10) / 10 })),
    })),
  });
  if (error) {
    console.error("logWorkout failed", error);
    const known = Object.keys(RPC_ERRORS).find((code) => error.message.includes(code));
    return {
      ok: false,
      error: known ? RPC_ERRORS[known] : "Couldn't save your workout. Please try again.",
    };
  }

  const result = rpcResultSchema.safeParse(data);
  if (!result.success) {
    console.error("logWorkout returned an unexpected shape", data);
    return { ok: false, error: "Your workout was saved, but we couldn't read the results." };
  }

  revalidatePath("/hub");
  revalidatePath("/log");

  return {
    ok: true,
    data: {
      spinsEarned: result.data.spins_earned,
      spinsBalance: result.data.spins_balance,
      exercises: result.data.exercises.map((e, i) => ({
        name: e.name,
        sets: exercises[i]?.sets ?? [],
        previousSets: e.previous_sets === null ? null : parseDbSets(e.previous_sets),
        grew: e.grew,
        spinAwarded: e.spin_awarded,
      })),
    },
  };
}
