import type { AtlasJson } from "./types";

/** A single-file HTML doc that plays the animation on open — no code, no server, works for non-developers. */
export function buildStandaloneHtmlPreview(imageDataUrl: string, atlas: AtlasJson): string {
  const anim = atlas.animations[0];
  const animationName = anim?.name ?? "animation";
  const frameRate = anim?.frameRate ?? 8;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>${animationName} 애니메이션 미리보기</title>
<style>
  body { margin:0; min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; background:#111; font-family:sans-serif; color:#eee; }
  canvas {
    image-rendering: pixelated;
    background:
      linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
    border: 1px solid #444;
    border-radius: 8px;
  }
  p { font-size: 14px; opacity: 0.8; }
</style>
</head>
<body>
  <canvas id="c"></canvas>
  <p>"${animationName}" 애니메이션 미리보기 (FPS: ${frameRate})</p>
  <script>
    const frames = ${JSON.stringify(atlas.frames)};
    const anim = ${JSON.stringify(anim)};
    const img = new Image();
    img.src = "${imageDataUrl}";
    const canvas = document.getElementById("c");
    const ctx = canvas.getContext("2d");
    let i = 0;
    img.onload = () => {
      const first = frames[anim.frames[0]].frame;
      canvas.width = first.w * 3;
      canvas.height = first.h * 3;
      setInterval(() => {
        const rect = frames[anim.frames[i]].frame;
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
        i = (i + 1) % anim.frames.length;
      }, 1000 / anim.frameRate);
    };
  </script>
</body>
</html>`;
}
