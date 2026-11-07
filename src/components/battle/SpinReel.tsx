"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  RARITY_BY_ID,
  RARITY_STYLES,
  rollDamage,
  rollRarity,
  type Rarity,
} from "@/lib/battle/rules";
import type { SpinResult } from "@/lib/battle/state";

const ITEM_WIDTH = 112;
const ITEM_GAP = 8;
const STEP = ITEM_WIDTH + ITEM_GAP;
const REEL_LENGTH = 64;
const WINNER_INDEX = 56;
const SPIN_MS = 5500;

// Filler cards only: rarer cards show up more often than their real odds so
// the reel looks lively. The real odds are in the drop-rate table, and the
// winning card always comes from the server.
const FILLER_WEIGHTS: Record<Rarity, number> = {
  common: 52,
  uncommon: 28,
  rare: 16,
  legendary: 4,
};

interface ReelItem {
  key: string;
  rarity: Rarity;
  damage: number;
}

// Small seeded PRNG so the idle reel renders the same on server and client.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildReel(maxHp: number, spinId: number, winner: SpinResult | null): ReelItem[] {
  const random = winner === null ? mulberry32(7) : Math.random;
  return Array.from({ length: REEL_LENGTH }, (_, i) => {
    if (winner && i === WINNER_INDEX) {
      return { key: `${spinId}-${i}`, rarity: winner.rarity, damage: winner.damage };
    }
    const rarity = rollRarity(random, FILLER_WEIGHTS);
    return { key: `${spinId}-${i}`, rarity, damage: rollDamage(rarity, maxHp, random) };
  });
}

export interface SpinReelProps {
  maxHp: number;
  /** Increments for every spin; the reel restarts when it changes. */
  spinId: number;
  result: SpinResult | null;
  onDone: () => void;
}

export function SpinReel({ maxHp, spinId, result, onDone }: SpinReelProps): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const items = useMemo(
    () => buildReel(maxHp, spinId, result),
    // Rebuild only when a new spin starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spinId, maxHp, result === null],
  );

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    setWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Centre of card `index` under the marker.
  function offsetFor(index: number, jitter = 0): number {
    return width / 2 - (index * STEP + ITEM_WIDTH / 2 + jitter);
  }

  useEffect(() => {
    if (result === null || width === 0) {
      setAnimating(false);
      setOffset(offsetFor(3));
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setAnimating(false);
      setOffset(offsetFor(WINNER_INDEX));
      const t = window.setTimeout(() => onDoneRef.current(), 300);
      return () => window.clearTimeout(t);
    }

    // Snap back to the start, then glide to the winner on the next frame.
    setAnimating(false);
    setOffset(offsetFor(3));
    const jitter = (Math.random() - 0.5) * ITEM_WIDTH * 0.8;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setAnimating(true);
        setOffset(offsetFor(WINNER_INDEX, jitter));
      });
    });
    const t = window.setTimeout(() => onDoneRef.current(), SPIN_MS + 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
    // offsetFor depends on width only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId, width === 0]);

  return (
    <div
      ref={viewportRef}
      className="reel-viewport relative h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40"
      aria-hidden="true"
    >
      <div
        className="flex h-full items-center"
        style={{
          gap: ITEM_GAP,
          transform: `translateX(${offset}px)`,
          transition: animating ? `transform ${SPIN_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)` : "none",
        }}
      >
        {items.map((item, i) => {
          const style = RARITY_STYLES[item.rarity];
          const isWinner = result !== null && !animating && i === WINNER_INDEX;
          return (
            <div
              key={item.key}
              className={`flex h-28 shrink-0 flex-col items-center justify-between rounded-lg border-2 bg-card/90 pt-3 ${style.border} ${
                isWinner ? `reel-winner ${style.glow}` : ""
              }`}
              style={{ width: ITEM_WIDTH }}
            >
              <span className={`font-mono text-[10px] uppercase tracking-widest ${style.text}`}>
                {RARITY_BY_ID[item.rarity].label}
              </span>
              <span className={`text-2xl font-bold ${style.text}`}>−{item.damage}</span>
              <span className={`h-2 w-full rounded-b-md ${style.bar}`} />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent-glow shadow-[0_0_12px_rgba(232,201,138,0.9)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
