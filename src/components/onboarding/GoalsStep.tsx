"use client";

import { useState, useTransition } from "react";
import { generateGoalPlan } from "@/app/onboarding/actions/goalPlan";
import { GOAL_PRESETS, type GoalPresetId } from "@/lib/onboarding/schema";
import type { StepProps } from "./types";
import {
  chipClass,
  chipOffClass,
  chipOnClass,
  errorClass,
  fieldClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "./styles";

const MAX_PRESETS = 4;
const MIN_FREEFORM_LENGTH = 10;
const MAX_FREEFORM_LENGTH = 1000;

export function GoalsStep({ draft, onChange }: StepProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const atPresetLimit = draft.goalPresets.length >= MAX_PRESETS;

  function togglePreset(id: GoalPresetId) {
    const selected = draft.goalPresets.includes(id);
    onChange({
      goalPresets: selected
        ? draft.goalPresets.filter((p) => p !== id)
        : [...draft.goalPresets, id],
    });
  }

  function buildPlan() {
    setError(null);
    startTransition(async () => {
      const result = await generateGoalPlan({
        goalFreeform: draft.goalFreeform,
        goalPresets: draft.goalPresets,
        age: draft.age,
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        healthNotes: draft.healthNotes,
        weeklyFreeMinutes: draft.weeklyFreeMinutes,
      });
      if (result.ok) {
        onChange({ goalPlan: result.data });
      } else {
        setError(result.error);
      }
    });
  }

  const plan = draft.goalPlan;

  return (
    <div className="flex flex-col gap-6">
      <fieldset className={fieldClass}>
        <legend className={labelClass}>Pick your goals (up to 4)</legend>
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((preset) => {
            const on = draft.goalPresets.includes(preset.id);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={on}
                disabled={!on && atPresetLimit}
                onClick={() => togglePreset(preset.id)}
                className={`${chipClass} ${on ? chipOnClass : chipOffClass} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className={fieldClass}>
        <label htmlFor="workoutsPerWeek" className={labelClass}>
          Workouts per week
        </label>
        <select
          id="workoutsPerWeek"
          className={inputClass}
          value={draft.workoutsPerWeek ?? ""}
          onChange={(e) =>
            onChange({
              workoutsPerWeek:
                e.target.value === "" ? null : Number(e.target.value),
            })
          }
        >
          <option value="" disabled>
            Choose…
          </option>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {`${n} × per week`}
            </option>
          ))}
        </select>
      </div>

      <div className={fieldClass}>
        <label htmlFor="goalFreeform" className={labelClass}>
          Or describe it in your own words
        </label>
        <textarea
          id="goalFreeform"
          rows={4}
          maxLength={MAX_FREEFORM_LENGTH}
          placeholder="e.g. I want to run a 5K by spring and feel stronger carrying groceries"
          className={inputClass}
          value={draft.goalFreeform}
          onChange={(e) => onChange({ goalFreeform: e.target.value })}
        />
        <p className="self-end text-xs text-foreground/50">
          {`${draft.goalFreeform.length}/${MAX_FREEFORM_LENGTH}`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={
            pending || draft.goalFreeform.trim().length < MIN_FREEFORM_LENGTH
          }
          onClick={buildPlan}
        >
          {pending ? "Thinking…" : "Build my plan with AI"}
        </button>
        {error ? (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}
      </div>

      {plan ? (
        <div className="rounded-xl border border-accent/30 bg-card/60 p-4 text-left">
          <p className="text-sm text-foreground/90">{plan.summary}</p>
          <ul className="mt-3 flex flex-col gap-1 text-sm text-foreground/80">
            {plan.weeklyPlan.map((item, i) => (
              <li key={`${item.day}-${i}`}>
                {`${item.day} — ${item.focus} (${item.durationMinutes} min)`}
              </li>
            ))}
          </ul>
          {plan.tips.length > 0 ? (
            <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-sm text-foreground/70">
              {plan.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className={`${secondaryButtonClass} mt-4`}
            onClick={() =>
              onChange({
                goalPresets: plan.recommendedPresets,
                workoutsPerWeek: plan.workoutsPerWeek,
              })
            }
          >
            Use these suggestions
          </button>
        </div>
      ) : null}
    </div>
  );
}
