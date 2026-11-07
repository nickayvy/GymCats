export type CompanionRarity = "starter";

export type Companion = {
  id: string;
  name: string;
  breed: string;
  image: string;
  rarity: CompanionRarity;
  description: string;
};

export const RARITY_LABELS: Record<CompanionRarity, string> = {
  starter: "Starter",
};

/**
 * Every companion a player can hold. For now every player starts with the
 * two starters; more will be collectible later.
 */
export const COMPANIONS: Companion[] = [
  {
    id: "siamese",
    name: "Siamese Shorthair",
    breed: "British Shorthair · Siamese points",
    image: "/gymcats-hero-cat.png",
    rarity: "starter",
    description: "Spots your heaviest sets, then naps straight through your rest timer.",
  },
  {
    id: "tuxedo",
    name: "Tuxedo",
    breed: "Domestic shorthair · Tuxedo coat",
    image: "/gymcats-hero-tuxedo-cat.png",
    rarity: "starter",
    description: "Always dressed for leg day. Counts your reps out loud, mostly correctly.",
  },
];

/** Inventory size, including slots not filled yet. */
export const INVENTORY_SLOTS = 12;
