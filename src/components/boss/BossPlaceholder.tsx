import { getCurrentBoss } from "@/lib/boss/currentBoss";
import { BossSprite } from "./BossSprite";

/**
 * This week's boss sprite. Kept for older callers; new code should use
 * <BossSprite bossId name /> directly.
 */
export function BossPlaceholder({ size = "md" }: { size?: "md" | "lg" }): React.JSX.Element {
  const boss = getCurrentBoss();
  return <BossSprite bossId={boss.id} name={boss.name} scale={size === "lg" ? 6 : 5} />;
}
