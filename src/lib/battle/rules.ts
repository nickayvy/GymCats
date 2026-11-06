// Battle rules shared by the UI. The server enforces the same numbers in
// supabase/migrations/20261107000000_boss_battles.sql (the gym radius is
// overridden in 20261108000000_gym_places.sql); change both together.

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface RarityRule {
  id: Rarity;
  label: string;
  /** Odds in hundredths of a percent, out of 10,000. */
  weight: number;
  /** Damage as a fraction of the boss's max HP. */
  minFraction: number;
  maxFraction: number;
}

/** 69.99% + 20% + 10% + 0.01% = 100%. */
export const RARITIES: readonly RarityRule[] = [
  { id: "common", label: "Common", weight: 6999, minFraction: 0, maxFraction: 0.01 },
  { id: "uncommon", label: "Uncommon", weight: 2000, minFraction: 0.01, maxFraction: 0.1 },
  { id: "rare", label: "Rare", weight: 1000, minFraction: 0.1, maxFraction: 0.3 },
  { id: "legendary", label: "Legendary", weight: 1, minFraction: 0.5, maxFraction: 0.5 },
];

export const RARITY_BY_ID: Record<Rarity, RarityRule> = Object.fromEntries(
  RARITIES.map((r) => [r.id, r]),
) as Record<Rarity, RarityRule>;

export const RARITY_STYLES: Record<Rarity, { text: string; border: string; glow: string; bar: string }> = {
  common: {
    text: "text-zinc-300",
    border: "border-zinc-500/70",
    glow: "shadow-[0_0_24px_rgba(161,161,170,0.35)]",
    bar: "bg-zinc-400",
  },
  uncommon: {
    text: "text-green-400",
    border: "border-green-500/80",
    glow: "shadow-[0_0_28px_rgba(34,197,94,0.5)]",
    bar: "bg-green-500",
  },
  rare: {
    text: "text-blue-400",
    border: "border-blue-500/80",
    glow: "shadow-[0_0_32px_rgba(59,130,246,0.6)]",
    bar: "bg-blue-500",
  },
  legendary: {
    text: "text-amber-300",
    border: "border-amber-400",
    glow: "shadow-[0_0_48px_rgba(251,191,36,0.75)]",
    bar: "bg-gradient-to-r from-amber-300 to-orange-500",
  },
};

/** One spin when you check in (at most once every 6 hours). */
export const CHECK_IN_BONUS_SPINS = 1;
/** One more spin for every 10 verified minutes at the gym. */
export const MINUTES_PER_SPIN = 10;
/** How close (meters) a fix must be to your gym (1 mile), before accuracy slack. */
export const GYM_RADIUS_M = 1609;
/** How often the battle screen re-checks your location during a session. */
export const HEARTBEAT_INTERVAL_MS = 60_000;
/** The longest gap between location checks that still counts in full. */
export const MAX_CREDITED_GAP_MINUTES = 30;
/** Sessions stop earning after this long. */
export const MAX_SESSION_MINUTES = 180;

/** Great-circle distance in meters, matching distance_m() in SQL. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

export function formatOdds(weight: number): string {
  const pct = weight / 100;
  return `${pct < 1 ? pct.toFixed(2) : String(pct)}%`;
}

/** Integer damage bounds for a rarity, matching roll_spin() in SQL. */
export function damageRange(rarity: Rarity, maxHp: number): { min: number; max: number } {
  const one = Math.max(1, Math.floor(maxHp * 0.01));
  const ten = Math.max(one + 1, Math.floor(maxHp * 0.1));
  const thirty = Math.max(ten + 1, Math.floor(maxHp * 0.3));
  switch (rarity) {
    case "common":
      return { min: 1, max: one };
    case "uncommon":
      return { min: one + 1, max: ten };
    case "rare":
      return { min: ten + 1, max: thirty };
    case "legendary": {
      const half = Math.max(1, Math.floor(maxHp * 0.5));
      return { min: half, max: half };
    }
  }
}

export function rollRarity(random: () => number = Math.random, weights?: Record<Rarity, number>): Rarity {
  const table = RARITIES.map((r) => ({ id: r.id, weight: weights?.[r.id] ?? r.weight }));
  const total = table.reduce((sum, r) => sum + r.weight, 0);
  let roll = random() * total;
  for (const r of table) {
    if (roll < r.weight) return r.id;
    roll -= r.weight;
  }
  return "common";
}

export function rollDamage(rarity: Rarity, maxHp: number, random: () => number = Math.random): number {
  const { min, max } = damageRange(rarity, maxHp);
  return min + Math.floor(random() * (max - min + 1));
}
