"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AtlasJson } from "@/lib/types";

const AnimationPreview = dynamic(() => import("./AnimationPreview"), {
  ssr: false,
  loading: () => <div className="text-sm text-[var(--muted)]">미리보기 로딩 중...</div>,
});

const SheetGridPreview = dynamic(() => import("./SheetGridPreview"), {
  ssr: false,
  loading: () => <div className="text-sm text-[var(--muted)]">시트 로딩 중...</div>,
});

interface Props {
  image: string;
  atlas: AtlasJson;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function SpriteResult({ image, atlas }: Props) {
  const [showRawSheet, setShowRawSheet] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="game-label">{showRawSheet ? "원본 시트 + 격자선" : "애니메이션 미리보기"}</span>
        <button type="button" onClick={() => setShowRawSheet((v) => !v)} className="game-button-ghost text-xs">
          {showRawSheet ? "애니메이션 보기" : "원본 시트 보기"}
        </button>
      </div>

      {showRawSheet ? <SheetGridPreview image={image} atlas={atlas} /> : <AnimationPreview image={image} atlas={atlas} />}

      <div className="flex gap-2">
        <button type="button" onClick={() => downloadBlob(dataUrlToBlob(image), "sprite-sheet.png")} className="game-button flex-1">
          PNG 다운로드
        </button>
        <button
          type="button"
          onClick={() =>
            downloadBlob(
              new Blob([JSON.stringify(atlas, null, 2)], { type: "application/json" }),
              "sprite-sheet.json",
            )
          }
          className="game-button flex-1"
        >
          JSON 다운로드
        </button>
      </div>
    </div>
  );
}
