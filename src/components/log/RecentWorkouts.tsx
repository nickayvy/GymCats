import { formatSets } from "@/lib/workouts/growth";
import type { RecentWorkout } from "@/lib/workouts/schema";
import { LocalDate } from "./LocalDate";

export function RecentWorkouts({ workouts }: { workouts: RecentWorkout[] }): React.JSX.Element | null {
  if (workouts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3 text-left">
      <h2 className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">Recent workouts</h2>
      <ul className="flex flex-col gap-3">
        {workouts.map((w) => (
          <li key={w.id} className="rounded-xl border border-accent/20 bg-card/60 p-3">
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-foreground/60">
              <LocalDate iso={w.performedAt} />
              {w.spinsEarned > 0 && (
                <span className="text-emerald-300">
                  +{w.spinsEarned} {w.spinsEarned === 1 ? "spin" : "spins"}
                </span>
              )}
            </div>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {w.exercises.map((e) => (
                <li key={e.name} className="flex flex-wrap justify-between gap-x-3">
                  <span className="font-semibold">
                    {e.grew && (
                      <span className="text-emerald-300" aria-label="grew">
                        ▲{" "}
                      </span>
                    )}
                    {e.name}
                  </span>
                  <span className="text-foreground/60">{formatSets(e.sets)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
