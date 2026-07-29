// Server-only. Import only from app/api/*/route.ts.
// Model IDs for image-capable Gemini generation move fast — verify against
// https://ai.google.dev/gemini-api/docs before relying on this in production.
import { ProviderError } from "./errors";

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

export async function geminiExpandPrompt(apiKey: string, instructions: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/${TEXT_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: instructions }] }],
    }),
  });

  if (!res.ok) {
    throw new ProviderError("gemini", res.status, await safeErrorText(res));
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    throw new ProviderError("gemini", 502, "Unexpected Gemini text response shape");
  }
  return text.trim();
}

export async function geminiGenerateImage(
  apiKey: string,
  prompt: string,
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(`${BASE_URL}/${IMAGE_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    throw new ProviderError("gemini", res.status, await safeErrorText(res));
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: { inlineData?: { data?: string } }) => p?.inlineData?.data);
  if (!imagePart) {
    throw new ProviderError("gemini", 502, "Gemini response did not contain image data");
  }
  return {
    base64: imagePart.inlineData.data,
    mimeType: imagePart.inlineData.mimeType ?? "image/png",
  };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
