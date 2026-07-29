"use client";

import { useEffect, useRef, useState } from "react";
import type { AtlasJson } from "@/lib/types";

interface Props {
  image: string;
  atlas: AtlasJson;
}

const MAX_DISPLAY = 280;

export default function AnimationPreview({ image, atlas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animation = atlas.animations[0];
  const [fps, setFps] = useState(animation?.frameRate ?? 8);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !animation) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    let rafId: number;
    let frameIndex = 0;
    let accumulatedMs = 0;
    let lastTimestamp: number | null = null;
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const firstFrame = atlas.frames[animation.frames[0]].frame;
      canvas.width = firstFrame.w;
      canvas.height = firstFrame.h;
      const scale = Math.min(3, MAX_DISPLAY / Math.max(firstFrame.w, firstFrame.h));
      canvas.style.width = `${firstFrame.w * scale}px`;
      canvas.style.maxWidth = "100%";
      canvas.style.height = "auto";

      const tick = (timestamp: number) => {
        if (lastTimestamp === null) lastTimestamp = timestamp;
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        accumulatedMs += delta;

        const msPerFrame = 1000 / fps;
        if (accumulatedMs >= msPerFrame) {
          accumulatedMs = 0;
          frameIndex = (frameIndex + 1) % animation.frames.length;
        }

        const rect = atlas.frames[animation.frames[frameIndex]].frame;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    };

    img.src = image;

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [image, atlas, animation, fps]);

  if (!animation) return null;

  return (
    <div className="space-y-2">
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
      <div className="flex items-center gap-2">
        <label className="game-label shrink-0" htmlFor="fps">
          FPS: {fps}
        </label>
        <input
          id="fps"
          type="range"
          min={1}
          max={24}
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          className="w-full accent-[var(--accent-cyan)]"
        />
      </div>
    </div>
  );
}
