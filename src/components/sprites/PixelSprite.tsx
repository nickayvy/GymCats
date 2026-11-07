import type { SpriteSheet } from "./types";

// Renders a SpriteSheet as one crisp SVG. Same-colour horizontal runs are
// merged and drawn as one <path> per colour; frames sit side by side and a
// CSS steps() animation slides the strip inside a clipping box. Pure CSS, so
// it works in server and client components and renders identically on both.

interface Built {
  width: number;
  height: number;
  frameCount: number;
  /** [fill, path data] per colour, in palette order. */
  paths: [string, string][];
}

const cache = new WeakMap<SpriteSheet, { normal?: Built; flipped?: Built }>();

function build(sheet: SpriteSheet, flip: boolean): Built {
  const width = sheet.frames[0]?.[0]?.length ?? 0;
  const height = sheet.frames[0]?.length ?? 0;
  const byColour = new Map<string, string>();
  sheet.frames.forEach((frame, f) => {
    frame.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let end = x + 1;
        while (end < row.length && row[end] === ch) end++;
        const fill = ch === "." ? undefined : sheet.palette[ch];
        if (fill) {
          const w = end - x;
          const left = f * width + (flip ? width - end : x);
          byColour.set(fill, `${byColour.get(fill) ?? ""}M${left} ${y}h${w}v1h-${w}z`);
        }
        x = end;
      }
    });
  });
  return { width, height, frameCount: sheet.frames.length, paths: [...byColour] };
}

function getBuilt(sheet: SpriteSheet, flip: boolean): Built {
  let entry = cache.get(sheet);
  if (!entry) {
    entry = {};
    cache.set(sheet, entry);
  }
  const key = flip ? "flipped" : "normal";
  return (entry[key] ??= build(sheet, flip));
}

const CSS =
  "@keyframes gc-px-step{from{transform:translateX(0)}to{transform:translateX(-100%)}}" +
  ":where(.gc-px){display:inline-block;vertical-align:middle;line-height:0}" +
  ".gc-px>svg{display:block}" +
  "@media (prefers-reduced-motion:reduce){.gc-px>svg{animation:none!important;transform:none!important}}";

export interface PixelSpriteProps {
  sheet: SpriteSheet;
  /** CSS px per sprite pixel. Default 4. */
  scale?: number;
  /** Accessible name (role="img"). Omit or pass "" for a decorative sprite (aria-hidden). */
  label?: string;
  /** Play the idle loop. Default true; single-frame sheets never animate. */
  animate?: boolean;
  /** Mirror horizontally. */
  flip?: boolean;
  className?: string;
}

export function PixelSprite({
  sheet,
  scale = 4,
  label,
  animate = true,
  flip = false,
  className,
}: PixelSpriteProps): React.JSX.Element {
  const { width, height, frameCount, paths } = getBuilt(sheet, flip);
  const fps = sheet.fps && sheet.fps > 0 ? sheet.fps : 4;
  const animated = animate && frameCount > 1;
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };

  return (
    <span
      className={className ? `gc-px ${className}` : "gc-px"}
      style={{ width: width * scale, height: height * scale, overflow: "hidden" }}
      {...a11y}
    >
      <style href="gc-pixel-sprite" precedence="default">
        {CSS}
      </style>
      <svg
        width={width * frameCount * scale}
        height={height * scale}
        viewBox={`0 0 ${width * frameCount} ${height}`}
        shapeRendering="crispEdges"
        focusable="false"
        style={
          animated
            ? { animation: `gc-px-step ${frameCount / fps}s steps(${frameCount}) infinite` }
            : undefined
        }
      >
        {paths.map(([fill, d]) => (
          <path key={fill} fill={fill} d={d} />
        ))}
      </svg>
    </span>
  );
}
