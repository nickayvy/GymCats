"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { rollSpin } from "@/app/battle/actions";
import { BossSprite } from "@/components/boss/BossSprite";
import { HealthBar } from "@/components/boss/HealthBar";
import { GymPanel } from "@/components/battle/GymPanel";
import { RARITY_LOOK } from "@/components/battle/rarity";
import { SpinReel } from "@/components/battle/SpinReel";
import { useNow } from "@/components/battle/shared";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";
import { BossBanner, Panel, PanelHeading, Starburst, PreviewNotice } from "@/components/ui";
import {
  RARITIES,
  RARITY_BY_ID,
  damageRange,
  formatDuration,
  formatOdds,
  rollDamage,
  rollRarity,
  sessionProgress,
} from "@/lib/battle/rules";
import { PREVIEW_SPINS, type BattleAttack, type BattleState, type SpinResult } from "@/lib/battle/state";

export interface BattleScreenProps {
  initialState: BattleState;
  preview: boolean;
}

type Phase = "idle" | "requesting" | "spinning" | "revealed";

function previewSpin(state: BattleState): { spin: SpinResult; state: BattleState } {
  const { maxHp, currentHp } = state.battle;
  const rarity = rollRarity();
  const damage = rollDamage(rarity, maxHp);
  const applied = Math.min(damage, currentHp);
  const hpAfter = currentHp - applied;
  const attack: BattleAttack = {
    id: `preview-${Date.now()}`,
    rarity,
    damage: applied,
    createdAt: new Date().toISOString(),
    displayName: "You",
    mine: true,
  };
  return {
    spin: { rarity, damage, appliedDamage: applied, hpAfter },
    state: {
      ...state,
      battle: {
        ...state.battle,
        currentHp: hpAfter,
        defeatedAt: hpAfter === 0 ? new Date().toISOString() : null,
      },
      spinsAvailable: state.spinsAvailable - 1,
      attacks: [attack, ...state.attacks].slice(0, 15),
    },
  };
}

