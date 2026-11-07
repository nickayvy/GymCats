import Link from "next/link";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

export function LogGrowButton(): React.JSX.Element {
  return (
    <Link
      href="/log"
      className="gc-btn gc-btn-moss shrink-0 flex-col gap-0.5 text-center leading-tight sm:flex-row sm:gap-2.5"
    >
      <span aria-hidden="true">
        <PixelSprite sheet={ITEM_SPRITES.dumbbell} scale={2} />
      </span>
      <span className="font-display text-xs not-italic uppercase tracking-[0.18em] sm:text-sm">
        Log &amp; Grow
      </span>
    </Link>
  );
}
