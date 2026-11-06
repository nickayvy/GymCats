"use client";

import Link from "next/link";
import { BossPlaceholder } from "@/components/boss/BossPlaceholder";
import { HealthBar } from "@/components/boss/HealthBar";
import type { Boss } from "@/lib/boss/currentBoss";

export interface BattleScreenProps {
  boss: Boss;
}

export function BattleScreen({ boss }: BattleScreenProps): React.JSX.Element {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.35),transparent_60%)] px-6 py-10">
      <div className="battle-cover" aria-hidden="true" />
      <header className="relative z-10 flex items-center justify-between">
        <Link href="/hub" className="font-mono text-xs uppercase tracking-widest text-foreground/60 hover:text-accent">← Retreat</Link>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-red-300/80">Battle</p>
      </header>

      <section className="battle-enter-boss relative z-10 mt-8 flex flex-col items-center gap-4 text-center">
        <BossPlaceholder size="lg" />
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{boss.name}</h1>
        <HealthBar current={boss.currentHp} max={boss.maxHp} label="Boss HP" />
      </section>

      <section className="battle-enter-panel title-card relative z-10 mx-auto mt-auto w-full max-w-2xl rounded-2xl px-6 py-6 text-center">
        <p role="status" className="font-mono text-sm text-accent-glow">{boss.name} blocks your path!</p>
        <p className="mt-2 text-sm text-foreground/60">Attack cards are coming soon. Train together to power up.</p>
      </section>
    </main>
  );
}
