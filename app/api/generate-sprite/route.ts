import { NextRequest, NextResponse } from "next/server";
import { geminiGenerateImage } from "@/lib/providers/gemini";
import { openaiGenerateImage } from "@/lib/providers/openai";
import { ProviderError } from "@/lib/providers/errors";
import { processSpriteSheet } from "@/lib/imageProcessing";
import type { GenerateSpriteRequest, GenerateSpriteResponse, ApiErrorResponse } from "@/lib/types";

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

  let body: GenerateSpriteRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.prompt || !body.rows || !body.cols || !body.frameCount || !body.chromaKey) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "prompt, rows, cols, frameCount, chromaKey are all required" },
      { status: 400 },
    );
  }

  try {
    const { base64 } =
      provider === "gemini"
        ? await geminiGenerateImage(apiKey, body.prompt)
        : await openaiGenerateImage(apiKey, body.prompt, body.rows, body.cols);

    const imageBuffer = Buffer.from(base64, "base64");

    const { pngBuffer, atlas } = await processSpriteSheet({
      imageBuffer,
      rows: body.rows,
      cols: body.cols,
      frameCount: body.frameCount,
      chromaKeyHex: body.chromaKey,
      animationName: body.animationName ?? "animation",
      frameRate: body.frameRate ?? 8,
      pingPong: body.pingPong,
    });

    return NextResponse.json<GenerateSpriteResponse>({
      image: `data:image/png;base64,${pngBuffer.toString("base64")}`,
      atlas,
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
