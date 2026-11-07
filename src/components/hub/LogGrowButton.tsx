import Link from "next/link";

export function LogGrowButton(): React.JSX.Element {
  return (
    <Link
      href="/log"
      className="flex shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-300/40 bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-center font-black uppercase leading-tight tracking-[0.15em] text-white shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:scale-105 hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-95"
    >
      <span aria-hidden="true" className="text-base leading-none">▲</span>
      <span className="text-xs">Log &amp;</span>
      <span className="text-xs">Grow</span>
    </Link>
  );
}
