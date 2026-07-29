"use client";

import { useState } from "react";

interface Props {
  animationName: string;
  frameRate: number;
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

export function IntegrationGuide({ animationName, frameRate }: Props) {
  const [open, setOpen] = useState(false);

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
    <div className="space-y-2 border-t border-[var(--panel-border)] pt-3">
      <button type="button" onClick={() => setOpen((v) => !v)} className="game-label flex w-full items-center justify-between">
        <span>이 파일을 내 프로젝트에 적용하는 법</span>
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
