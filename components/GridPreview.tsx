"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  image: Blob;
  rows: number;
  cols: number;
}

const MAX_DISPLAY = 420;

/** Live grid-line overlay so users can tune rows/cols against the actual image before slicing, instead of guessing and checking after the fact. */
export function GridPreview({ image, rows, cols }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);

  useEffect(() => {
    let cancelled = false;
    createImageBitmap(image).then((bmp) => {
      if (cancelled) return;
      setBitmap(bmp);
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bitmap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = bitmap.width;
    const h = bitmap.height;
    canvas.width = w;
    canvas.height = h;
    const scale = Math.min(1, MAX_DISPLAY / Math.max(w, h));
    canvas.style.width = `${w * scale}px`;
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0);

    const safeCols = Math.max(1, cols);
    const safeRows = Math.max(1, rows);
    const cellWidth = w / safeCols;
    const cellHeight = h / safeRows;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.9)";
    ctx.lineWidth = Math.max(1, Math.round(w / 400));
    for (let c = 1; c < safeCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellWidth, 0);
      ctx.lineTo(c * cellWidth, h);
      ctx.stroke();
    }
    for (let r = 1; r < safeRows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellHeight);
      ctx.lineTo(w, r * cellHeight);
      ctx.stroke();
    }
  }, [bitmap, rows, cols]);

  return (
    <div
      className="inline-block rounded border border-[var(--panel-border)]"
      style={{
        backgroundImage:
          "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
      }}
    >
      <canvas ref={canvasRef} className="block" style={{ imageRendering: "pixelated" }} />
    </div>
  );
}
