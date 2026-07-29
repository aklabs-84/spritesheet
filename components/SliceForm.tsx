"use client";

import { useState } from "react";
import { sliceUploadedImage } from "@/lib/clientSpriteSlicer";
import { GridPreview } from "./GridPreview";
import type { GenerateSpriteResponse } from "@/lib/types";

interface Props {
  image: Blob;
  onResult: (result: GenerateSpriteResponse) => void;
  defaultAnimationName?: string;
  defaultRows?: number;
  defaultCols?: number;
  defaultFrameCount?: number;
  defaultFrameRate?: number;
  submitLabel?: string;
}

export function SliceForm({
  image,
  onResult,
  defaultAnimationName = "animation",
  defaultRows = 2,
  defaultCols = 4,
  defaultFrameCount = 8,
  defaultFrameRate = 8,
  submitLabel = "애니메이션 만들기",
}: Props) {
  const [animationName, setAnimationName] = useState(defaultAnimationName);
  const [frameCount, setFrameCount] = useState(defaultFrameCount);
  const [rows, setRows] = useState(defaultRows);
  const [cols, setCols] = useState(defaultCols);
  const [frameRate, setFrameRate] = useState(defaultFrameRate);
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaColor, setChromaColor] = useState("#FF00FF");
  const [pingPong, setPingPong] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cellsMismatch = rows * cols !== frameCount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setProcessing(true);
    try {
      const result = await sliceUploadedImage({
        image,
        rows,
        cols,
        frameCount,
        animationName,
        frameRate,
        chromaKeyHex: chromaEnabled ? chromaColor : undefined,
        pingPong,
      });
      onResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <p className="game-label">
          격자 미리보기 — 아래 행/열 값을 캐릭터 칸 경계에 맞춰보세요
        </p>
        <GridPreview image={image} rows={rows} cols={cols} />
      </div>

      <div>
        <label className="game-label mb-1 block" htmlFor="animation-name">
          애니메이션 이름
        </label>
        <input
          id="animation-name"
          className="game-input w-full"
          value={animationName}
          onChange={(e) => setAnimationName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="game-label mb-1 block" htmlFor="slice-frameCount">
            프레임 수
          </label>
          <input
            id="slice-frameCount"
            type="number"
            min={1}
            max={64}
            className="game-input w-full"
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="slice-fps">
            FPS
          </label>
          <input
            id="slice-fps"
            type="number"
            min={1}
            max={30}
            className="game-input w-full"
            value={frameRate}
            onChange={(e) => setFrameRate(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="slice-rows">
            행 (rows)
          </label>
          <input
            id="slice-rows"
            type="number"
            min={1}
            max={16}
            className="game-input w-full"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="slice-cols">
            열 (cols)
          </label>
          <input
            id="slice-cols"
            type="number"
            min={1}
            max={16}
            className="game-input w-full"
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
          />
        </div>
      </div>

      {cellsMismatch && (
        <p className="text-xs text-amber-400">
          행 x 열 ({rows * cols})이 프레임 수({frameCount})와 다릅니다. 일부 칸이 비거나 프레임이 잘릴 수 있습니다.
        </p>
      )}

      <div className="flex items-center gap-3">
        <input
          id="slice-chroma-enabled"
          type="checkbox"
          checked={chromaEnabled}
          onChange={(e) => setChromaEnabled(e.target.checked)}
        />
        <label className="game-label" htmlFor="slice-chroma-enabled">
          배경 투명화 (크로마키)
        </label>
        {chromaEnabled && (
          <input
            type="color"
            value={chromaColor}
            onChange={(e) => setChromaColor(e.target.value)}
            className="h-7 w-10 rounded border border-[var(--panel-border)] bg-transparent"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="slice-ping-pong"
          type="checkbox"
          checked={pingPong}
          onChange={(e) => setPingPong(e.target.checked)}
        />
        <label className="game-label" htmlFor="slice-ping-pong">
          자연스러운 루프 (ping-pong)
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={processing} className="game-button w-full">
        {processing ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
}
