import { WorkoutLogger } from "@/components/log/WorkoutLogger";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { createClient } from "@/lib/supabase/server";
import { getSpinBalance, getWorkoutHistory } from "@/lib/workouts/queries";
import type { ExerciseHistoryEntry, RecentWorkout } from "@/lib/workouts/schema";

export const metadata = { title: "Log & Grow · GymCats" };

export default async function LogPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();

  let lastSessions: ExerciseHistoryEntry[] = [];
  let recentWorkouts: RecentWorkout[] = [];
  let spins = 0;

  if (!preview && userId) {
    const supabase = await createClient();
    const [history, balance] = await Promise.all([
      getWorkoutHistory(supabase, userId),
      getSpinBalance(supabase, userId),
    ]);
    lastSessions = history.lastSessions;
    recentWorkouts = history.recentWorkouts;
    spins = balance;
  }

  return (
    <WorkoutLogger
      preview={preview}
      spins={spins}
      lastSessions={lastSessions}
      recentWorkouts={recentWorkouts}
    />
  );
}
