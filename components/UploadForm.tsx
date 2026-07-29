"use client";

import { useState } from "react";
import { SliceForm } from "./SliceForm";
import type { GenerateSpriteResponse } from "@/lib/types";

interface Props {
  onResult: (result: GenerateSpriteResponse) => void;
}

export function UploadForm({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <div className="game-panel space-y-4 p-5">
      <p className="text-xs text-[var(--muted)]">
        AI 없이, 이미 갖고 있는 스프라이트 시트 이미지를 격자로 잘라 애니메이션으로 재생합니다.
      </p>

      <div>
        <label className="game-label mb-1 block" htmlFor="sheet-file">
          스프라이트 시트 이미지
        </label>
        <input
          id="sheet-file"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full text-sm text-[var(--muted)] file:mr-3 file:rounded file:border-0 file:bg-[var(--accent-cyan)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-black"
        />
      </div>

      {file && <SliceForm image={file} onResult={onResult} />}
    </div>
  );
}
