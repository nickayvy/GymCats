import { PREVIEW_SPINS } from "@/lib/battle/state";
import { WorkoutLogger } from "@/components/log/WorkoutLogger";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { createClient } from "@/lib/supabase/server";
import { loadBattleState } from "@/lib/battle/server";
import { getWorkoutHistory } from "@/lib/workouts/queries";
import type { ExerciseHistoryEntry, RecentWorkout } from "@/lib/workouts/schema";

export const metadata = { title: "Log & Grow · GymCats" };

export default async function LogPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();

  let lastSessions: ExerciseHistoryEntry[] = [];
  let recentWorkouts: RecentWorkout[] = [];
  // Preview mode shows the same demo attacks as the hub and battle screens.
  let spins = preview ? PREVIEW_SPINS : 0;

  if (!preview && userId) {
    const supabase = await createClient();
    // Spins come from one place (get_battle_state): this week's gym spins
    // plus the Log & Grow wallet.
    const [history, battle] = await Promise.all([
      getWorkoutHistory(supabase, userId),
      loadBattleState(supabase),
    ]);
    lastSessions = history.lastSessions;
    recentWorkouts = history.recentWorkouts;
    spins = battle.ok ? battle.data.spinsAvailable : 0;
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
