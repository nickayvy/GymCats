export function SpinBadge({
  spins,
  className = "",
}: {
  spins: number;
  className?: string;
}): React.JSX.Element {
  return (
    <p className={`rpg-window inline-flex items-center gap-3 px-3 py-1 ${className}`}>
      <span className="rpg-label">Attacks</span>
      <span className="font-mono text-lg tabular-nums text-accent-glow">{spins}</span>
    </p>
  );
}
