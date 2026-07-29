import type { ExpandPromptRequest, MotionPreset } from "./types";

export const MOTION_LABELS: Record<MotionPreset, string> = {
  idle: "idle breathing loop",
  walk: "walking cycle",
  run: "running cycle",
  jump: "jump (crouch, launch, apex, land)",
  attack: "melee attack swing",
  custom: "custom motion described by the user",
};

const CHROMA_KEY_HEX = "#FF00FF";

export function buildExpansionInstructions({
  roughDescription,
  motion,
  frameCount,
  rows,
  cols,
}: ExpandPromptRequest): string {
  const motionLabel = MOTION_LABELS[motion];
  return [
    `Character concept: ${roughDescription}`,
    `Animation: ${motionLabel}, exactly ${frameCount} frames.`,
    "",
    "Write a single detailed image-generation prompt that enforces these hard requirements:",
    `1. Style consistency: identical character proportions, palette, and art style in every cell.`,
    `2. Keyable background: flat, uniform solid background, pure magenta ${CHROMA_KEY_HEX}, no gradients, shadows, or texture on the background.`,
    `3. Exact grid: arrange exactly ${rows} rows x ${cols} columns = ${rows * cols} cells in one single image, one animation frame per cell, uniform cell size, no dividing lines, no text or watermark.`,
    `4. Containment: scale each character down so it fits fully inside its own cell with visible margin on all sides — the character must never touch or cross into a neighboring cell, even during large poses (arms raised, weapon swings, jumps).`,
    `5. Alignment: keep the character's anchor point (feet/base) at the same relative position within every cell so frames line up when played back in sequence.`,
    "",
    "Return only the final prompt text, nothing else.",
  ].join("\n");
}

/**
 * A ready-to-paste prompt (not instructions to an LLM) for pasting directly into any
 * external AI image platform. Purely templated from user input — no AI call involved,
 * so this is available without an API key.
 */
export function buildGuidePrompt({
  roughDescription,
  motion,
  frameCount,
  rows,
  cols,
}: ExpandPromptRequest): string {
  const motionLabel = MOTION_LABELS[motion];
  return [
    `A single sprite sheet image of the following character: ${roughDescription}`,
    `Animation shown: ${motionLabel}, exactly ${frameCount} frames.`,
    "",
    "Hard requirements:",
    `1. Style consistency: identical character proportions, palette, and art style in every cell.`,
    `2. Keyable background: flat, uniform solid background, pure magenta ${CHROMA_KEY_HEX}, no gradients, shadows, or texture on the background.`,
    `3. Exact grid: arrange exactly ${rows} rows x ${cols} columns = ${rows * cols} cells in one single image, one animation frame per cell, uniform cell size, no dividing lines, no text or watermark.`,
    `4. Containment: scale each character down so it fits fully inside its own cell with visible margin on all sides — the character must never touch or cross into a neighboring cell, even during large poses (arms raised, weapon swings, jumps).`,
    `5. Alignment: keep the character's anchor point (feet/base) at the same relative position within every cell so frames line up when played back in sequence.`,
  ].join("\n");
}

export const DEFAULT_CHROMA_KEY = CHROMA_KEY_HEX;
