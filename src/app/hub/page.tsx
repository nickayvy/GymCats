import { BossPlaceholder } from "@/components/boss/BossPlaceholder";
import { HealthBar } from "@/components/boss/HealthBar";
import { BattleButton } from "@/components/hub/BattleButton";
import { LogGrowButton } from "@/components/hub/LogGrowButton";
import { SpinBadge } from "@/components/hub/SpinBadge";
import { PartnerBadge } from "@/components/team/PartnerBadge";
import { TeamStrip } from "@/components/team/TeamStrip";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { loadBattleState } from "@/lib/battle/server";
import { daysRemaining, getCurrentBoss } from "@/lib/boss/currentBoss";
import { createClient } from "@/lib/supabase/server";
import { getTeam, type Team } from "@/lib/team/getTeam";

export const metadata = { title: "Hub · GymCats" };

const NO_TEAM: Team = { me: null, partner: null, inviteCode: null };

export default async function HubPage(): Promise<React.JSX.Element> {
  const { preview, userId } = await requireOnboardedUser();
  const boss = getCurrentBoss();
  const days = daysRemaining(boss);

  // Real HP, spins and team for signed-in players; full HP in preview mode.
  // Spins come from one place (get_battle_state): gym check-ins this week
  // plus the workout-log wallet.
  let currentHp = boss.currentHp;
  let maxHp = boss.maxHp;
  let spins: number | null = null;
  let team: Team = NO_TEAM;
  if (!preview && userId) {
    const supabase = await createClient();
    const [battle, loadedTeam] = await Promise.all([
      loadBattleState(supabase),
      getTeam(supabase, userId),
    ]);
    if (battle.ok) {
      currentHp = battle.data.battle.currentHp;
      maxHp = battle.data.battle.maxHp;
      spins = battle.data.spinsAvailable;
    }
    team = loadedTeam;
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 ${preview ? "pt-44" : "pt-24"}`}
    >
      <div className="hero-glow pointer-events-none absolute inset-0" />
      {preview && (
        <p className="rpg-window absolute left-1/2 top-6 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 px-4 py-2 text-center text-sm text-accent-glow">
          Preview mode: Supabase isn&apos;t configured.
        </p>
      )}
      <div className={`absolute right-4 z-20 sm:right-6 ${preview ? "top-24" : "top-6"}`}>
        <PartnerBadge partner={team.partner} />
      </div>
      <section className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <p className="rpg-window px-4 py-1.5">
          <span className="rpg-label">This week&apos;s boss</span>
          <span className="mx-2 text-foreground/40">·</span>
          <span className="text-sm text-foreground">
            {days} {days === 1 ? "day" : "days"} left
          </span>
        </p>
        <BossPlaceholder />
        <h1 className="rpg-title text-3xl font-bold sm:text-4xl">
          {boss.name}
        </h1>
        <HealthBar current={currentHp} max={maxHp} label="Boss HP" />
        <TeamStrip me={team.me} partner={team.partner} />
        <nav aria-label="Commands" className="rpg-window mt-2 flex w-full max-w-sm items-stretch gap-4 p-4">
          <BattleButton />
          <LogGrowButton />
        </nav>
        {spins !== null && (
          <div className="flex flex-col items-center gap-2">
            <SpinBadge spins={spins} />
            <p className="text-sm text-foreground/70">
              {spins > 0
                ? "Ready to attack"
                : currentHp > 0
                  ? "Check in at the gym or log a workout to earn attacks"
                  : "Boss defeated!"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
