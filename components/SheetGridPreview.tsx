"use client";

import { useEffect, useRef } from "react";
import type { AtlasJson } from "@/lib/types";

interface Props {
  image: string;
  atlas: AtlasJson;
}

const MAX_DISPLAY = 480;

export default function SheetGridPreview({ image, atlas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const { w, h } = atlas.meta.size;
      canvas.width = w;
      canvas.height = h;
      const scale = Math.min(1, MAX_DISPLAY / Math.max(w, h));
      canvas.style.width = `${w * scale}px`;
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0);

      const { rows, cols, cellWidth, cellHeight } = atlas.meta.grid;
      ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
      ctx.lineWidth = Math.max(1, Math.round(w / 400));
      for (let c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellWidth, 0);
        ctx.lineTo(c * cellWidth, h);
        ctx.stroke();
      }
      for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellHeight);
        ctx.lineTo(w, r * cellHeight);
        ctx.stroke();
      }
    };
    img.src = image;
  }, [image, atlas]);

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
