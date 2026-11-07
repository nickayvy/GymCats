/**
 * A pixel-art sprite authored as string grids: one character per pixel,
 * "." is transparent, every other character must be a key of `palette`.
 */
export interface SpriteSheet {
  palette: Record<string, string>; // char -> CSS colour
  frames: readonly (readonly string[])[]; // every frame same width/height
  fps?: number; // default 4
}
