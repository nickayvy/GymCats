"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

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
        className="gc-btn gc-btn-ember gc-btn-lg gc-shine min-w-0 flex-1 px-4 font-display text-xl uppercase sm:px-8 sm:text-2xl"
      >
        <span aria-hidden="true">
          <PixelSprite sheet={ITEM_SPRITES.claw} scale={2} />
        </span>
        <span className="not-italic tracking-[0.14em] sm:tracking-[0.24em]">Battle</span>
      </button>
      {/* Portaled so no ancestor's stacking context or transform can clip the full-screen wipe. */}
      {launching && createPortal(<div className="battle-wipe" aria-hidden="true" />, document.body)}
    </>
  );
}
