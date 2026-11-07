/**
 * Boss name plate: italic epithet, large Cinzel name, and an ember underline
 * that sweeps in from the centre.
 */
export function BossBanner({
  name,
  epithet,
  className = "",
}: {
  name: string;
  epithet?: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {epithet && (
        <p className="gc-eyebrow gc-fade flex items-center gap-2">
          <span aria-hidden="true" className="text-white/50">
            ⟡
          </span>
          {epithet}
          <span aria-hidden="true" className="text-white/50">
            ⟡
          </span>
        </p>
      )}
      <h1 className="gc-title gc-title-in text-3xl uppercase tracking-wide sm:text-5xl">{name}</h1>
      <span
        aria-hidden="true"
        className="gc-line-grow mt-1 block h-[3px] w-full max-w-sm rounded-full bg-gradient-to-r from-transparent via-ember to-transparent shadow-[0_0_12px_rgba(232,80,63,0.7)]"
      />
    </div>
  );
}
