export function SpinBadge({
  spins,
  className = "",
}: {
  spins: number;
  className?: string;
}): React.JSX.Element {
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/80 px-3 py-1 font-mono text-xs uppercase tracking-widest text-accent-glow ${className}`}
    >
      <span aria-hidden="true">✦</span>
      <span>
        {spins} {spins === 1 ? "spin" : "spins"}
      </span>
    </p>
  );
}
