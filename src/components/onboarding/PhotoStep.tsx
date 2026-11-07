"use client";

import { useEffect, useState } from "react";
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
      <div className="flex flex-col items-center gap-4">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not optimizable
          <img
            src={previewUrl}
            alt="Your profile photo preview"
            width={128}
            height={128}
            className="h-32 w-32 rounded-full border-2 border-accent/40 object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-accent/40 font-mono text-xs uppercase tracking-widest text-foreground/50">
            No photo
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <label htmlFor="avatar" className={`${secondaryButtonClass} cursor-pointer`}>
            {file ? "Choose another photo" : "Choose a photo"}
          </label>
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleSelect}
            className="sr-only"
          />
          {file ? (
            <button type="button" onClick={handleRemove} className={secondaryButtonClass}>
              Remove photo
            </button>
          ) : null}
        </div>
      </div>

      <div className={fieldClass}>
        <span className={labelClass}>Profile photo</span>
        <p className="text-sm text-foreground/60">Optional — you can add one later.</p>
      </div>

      {error ? (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
