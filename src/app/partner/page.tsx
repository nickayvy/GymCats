import Link from "next/link";
import type { Metadata } from "next";
import "@/app/styles/entry.css";
import { Avatar } from "@/components/team/Avatar";
import { LeaveTeamButton } from "@/components/team/LeaveTeamButton";
import { PartnerInvite } from "@/components/team/PartnerInvite";
import { DialogBox, Panel, PanelHeading, TitleBanner, PreviewNotice } from "@/components/ui";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { createClient } from "@/lib/supabase/server";
import { getTeam, type TeamMember } from "@/lib/team/getTeam";

export const metadata: Metadata = { title: "Partner · GymCats" };

function rise(ms: number): React.CSSProperties {
  return { "--d": `${ms}ms` } as React.CSSProperties;
}

function PartnerProfile({ partner }: { partner: TeamMember }): React.JSX.Element {
  const since = partner.joinedAt
    ? new Date(partner.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <>
      <div className="flex flex-col items-center gap-4">
        <div className="gc-pop flex flex-col items-center">
          <Avatar name={partner.displayName} url={partner.avatarUrl} size="lg" />
        </div>
        <TitleBanner
          eyebrow="Your partner"
          title={partner.displayName}
          subtitle={since ? `Teammates since ${since}` : undefined}
          size="lg"
        />
      </div>

      {!partner.onboarded ? (
        <DialogBox variant="written" className="gc-rise w-full max-w-md" >
          <span className="gc-key">{partner.displayName}</span> hasn&apos;t finished setting up their profile yet.
        </DialogBox>
      ) : (
        <Panel className="gc-rise flex w-full max-w-xl flex-col gap-6 px-5 py-6 text-left sm:px-7" style={rise(150)}>
          <section>
            <PanelHeading>Goals</PanelHeading>
            {partner.goalLabels.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {partner.goalLabels.map((label) => (
                  <li key={label} className="gc-chip border-glow/70! bg-[rgba(22,64,66,0.75)]! text-[#e9fffd]!">
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}
            {partner.goalFreeform ? (
              <p className="mt-3 border-l-2 border-white/25 pl-3 text-sm italic text-white/75">
                &ldquo;{partner.goalFreeform}&rdquo;
              </p>
            ) : null}
          </section>

          {partner.workoutsPerWeek ? (
            <section>
              <PanelHeading>Training</PanelHeading>
              <div className="gc-row">
                <span>Weekly target</span>
                <span className="px-3 text-sm italic text-moss">
                  {partner.workoutsPerWeek} {partner.workoutsPerWeek === 1 ? "workout" : "workouts"} a week
                </span>
              </div>
            </section>
          ) : null}

          {partner.goalPlan ? (
            <section>
              <PanelHeading>Weekly plan</PanelHeading>
              <ul className="flex flex-col gap-0.5">
                {partner.goalPlan.weeklyPlan.map((day) => (
                  <li
                    key={day.day}
                    className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-stretch gap-0.5 overflow-hidden rounded-[3px] bg-white/5 text-sm"
                  >
                    <span className="flex items-center bg-white/[0.07] px-2.5 py-2 font-mono text-xs uppercase tracking-widest text-glow">
                      {day.day}
                    </span>
                    <span className="flex items-center bg-black/40 px-3 py-2 italic text-ink">{day.focus}</span>
                    <span className="gc-num flex items-center bg-black/40 px-3 py-2 font-mono text-xs text-white/60">
                      {day.durationMinutes} min
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Panel>
      )}

      <LeaveTeamButton partnerName={partner.displayName} />
    </>
  );
}

/** You plus an open slot waiting for a partner. */
function OpenParty({ me }: { me: TeamMember | null }): React.JSX.Element {
  return (
    <div className="gc-rise flex items-start justify-center gap-4 sm:gap-6" style={rise(120)}>
      <div className="flex flex-col items-center gap-2">
        <Avatar name={me?.displayName ?? "You"} url={me?.avatarUrl ?? null} size="md" />
        <span className="text-sm italic text-ink">You</span>
      </div>
      <span aria-hidden="true" className="mt-5 font-mono text-xl text-white/45">
        +
      </span>
      <div className="flex flex-col items-center gap-2">
        <span className="gc-party-open flex h-16 w-16 items-center justify-center rounded-[4px] text-2xl leading-none">
          <span aria-hidden="true">+</span>
        </span>
        <span className="text-sm italic text-glow">Open slot</span>
      </div>
    </div>
  );
}

export default async function PartnerPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();
  const team =
    !preview && userId ? await getTeam(await createClient(), userId) : null;

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-x-hidden px-4 pb-14 pt-4 sm:pt-6">
      <header className="relative z-10 flex w-full max-w-2xl items-center justify-between">
        <Link href="/hub" className="gc-btn gc-btn-ghost gc-btn-sm -ml-2">
          Hub
        </Link>
        <p className="gc-caps">Your team</p>
      </header>

      <section className="relative z-10 mt-6 flex w-full max-w-3xl flex-col items-center gap-6 text-center sm:mt-10">
        {team?.partner ? (
          <PartnerProfile partner={team.partner} />
        ) : preview ? (
          <>
            <TitleBanner eyebrow="Your party" title="Team up with your partner" size="md" />
            <OpenParty me={null} />
            <PreviewNotice detail="so partners can't be linked." />
          </>
        ) : (
          <>
            <TitleBanner eyebrow="Your party" title="Team up with your partner" size="md" />
            <OpenParty me={team?.me ?? null} />
            <p className="gc-eyebrow gc-rise max-w-md text-center" style={rise(200)}>
              Send them your invite link. Once they join, you&apos;ll see their profile here and take on
              each week&apos;s <span className="gc-warn">boss</span> together.
            </p>
            <Panel className="gc-rise w-full max-w-md px-5 py-6 sm:px-7" style={rise(280)}>
              <PartnerInvite inviteCode={team?.inviteCode ?? null} />
            </Panel>
          </>
        )}
      </section>
    </main>
  );
}
