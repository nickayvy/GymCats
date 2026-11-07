/** Framed "enemy" portrait slot until real boss art exists. */
export function BossPlaceholder({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      role="img"
      aria-label="Boss placeholder"
      className={`rpg-window boss-float flex items-center justify-center overflow-hidden ${
        size === "lg" ? "h-64 w-64 sm:h-80 sm:w-80" : "h-48 w-48 sm:h-56 sm:w-56"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 60%, rgba(196, 45, 35, 0.45), transparent 65%), repeating-linear-gradient(45deg, rgba(0,0,0,0.18) 0 4px, transparent 4px 8px), linear-gradient(180deg, #3a1630 0%, #12081c 100%)",
      }}
    >
      <span className="rpg-title font-mono text-4xl font-bold tracking-[0.2em] sm:text-5xl">BOSS</span>
    </div>
  );
}
