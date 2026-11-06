"use client";

import type { StepProps } from "./types";
import { fieldClass, inputClass, labelClass } from "./styles";

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export function BasicsStep({ draft, onChange }: StepProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className={fieldClass}>
        <label htmlFor="displayName" className={labelClass}>
          Display name
        </label>
        <input
          id="displayName"
          type="text"
          maxLength={40}
          autoComplete="nickname"
          className={inputClass}
          value={draft.displayName}
          onChange={(e) => onChange({ displayName: e.target.value })}
        />
      </div>

      <div className={fieldClass}>
        <label htmlFor="age" className={labelClass}>
          Age
        </label>
        <input
          id="age"
          type="number"
          inputMode="numeric"
          min={13}
          max={100}
          className={inputClass}
          value={draft.age ?? ""}
          onChange={(e) => onChange({ age: parseNumber(e.target.value) })}
        />
      </div>
    </div>
  );
}
