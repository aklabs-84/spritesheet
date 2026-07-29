"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiProvider } from "./types";

const STORAGE_KEY = "sprite-app:keys";

interface StoredKeys {
  gemini?: string;
  openai?: string;
  activeProvider: AiProvider;
}

const DEFAULT_KEYS: StoredKeys = { activeProvider: "gemini" };

function readStorage(): StoredKeys {
  if (typeof window === "undefined") return DEFAULT_KEYS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_KEYS;
    return { ...DEFAULT_KEYS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_KEYS;
  }
}

export function useApiKey() {
  const [keys, setKeys] = useState<StoredKeys>(DEFAULT_KEYS);

  useEffect(() => {
    setKeys(readStorage());
  }, []);

  const update = useCallback((next: Partial<StoredKeys>) => {
    setKeys((prev) => {
      const merged = { ...prev, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const activeKey = keys[keys.activeProvider] ?? "";

  return {
    provider: keys.activeProvider,
    setProvider: (provider: AiProvider) => update({ activeProvider: provider }),
    geminiKey: keys.gemini ?? "",
    openaiKey: keys.openai ?? "",
    setGeminiKey: (value: string) => update({ gemini: value }),
    setOpenaiKey: (value: string) => update({ openai: value }),
    activeKey,
  };
}
