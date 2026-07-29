"use client";

import { useState } from "react";
import type { AtlasJson } from "@/lib/types";
import { downloadBlob } from "@/lib/download";
import { buildStandaloneHtmlPreview } from "@/lib/standaloneHtml";

interface Props {
  image: string;
  atlas: AtlasJson;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="game-button-ghost absolute right-2 top-2 text-xs"
      >
        {copied ? "복사됨!" : "복사"}
      </button>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 pr-16 font-mono text-xs text-[var(--muted)]">
        {code}
      </pre>
    </div>
  );
}

export function IntegrationGuide({ image, atlas }: Props) {
  const [open, setOpen] = useState(false);
  const animationName = atlas.animations[0]?.name ?? "animation";
  const frameRate = atlas.animations[0]?.frameRate ?? 8;

  function handleDownloadPreview() {
    const html = buildStandaloneHtmlPreview(image, atlas);
    downloadBlob(new Blob([html], { type: "text/html" }), `${animationName}-preview.html`);
  }

  const phaserCode = `// preload()
this.load.atlas('${animationName}', 'sprite-sheet.png', 'sprite-sheet.json');

// create()
this.anims.create({
  key: '${animationName}',
  frames: this.anims.generateFrameNames('${animationName}'),
  frameRate: ${frameRate},
  repeat: -1,
});
const sprite = this.add.sprite(x, y, '${animationName}');
sprite.play('${animationName}');`;

  const canvasCode = `const img = new Image();
img.src = 'sprite-sheet.png';
const atlas = await fetch('sprite-sheet.json').then((r) => r.json());
const anim = atlas.animations[0];

let frameIndex = 0;
setInterval(() => {
  frameIndex = (frameIndex + 1) % anim.frames.length;
  const rect = atlas.frames[anim.frames[frameIndex]].frame;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
}, 1000 / anim.frameRate);`;

  return (
    <div className="space-y-3 border-t border-[var(--panel-border)] pt-3">
      <div className="space-y-1">
        <p className="game-label">내 프로젝트에 적용하기</p>
        <p className="text-xs text-[var(--muted)]">
          아래 파일을 다운로드해서 더블클릭하면, 코드를 몰라도 브라우저에서 바로 애니메이션을 확인할 수 있어요.
        </p>
      </div>
      <button type="button" onClick={handleDownloadPreview} className="game-button w-full">
        코드 없이 바로 확인하기 (HTML 다운로드)
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="game-label flex w-full items-center justify-between pt-1"
      >
        <span>개발자용 코드 보기 (Phaser 3 / 순수 Canvas)</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-3 text-xs text-[var(--muted)]">
          <p>
            PNG는 시트 이미지, JSON은 각 프레임 좌표(<code>frames</code>)와 재생 순서(<code>animations</code>)가 담긴
            Phaser 텍스처 아틀라스 포맷입니다. 두 파일을 같은 폴더에 두고 아래처럼 불러오면 됩니다.
          </p>
          <div>
            <p className="game-label mb-1">Phaser 3</p>
            <CodeBlock code={phaserCode} />
          </div>
          <div>
            <p className="game-label mb-1">Phaser 없이 순수 Canvas</p>
            <CodeBlock code={canvasCode} />
          </div>
        </div>
      )}
    </div>
  );
}
