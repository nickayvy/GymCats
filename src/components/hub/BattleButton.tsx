"use client";

import { useBattleWarp } from "@/components/transition/battleWarp";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

export function BattleButton(): React.JSX.Element {
  const { warping, warpToBattle } = useBattleWarp();

  return (
    <button
      type="button"
      aria-label="Battle"
      disabled={warping}
      onClick={warpToBattle}
      className="gc-btn gc-btn-ember gc-shine min-h-[4.5rem] w-full gap-3 px-6 font-display text-2xl uppercase sm:min-h-20 sm:text-3xl"
    >
      <span aria-hidden="true">
        <PixelSprite sheet={ITEM_SPRITES.claw} scale={3} />
      </span>
      <span className="not-italic tracking-[0.24em]">Battle</span>
    </button>
  );
}
