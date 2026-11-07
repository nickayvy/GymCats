import { PixelSprite, bossSprite } from "@/components/sprites";

export interface BossSpriteProps {
  /** Boss id from BOSS_ROSTER, e.g. "couch-kraken". */
  bossId: string;
  /** Accessible name, usually the boss's name. */
  name: string;
  /** CSS px per sprite pixel (the sheet is 48×48). Default 5. */
  scale?: number;
  /** Bob up and down with a pulsing ground shadow. Default true. */
  float?: boolean;
  /** Defeated: drained of colour and slumped. */
  defeated?: boolean;
  className?: string;
}

/** The weekly boss standing on the field: idle-animated sprite over a soft ground shadow. */
export function BossSprite({
  bossId,
  name,
  scale = 5,
  float = true,
  defeated = false,
  className = "",
}: BossSpriteProps): React.JSX.Element {
  const size = 48 * scale;
  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ width: size }}>
      <div
        className={`${float && !defeated ? "gc-float" : ""} transition-[filter,rotate,translate] duration-700 ${
          defeated ? "translate-y-3 rotate-[8deg] grayscale-[0.85] brightness-75" : ""
        }`}
      >
        <PixelSprite
          sheet={bossSprite(bossId)}
          scale={scale}
          label={defeated ? `${name} (defeated)` : name}
          animate={!defeated}
          className="drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
        />
      </div>
      <span
        aria-hidden="true"
        className="gc-sprite-shadow -mt-3"
        style={{ height: Math.max(10, Math.round(scale * 3)), ...(defeated ? { animation: "none" } : {}) }}
      />
    </div>
  );
}
