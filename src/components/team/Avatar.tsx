const SIZES = {
  xs: "h-6 w-6 text-[10px]",
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
  const base = `${SIZES[size]} shrink-0 rounded-full border-2 border-accent/50`;

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
      className={`${base} flex items-center justify-center bg-accent/15 font-bold uppercase text-accent-glow`}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
