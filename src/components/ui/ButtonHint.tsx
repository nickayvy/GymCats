/** Round key glyph shown next to an action, e.g. <ButtonHint glyph="A" /> Select. */
export function ButtonHint({ glyph, className = "" }: { glyph: string; className?: string }): React.JSX.Element {
  return (
    <span aria-hidden="true" className={`gc-hint ${className}`}>
      {glyph}
    </span>
  );
}

/** Footer row of hints, like a menu's control legend. */
export function HintBar({
  hints,
  className = "",
}: {
  hints: { glyph: string; label: string }[];
  className?: string;
}): React.JSX.Element {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm italic text-white/80 ${className}`}>
      {hints.map((h) => (
        <span key={h.label} className="inline-flex items-center gap-1.5">
          {h.label}
          <ButtonHint glyph={h.glyph} />
        </span>
      ))}
    </div>
  );
}
