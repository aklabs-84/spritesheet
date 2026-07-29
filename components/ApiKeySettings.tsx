"use client";

import { useApiKey } from "@/lib/apiKeyStorage";

export function ApiKeySettings() {
  const { provider, setProvider, geminiKey, openaiKey, setGeminiKey, setOpenaiKey } = useApiKey();

  return (
    <div className="game-panel space-y-3 p-4">
      <h2 className="game-label text-[var(--accent-cyan)]">API 설정</h2>

      <div className="flex items-center gap-3">
        <label className="game-label w-20 shrink-0" htmlFor="provider">
          제공자
        </label>
        <select
          id="provider"
          className="game-input flex-1"
          value={provider}
          onChange={(e) => setProvider(e.target.value as "gemini" | "openai")}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <label className="game-label w-20 shrink-0" htmlFor="gemini-key">
          Gemini 키
        </label>
        <input
          id="gemini-key"
          type="password"
          autoComplete="off"
          placeholder="AIza..."
          className="game-input flex-1"
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="game-label w-20 shrink-0" htmlFor="openai-key">
          OpenAI 키
        </label>
        <input
          id="openai-key"
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          className="game-input flex-1"
          value={openaiKey}
          onChange={(e) => setOpenaiKey(e.target.value)}
        />
      </div>

      <p className="text-xs text-[var(--muted)]">키는 이 브라우저에만 저장되며, 서버에는 저장되지 않습니다.</p>
    </div>
  );
}
