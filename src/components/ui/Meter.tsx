export interface MeterProps {
  value: number;
  max: number;
  /** Accessible name. */
  label: string;
  tone?: "ember" | "glow" | "moss" | "gold";
  /** Show a pale "damage taken" bar that drains after the real one. */
  ghost?: boolean;
  className?: string;
  /** Height in px. Default 12. */
  height?: number;
}

/** Segmented HUD bar (HP, progress, stamina). */
export function Meter({
  value,
  max,
  label,
  tone = "ember",
  ghost = false,
  className = "",
  height = 12,
}: MeterProps): React.JSX.Element {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`gc-meter gc-meter-${tone} ${className}`}
      style={{ height }}
    >
      {ghost && <div className="gc-meter-ghost" style={{ width: `${pct}%` }} />}
      <div className="gc-meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
