// Isomorphic (server + browser) grid math and chroma-key pixel test.
// No Node-only or DOM-only APIs here — lib/clientSpriteSlicer.ts (canvas) uses it.
import type { AtlasJson } from "./types";

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

export const CHROMA_TOLERANCE = 60;
/** Distance band beyond CHROMA_TOLERANCE over which alpha ramps 0 -> 255 instead of
 * snapping instantly, so anti-aliased edge pixels fade out instead of leaving a
 * hard-edged halo of near-background-colored pixels around the character. */
export const CHROMA_FEATHER = 40;

/** Euclidean RGB distance from the chroma-key color. */
export function chromaKeyDistance(
  r: number,
  g: number,
  b: number,
  kr: number,
  kg: number,
  kb: number,
): number {
  return Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2);
}

/** Maps chroma-key distance to an alpha value (0 = fully keyed out, 255 = fully opaque). */
export function chromaKeyAlpha(distance: number): number {
  if (distance <= CHROMA_TOLERANCE) return 0;
  if (distance >= CHROMA_TOLERANCE + CHROMA_FEATHER) return 255;
  return Math.round(((distance - CHROMA_TOLERANCE) / CHROMA_FEATHER) * 255);
}

/**
 * Chroma-keying a busy/gradient-heavy background (common in AI-generated art) leaves
 * scattered single-pixel specks that dodge the threshold in one direction or the other.
 * Removes any opaque region not connected to a large enough blob — real character
 * silhouettes are always much bigger than stray noise pixels.
 */
export function despeckleAlpha(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  minIslandSize = 8,
) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const stack: number[] = [];

  for (let start = 0; start < total; start++) {
    if (visited[start] || data[start * 4 + 3] === 0) continue;

    const island: number[] = [];
    visited[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const idx = stack.pop()!;
      island.push(idx);
      const x = idx % width;
      const y = (idx / width) | 0;
      const neighbors = [];
      if (x > 0) neighbors.push(idx - 1);
      if (x < width - 1) neighbors.push(idx + 1);
      if (y > 0) neighbors.push(idx - width);
      if (y < height - 1) neighbors.push(idx + width);
      for (const n of neighbors) {
        if (!visited[n] && data[n * 4 + 3] !== 0) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }

    if (island.length < minIslandSize) {
      for (const idx of island) {
        data[idx * 4 + 3] = 0;
      }
    }
  }
}

export interface BuildAtlasParams {
  width: number;
  height: number;
  rows: number;
  cols: number;
  frameCount: number;
  animationName: string;
  frameRate: number;
  /** If true, appends the reversed sequence (minus both endpoints) so playback bounces forward/backward instead of snapping from the last frame back to the first. */
  pingPong?: boolean;
}

/** Pure grid math: divides an image into rows x cols cells and builds a Phaser-style atlas. No image bytes involved. */
export function buildAtlas({
  width,
  height,
  rows,
  cols,
  frameCount,
  animationName,
  frameRate,
  pingPong,
}: BuildAtlasParams): AtlasJson {
  const cellWidth = Math.floor(width / cols);
  const cellHeight = Math.floor(height / rows);

  const frames: AtlasJson["frames"] = {};
  const frameNames: string[] = [];
  for (let i = 0; i < frameCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const name = `frame_${String(i).padStart(2, "0")}`;
    frameNames.push(name);
    const rect = { x: col * cellWidth, y: row * cellHeight, w: cellWidth, h: cellHeight };
    frames[name] = {
      frame: rect,
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: cellWidth, h: cellHeight },
      sourceSize: { w: cellWidth, h: cellHeight },
    };
  }

  const playbackFrames =
    pingPong && frameNames.length > 2
      ? [...frameNames, ...frameNames.slice(1, -1).reverse()]
      : frameNames;

  return {
    frames,
    meta: {
      app: "sprite-sheet-generator",
      version: "1.0",
      image: "sprite-sheet.png",
      format: "RGBA8888",
      size: { w: width, h: height },
      scale: "1",
      grid: { rows, cols, cellWidth, cellHeight },
      frameCount,
    },
    animations: [{ name: animationName, frames: playbackFrames, frameRate, loop: true }],
  };
}
