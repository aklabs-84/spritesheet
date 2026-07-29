"use client";

import { downloadBlob, dataUrlToBlob } from "@/lib/download";

interface Props {
  prompt: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onGenerateImage: () => void;
  onGenerateSheet: () => void;
  regenerating: boolean;
  generatingImage: boolean;
  generatingSheet: boolean;
  previewImage: string | null;
}

export function PromptPreview({
  prompt,
  onChange,
  onRegenerate,
  onGenerateImage,
  onGenerateSheet,
  regenerating,
  generatingImage,
  generatingSheet,
  previewImage,
}: Props) {
  const busy = regenerating || generatingImage || generatingSheet;

  return (
    <div className="game-panel space-y-3 p-5">
      <label className="game-label block" htmlFor="expanded-prompt">
        생성 프롬프트 (수정 가능)
      </label>
      <textarea
        id="expanded-prompt"
        className="game-input w-full font-mono"
        rows={8}
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="game-button-ghost flex-1 disabled:opacity-50"
        >
          {regenerating ? "다시 만드는 중..." : "프롬프트 다시 생성"}
        </button>
        <button type="button" onClick={onGenerateImage} disabled={busy} className="game-button-ghost flex-1">
          {generatingImage ? "이미지 생성 중..." : "캐릭터 이미지 미리보기"}
        </button>
        <button type="button" onClick={onGenerateSheet} disabled={busy} className="game-button flex-1">
          {generatingSheet ? "시트 이미지 생성 중..." : "시트 이미지 생성"}
        </button>
      </div>

      {previewImage && (
        <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
          <span className="game-label block">캐릭터 이미지 미리보기</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage}
            alt="캐릭터 이미지 미리보기"
            className="max-h-56 rounded border border-[var(--panel-border)]"
            style={{ imageRendering: "pixelated" }}
          />
          <button
            type="button"
            onClick={() => downloadBlob(dataUrlToBlob(previewImage), "character-preview.png")}
            className="game-button-ghost w-full text-xs"
          >
            이미지 다운로드
          </button>
        </div>
      )}
    </div>
  );
}
