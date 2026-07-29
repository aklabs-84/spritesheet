"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { AtlasJson } from "@/lib/types";
import { downloadBlob, dataUrlToBlob } from "@/lib/download";
import { IntegrationGuide } from "./IntegrationGuide";

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

      <IntegrationGuide image={image} atlas={atlas} />
    </div>
  );
}
