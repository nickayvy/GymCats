"use client";

import { RangeSlider } from "@/components/ui";
import type { StepProps } from "./types";
import { inputClass } from "./styles";

const AGE_MIN = 13;
const AGE_MAX = 100;
// Where the age slider rests before an age is entered.
const AGE_REST = 30;

function parseNumber(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isNaN(value) ? null : value;
}

export function BasicsStep({ draft, onChange }: StepProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="gc-row ob-row gc-rise">
        <label htmlFor="displayName">Display name</label>
        <div>
          <input
            id="displayName"
            type="text"
            maxLength={40}
            autoComplete="nickname"
            placeholder="Your hero's name"
            className={inputClass}
            value={draft.displayName}
            onChange={(e) => onChange({ displayName: e.target.value })}
          />
        </div>
      </div>

      <div className="ob-stat gc-rise" style={{ "--d": "90ms" } as React.CSSProperties}>
        <div className="gc-row ob-row">
          <label htmlFor="age">Age</label>
          <div>
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={AGE_MIN}
              max={AGE_MAX}
              placeholder="—"
              className={inputClass}
              value={draft.age ?? ""}
              onChange={(e) => onChange({ age: parseNumber(e.target.value) })}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 px-1">
          <span aria-hidden="true" className="gc-caps gc-num w-6 text-left">
            {AGE_MIN}
          </span>
          <RangeSlider
            aria-label="Adjust age"
            min={AGE_MIN}
            max={AGE_MAX}
            value={draft.age ?? AGE_REST}
            data-empty={draft.age === null || undefined}
            onValueChange={(age) => onChange({ age })}
          />
          <span aria-hidden="true" className="gc-caps gc-num w-6 text-right">
            {AGE_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
