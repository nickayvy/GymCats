"use client";

import { useEffect, useState } from "react";
import { CAT_SPRITES, PixelSprite } from "@/components/sprites";
import { ItemSlot } from "@/components/ui";
import { fieldClass, errorClass, labelClass, secondaryButtonClass } from "./styles";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface PhotoStepProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export function PhotoStep({ file, onFileChange }: PhotoStepProps): React.JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>): void {
    const selected = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!selected) return;

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Photo must be a JPEG, PNG or WebP image.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Photo must be 5 MB or smaller.");
      return;
    }

    setError(null);
    onFileChange(selected);
  }

  function handleRemove(): void {
    setError(null);
    onFileChange(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-5">
        <div className="gc-rise flex flex-col items-center gap-2">
          <ItemSlot size={144} selected={previewUrl !== null} className="ob-portrait">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not optimizable
              <img
                src={previewUrl}
                alt="Your profile photo preview"
                width={128}
                height={128}
                className="gc-pop h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <PixelSprite
                  sheet={CAT_SPRITES.siamese}
                  scale={3}
                  label=""
                  className="opacity-60 grayscale"
                />
                <span className="gc-caps">No photo</span>
              </div>
            )}
          </ItemSlot>
          <span aria-hidden="true" className="gc-sprite-shadow" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* The input comes first so its focus ring can show on the label next to it. */}
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelect}
            className="ob-file sr-only"
          />
          <label htmlFor="avatar" className={`${secondaryButtonClass} cursor-pointer`}>
            <span aria-hidden="true">◆</span>
            {file ? "Choose another photo" : "Choose a photo"}
          </label>
          {file ? (
            <button type="button" onClick={handleRemove} className={`${secondaryButtonClass} gc-btn-ghost`}>
              Remove photo
            </button>
          ) : null}
        </div>
      </div>

      <div className={`${fieldClass} items-center text-center`}>
        <span className={labelClass}>Profile photo</span>
        <p className="text-sm italic text-white/60">Optional — you can add one later.</p>
      </div>

      {error ? (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
