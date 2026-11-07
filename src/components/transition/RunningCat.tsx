import { CAT_FRAMES, CAT_HEIGHT, CAT_PALETTE, CAT_WIDTH } from "./catSprite";

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

// The sheet holds 4 frames; `.cat-run-sheet` in globals.css steps through
// them, so keep its steps() count in sync with CAT_FRAMES.length.
// Merge horizontal runs of one colour into a single rect, frames laid out
// side by side so the sheet can be stepped through with a CSS transform.
function buildRuns(): Run[] {
  const runs: Run[] = [];
  CAT_FRAMES.forEach((frame, f) => {
    frame.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        const ch = row[x];
        let end = x + 1;
        while (end < row.length && row[end] === ch) end++;
        const fill = CAT_PALETTE[ch];
        if (fill) runs.push({ x: f * CAT_WIDTH + x, y, w: end - x, fill });
        x = end;
      }
    });
  });
  return runs;
}

const RUNS = buildRuns();

export interface RunningCatProps {
  /** Size of one sprite pixel in CSS pixels. */
  scale?: number;
}

export function RunningCat({ scale = 4 }: RunningCatProps): React.JSX.Element {
  const width = CAT_WIDTH * scale;
  const height = CAT_HEIGHT * scale;
  return (
    <div className="overflow-hidden" style={{ width, height }} aria-hidden="true">
      <svg
        className="cat-run-sheet block"
        width={width * CAT_FRAMES.length}
        height={height}
        viewBox={`0 0 ${CAT_WIDTH * CAT_FRAMES.length} ${CAT_HEIGHT}`}
        shapeRendering="crispEdges"
      >
        {RUNS.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
      </svg>
    </div>
  );
}
