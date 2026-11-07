import { BossSprite } from "@/components/boss/BossSprite";
import { HealthBar } from "@/components/boss/HealthBar";
import { BattleButton } from "@/components/hub/BattleButton";
import { LogGrowButton } from "@/components/hub/LogGrowButton";
import { SpinBadge } from "@/components/hub/SpinBadge";
import { PartnerBadge } from "@/components/team/PartnerBadge";
import { TeamStrip } from "@/components/team/TeamStrip";
import { BossBanner, HintBar, Panel } from "@/components/ui";
import { requireOnboardedUser } from "@/lib/auth/requireOnboardedUser";
import { loadBattleState } from "@/lib/battle/server";
import { PREVIEW_SPINS } from "@/lib/battle/state";
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

  // Preview mode has no wallet; show the demo attacks the battle screen hands out.
  const shownSpins = spins ?? (preview ? PREVIEW_SPINS : null);
  const defeated = currentHp <= 0;

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 pb-5 pt-4 sm:px-8 sm:pt-6">
      <header className="relative z-20 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2 pt-1">
          <p className="font-display text-sm font-bold tracking-[0.3em] text-white/80 sm:text-base">GymCats</p>
          {preview && (
            <p className="w-fit rounded-[3px] border border-glow/30 bg-black/55 px-2.5 py-1 font-mono text-[11px] tracking-[0.06em] text-glow/90">
              Preview mode: Supabase isn&apos;t configured.
            </p>
          )}
        </div>
        <div className="shrink-0">
          <PartnerBadge partner={team.partner} />
        </div>
      </header>

      <section
        className="relative z-10 mx-auto mt-5 flex w-full max-w-xl flex-col items-center gap-3 sm:mt-6"
        aria-label="This week's boss"
      >
        <BossBanner
          epithet={
            <>
              This week&apos;s boss · {days} {days === 1 ? "day" : "days"} left
            </>
          }
          name={boss.name}
        />
        <HealthBar current={currentHp} max={maxHp} label="Boss HP" className="gc-rise mt-1" />
      </section>

      <div className="relative z-0 flex flex-1 items-center justify-center py-4 sm:py-2">
        <div className="gc-rise" style={{ "--d": "150ms" } as React.CSSProperties}>
          <BossSprite bossId={boss.id} name={boss.name} scale={5} defeated={defeated} className="sm:hidden" />
          <BossSprite bossId={boss.id} name={boss.name} scale={6} defeated={defeated} className="hidden sm:flex" />
        </div>
      </div>

      <section
        className="gc-rise relative z-10 grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-end sm:gap-6"
        style={{ "--d": "280ms" } as React.CSSProperties}
      >
        <Panel className="flex items-center justify-between gap-4 px-4 py-3">
          <TeamStrip me={team.me} partner={team.partner} />
          {shownSpins !== null && (
            <div className="flex flex-col items-end gap-1.5 text-right">
              <span className="gc-caps">Attacks</span>
              <SpinBadge spins={shownSpins} />
              <p className="max-w-[11rem] text-xs italic leading-snug text-white/60">
                {shownSpins > 0
                  ? "Ready to attack"
                  : !defeated
                    ? "Check in at the gym or log a workout to earn attacks"
                    : "Boss defeated!"}
              </p>
            </div>
          )}
        </Panel>
        <div className="flex w-full items-stretch gap-3">
          <BattleButton />
          <LogGrowButton />
        </div>
      </section>

      <footer className="relative z-10 mt-4 border-t border-white/10 pt-3">
        <HintBar
          hints={[
            { glyph: "A", label: "Battle" },
            { glyph: "X", label: "Log & Grow" },
          ]}
        />
      </footer>
    </main>
  );
}
