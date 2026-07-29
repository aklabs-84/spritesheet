// Isomorphic (server + browser) grid math and chroma-key pixel test.
// No Node-only or DOM-only APIs here so both lib/imageProcessing.ts (sharp)
// and lib/clientSpriteSlicer.ts (canvas) can share the same logic.
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

/** Euclidean RGB distance; caller decides what to do when it's within tolerance. */
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
