"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseConfig } from "@/lib/env";
import {
  firstIssue,
  profileSchema,
  type ActionResult,
} from "@/lib/onboarding/schema";
import { createClient } from "@/lib/supabase/server";

const AVATAR_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export async function saveProfile(formData: FormData): Promise<ActionResult> {
  if (getSupabaseConfig() === null) {
    return {
      ok: false,
      error: "Saving is unavailable: Supabase is not configured.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please log in again." };
  }

  const raw = formData.get("draft");
  if (typeof raw !== "string") {
    return { ok: false, error: "Please check your answers." };
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Please check your answers." };
  }

  const parsed = profileSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: firstIssue(parsed.error) };
  }
  const profile = parsed.data;

  let avatarPath: string | null = null;
  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    if (!AVATAR_TYPES.includes(avatar.type)) {
      return { ok: false, error: "Photo must be a JPEG, PNG or WebP image." };
    }
    if (avatar.size > AVATAR_MAX_BYTES) {
      return { ok: false, error: "Photo must be 5 MB or smaller." };
    }

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { upsert: true, contentType: avatar.type });
    if (uploadError) {
      return {
        ok: false,
        error: "Couldn't upload your photo. Try again or skip it.",
      };
    }
    avatarPath = path;
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: profile.displayName,
    age: profile.age,
    height_cm: profile.heightCm,
    weight_kg: profile.weightKg,
    unit_system: profile.unitSystem,
    health_notes: profile.healthNotes,
    weekly_free_minutes: profile.weeklyFreeMinutes,
    goal_presets: profile.goalPresets,
    goal_freeform: profile.goalFreeform,
    goal_plan: profile.goalPlan,
    workouts_per_week: profile.workoutsPerWeek,
    ...(avatarPath !== null ? { avatar_path: avatarPath } : {}),
    onboarded_at: new Date().toISOString(),
  });
  if (error) {
    console.error("saveProfile failed", error);
    return {
      ok: false,
      error: "Couldn't save your profile. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
