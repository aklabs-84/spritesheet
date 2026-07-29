"use client";

interface Props {
  prompt: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onGenerate: () => void;
  regenerating: boolean;
  generating: boolean;
}

export function PromptPreview({ prompt, onChange, onRegenerate, onGenerate, regenerating, generating }: Props) {
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
          disabled={regenerating || generating}
          className="game-button-ghost flex-1 disabled:opacity-50"
        >
          {regenerating ? "다시 만드는 중..." : "프롬프트 다시 생성"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || regenerating}
          className="game-button flex-1"
        >
          {generating ? "스프라이트 시트 생성 중..." : "스프라이트 시트 생성"}
        </button>
      </div>
    </div>
  );
}
