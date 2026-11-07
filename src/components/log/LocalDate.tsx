"use client";

/** Short date in the viewer's own time zone ("Nov 4"). */
export function LocalDate({ iso }: { iso: string }): React.JSX.Element {
  const date = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
    </time>
  );
}
