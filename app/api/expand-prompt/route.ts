import { NextRequest, NextResponse } from "next/server";
import { buildExpansionInstructions } from "@/lib/promptTemplates";
import { geminiExpandPrompt } from "@/lib/providers/gemini";
import { openaiExpandPrompt } from "@/lib/providers/openai";
import { ProviderError } from "@/lib/providers/errors";
import type { ExpandPromptRequest, ExpandPromptResponse, ApiErrorResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  const provider = req.headers.get("x-ai-provider");

  if (!apiKey || (provider !== "gemini" && provider !== "openai")) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Missing or invalid x-api-key / x-ai-provider headers" },
      { status: 400 },
    );
  }

  let body: ExpandPromptRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<ApiErrorResponse>({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.roughDescription || !body.motion || !body.frameCount || !body.rows || !body.cols) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "roughDescription, motion, frameCount, rows, cols are all required" },
      { status: 400 },
    );
  }

  const instructions = buildExpansionInstructions(body);

  try {
    const expandedPrompt =
      provider === "gemini"
        ? await geminiExpandPrompt(apiKey, instructions)
        : await openaiExpandPrompt(apiKey, instructions);

    return NextResponse.json<ExpandPromptResponse>({ expandedPrompt });
  } catch (err) {
    return handleProviderError(err);
  }
}

function handleProviderError(err: unknown) {
  if (err instanceof ProviderError) {
    const status = err.status === 401 || err.status === 403 ? 401 : 502;
    const message =
      status === 401 ? `Invalid API key for ${err.provider}` : `${err.provider} request failed: ${err.message}`;
    return NextResponse.json<ApiErrorResponse>({ error: message }, { status });
  }
  return NextResponse.json<ApiErrorResponse>({ error: "Unexpected server error" }, { status: 500 });
}
