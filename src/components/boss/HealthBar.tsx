/** Segmented RPG-style HP gauge with the numbers above it. */
export function HealthBar({
  current,
  max,
  label,
}: {
  current: number;
  max: number;
  label: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

  return (
    <div className="w-full max-w-md">
      <div className="flex items-end justify-between">
        <span className="rpg-label">{label}</span>
        <span className="font-mono tabular-nums text-foreground">
          <span className="text-lg">{current}</span>
          <span className="text-xs text-foreground/60"> / {max}</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        className="rpg-bar mt-1 w-full"
      >
        <div className="health-fill rpg-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
