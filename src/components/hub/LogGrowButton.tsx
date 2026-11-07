import Link from "next/link";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

export function LogGrowButton(): React.JSX.Element {
  return (
    <Link
      href="/log"
      className="gc-btn gc-btn-moss w-full gap-2.5 px-4 text-center leading-tight sm:h-full sm:w-auto sm:min-w-36 sm:flex-col sm:gap-1 sm:px-5"
    >
      <span aria-hidden="true">
        <PixelSprite sheet={ITEM_SPRITES.dumbbell} scale={2} />
      </span>
      <span className="font-display text-sm not-italic uppercase tracking-[0.18em]">
        Log &amp; Grow
      </span>
    </Link>
  );
}
