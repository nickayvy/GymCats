import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

type IconId = "dumbbell" | "kettlebell" | "sneaker" | "water" | "flame" | "claw";

// Picks an inventory icon for an exercise name. Purely decorative.
const RULES: { test: RegExp; icon: IconId }[] = [
  { test: /kettlebell|\bkb\b|swing|goblet|turkish/i, icon: "kettlebell" },
  { test: /swim|rowing|\berg\b|aqua/i, icon: "water" },
  { test: /run|jog|sprint|treadmill|walk|lunge|step|stair|calf|jump|hike|bike|cycl|elliptical/i, icon: "sneaker" },
  { test: /burpee|hiit|circuit|cardio|plank|crunch|sit-?up|\babs?\b|core|yoga|stretch|mountain climber/i, icon: "flame" },
  { test: /pull-?up|chin-?up|push-?up|\bdips?\b|muscle-?up/i, icon: "claw" },
];

export function exerciseIconId(name: string): IconId | null {
  const trimmed = name.trim();
  if (trimmed === "") return null;
  return RULES.find((r) => r.test.test(trimmed))?.icon ?? "dumbbell";
}

/** 16×16 item icon for an exercise, or null for an unnamed one. */
export function ExerciseIcon({ name, scale = 2 }: { name: string; scale?: number }): React.JSX.Element | null {
  const id = exerciseIconId(name);
  if (!id) return null;
  return <PixelSprite sheet={ITEM_SPRITES[id]} scale={scale} label="" />;
}
