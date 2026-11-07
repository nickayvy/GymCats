const SIZES = {
  sm: "h-10 w-10 text-sm",
  md: "h-16 w-16 text-xl",
  lg: "h-28 w-28 text-4xl",
} as const;

/** Round profile photo, or the first letter of the name when there's no photo. */
export function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
}): React.JSX.Element {
  // Square portrait in a gilded bevel, like an RPG party portrait.
  const base = `${SIZES[size]} shrink-0 rounded-sm border-2 border-t-accent-glow border-l-accent-glow border-b-[#6a4a17] border-r-[#6a4a17] shadow-[0_0_0_2px_#04050c]`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Supabase URL
      <img src={url} alt={`${name}'s profile photo`} className={`${base} object-cover`} />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={`${base} flex items-center justify-center bg-[#1a2559] font-mono font-bold uppercase text-accent-glow`}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
