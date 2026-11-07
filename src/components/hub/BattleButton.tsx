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
        className="gc-btn gc-btn-ember gc-shine min-h-[4.5rem] w-full gap-3 px-6 font-display text-2xl uppercase sm:min-h-20 sm:text-3xl"
      >
        <span aria-hidden="true">
          <PixelSprite sheet={ITEM_SPRITES.claw} scale={3} />
        </span>
        <span className="not-italic tracking-[0.24em]">Battle</span>
      </button>
      {/* Portaled so no ancestor's stacking context or transform can clip the full-screen wipe. */}
      {launching && createPortal(<div className="battle-wipe" aria-hidden="true" />, document.body)}
    </>
  );
}
