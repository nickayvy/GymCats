"use client";

import { useState, useTransition } from "react";
import { completeOnboarding, saveProfile } from "@/app/onboarding/actions/profile";
import { STEP_SCHEMAS, firstIssue, type OnboardingDraft } from "@/lib/onboarding/schema";
import { BasicsStep } from "./BasicsStep";
import { BodyStep } from "./BodyStep";
import { GoalsStep } from "./GoalsStep";
import { PartnerStep } from "./PartnerStep";
import { PhotoStep } from "./PhotoStep";
import { errorClass, primaryButtonClass, secondaryButtonClass } from "./styles";
import { ButtonHint, Panel, TitleBanner } from "@/components/ui";

const TITLES = [
  "About you",
  "Your body",
  "Your goals",
  "Profile photo",
  "Your partner",
] as const;

// Small italic line above each step title, like a new-save screen.
const EYEBROWS = [
  "Name your hero",
  "Set your stats",
  "Choose your quest",
  "Pick a portrait",
  "Form your party",
] as const;

const TOTAL_STEPS = TITLES.length;
const PHOTO_STEP = 3;
const PARTNER_STEP = 4;

export function OnboardingWizard({
  configured,
  initialDisplayName,
  partnerName = null,
  inviteCode = null,
  resumeAtPartnerStep = false,
}: {
  configured: boolean;
  initialDisplayName: string;
  partnerName?: string | null;
  inviteCode?: string | null;
  /** The profile is saved but the partner step was never finished. */
  resumeAtPartnerStep?: boolean;
}): React.JSX.Element {
  const [step, setStep] = useState(resumeAtPartnerStep ? PARTNER_STEP : 0);
  const [draft, setDraft] = useState<OnboardingDraft>({
    displayName: initialDisplayName,
    age: null,
    heightCm: null,
    weightKg: null,
    goalPresets: [],
    goalFreeform: "",
    goalPlan: null,
    workoutsPerWeek: null,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  // Which way the step content slides in. Presentation only.
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  function onChange(patch: Partial<OnboardingDraft>): void {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  }

  function goBack(): void {
    setError(null);
    setDirection("back");
    setStep((s) => Math.max(0, s - 1));
  }

  function goNext(): void {
    setDirection("forward");
    if (step < PHOTO_STEP) {
      const result = STEP_SCHEMAS[step].safeParse(draft);
      if (!result.success) {
        setError(firstIssue(result.error));
        return;
      }
      setError(null);
      setStep(step + 1);
      return;
    }

    // Photo step: save the profile, then advance to the partner step.
    if (!configured) {
      setError(null);
      setStep(PARTNER_STEP);
      return;
    }

    const formData = new FormData();
    formData.set("draft", JSON.stringify(draft));
    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }

    startSaving(async () => {
      const result = await saveProfile(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setStep(PARTNER_STEP);
    });
  }

  function renderStep(): React.JSX.Element {
    switch (step) {
      case 0:
        return <BasicsStep draft={draft} onChange={onChange} />;
      case 1:
        return <BodyStep draft={draft} onChange={onChange} />;
      case 2:
        return <GoalsStep draft={draft} onChange={onChange} />;
      case PHOTO_STEP:
        return <PhotoStep file={avatarFile} onFileChange={setAvatarFile} />;
      default:
        return (
          <PartnerStep
            partnerName={partnerName}
            initialInviteCode={inviteCode}
            onFinish={() => {
              startSaving(async () => {
                await completeOnboarding();
              });
            }}
          />
        );
    }
  }

  const isPartnerStep = step === PARTNER_STEP;
  const nextLabel =
    step === PHOTO_STEP ? (saving ? "Saving…" : "Save profile") : "Next";

  return (
    <div className="relative z-10 flex w-full flex-col gap-5">
      <header className="flex flex-col items-center gap-4">
        <p className="gc-caps gc-fade">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <ol aria-label="Onboarding progress" className="ob-steps">
          {TITLES.map((title, i) => {
            const state = i < step ? "done" : i === step ? "current" : "upcoming";
            return (
              <li key={title} className="flex items-center" aria-current={i === step ? "step" : undefined}>
                {i > 0 ? <span aria-hidden="true" className="ob-step-link" data-done={i <= step || undefined} /> : null}
                <span className="ob-step" data-state={state} />
                <span className="sr-only">{`${title}${state === "done" ? " (done)" : ""}`}</span>
              </li>
            );
          })}
        </ol>
        <TitleBanner key={step} title={TITLES[step]} eyebrow={EYEBROWS[step]} size="md" />
      </header>

      <Panel className="px-4 py-6 sm:px-8 sm:py-8">
        <div key={step} className="ob-slide" data-dir={direction}>
          {renderStep()}
        </div>

        {error ? (
          <p role="alert" className={`${errorClass} gc-fade mt-5 flex items-center gap-2`}>
            <span aria-hidden="true">◆</span>
            {error}
          </p>
        ) : null}
      </Panel>

      {isPartnerStep ? null : (
        <footer className="flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className={`${secondaryButtonClass} min-w-28`}
            >
              <ButtonHint glyph="B" />
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className={`${primaryButtonClass} min-w-36`}
          >
            {nextLabel}
            <ButtonHint glyph="A" />
          </button>
        </footer>
      )}
    </div>
  );
}
