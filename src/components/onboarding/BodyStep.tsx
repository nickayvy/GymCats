"use client";

import { useState } from "react";
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from "@/lib/units";
import { RangeSlider } from "@/components/ui";
import type { StepProps } from "./types";
import { inputClass } from "./styles";

// Slider ranges. The number inputs stay the source of truth; the sliders just
// write the same text state, so any value the inputs accept still works.
const HEIGHT_MIN_IN = 48; // 4'0"
const HEIGHT_MAX_IN = 90; // 7'6"
const HEIGHT_REST_IN = 67;
const WEIGHT_MIN_LB = 70;
const WEIGHT_MAX_LB = 450;
const WEIGHT_REST_LB = 160;

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

  const feet = parseNumber(heightText.feet);
  const inches = parseNumber(heightText.inches);
  const totalInches = feet === null || inches === null ? null : feet * 12 + inches;
  const weightLb = parseNumber(weightLbText);

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Height" className="ob-stat gc-rise">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <span className="gc-label">Height</span>
          <span className="ob-readout" data-empty={totalInches === null || undefined}>
            {totalInches === null ? "—" : `${feet}′ ${inches}″`}
          </span>
        </div>
        <RangeSlider
          aria-label="Adjust height"
          aria-valuetext={
            totalInches === null ? undefined : `${Math.floor(totalInches / 12)} feet ${totalInches % 12} inches`
          }
          min={HEIGHT_MIN_IN}
          max={HEIGHT_MAX_IN}
          value={totalInches ?? HEIGHT_REST_IN}
          data-empty={totalInches === null || undefined}
          onValueChange={(total) =>
            updateHeightText({ feet: String(Math.floor(total / 12)), inches: String(total % 12) })
          }
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="gc-row ob-row">
            <label htmlFor="heightFeet">Height (ft)</label>
            <div>
              <input
                id="heightFeet"
                type="number"
                inputMode="numeric"
                min={0}
                max={8}
                placeholder="—"
                className={inputClass}
                value={heightText.feet}
                onChange={(e) => updateHeightText({ ...heightText, feet: e.target.value })}
              />
            </div>
          </div>
          <div className="gc-row ob-row">
            <label htmlFor="heightInches">Height (in)</label>
            <div>
              <input
                id="heightInches"
                type="number"
                inputMode="numeric"
                min={0}
                max={11}
                placeholder="—"
                className={inputClass}
                value={heightText.inches}
                onChange={(e) => updateHeightText({ ...heightText, inches: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Weight" className="ob-stat gc-rise" style={{ "--d": "90ms" } as React.CSSProperties}>
        <div className="flex items-baseline justify-between gap-3 px-1">
          <span className="gc-label">Weight</span>
          <span className="ob-readout" data-empty={weightLb === null || undefined}>
            {weightLb === null ? "—" : `${weightLb} lb`}
          </span>
        </div>
        <RangeSlider
          aria-label="Adjust weight"
          aria-valuetext={weightLb === null ? undefined : `${weightLb} pounds`}
          min={WEIGHT_MIN_LB}
          max={WEIGHT_MAX_LB}
          value={weightLb === null ? WEIGHT_REST_LB : Math.round(weightLb)}
          data-empty={weightLb === null || undefined}
          onValueChange={(lb) => updateWeightLbText(String(lb))}
        />
        <div className="gc-row ob-row">
          <label htmlFor="weightLb">Weight (lb)</label>
          <div>
            <input
              id="weightLb"
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
              className={inputClass}
              value={weightLbText}
              onChange={(e) => updateWeightLbText(e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
