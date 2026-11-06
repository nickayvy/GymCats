"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const WIPE_DURATION_MS = 650;

export function BattleButton(): React.JSX.Element {
  const router = useRouter();
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    router.prefetch("/battle");
  }, [router]);

  useEffect(() => {
    if (!launching) return;
    const timeout = window.setTimeout(() => {
      router.push("/battle");
    }, WIPE_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [launching, router]);

  function handleClick(): void {
    if (launching) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push("/battle");
      return;
    }
    setLaunching(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Battle"
        disabled={launching}
        onClick={handleClick}
        className="mt-4 w-full max-w-xs rounded-2xl bg-gradient-to-b from-red-500 to-red-700 px-10 py-5 text-2xl font-black uppercase tracking-[0.3em] text-white shadow-[0_0_40px_rgba(239,68,68,0.45)] transition hover:scale-105 hover:shadow-[0_0_60px_rgba(239,68,68,0.6)] active:scale-95 disabled:opacity-80"
      >
        Battle
      </button>
      {launching && <div className="battle-wipe" aria-hidden="true" />}
    </>
  );
}
