// Server-only (uses sharp, requires Node runtime). Import only from app/api/*/route.ts.
import sharp from "sharp";
import type { AtlasJson } from "./types";
import { buildAtlas, chromaKeyDistance, hexToRgb, CHROMA_TOLERANCE } from "./spriteGrid";

/** Replaces pixels close to `chromaKeyHex` with full transparency. Mutates in place. */
function applyChromaKey(data: Buffer, chromaKeyHex: string): void {
  const [kr, kg, kb] = hexToRgb(chromaKeyHex);
  for (let i = 0; i < data.length; i += 4) {
    const dist = chromaKeyDistance(data[i], data[i + 1], data[i + 2], kr, kg, kb);
    if (dist < CHROMA_TOLERANCE) {
      data[i + 3] = 0;
    }
  }
}

export interface ProcessSpriteSheetParams {
  imageBuffer: Buffer;
  rows: number;
  cols: number;
  frameCount: number;
  chromaKeyHex: string;
  animationName: string;
  frameRate: number;
  pingPong?: boolean;
}

export interface ProcessSpriteSheetResult {
  pngBuffer: Buffer;
  atlas: AtlasJson;
}

export async function processSpriteSheet({
  imageBuffer,
  rows,
  cols,
  frameCount,
  chromaKeyHex,
  animationName,
  frameRate,
  pingPong,
}: ProcessSpriteSheetParams): Promise<ProcessSpriteSheetResult> {
  const image = sharp(imageBuffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (channels !== 4) {
    throw new Error(`Expected RGBA buffer, got ${channels} channels`);
  }

  applyChromaKey(data, chromaKeyHex);

  const pngBuffer = await sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  const atlas = buildAtlas({ width, height, rows, cols, frameCount, animationName, frameRate, pingPong });

  return { pngBuffer, atlas };
}
