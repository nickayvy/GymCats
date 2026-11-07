import { formatSets } from "@/lib/workouts/growth";
import type { RecentWorkout } from "@/lib/workouts/schema";
import { Panel, PanelHeading } from "@/components/ui";
import { LocalDate } from "./LocalDate";

export function RecentWorkouts({ workouts }: { workouts: RecentWorkout[] }): React.JSX.Element | null {
  if (workouts.length === 0) return null;

  return (
    <Panel as="section" className="gc-rise flex flex-col p-4 text-left sm:p-5" style={{ "--d": "150ms" } as React.CSSProperties}>
      <PanelHeading>Recent workouts</PanelHeading>
      <ul className="flex flex-col gap-2">
        {workouts.map((w) => (
          <li key={w.id} className="lg-last flex items-start gap-3 p-3">
            <span className="lg-date">
              <LocalDate iso={w.performedAt} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {w.spinsEarned > 0 && (
                <span className="lg-badge-gold self-start">
                  +{w.spinsEarned} {w.spinsEarned === 1 ? "attack" : "attacks"}
                </span>
              )}
              <ul className="flex flex-col gap-1 text-sm">
                {w.exercises.map((e) => (
                  <li key={e.name} className="flex flex-wrap justify-between gap-x-3">
                    <span className="font-semibold text-ink">
                      {e.grew && (
                        <span className="text-moss" aria-label="grew">
                          ▲{" "}
                        </span>
                      )}
                      {e.name}
                    </span>
                    <span className="gc-num italic text-white/65">{formatSets(e.sets)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
