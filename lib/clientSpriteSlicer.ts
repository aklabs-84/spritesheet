// Browser-only. Slices a user-uploaded sprite sheet into a grid atlas without any AI call.
import type { AtlasJson, GenerateSpriteResponse } from "./types";
import { buildAtlas, chromaKeyDistance, hexToRgb, CHROMA_TOLERANCE } from "./spriteGrid";

export interface SliceUploadedImageParams {
  file: File;
  rows: number;
  cols: number;
  frameCount: number;
  animationName: string;
  frameRate: number;
  /** If provided, pixels close to this hex color are made transparent. */
  chromaKeyHex?: string;
  pingPong?: boolean;
}

/**
 * Grid cuts are mechanically exact, but source art often isn't: a neighboring
 * character's tail/hand can poke a pixel or two across the cell boundary line.
 * Static grids hide this (it's always in the same spot), but once frames are
 * shifted to align (see below), that sliver moves independently per frame and
 * reads as a flicker. Erasing a thin border around each cell removes it.
 */
const EDGE_TRIM = 2;

function trimEdgeBleed(imageData: ImageData, margin: number) {
  const { data, width, height } = imageData;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      if (px < margin || px >= width - margin || py < margin || py >= height - margin) {
        data[(py * width + px) * 4 + 3] = 0;
      }
    }
  }
}

/**
 * Source sprite sheets (especially AI-generated ones) often don't draw the
 * character at the exact same anchor point in every cell. That's invisible
 * in a static grid but reads as jitter/jumping once played as an animation.
 * Re-centers each frame's opaque-pixel bounding box onto a shared anchor
 * (bottom-center, i.e. "feet") within its own cell so playback looks stable.
 * Only meaningful once the background is transparent, so this only runs
 * when a chroma key was applied.
 */
function alignFramesToSharedAnchor(sourceCanvas: HTMLCanvasElement, atlas: AtlasJson): HTMLCanvasElement {
  const sourceCtx = sourceCanvas.getContext("2d");
  if (!sourceCtx) throw new Error("캔버스를 초기화할 수 없습니다.");

  const frameNames = Object.keys(atlas.frames);
  const cells = frameNames.map((name) => {
    const rect = atlas.frames[name].frame;
    const imageData = sourceCtx.getImageData(rect.x, rect.y, rect.w, rect.h);
    trimEdgeBleed(imageData, EDGE_TRIM);
    const { data } = imageData;
    let minX = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let py = 0; py < rect.h; py++) {
      for (let px = 0; px < rect.w; px++) {
        const alpha = data[(py * rect.w + px) * 4 + 3];
        if (alpha === 0) continue;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py > maxY) maxY = py;
      }
    }
    const anchor = maxX === -Infinity ? null : { centerX: (minX + maxX) / 2, bottomY: maxY };
    return { rect, imageData, anchor };
  });

  const known = cells.map((c) => c.anchor).filter((a): a is { centerX: number; bottomY: number } => a !== null);
  if (known.length === 0) return sourceCanvas;
  const targetX = known.reduce((sum, a) => sum + a.centerX, 0) / known.length;
  const targetY = known.reduce((sum, a) => sum + a.bottomY, 0) / known.length;

  const alignedCanvas = document.createElement("canvas");
  alignedCanvas.width = sourceCanvas.width;
  alignedCanvas.height = sourceCanvas.height;
  const alignedCtx = alignedCanvas.getContext("2d");
  if (!alignedCtx) throw new Error("캔버스를 초기화할 수 없습니다.");

  for (const { rect, imageData, anchor } of cells) {
    const shiftX = anchor ? Math.round(targetX - anchor.centerX) : 0;
    const shiftY = anchor ? Math.round(targetY - anchor.bottomY) : 0;

    const cellCanvas = document.createElement("canvas");
    cellCanvas.width = rect.w;
    cellCanvas.height = rect.h;
    const cellCtx = cellCanvas.getContext("2d");
    if (!cellCtx) throw new Error("캔버스를 초기화할 수 없습니다.");
    cellCtx.putImageData(imageData, 0, 0);

    alignedCtx.save();
    alignedCtx.beginPath();
    alignedCtx.rect(rect.x, rect.y, rect.w, rect.h);
    alignedCtx.clip();
    alignedCtx.drawImage(cellCanvas, rect.x + shiftX, rect.y + shiftY);
    alignedCtx.restore();
  }

  return alignedCanvas;
}

export async function sliceUploadedImage({
  file,
  rows,
  cols,
  frameCount,
  animationName,
  frameRate,
  chromaKeyHex,
  pingPong,
}: SliceUploadedImageParams): Promise<GenerateSpriteResponse> {
  const bitmap = await createImageBitmap(file);
  let canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 초기화할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const atlas = buildAtlas({
    width: canvas.width,
    height: canvas.height,
    rows,
    cols,
    frameCount,
    animationName,
    frameRate,
    pingPong,
  });

  if (chromaKeyHex) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const [kr, kg, kb] = hexToRgb(chromaKeyHex);
    for (let i = 0; i < data.length; i += 4) {
      const dist = chromaKeyDistance(data[i], data[i + 1], data[i + 2], kr, kg, kb);
      if (dist < CHROMA_TOLERANCE) {
        data[i + 3] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    canvas = alignFramesToSharedAnchor(canvas, atlas);
  }

  const image = canvas.toDataURL("image/png");

  return { image, atlas };
}
