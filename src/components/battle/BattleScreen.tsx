"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { rollSpin } from "@/app/battle/actions";
import { BossPlaceholder } from "@/components/boss/BossPlaceholder";
import { HealthBar } from "@/components/boss/HealthBar";
import { GymPanel } from "@/components/battle/GymPanel";
import { SpinReel } from "@/components/battle/SpinReel";
import {
  RARITIES,
  RARITY_BY_ID,
  RARITY_STYLES,
  damageRange,
  formatOdds,
  rollDamage,
  rollRarity,
} from "@/lib/battle/rules";
import type { BattleAttack, BattleState, SpinResult } from "@/lib/battle/state";

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

  const handleGymState = useCallback((next: BattleState) => {
    // Don't overwrite HP mid-spin; the reveal applies the latest state.
    if (spinning.current) pendingState.current = next;
    else setState(next);
  }, []);

  async function handleSpin(): Promise<void> {
    if (busy || defeated || state.spinsAvailable <= 0) return;
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

  const resultStyle = spin ? RARITY_STYLES[spin.rarity] : null;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.35),transparent_60%)] px-4 py-8 sm:px-6">
      <div className="battle-cover" aria-hidden="true" />
      <header className="relative z-10 mx-auto flex w-full max-w-2xl items-center justify-between">
        <Link href="/hub" className="font-mono text-xs uppercase tracking-widest text-foreground/60 hover:text-accent">
          ← Retreat
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-red-300/80">
          Battle{preview ? " · Preview" : ""}
        </p>
      </header>

      <section className="battle-enter-boss relative z-10 mt-6 flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div key={hitKey} className={hitKey > 0 && phase === "revealed" ? "boss-hit" : ""}>
            <BossPlaceholder />
          </div>
          {phase === "revealed" && spin && resultStyle && (
            <span
              key={`pop-${hitKey}`}
              className={`damage-pop pointer-events-none absolute left-1/2 top-1/3 text-5xl font-black ${resultStyle.text}`}
            >
              −{spin.appliedDamage}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{battle.bossName}</h1>
        <HealthBar current={battle.currentHp} max={battle.maxHp} label="Boss HP" />
        {defeated && (
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-amber-300">
            Defeated! A new boss arrives Monday.
          </p>
        )}
      </section>

      <div className="battle-enter-panel relative z-10 mx-auto mt-8 flex w-full max-w-2xl flex-col gap-5">
        <section className="title-card rounded-2xl px-4 py-5 sm:px-6" aria-labelledby="spin-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="spin-heading" className="font-mono text-xs uppercase tracking-[0.3em] text-accent/80">
              Attack spin
            </h2>
            <p className="font-mono text-xs text-foreground/60">
              {state.spinsAvailable} {state.spinsAvailable === 1 ? "spin" : "spins"} left
            </p>
          </div>

          <SpinReel maxHp={battle.maxHp} spinId={spinId} result={spin} onDone={handleReelDone} />

          <div className="mt-4 flex min-h-12 flex-col items-center gap-3 text-center">
            <p role="status" aria-live="polite" className="text-sm">
              {phase === "revealed" && spin && resultStyle ? (
                <span className={`font-semibold ${resultStyle.text}`}>
                  {RARITY_BY_ID[spin.rarity].label} hit! −{spin.appliedDamage} HP
                  {spin.appliedDamage < spin.damage ? ` (rolled ${spin.damage})` : ""}
                  {spin.hpAfter === 0 ? " · Boss defeated!" : ""}
                </span>
              ) : phase === "spinning" ? (
                <span className="text-foreground/60">Rolling…</span>
              ) : defeated ? (
                <span className="text-foreground/60">Nothing left to hit this week.</span>
              ) : state.spinsAvailable > 0 ? (
                <span className="text-foreground/60">Spin to deal damage.</span>
              ) : (
                <span className="text-foreground/60">No spins yet. Check in at the gym to earn some.</span>
              )}
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSpin}
              disabled={busy || defeated || state.spinsAvailable <= 0}
              className="w-full max-w-xs rounded-2xl bg-gradient-to-b from-red-500 to-red-700 px-8 py-4 text-xl font-black uppercase tracking-[0.25em] text-white shadow-[0_0_32px_rgba(239,68,68,0.4)] transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              {phase === "requesting" ? "…" : phase === "spinning" ? "Rolling" : "Spin"}
            </button>
          </div>
        </section>

        <GymPanel state={state} preview={preview} onState={handleGymState} />

        <div className="grid gap-5 sm:grid-cols-2">
          <DropRates maxHp={battle.maxHp} />
          <AttackLog attacks={state.attacks} />
        </div>
      </div>
    </main>
  );
}

function DropRates({ maxHp }: { maxHp: number }): React.JSX.Element {
  return (
    <section className="title-card rounded-2xl px-5 py-4" aria-labelledby="odds-heading">
      <h2 id="odds-heading" className="font-mono text-xs uppercase tracking-[0.3em] text-accent/80">
        Drop rates
      </h2>
      <table className="mt-3 w-full text-sm">
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
            return (
              <tr key={r.id} className="border-t border-white/5 first:border-0">
                <td className={`py-1.5 font-semibold ${RARITY_STYLES[r.id].text}`}>{r.label}</td>
                <td className="py-1.5 text-right font-mono text-foreground/70">{formatOdds(r.weight)}</td>
                <td className="py-1.5 text-right font-mono text-foreground/70">
                  {range.min === range.max ? range.min : `${range.min}–${range.max}`} HP
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function AttackLog({ attacks }: { attacks: BattleAttack[] }): React.JSX.Element {
  return (
    <section className="title-card rounded-2xl px-5 py-4" aria-labelledby="log-heading">
      <h2 id="log-heading" className="font-mono text-xs uppercase tracking-[0.3em] text-accent/80">
        Recent hits
      </h2>
      {attacks.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/50">No hits yet this week.</p>
      ) : (
        <ul className="mt-3 space-y-1.5 text-sm">
          {attacks.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground/80">
                {a.mine ? "You" : a.displayName}{" "}
                <span className={`font-mono text-xs ${RARITY_STYLES[a.rarity].text}`}>
                  {RARITY_BY_ID[a.rarity].label}
                </span>
              </span>
              <span className={`font-mono font-semibold ${RARITY_STYLES[a.rarity].text}`}>−{a.damage}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