export function BattleScreen({ initialState, preview }: BattleScreenProps): React.JSX.Element {
  const [state, setState] = useState(initialState);
  const [phase, setPhase] = useState<Phase>("idle");
  const [spinId, setSpinId] = useState(0);
  const [spin, setSpin] = useState<SpinResult | null>(null);
  // The new HP is held back until the reel stops, so the result isn't spoiled.
  const pendingState = useRef<BattleState | null>(null);
  const spinning = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [hitKey, setHitKey] = useState(0);

  const { battle } = state;
  const defeated = battle.currentHp <= 0;
  const busy = phase === "requesting" || phase === "spinning";
  const attacks = state.spinsAvailable;
  const now = useNow(state.session !== null);
  const nextAttackIn = state.session ? sessionProgress(state.session, now ?? Date.parse(state.session.lastPingAt)).secondsUntilNext : null;

  const handleGymState = useCallback((next: BattleState) => {
    // Don't overwrite HP mid-spin; the reveal applies the latest state.
    if (spinning.current) pendingState.current = next;
    else setState(next);
  }, []);

  async function handleSpin(): Promise<void> {
    if (busy || defeated || attacks <= 0) return;
    setError(null);
    setPhase("requesting");
    spinning.current = true;

    let outcome: { spin: SpinResult; state: BattleState };
    if (preview) {
      outcome = previewSpin(state);
    } else {
      const result = await rollSpin();
      if (!result.ok) {
        setError(result.error);
        setPhase("idle");
        spinning.current = false;
        return;
      }
      outcome = result.data;
    }

    pendingState.current = outcome.state;
    setSpin(outcome.spin);
    setSpinId((n) => n + 1);
    setPhase("spinning");
  }

  const handleReelDone = useCallback(() => {
    spinning.current = false;
    setPhase("revealed");
    setHitKey((n) => n + 1);
    const pending = pendingState.current;
    pendingState.current = null;
    if (pending) setState(pending);
  }, []);

  const resultLook = spin ? RARITY_LOOK[spin.rarity] : null;
  const hit = hitKey > 0 && phase === "revealed";

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 pb-6 pt-3 sm:px-6">
      <div className="battle-cover" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between gap-3">
        <Link href="/hub" className="gc-btn gc-btn-sm">
          Retreat
        </Link>
        <p className="gc-caps text-[#ff8a74]/90">Boss battle</p>
      </header>
      {preview && <PreviewNotice detail="so attacks aren't saved." className="relative z-10 mx-auto mt-2" />}

      <section className="battle-enter-boss relative z-10 mt-2 flex flex-col items-center gap-2 text-center">
        <BossBanner
          epithet={defeated ? "Vanquished this week" : "Weekly boss"}
          name={battle.bossName}
          className="[&_h1]:text-2xl sm:[&_h1]:text-4xl"
        />
        <HealthBar current={battle.currentHp} max={battle.maxHp} label="Boss HP" className="mt-1" />

        <div className="relative mt-1 flex w-full justify-center">
          {defeated && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 sm:h-[440px] sm:w-[440px]">
              <Starburst color="#ffe29a" className="h-full w-full" />
            </div>
          )}
          <div key={hitKey} className={hit ? "boss-hit" : ""}>
            <BossSprite
              bossId={battle.bossId}
              name={battle.bossName}
              scale={4}
              defeated={defeated}
              className="sm:hidden"
            />
            <BossSprite
              bossId={battle.bossId}
              name={battle.bossName}
              scale={5}
              defeated={defeated}
              className="hidden sm:flex"
            />
          </div>
          {phase === "revealed" && spin && resultLook && (
            <span
              key={`pop-${hitKey}`}
              className={`damage-pop pointer-events-none absolute left-1/2 top-1/4 z-10 text-5xl font-black sm:text-6xl ${resultLook.text}`}
              style={{ WebkitTextStroke: "6px #120806", paintOrder: "stroke fill" }}
            >
              −{spin.appliedDamage}
            </span>
          )}
        </div>

        {defeated ? (
          <div className="relative flex flex-col items-center gap-1">
            <p className="gc-eyebrow gc-fade">Victory</p>
            <h2 className="gc-title battle-victory-title text-3xl uppercase sm:text-4xl">Boss Defeated</h2>
            <p className="gc-eyebrow gc-fade" style={{ "--d": "500ms" } as React.CSSProperties}>
              Defeated! A new boss arrives Monday.
            </p>
          </div>
        ) : (
          state.partner && (
            <p className="gc-eyebrow">
              You and <span className="gc-key">{state.partner.displayName}</span> stand ready.
            </p>
          )
        )}
      </section>

      <div className="battle-enter-panel relative z-10 mt-3 flex w-full flex-col gap-4">
        <Panel as="section" className="px-3 py-4 sm:px-5" aria-labelledby="attack-heading">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-1">
            <h2 id="attack-heading" className="gc-title text-lg uppercase tracking-[0.12em]">
              Attack
            </h2>
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {!defeated && nextAttackIn !== null && (
                <p className="flex items-center gap-1.5 text-xs italic text-glow">
                  <PixelSprite sheet={ITEM_SPRITES.hourglass} scale={1} />
                  Next attack in <span className="gc-num font-mono not-italic">{formatDuration(nextAttackIn)}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5 rounded-[3px] border border-[#f2c75c]/40 bg-black/50 py-0.5 pl-1 pr-2.5 text-xs italic text-white/75">
                <PixelSprite sheet={ITEM_SPRITES.claw} scale={1.5} />
                <span className="gc-num font-mono text-base font-bold not-italic text-gold">{attacks}</span>
                {attacks === 1 ? "attack" : "attacks"} left
              </p>
            </div>
          </div>

          <SpinReel maxHp={battle.maxHp} spinId={spinId} result={spin} onDone={handleReelDone} />

          <div className="mt-4 flex min-h-12 flex-col items-center gap-3 text-center">
            <p role="status" aria-live="polite" className="min-h-6 text-sm italic">
              {phase === "revealed" && spin && resultLook ? (
                <span
                  key={`result-${hitKey}`}
                  className={`battle-result-in inline-flex items-center gap-2 font-semibold not-italic ${resultLook.text}`}
                >
                  <PixelSprite sheet={ITEM_SPRITES[resultLook.gem]} scale={1.5} />
                  <span>
                    {RARITY_BY_ID[spin.rarity].label} hit! −{spin.appliedDamage} HP
                    {spin.appliedDamage < spin.damage ? ` (rolled ${spin.damage})` : ""}
                    {spin.hpAfter === 0 ? " · Boss defeated!" : ""}
                  </span>
                </span>
              ) : phase === "spinning" ? (
                <span className="text-white/65">Rolling…</span>
              ) : defeated ? (
                <span className="text-white/65">Nothing left to hit this week.</span>
              ) : attacks > 0 ? (
                <span className="text-white/65">Attack to deal damage.</span>
              ) : nextAttackIn !== null ? (
                <span className="text-white/65">
                  Your next attack is ready in {formatDuration(nextAttackIn)}. Stay at the gym!
                </span>
              ) : state.session ? (
                <span className="text-white/65">This session is maxed. Log a workout to earn more attacks.</span>
              ) : (
                <span className="text-white/65">No attacks yet. Check in at the gym or log a workout to earn some.</span>
              )}
            </p>
            {error && (
              <p role="alert" className="text-sm italic text-[#ff8a74]">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSpin}
              disabled={busy || defeated || attacks <= 0}
              className="gc-btn gc-btn-ember gc-btn-lg w-full max-w-xs font-display text-xl uppercase"
            >
              <span className="not-italic tracking-[0.24em]">
                {phase === "requesting" ? "…" : phase === "spinning" ? "Rolling" : "Attack"}
              </span>
            </button>
            {!busy && !defeated && attacks <= 0 && (
              <div className="gc-rise flex w-full max-w-md flex-col items-center gap-3 rounded-[4px] border border-gold/35 bg-black/45 px-4 py-3 text-center">
                <p className="text-sm italic text-ink">
                  <span className="gc-gold not-italic">Out of attacks.</span>{" "}
                  {preview
                    ? `Reload the page for another ${PREVIEW_SPINS} demo attacks.`
                    : "Check in at the gym or log a workout to earn more."}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Link href="/log" className="gc-btn gc-btn-moss gc-btn-sm">
                    Log a workout
                  </Link>
                  <Link href="/hub" className="gc-btn gc-btn-sm">
                    Back to the hub
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <GymPanel state={state} preview={preview} onState={handleGymState} />

        <div className="grid gap-4 sm:grid-cols-2">
          <DropRates maxHp={battle.maxHp} />
          <AttackLog attacks={state.attacks} />
        </div>
      </div>

    </main>
  );
}

function DropRates({ maxHp }: { maxHp: number }): React.JSX.Element {
  return (
    <Panel as="section" className="px-4 py-4" aria-labelledby="odds-heading">
      <PanelHeading>
        <span id="odds-heading">Drop Rates</span>
      </PanelHeading>
      <table className="w-full border-separate border-spacing-y-[3px] text-sm">
        <thead className="sr-only">
          <tr>
            <th>Rarity</th>
            <th>Odds</th>
            <th>Damage</th>
          </tr>
        </thead>
        <tbody>
          {RARITIES.map((r) => {
            const range = damageRange(r.id, maxHp);
            const look = RARITY_LOOK[r.id];
            return (
              <tr key={r.id}>
                <td className="rounded-l-[3px] bg-white/[0.07] py-1.5 pl-2 pr-2">
                  <span className={`flex items-center gap-2 font-semibold italic ${look.text}`}>
                    <PixelSprite sheet={ITEM_SPRITES[look.gem]} scale={1.5} />
                    {r.label}
                  </span>
                </td>
                <td className="gc-num bg-black/45 px-2 py-1.5 text-right font-mono text-white/75">{formatOdds(r.weight)}</td>
                <td className="gc-num rounded-r-[3px] bg-black/45 py-1.5 pl-1 pr-2 text-right font-mono text-white/75">
                  {range.min === range.max ? range.min : `${range.min}–${range.max}`} HP
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Panel>
  );
}

function AttackLog({ attacks }: { attacks: BattleAttack[] }): React.JSX.Element {
  return (
    <Panel as="section" className="px-4 py-4" aria-labelledby="log-heading">
      <PanelHeading>
        <span id="log-heading">Battle Log</span>
      </PanelHeading>
      {attacks.length === 0 ? (
        <p className="text-sm italic text-white/50">No hits yet this week.</p>
      ) : (
        <ul className="max-h-64 space-y-[3px] overflow-y-auto text-sm">
          {attacks.map((a) => {
            const look = RARITY_LOOK[a.rarity];
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-[3px] bg-white/[0.06] px-2 py-1"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PixelSprite sheet={ITEM_SPRITES[look.gem]} scale={1} />
                  <span className="truncate italic text-ink">{a.mine ? "You" : a.displayName}</span>
                  <span className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] ${look.text}`}>
                    {RARITY_BY_ID[a.rarity].label}
                  </span>
                </span>
                <span className={`gc-num shrink-0 font-mono font-semibold ${look.text}`}>−{a.damage}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
