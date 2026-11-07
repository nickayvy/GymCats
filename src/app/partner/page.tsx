import Link from "next/link";
import type { Metadata } from "next";
import { Avatar } from "@/components/team/Avatar";
import { LeaveTeamButton } from "@/components/team/LeaveTeamButton";
import { PartnerInvite } from "@/components/team/PartnerInvite";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { createClient } from "@/lib/supabase/server";
import { getTeam, type TeamMember } from "@/lib/team/getTeam";

export const metadata: Metadata = { title: "Partner · GymCats" };

const sectionLabel = "font-mono text-xs uppercase tracking-widest text-accent/80";

function PartnerProfile({ partner }: { partner: TeamMember }): React.JSX.Element {
  const since = partner.joinedAt
    ? new Date(partner.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <Avatar name={partner.displayName} url={partner.avatarUrl} size="lg" />
        <h1 className="text-3xl font-bold tracking-tight">{partner.displayName}</h1>
        {since ? <p className="font-mono text-xs text-foreground/50">Teammates since {since}</p> : null}
      </div>

      {!partner.onboarded ? (
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2 text-sm text-accent-glow">
          {partner.displayName} hasn&apos;t finished setting up their profile yet.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-6 text-left">
          <section className="flex flex-col gap-2">
            <h2 className={sectionLabel}>Goals</h2>
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

          {partner.workoutsPerWeek ? (
            <section className="flex flex-col gap-1">
              <h2 className={sectionLabel}>Training</h2>
              <p className="text-sm text-foreground/80">
                {partner.workoutsPerWeek} {partner.workoutsPerWeek === 1 ? "workout" : "workouts"} a week
              </p>
            </section>
          ) : null}

          {partner.goalPlan ? (
            <section className="flex flex-col gap-2">
              <h2 className={sectionLabel}>Weekly plan</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {partner.goalPlan.weeklyPlan.map((day) => (
                  <li key={day.day} className="flex justify-between gap-4 border-b border-accent/10 py-1">
                    <span className="font-mono text-accent/80">{day.day}</span>
                    <span className="flex-1 text-foreground/80">{day.focus}</span>
                    <span className="font-mono text-foreground/50">{day.durationMinutes} min</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <LeaveTeamButton partnerName={partner.displayName} />
    </>
  );
}

export default async function PartnerPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();
  const team =
    !preview && userId ? await getTeam(await createClient(), userId) : null;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden px-6 py-10">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <header className="relative z-10 flex w-full max-w-xl items-center justify-between">
        <Link href="/hub" className="font-mono text-xs uppercase tracking-widest text-foreground/60 hover:text-accent">
          ← Hub
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">Your team</p>
      </header>

      <section className="title-card relative z-10 mt-8 flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl px-6 py-8 text-center sm:px-10">
        {team?.partner ? (
          <PartnerProfile partner={team.partner} />
        ) : preview ? (
          <p className="text-sm text-foreground/70">Preview mode: Supabase isn&apos;t configured.</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Team up with your partner</h1>
            <p className="text-sm text-foreground/70">
              Send them your invite link. Once they join, you&apos;ll see their profile here and take on
              each week&apos;s boss together.
            </p>
            <PartnerInvite inviteCode={team?.inviteCode ?? null} />
          </>
        )}
      </section>
    </main>
  );
}
