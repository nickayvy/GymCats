export function BossPlaceholder({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <div
      role="img"
      aria-label="Boss placeholder"
      className={`boss-float flex items-center justify-center rounded-2xl border-4 border-dashed border-red-400/60 bg-red-950/30 ${
        size === "lg" ? "h-64 w-64 sm:h-80 sm:w-80" : "h-48 w-48 sm:h-56 sm:w-56"
      }`}
    >
      <span className="font-mono text-4xl font-bold tracking-[0.3em] text-red-300 sm:text-5xl">
        BOSS
      </span>
    </div>
  );
}
