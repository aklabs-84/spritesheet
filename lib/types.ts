export type AiProvider = "gemini" | "openai";

export type MotionPreset =
  | "idle"
  | "walk"
  | "run"
  | "jump"
  | "attack"
  | "custom";

export interface ExpandPromptRequest {
  roughDescription: string;
  motion: MotionPreset;
  frameCount: number;
  rows: number;
  cols: number;
  pingPong?: boolean;
}

export interface ExpandPromptResponse {
  expandedPrompt: string;
}

export interface GenerateSpriteRequest {
  prompt: string;
  rows: number;
  cols: number;
  frameCount: number;
  chromaKey: string;
  animationName?: string;
  frameRate?: number;
  pingPong?: boolean;
}

export interface AtlasFrame {
  frame: { x: number; y: number; w: number; h: number };
  rotated: false;
  trimmed: false;
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
}

export interface AtlasAnimation {
  name: string;
  frames: string[];
  frameRate: number;
  loop: boolean;
}

export interface AtlasJson {
  frames: Record<string, AtlasFrame>;
  meta: {
    app: string;
    version: string;
    image: string;
    format: "RGBA8888";
    size: { w: number; h: number };
    scale: "1";
    grid: { rows: number; cols: number; cellWidth: number; cellHeight: number };
    frameCount: number;
  };
  animations: AtlasAnimation[];
}

export interface GenerateSpriteResponse {
  image: string; // data:image/png;base64,....
  atlas: AtlasJson;
}

export interface ApiErrorResponse {
  error: string;
}
