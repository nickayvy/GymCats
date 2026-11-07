import "@/app/styles/entry.css";

const SIZES = {
  sm: "h-10 w-10 text-base",
  md: "h-16 w-16 text-2xl",
  lg: "h-28 w-28 text-5xl",
} as const;

/**
 * Profile photo in a square portrait frame (like an inventory slot), or the
 * first letter of the name when there's no photo.
 */
export function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url: string | null;
  size?: keyof typeof SIZES;
}): React.JSX.Element {
  const base = `gc-portrait ${SIZES[size]} shrink-0`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- short-lived signed Supabase URL
      <img src={url} alt={`${name}'s profile photo`} className={`${base} object-cover p-[3px]`} />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={`${base} gc-title flex items-center justify-center uppercase leading-none text-ink`}
    >
      {name.trim().charAt(0) || "?"}
    </span>
  );
}
