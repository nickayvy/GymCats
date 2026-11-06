import { BossPlaceholder } from "@/components/boss/BossPlaceholder";
import { HealthBar } from "@/components/boss/HealthBar";
import { BattleButton } from "@/components/hub/BattleButton";
import { PartnerBadge } from "@/components/team/PartnerBadge";
import { TeamStrip } from "@/components/team/TeamStrip";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { daysRemaining, getCurrentBoss } from "@/lib/boss/currentBoss";
import { createClient } from "@/lib/supabase/server";
import { getTeam, type Team } from "@/lib/team/getTeam";

export const metadata = { title: "Hub · GymCats" };

export default async function HubPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();
  const boss = getCurrentBoss();
  const days = daysRemaining(boss);

  const team: Team =
    !preview && userId
      ? await getTeam(await createClient(), userId)
      : { me: null, partner: null, inviteCode: null };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-24">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      {preview && (
        <p className="absolute left-1/2 top-6 z-20 -translate-x-1/2 rounded-lg border border-accent/30 bg-card/80 px-4 py-2 font-mono text-xs text-accent">
          Preview mode: Supabase isn&apos;t configured.
        </p>
      )}
      <div className={`absolute right-4 z-20 sm:right-6 ${preview ? "top-20" : "top-6"}`}>
        <PartnerBadge partner={team.partner} />
      </div>
      <section className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">
          This week&apos;s boss · {days} {days === 1 ? "day" : "days"} left
        </p>
        <BossPlaceholder />
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {boss.name}
        </h1>
        <HealthBar
          current={boss.currentHp}
          max={boss.maxHp}
          label="Boss HP"
        />
        <TeamStrip me={team.me} partner={team.partner} />
        <BattleButton />
      </section>
    </main>
  );
}
