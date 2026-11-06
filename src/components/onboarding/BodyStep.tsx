"use client";

import { useState } from "react";
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from "@/lib/units";
import type { StepProps } from "./types";
import { fieldClass, inputClass, labelClass } from "./styles";

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

// The draft stores metric; these imperial text fields are seeded from it. Pounds are rounded to whole
// numbers so that 160 lb -> 72.6 kg -> 160 lb survives a remount (kgToLb(72.6) is 160.1).
function heightTextFromCm(cm: number | null): { feet: string; inches: string } {
  if (cm === null) return { feet: "", inches: "" };
  const { feet, inches } = cmToFeetInches(cm);
  return { feet: String(feet), inches: String(inches) };
}

function weightTextFromKg(kg: number | null): string {
  return kg === null ? "" : String(Math.round(kgToLb(kg)));
}

export function BodyStep({ draft, onChange }: StepProps): React.JSX.Element {
  const [heightText, setHeightText] = useState(() => heightTextFromCm(draft.heightCm));
  const [weightLbText, setWeightLbText] = useState(() => weightTextFromKg(draft.weightKg));

  function updateHeightText(next: { feet: string; inches: string }): void {
    setHeightText(next);
    const feet = parseNumber(next.feet);
    const inches = parseNumber(next.inches);
    onChange({ heightCm: feet === null || inches === null ? null : feetInchesToCm(feet, inches) });
  }

  function updateWeightLbText(next: string): void {
    setWeightLbText(next);
    const lb = parseNumber(next);
    onChange({ weightKg: lb === null ? null : lbToKg(lb) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4">
        <div className={fieldClass}>
          <label htmlFor="heightFeet" className={labelClass}>
            Height (ft)
          </label>
          <input
            id="heightFeet"
            type="number"
            inputMode="numeric"
            min={0}
            max={8}
            className={inputClass}
            value={heightText.feet}
            onChange={(e) => updateHeightText({ ...heightText, feet: e.target.value })}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="heightInches" className={labelClass}>
            Height (in)
          </label>
          <input
            id="heightInches"
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            className={inputClass}
            value={heightText.inches}
            onChange={(e) => updateHeightText({ ...heightText, inches: e.target.value })}
          />
        </div>
      </div>

      <div className={fieldClass}>
        <label htmlFor="weightLb" className={labelClass}>
          Weight (lb)
        </label>
        <input
          id="weightLb"
          type="number"
          inputMode="decimal"
          step="0.1"
          className={inputClass}
          value={weightLbText}
          onChange={(e) => updateWeightLbText(e.target.value)}
        />
      </div>
    </div>
  );
}
