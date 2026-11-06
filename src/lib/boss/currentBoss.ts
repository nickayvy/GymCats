export type Boss = { id: string; name: string; maxHp: number; currentHp: number; weekStart: string; weekEnd: string };

export const BOSS_ROSTER = [
  { id: "couch-kraken", name: "The Couch Kraken", maxHp: 1000 },
  { id: "snooze-lord", name: "Lord Snoozealot", maxHp: 1000 },
  { id: "donut-golem", name: "The Donut Golem", maxHp: 1000 },
] as const;

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export function getWeekBounds(now: Date): { start: Date; end: Date } {
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday),
  );
  const end = new Date(start.getTime() + WEEK_MS);
  return { start, end };
}

export function getCurrentBoss(now: Date = new Date()): Boss {
  const { start, end } = getWeekBounds(now);
  const count = BOSS_ROSTER.length;
  const raw = Math.floor(start.getTime() / WEEK_MS) % count;
  const index = (raw + count) % count;
  const boss = BOSS_ROSTER[index];
  return {
    id: boss.id,
    name: boss.name,
    maxHp: boss.maxHp,
    currentHp: boss.maxHp,
    weekStart: start.toISOString(),
    weekEnd: end.toISOString(),
  };
}

export function daysRemaining(boss: Boss, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((Date.parse(boss.weekEnd) - now.getTime()) / DAY_MS));
}
