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
        className="rpg-btn rpg-btn-red min-w-0 flex-1 px-6 py-5 text-2xl font-bold uppercase tracking-[0.2em]"
      >
        Battle
      </button>
      {launching && <div className="battle-wipe" aria-hidden="true" />}
    </>
  );
}
