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
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-foreground/70">
        <span>{label}</span>
        <span>
          {current} / {max} HP
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        className="mt-2 h-4 w-full overflow-hidden rounded-full border border-red-400/40 bg-red-950/50"
      >
        <div
          className="health-fill h-full rounded-full bg-gradient-to-r from-red-600 to-red-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
