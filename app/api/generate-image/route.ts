import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateImage } from "@/lib/providers/gemini";
import { openaiGenerateImage } from "@/lib/providers/openai";
import { ProviderError } from "@/lib/providers/errors";
import type { GenerateImageRequest, GenerateImageResponse, ApiErrorResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const provider = req.headers.get("x-ai-provider");

  if (!apiKey || (provider !== "gemini" && provider !== "openai")) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Missing or invalid x-api-key / x-ai-provider headers" },
      { status: 400 },
    );
  }

  let body: GenerateImageRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json<ApiErrorResponse>({ error: "prompt is required" }, { status: 400 });
  }

  try {
    const { base64, mimeType } =
      provider === "gemini"
        ? await geminiGenerateImage(apiKey, body.prompt)
        : await openaiGenerateImage(apiKey, body.prompt, body.rows ?? 1, body.cols ?? 1);

    return NextResponse.json<GenerateImageResponse>({
      image: `data:${mimeType};base64,${base64}`,
    });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof ProviderError) {
    const status = err.status === 401 || err.status === 403 ? 401 : 502;
    const message =
      status === 401 ? `Invalid API key for ${err.provider}` : `${err.provider} request failed: ${err.message}`;
    return NextResponse.json<ApiErrorResponse>({ error: message }, { status });
  }
  return NextResponse.json<ApiErrorResponse>({ error: "Unexpected server error" }, { status: 500 });
}
