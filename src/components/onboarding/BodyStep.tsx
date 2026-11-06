"use client";

import { useState } from "react";
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from "@/lib/units";
import type { StepProps } from "./types";
import {
  chipClass,
  chipOffClass,
  chipOnClass,
  fieldClass,
  inputClass,
  labelClass,
} from "./styles";

type UnitSystem = "imperial" | "metric";

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

// Imperial text fields are seeded from the metric draft. Pounds are rounded to whole
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

  function selectUnits(next: UnitSystem): void {
    if (next === "imperial") {
      // Keep whatever the user typed if it still matches the metric draft; otherwise
      // (they edited metric in the meantime) re-derive the imperial text from the draft.
      const feet = parseNumber(heightText.feet);
      const inches = parseNumber(heightText.inches);
      const typedCm = feet === null || inches === null ? null : feetInchesToCm(feet, inches);
      if (typedCm !== draft.heightCm) setHeightText(heightTextFromCm(draft.heightCm));

      const lb = parseNumber(weightLbText);
      const typedKg = lb === null ? null : lbToKg(lb);
      if (typedKg !== draft.weightKg) setWeightLbText(weightTextFromKg(draft.weightKg));
    }
    onChange({ unitSystem: next });
  }

  const isImperial = draft.unitSystem === "imperial";
  const unitOptions: { value: UnitSystem; label: string }[] = [
    { value: "imperial", label: "Imperial (ft, lb)" },
    { value: "metric", label: "Metric (cm, kg)" },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className={fieldClass}>
        <span id="unitSystemLabel" className={labelClass}>
          Units
        </span>
        <div role="group" aria-labelledby="unitSystemLabel" className="flex gap-2">
          {unitOptions.map((option) => {
            const active = draft.unitSystem === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => selectUnits(option.value)}
                className={`${chipClass} ${active ? chipOnClass : chipOffClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {isImperial ? (
        <>
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
        </>
      ) : (
        <>
          <div className={fieldClass}>
            <label htmlFor="heightCm" className={labelClass}>
              Height (cm)
            </label>
            <input
              id="heightCm"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={100}
              max={250}
              className={inputClass}
              value={draft.heightCm ?? ""}
              onChange={(e) => onChange({ heightCm: parseNumber(e.target.value) })}
            />
          </div>

          <div className={fieldClass}>
            <label htmlFor="weightKg" className={labelClass}>
              Weight (kg)
            </label>
            <input
              id="weightKg"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={30}
              max={300}
              className={inputClass}
              value={draft.weightKg ?? ""}
              onChange={(e) => onChange({ weightKg: parseNumber(e.target.value) })}
            />
          </div>
        </>
      )}
    </div>
  );
}
