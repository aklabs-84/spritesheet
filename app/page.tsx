"use client";

import { useState } from "react";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { GenerationForm } from "@/components/GenerationForm";
import { PromptPreview } from "@/components/PromptPreview";
import { SpriteResult } from "@/components/SpriteResult";
import { UploadForm } from "@/components/UploadForm";
import { useApiKey } from "@/lib/apiKeyStorage";
import { DEFAULT_CHROMA_KEY } from "@/lib/promptTemplates";
import type {
  ApiErrorResponse,
  ExpandPromptRequest,
  ExpandPromptResponse,
  GenerateSpriteResponse,
} from "@/lib/types";

type Mode = "ai" | "upload";
type AiStep = "form" | "prompt";

export default function Home() {
  const { provider, activeKey } = useApiKey();

  const [mode, setMode] = useState<Mode>("ai");
  const [aiStep, setAiStep] = useState<AiStep>("form");
  const [formValues, setFormValues] = useState<ExpandPromptRequest | null>(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GenerateSpriteResponse | null>(null);

  const [expanding, setExpanding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callApi<T>(path: string, body: unknown): Promise<T> {
    if (!activeKey) {
      throw new Error(`${provider === "gemini" ? "Gemini" : "OpenAI"} API 키를 먼저 설정에 입력해주세요.`);
    }
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": activeKey,
        "x-ai-provider": provider,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error((json as ApiErrorResponse).error ?? "요청이 실패했습니다.");
    }
    return json as T;
  }

  async function handleFormSubmit(values: ExpandPromptRequest) {
    setError(null);
    setFormValues(values);
    setExpanding(true);
    try {
      const { expandedPrompt } = await callApi<ExpandPromptResponse>("/api/expand-prompt", values);
      setPrompt(expandedPrompt);
      setAiStep("prompt");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setExpanding(false);
    }
  }

  async function handleRegenerate() {
    if (!formValues) return;
    setError(null);
    setExpanding(true);
    try {
      const { expandedPrompt } = await callApi<ExpandPromptResponse>("/api/expand-prompt", formValues);
      setPrompt(expandedPrompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setExpanding(false);
    }
  }

  async function handleGenerate() {
    if (!formValues) return;
    setError(null);
    setGenerating(true);
    try {
      const response = await callApi<GenerateSpriteResponse>("/api/generate-sprite", {
        prompt,
        rows: formValues.rows,
        cols: formValues.cols,
        frameCount: formValues.frameCount,
        chromaKey: DEFAULT_CHROMA_KEY,
        animationName: formValues.motion,
        pingPong: formValues.pingPong,
      });
      setResult(response);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setGenerating(false);
    }
  }

  function handleReset() {
    setAiStep("form");
    setResult(null);
    setPrompt("");
    setError(null);
  }

  function handleModeChange(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setError(null);
    setAiStep("form");
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 space-y-6">
      <header className="space-y-4">
        <h1 className="font-pixel text-base leading-relaxed text-[var(--accent-cyan)] sm:text-lg">
          🕹 AI 스프라이트 스튜디오
        </h1>
        <div className="flex gap-1 border-b border-[var(--panel-border)]">
          <button type="button" className="game-tab" data-active={mode === "ai"} onClick={() => handleModeChange("ai")}>
            AI로 생성
          </button>
          <button
            type="button"
            className="game-tab"
            data-active={mode === "upload"}
            onClick={() => handleModeChange("upload")}
          >
            이미지 업로드
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {mode === "ai" ? (
            <>
              <ApiKeySettings />
              {aiStep === "form" && <GenerationForm onSubmit={handleFormSubmit} submitting={expanding} />}
              {aiStep === "prompt" && (
                <PromptPreview
                  prompt={prompt}
                  onChange={setPrompt}
                  onRegenerate={handleRegenerate}
                  onGenerate={handleGenerate}
                  regenerating={expanding}
                  generating={generating}
                />
              )}
            </>
          ) : (
            <UploadForm onResult={setResult} />
          )}
        </div>

        <div className="game-panel relative flex min-h-[360px] flex-col items-center justify-center gap-4 p-5">
          <div className="pointer-events-none absolute inset-3 rounded-lg border border-dashed border-[var(--panel-border)]" />
          {result ? (
            <div className="relative z-10 w-full">
              <SpriteResult image={result.image} atlas={result.atlas} />
              <button type="button" onClick={handleReset} className="game-button-ghost mt-4 w-full">
                새로 만들기
              </button>
            </div>
          ) : (
            <p className="relative z-10 px-6 text-center text-sm text-[var(--muted)]">
              {mode === "ai"
                ? "왼쪽에서 캐릭터를 설명하고 생성하면 여기에 결과가 표시됩니다."
                : "왼쪽에서 스프라이트 시트를 업로드하면 여기에 애니메이션이 표시됩니다."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
