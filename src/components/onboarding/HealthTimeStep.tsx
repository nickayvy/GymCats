"use client";

import { FREE_TIME_OPTIONS } from "@/lib/onboarding/schema";
import type { StepProps } from "./types";
import { fieldClass, inputClass, labelClass } from "./styles";

export function HealthTimeStep({ draft, onChange }: StepProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className={fieldClass}>
        <label htmlFor="healthNotes" className={labelClass}>
          Health notes
        </label>
        <textarea
          id="healthNotes"
          rows={4}
          maxLength={500}
          placeholder="Injuries, conditions, or anything we should keep in mind (optional)"
          className={inputClass}
          value={draft.healthNotes}
          onChange={(e) => onChange({ healthNotes: e.target.value })}
        />
        <p className="text-xs text-foreground/50">
          Shared only with your partner. Not medical advice.
        </p>
      </div>

      <div className={fieldClass}>
        <label htmlFor="weeklyFreeMinutes" className={labelClass}>
          Free time each week
        </label>
        <select
          id="weeklyFreeMinutes"
          className={inputClass}
          value={draft.weeklyFreeMinutes ?? ""}
          onChange={(e) =>
            onChange({ weeklyFreeMinutes: e.target.value === "" ? null : Number(e.target.value) })
          }
        >
          <option value="" disabled>
            Choose…
          </option>
          {FREE_TIME_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {`${minutes / 60} hr${minutes === 60 ? "" : "s"} / week`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
