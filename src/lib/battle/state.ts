import { getCurrentBoss } from "@/lib/boss/currentBoss";
import type { Rarity } from "@/lib/battle/rules";

export interface BattleAttack {
  id: string;
  rarity: Rarity;
  damage: number;
  createdAt: string;
  displayName: string;
  mine: boolean;
}

export interface GymSession {
  startedAt: string;
  lastPingAt: string;
  creditedSeconds: number;
  bonusSpin: boolean;
}

export interface BattleState {
  battle: {
    id: string;
    bossId: string;
    bossName: string;
    maxHp: number;
    currentHp: number;
    weekStart: string;
    defeatedAt: string | null;
  };
  spinsAvailable: number;
  gym: { name: string; lat: number; lng: number; setAt: string } | null;
  session: GymSession | null;
  partner: { displayName: string; atGym: boolean } | null;
  attacks: BattleAttack[];
}

export interface SpinResult {
  rarity: Rarity;
  /** What the spin rolled. */
  damage: number;
  /** What actually came off the boss (less if it had less HP left). */
  appliedDamage: number;
  hpAfter: number;
  /** Which spin paid: this week's gym spins or the Log & Grow wallet. Absent in preview. */
  source?: "gym" | "wallet";
}

/** A gym from Google Places near the player's location. */
export interface NearbyGym {
  placeId: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  distanceM: number;
}

/** Demo spins in preview mode, where nothing is saved. */
export const PREVIEW_SPINS = 10;

export function previewBattleState(): BattleState {
  const boss = getCurrentBoss();
  return {
    battle: {
      id: "preview",
      bossId: boss.id,
      bossName: boss.name,
      maxHp: boss.maxHp,
      currentHp: boss.currentHp,
      weekStart: boss.weekStart.slice(0, 10),
      defeatedAt: null,
    },
    spinsAvailable: PREVIEW_SPINS,
    gym: null,
    session: null,
    partner: null,
    attacks: [],
  };
}
