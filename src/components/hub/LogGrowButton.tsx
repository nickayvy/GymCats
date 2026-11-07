import Link from "next/link";

export function LogGrowButton(): React.JSX.Element {
  return (
    <Link
      href="/log"
      className="rpg-btn rpg-btn-green shrink-0 flex-col gap-0 px-4 py-2 text-center uppercase leading-tight"
    >
      <span aria-hidden="true" className="text-base leading-none">▲</span>
      <span className="text-sm">Log &amp;</span>
      <span className="text-sm">Grow</span>
    </Link>
  );
}
