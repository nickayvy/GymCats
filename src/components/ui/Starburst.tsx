/** Rotating light rays behind a reward. Place it absolutely behind content. */
export function Starburst({
  className = "",
  color = "#ffe9a8",
}: {
  className?: string;
  color?: string;
}): React.JSX.Element {
  const rays = Array.from({ length: 16 }, (_, i) => i * (360 / 16));
  return (
    <svg viewBox="-100 -100 200 200" aria-hidden="true" className={`gc-starburst pointer-events-none ${className}`}>
      <defs>
        <radialGradient id="gc-burst-core">
          <stop offset="0" stopColor={color} stopOpacity="0.9" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {rays.map((deg, i) => (
        <path
          key={deg}
          d={i % 2 === 0 ? "M0 0 L-7 -98 L7 -98 Z" : "M0 0 L-4 -70 L4 -70 Z"}
          fill={color}
          opacity={i % 2 === 0 ? 0.32 : 0.2}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle r="44" fill="url(#gc-burst-core)" />
    </svg>
  );
}
