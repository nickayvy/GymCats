import { z } from "zod";

export const GOAL_PRESETS = [
  { id: "lose_weight", label: "Lose weight" },
  { id: "build_strength", label: "Build strength" },
  { id: "build_muscle", label: "Build muscle" },
  { id: "improve_endurance", label: "Improve endurance" },
  { id: "improve_flexibility", label: "Improve flexibility" },
  { id: "stay_consistent", label: "Stay consistent" },
] as const;

export const goalPresetIdSchema = z.enum([
  "lose_weight",
  "build_strength",
  "build_muscle",
  "improve_endurance",
  "improve_flexibility",
  "stay_consistent",
]);

export type GoalPresetId = z.infer<typeof goalPresetIdSchema>;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const goalPlanSchema = z.object({
  summary: z.string().min(1).max(600),
  recommendedPresets: z.array(goalPresetIdSchema).min(1).max(4),
  workoutsPerWeek: z.number().int().min(1).max(7),
  weeklyPlan: z
    .array(
      z.object({
        day: z.enum(WEEKDAYS),
        focus: z.string().min(1).max(80),
        durationMinutes: z.number().int().min(10).max(180),
      }),
    )
    .min(1)
    .max(7),
  tips: z.array(z.string().min(1).max(200)).max(5),
});

export type GoalPlan = z.infer<typeof goalPlanSchema>;

export const basicsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(40, "Display name must be 40 characters or fewer."),
  age: z
    .number({ error: "Enter your age." })
    .int("Age must be a whole number.")
    .min(13, "You must be at least 13.")
    .max(100, "Enter an age of 100 or less."),
});

export const bodySchema = z.object({
  heightCm: z
    .number({ error: "Enter your height." })
    .min(100, "Height looks too short.")
    .max(250, "Height looks too tall."),
  weightKg: z
    .number({ error: "Enter your weight." })
    .min(30, "Weight looks too low.")
    .max(300, "Weight looks too high."),
});

export const goalsSchema = z
  .object({
    goalPresets: z.array(goalPresetIdSchema).max(4, "Pick up to 4 goals."),
    goalFreeform: z.string().max(1000, "Keep it under 1000 characters."),
    goalPlan: goalPlanSchema.nullable(),
    workoutsPerWeek: z
      .number({ error: "Choose workouts per week." })
      .int()
      .min(1)
      .max(7),
  })
  .refine((v) => v.goalPresets.length > 0 || v.goalFreeform.trim().length > 0, {
    message: "Pick at least one goal or describe your own.",
    path: ["goalPresets"],
  });

export const profileSchema = basicsSchema
  .extend(bodySchema.shape)
  .and(goalsSchema);

export type ProfileInput = z.infer<typeof profileSchema>;

export type OnboardingDraft = {
  displayName: string;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  goalPresets: GoalPresetId[];
  goalFreeform: string;
  goalPlan: GoalPlan | null;
  workoutsPerWeek: number | null;
};

export const STEP_SCHEMAS = [basicsSchema, bodySchema, goalsSchema] as const;

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check your answers.";
}

export const goalPlanInputSchema = z.object({
  goalFreeform: z
    .string()
    .trim()
    .min(10, "Describe your goals in at least 10 characters.")
    .max(1000),
  goalPresets: z.array(goalPresetIdSchema).max(6),
  age: z.number().int().min(13).max(100).nullable(),
  heightCm: z.number().nullable(),
  weightKg: z.number().nullable(),
});

export type GoalPlanInput = z.infer<typeof goalPlanInputSchema>;

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
