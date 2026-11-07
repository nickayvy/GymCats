"use client";

import { useState, useTransition } from "react";
import { generateGoalPlan } from "@/app/onboarding/actions/goalPlan";
import { GOAL_PRESETS, type GoalPresetId } from "@/lib/onboarding/schema";
import { Diamond } from "@/components/ui";
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
      <fieldset className={`${fieldClass} gc-rise`}>
        <legend className={`${labelClass} mb-2 flex w-full items-baseline justify-between gap-3`}>
          Pick your goals (up to 4)
          <span aria-hidden="true" className="gc-caps gc-num not-italic">
            {`${draft.goalPresets.length}/${MAX_PRESETS}`}
          </span>
        </legend>
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
                <Diamond className={on ? "text-glow" : "text-white/30"} />
                {preset.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="gc-row ob-row gc-rise" style={{ "--d": "80ms" } as React.CSSProperties}>
        <label htmlFor="workoutsPerWeek">Workouts per week</label>
        <div>
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
      </div>

      <div className={`${fieldClass} gc-rise`} style={{ "--d": "160ms" } as React.CSSProperties}>
        <label htmlFor="goalFreeform" className={labelClass}>
          Or describe it in your own words
        </label>
        <textarea
          id="goalFreeform"
          rows={4}
          maxLength={MAX_FREEFORM_LENGTH}
          placeholder="e.g. I want to run a 5K by spring and feel stronger carrying groceries"
          className={`${inputClass} resize-y leading-relaxed`}
          value={draft.goalFreeform}
          onChange={(e) => onChange({ goalFreeform: e.target.value })}
        />
        <p className="gc-caps gc-num self-end">
          {`${draft.goalFreeform.length}/${MAX_FREEFORM_LENGTH}`}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          className={`${secondaryButtonClass} gc-btn-glow`}
          disabled={
            pending || draft.goalFreeform.trim().length < MIN_FREEFORM_LENGTH
          }
          onClick={buildPlan}
        >
          <span aria-hidden="true">✦</span>
          {pending ? "Thinking…" : "Build my plan with AI"}
        </button>
        {error ? (
          <p role="alert" className={errorClass}>
            {error}
          </p>
        ) : null}
      </div>

      {plan ? (
        <div className="gc-rise rounded-sm border border-white/15 bg-black/45 p-4 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.5)]">
          <p className="gc-label mb-2 flex items-center gap-2" style={{ color: "var(--glow)" }}>
            Your suggested plan
          </p>
          <p className="text-sm italic leading-relaxed text-ink">{plan.summary}</p>
          <ul className="mt-4 flex flex-col gap-1">
            {plan.weeklyPlan.map((item, i) => (
              <li
                key={`${item.day}-${i}`}
                className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 rounded-[3px] bg-white/[0.06] px-3 py-2 text-sm"
              >
                <span className="gc-caps" style={{ color: "var(--glow)" }}>
                  {item.day}
                </span>
                <span className="sr-only"> — </span>
                <span className="italic text-ink">{item.focus}</span>
                <span className="gc-num font-mono text-xs text-white/65">{`${item.durationMinutes} min`}</span>
              </li>
            ))}
          </ul>
          {plan.tips.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-1.5 text-sm italic text-white/70">
              {plan.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <Diamond className="mt-1.5 shrink-0 text-gold" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className={`${secondaryButtonClass} gc-btn-sm mt-4`}
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
