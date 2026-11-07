import { Meter } from "@/components/ui";

/** Boss HP plate: caps label and numbers over an ember HUD bar with a draining ghost. */
export function HealthBar({
  current,
  max,
  label,
  className = "",
}: {
  current: number;
  max: number;
  label: string;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`w-full max-w-md ${className}`}>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <span className="gc-caps text-white/60">{label}</span>
        <span className="gc-num font-mono text-sm font-semibold text-ink">
          {current}
          <span className="text-white/45"> / {max}</span>
          <span className="ml-1 text-[0.7rem] tracking-[0.18em] text-[#ff8a74]">HP</span>
        </span>
      </div>
      <Meter value={current} max={max} label={label} tone="ember" ghost height={14} />
    </div>
  );
}
