import { Avatar } from "@/components/team/Avatar";
import type { TeamMember } from "@/lib/team/getTeam";
import { primaryButtonClass } from "./styles";

const sectionLabel = "font-mono text-[10px] uppercase tracking-[0.3em] text-accent/70";

/** Last onboarding step once the user has a partner: who they're training with. */
export function MeetPartner({
  partner,
  myName,
  myAvatarUrl,
  onFinish,
}: {
  partner: TeamMember;
  myName: string;
  myAvatarUrl: string | null;
  onFinish: () => void;
}): React.JSX.Element {
  const hasGoals = partner.goalLabels.length > 0 || partner.goalFreeform !== "";

  return (
    <div className="flex flex-col items-center gap-6 text-center motion-safe:[animation:battle-enter-up_400ms_ease-out_both]">
      <div className="flex items-end gap-4">
        <div className="flex flex-col items-center gap-2">
          <Avatar name={myName || "You"} url={myAvatarUrl} size="md" />
          <span className="text-xs text-foreground/70">You</span>
        </div>
        <span aria-hidden="true" className="mb-9 font-mono text-xl text-accent/70">
          +
        </span>
        <div className="flex flex-col items-center gap-2">
          <Avatar name={partner.displayName} url={partner.avatarUrl} size="lg" />
          <span className="max-w-[9rem] truncate text-sm font-semibold">{partner.displayName}</span>
        </div>
      </div>

      <p className="text-lg">
        You&apos;re teamed up with{" "}
        <strong className="text-accent-glow">{partner.displayName}</strong> 🎉
      </p>

      <div className="flex w-full flex-col gap-4 rounded-xl border border-accent/25 bg-background/40 px-5 py-4 text-left">
        {!partner.onboarded ? (
          <p className="text-sm text-foreground/70">
            {partner.displayName} is still setting up their profile. You&apos;ll see their goals here
            once they&apos;re done.
          </p>
        ) : (
          <>
            {hasGoals ? (
              <section className="flex flex-col gap-2">
                <h2 className={sectionLabel}>{partner.displayName}&apos;s goals</h2>
                {partner.goalLabels.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {partner.goalLabels.map((label) => (
                      <li
                        key={label}
                        className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm text-accent-glow"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {partner.goalFreeform ? (
                  <p className="text-sm text-foreground/70">&ldquo;{partner.goalFreeform}&rdquo;</p>
                ) : null}
              </section>
            ) : null}
            {partner.workoutsPerWeek ? (
              <section className="flex flex-col gap-1">
                <h2 className={sectionLabel}>Training</h2>
                <p className="text-sm text-foreground/80">
                  {partner.workoutsPerWeek} {partner.workoutsPerWeek === 1 ? "workout" : "workouts"} a
                  week
                </p>
              </section>
            ) : null}
            {!hasGoals && !partner.workoutsPerWeek ? (
              <p className="text-sm text-foreground/70">
                {partner.displayName} is ready to train with you.
              </p>
            ) : null}
          </>
        )}
      </div>

      <p className="text-sm text-foreground/70">
        Every gym visit and logged workout earns spins. Spend them together to take down this
        week&apos;s boss.
      </p>

      <button type="button" onClick={onFinish} className={`${primaryButtonClass} px-8 py-3 text-base`}>
        Let&apos;s go
      </button>
    </div>
  );
}
