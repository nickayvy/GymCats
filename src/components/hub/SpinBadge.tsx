import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";

/** Gold "attacks in the pouch" counter: a claw item icon and the count. */
export function SpinBadge({
  spins,
  className = "",
}: {
  spins: number;
  className?: string;
}): React.JSX.Element {
  return (
    <p
      className={`inline-flex items-center gap-2.5 rounded-[3px] border border-[#f2c75c]/45 bg-black/55 py-1 pl-1 pr-3 shadow-[0_0_18px_rgba(242,199,92,0.18)] ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-gradient-to-b from-[#3a3120] to-[#16130b] shadow-[inset_0_0_0_1px_rgba(242,199,92,0.35)]"
      >
        <PixelSprite sheet={ITEM_SPRITES.claw} scale={1.5} />
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="gc-num font-mono text-xl font-bold leading-none text-gold [text-shadow:0_0_12px_rgba(242,199,92,0.55)]">
          {spins}
        </span>
        <span className="text-sm italic text-white/75">{spins === 1 ? "attack" : "attacks"}</span>
      </span>
    </p>
  );
}
