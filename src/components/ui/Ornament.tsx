// Thin rule that ends in a small diamond and a leaf curl. Original ornament
// used beside titles and under headings. `side` mirrors it.
export function Ornament({
  side = "left",
  className = "",
}: {
  side?: "left" | "right";
  className?: string;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 120 16"
      aria-hidden="true"
      className={`h-3 w-24 shrink-0 text-white/55 ${side === "right" ? "-scale-x-100" : ""} ${className}`}
      fill="none"
      stroke="currentColor"
    >
      <path d="M0 8 H92" strokeWidth="1" />
      <path d="M92 8 L100 3 L108 8 L100 13 Z" strokeWidth="1.2" fill="currentColor" fillOpacity="0.25" />
      <path d="M108 8 C112 8 114 5 118 3" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="84" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Small diamond used as a bullet or inside dividers. */
export function Diamond({ className = "" }: { className?: string }): React.JSX.Element {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" className={`h-2 w-2 ${className}`}>
      <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="currentColor" />
    </svg>
  );
}
