// Server-only. Import only from app/api/*/route.ts.
// Verify current model IDs/endpoints against https://platform.openai.com/docs
// before relying on this in production — image-gen APIs move fast.
import { ProviderError } from "./errors";

const TEXT_MODEL = "gpt-4o-mini";
const IMAGE_MODEL = "gpt-image-1";

export async function openaiExpandPrompt(apiKey: string, instructions: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [{ role: "user", content: instructions }],
    }),
  });

  if (!res.ok) {
    throw new ProviderError("openai", res.status, await safeErrorText(res));
  }

  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new ProviderError("openai", 502, "Unexpected OpenAI chat response shape");
  }
  return text.trim();
}

type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

/** Picks the supported gpt-image-1 size whose aspect ratio is closest to a rows x cols grid of square cells. */
function pickImageSize(rows: number, cols: number): ImageSize {
  const targetAspect = cols / rows;
  const options: { size: ImageSize; aspect: number }[] = [
    { size: "1024x1024", aspect: 1 },
    { size: "1536x1024", aspect: 1536 / 1024 },
    { size: "1024x1536", aspect: 1024 / 1536 },
  ];
  return options.reduce((best, opt) =>
    Math.abs(Math.log(opt.aspect / targetAspect)) < Math.abs(Math.log(best.aspect / targetAspect)) ? opt : best,
  ).size;
}

export async function openaiGenerateImage(
  apiKey: string,
  prompt: string,
  rows: number,
  cols: number,
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: pickImageSize(rows, cols),
    }),
  });

  if (!res.ok) {
    throw new ProviderError("openai", res.status, await safeErrorText(res));
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (typeof b64 !== "string") {
    throw new ProviderError("openai", 502, "OpenAI response did not contain image data");
  }
  return { base64: b64, mimeType: "image/png" };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}
