import type { Rarity } from "@/lib/battle/rules";

// How each rarity looks in the "Wild Trail" UI. Presentation only: the odds
// and damage live in src/lib/battle/rules.ts. Class strings are literal so
// Tailwind picks them up.
export interface RarityLook {
  /** Main colour (borders, numbers). */
  hex: string;
  /** Translucent version for glows. */
  glow: string;
  text: string;
  /** ITEM_SPRITES key of the rarity's gem icon. */
  gem: `gem-${Rarity}`;
}

export const RARITY_LOOK: Record<Rarity, RarityLook> = {
  common: { hex: "#d9d3c4", glow: "rgba(217, 211, 196, 0.35)", text: "text-[#d9d3c4]", gem: "gem-common" },
  uncommon: { hex: "#9bd36a", glow: "rgba(155, 211, 106, 0.5)", text: "text-[#9bd36a]", gem: "gem-uncommon" },
  rare: { hex: "#6cb8ff", glow: "rgba(108, 184, 255, 0.55)", text: "text-[#6cb8ff]", gem: "gem-rare" },
  legendary: { hex: "#f2c75c", glow: "rgba(242, 199, 92, 0.75)", text: "text-[#f2c75c]", gem: "gem-legendary" },
};
