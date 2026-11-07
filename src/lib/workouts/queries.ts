import { createClient } from "@/lib/supabase/server";
import {
  parseDbSets,
  type ExerciseHistoryEntry,
  type RecentWorkout,
} from "./schema";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const HISTORY_ROWS = 300;
const RECENT_WORKOUTS = 5;

/**
 * The user's latest session of each exercise they have logged, newest first,
 * plus their most recent workouts. Partner rows are readable under RLS, so
 * every query filters on the user's own id.
 */
export async function getWorkoutHistory(
  supabase: Supabase,
  userId: string,
): Promise<{ lastSessions: ExerciseHistoryEntry[]; recentWorkouts: RecentWorkout[] }> {
  const [exercisesRes, workoutsRes] = await Promise.all([
    supabase
      .from("workout_exercises")
      .select("workout_id, exercise_key, exercise_name, sets, grew, position, performed_at")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false })
      .order("position", { ascending: true })
      .limit(HISTORY_ROWS),
    supabase
      .from("workouts")
      .select("id, performed_at, spins_earned")
      .eq("user_id", userId)
      .order("performed_at", { ascending: false })
      .limit(RECENT_WORKOUTS),
  ]);

  if (exercisesRes.error || workoutsRes.error) {
    console.error("getWorkoutHistory failed", exercisesRes.error ?? workoutsRes.error);
    return { lastSessions: [], recentWorkouts: [] };
  }

  const lastSessions: ExerciseHistoryEntry[] = [];
  const seen = new Set<string>();
  const byWorkout = new Map<string, RecentWorkout["exercises"]>();
  for (const row of exercisesRes.data) {
    const sets = parseDbSets(row.sets);
    if (!seen.has(row.exercise_key)) {
      seen.add(row.exercise_key);
      lastSessions.push({
        key: row.exercise_key,
        name: row.exercise_name,
        sets,
        performedAt: row.performed_at,
      });
    }
    const list = byWorkout.get(row.workout_id) ?? [];
    list.push({ name: row.exercise_name, sets, grew: row.grew });
    byWorkout.set(row.workout_id, list);
  }

  const recentWorkouts: RecentWorkout[] = workoutsRes.data.map((w) => ({
    id: w.id,
    performedAt: w.performed_at,
    spinsEarned: w.spins_earned,
    exercises: byWorkout.get(w.id) ?? [],
  }));

  return { lastSessions, recentWorkouts };
}
