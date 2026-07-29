"use client";

import { useState } from "react";
import { sliceUploadedImage } from "@/lib/clientSpriteSlicer";
import type { GenerateSpriteResponse } from "@/lib/types";

interface Props {
  onResult: (result: GenerateSpriteResponse) => void;
}

export function UploadForm({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [animationName, setAnimationName] = useState("animation");
  const [frameCount, setFrameCount] = useState(8);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(4);
  const [frameRate, setFrameRate] = useState(8);
  const [chromaEnabled, setChromaEnabled] = useState(false);
  const [chromaColor, setChromaColor] = useState("#FF00FF");
  const [pingPong, setPingPong] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cellsMismatch = rows * cols !== frameCount;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("스프라이트 시트 이미지를 먼저 선택해주세요.");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const result = await sliceUploadedImage({
        file,
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
    <form onSubmit={handleSubmit} className="game-panel space-y-4 p-5">
      <p className="text-xs text-[var(--muted)]">
        AI 없이, 이미 갖고 있는 스프라이트 시트 이미지를 격자로 잘라 애니메이션으로 재생합니다.
      </p>

      <div>
        <label className="game-label mb-1 block" htmlFor="sheet-file">
          스프라이트 시트 이미지
        </label>
        <input
          id="sheet-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-[var(--muted)] file:mr-3 file:rounded file:border-0 file:bg-[var(--accent-cyan)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-black"
        />
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="업로드 미리보기"
            className="mt-2 max-h-40 rounded border border-[var(--panel-border)]"
            style={{ imageRendering: "pixelated" }}
          />
        )}
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
          <label className="game-label mb-1 block" htmlFor="up-frameCount">
            프레임 수
          </label>
          <input
            id="up-frameCount"
            type="number"
            min={1}
            max={64}
            className="game-input w-full"
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="up-fps">
            FPS
          </label>
          <input
            id="up-fps"
            type="number"
            min={1}
            max={30}
            className="game-input w-full"
            value={frameRate}
            onChange={(e) => setFrameRate(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="up-rows">
            행 (rows)
          </label>
          <input
            id="up-rows"
            type="number"
            min={1}
            max={16}
            className="game-input w-full"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="game-label mb-1 block" htmlFor="up-cols">
            열 (cols)
          </label>
          <input
            id="up-cols"
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
          id="chroma-enabled"
          type="checkbox"
          checked={chromaEnabled}
          onChange={(e) => setChromaEnabled(e.target.checked)}
        />
        <label className="game-label" htmlFor="chroma-enabled">
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
          id="ping-pong"
          type="checkbox"
          checked={pingPong}
          onChange={(e) => setPingPong(e.target.checked)}
        />
        <label className="game-label" htmlFor="ping-pong">
          자연스러운 루프 (ping-pong)
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button type="submit" disabled={processing} className="game-button w-full">
        {processing ? "처리 중..." : "애니메이션 만들기"}
      </button>
    </form>
  );
}
