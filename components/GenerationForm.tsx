"use client";

import { useState } from "react";
import { MOTION_LABELS, buildGuidePrompt } from "@/lib/promptTemplates";
import type { ExpandPromptRequest, MotionPreset } from "@/lib/types";

interface Props {
  onSubmit: (values: ExpandPromptRequest) => void;
  submitting: boolean;
}

export function GenerationForm({ onSubmit, submitting }: Props) {
  const [roughDescription, setRoughDescription] = useState("");
  const [motion, setMotion] = useState<MotionPreset>("walk");
  const [frameCount, setFrameCount] = useState(8);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(4);
  const [pingPong, setPingPong] = useState(false);
  const [copied, setCopied] = useState(false);

  const cellsMismatch = rows * cols !== frameCount;
  const guidePrompt = roughDescription.trim()
    ? buildGuidePrompt({ roughDescription, motion, frameCount, rows, cols, pingPong })
    : "";

  async function handleCopyGuidePrompt() {
    await navigator.clipboard.writeText(guidePrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form
      className="game-panel space-y-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ roughDescription, motion, frameCount, rows, cols, pingPong });
      }}
    >
      <div>
        <label className="game-label mb-1 block" htmlFor="description">
          캐릭터 설명
        </label>
        <textarea
          id="description"
          required
          className="game-input w-full"
          rows={3}
          placeholder="예: 빨간 갑옷을 입은 작은 전사 캐릭터, 픽셀아트 스타일"
          value={roughDescription}
          onChange={(e) => setRoughDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="game-label mb-1 block" htmlFor="motion">
            동작
          </label>
          <select
            id="motion"
            className="game-input w-full"
            value={motion}
            onChange={(e) => setMotion(e.target.value as MotionPreset)}
          >
            {Object.entries(MOTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="game-label mb-1 block" htmlFor="frameCount">
            프레임 수
          </label>
          <input
            id="frameCount"
            type="number"
            min={1}
            max={64}
            className="game-input w-full"
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="game-label mb-1 block" htmlFor="rows">
            행 (rows)
          </label>
          <input
            id="rows"
            type="number"
            min={1}
            max={16}
            className="game-input w-full"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
          />
        </div>

        <div>
          <label className="game-label mb-1 block" htmlFor="cols">
            열 (cols)
          </label>
          <input
            id="cols"
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
          id="ping-pong"
          type="checkbox"
          checked={pingPong}
          onChange={(e) => setPingPong(e.target.checked)}
        />
        <label className="game-label" htmlFor="ping-pong">
          자연스러운 루프 (ping-pong)
        </label>
      </div>

      {guidePrompt && (
        <div className="space-y-2 rounded border border-[var(--panel-border)] p-3">
          <div className="flex items-center justify-between">
            <span className="game-label">가이드 프롬프트 (API 키 불필요, 외부 AI에 붙여넣기)</span>
            <button type="button" onClick={handleCopyGuidePrompt} className="game-button-ghost text-xs">
              {copied ? "복사됨!" : "복사하기"}
            </button>
          </div>
          <p className="whitespace-pre-wrap rounded bg-black/20 p-2 font-mono text-xs text-[var(--muted)]">
            {guidePrompt}
          </p>
        </div>
      )}

      <button type="submit" disabled={submitting} className="game-button w-full">
        {submitting ? "프롬프트 생성 중..." : "프롬프트 생성"}
      </button>
    </form>
  );
}
