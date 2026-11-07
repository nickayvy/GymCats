"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RARITY_LOOK } from "@/components/battle/rarity";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";
import { Starburst } from "@/components/ui";
import {
  RARITY_BY_ID,
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

// The reel at rest, before any spin, shows no legendary card: the rarest
// hit sitting there by default oversells how often it drops.
const IDLE_WEIGHTS: Record<Rarity, number> = { ...FILLER_WEIGHTS, legendary: 0 };

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
    const rarity = rollRarity(random, winner === null ? IDLE_WEIGHTS : FILLER_WEIGHTS);
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
  // The spinId whose reel has stopped. Keyed by spin so a new spin never
  // starts out looking "landed" for a frame before the effect runs.
  const [landedSpin, setLandedSpin] = useState<number | null>(null);
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
      const t = window.setTimeout(() => {
        setLandedSpin(spinId);
        onDoneRef.current();
      }, 300);
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
    const t = window.setTimeout(() => {
      setLandedSpin(spinId);
      onDoneRef.current();
    }, SPIN_MS + 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(t);
    };
    // offsetFor depends on width only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId, width === 0]);

  // The winner card lights up once the reel has stopped and the result is shown.
  const landed = landedSpin === spinId;
  const revealed = landed && result !== null;
  const winnerLook = result ? RARITY_LOOK[result.rarity] : null;

  return (
    <div
      ref={viewportRef}
      className="reel-viewport relative h-40 w-full overflow-hidden rounded-[3px] border border-white/15 bg-black/55 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.6),inset_0_12px_30px_rgba(0,0,0,0.6)]"
      aria-hidden="true"
    >
      {revealed && winnerLook && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2">
          <Starburst color={winnerLook.hex} className="h-full w-full" />
        </div>
      )}
      <div className="absolute inset-0 [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
        <div
          className="flex h-full items-center"
          style={{
            gap: ITEM_GAP,
            transform: `translateX(${offset}px)`,
            transition: animating ? `transform ${SPIN_MS}ms cubic-bezier(0.08, 0.82, 0.17, 1)` : "none",
          }}
        >
          {items.map((item, i) => {
            const look = RARITY_LOOK[item.rarity];
            const isWinner = revealed && i === WINNER_INDEX;
            return (
              <div
                key={item.key}
                className={`relative flex h-32 shrink-0 flex-col items-center justify-center gap-1 rounded-[3px] border bg-gradient-to-b from-[#2a2922] to-[#0c0c0b] transition-opacity duration-500 ${
                  isWinner ? "battle-reel-win z-10" : revealed ? "opacity-35" : ""
                }`}
                style={
                  {
                    width: ITEM_WIDTH,
                    borderColor: isWinner ? look.hex : `${look.hex}99`,
                    "--rg": look.glow,
                    ...(isWinner
                      ? {}
                      : { boxShadow: `inset 0 0 0 2px rgba(0,0,0,0.5), inset 0 -22px 26px -16px ${look.glow}` }),
                  } as React.CSSProperties
                }
              >
                <PixelSprite sheet={ITEM_SPRITES[look.gem]} scale={3} />
                <span className={`font-mono text-[10px] font-semibold uppercase tracking-[0.2em] ${look.text}`}>
                  {RARITY_BY_ID[item.rarity].label}
                </span>
                <span className={`gc-num font-display text-2xl font-bold leading-none ${look.text}`}>
                  −{item.damage}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-1 h-[2px] rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${look.hex}, transparent)` }}
                />
              </div>
            );
          })}
        </div>
      </div>
      <div className="battle-reel-marker" />
    </div>
  );
}
