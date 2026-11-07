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

const TITLES = [
  "About you",
  "Your body",
  "Your goals",
  "Profile photo",
  "Your partner",
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

  function onChange(patch: Partial<OnboardingDraft>): void {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  }

  function goBack(): void {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function goNext(): void {
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
    <div className="title-card relative z-10 flex w-full max-w-xl flex-col gap-6 rounded-2xl px-6 py-8 sm:px-10">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-accent/80">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <h1 className="text-2xl font-bold">{TITLES[step]}</h1>
        <div className="h-1 w-full rounded bg-accent/15">
          <div
            className="h-1 rounded bg-accent"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      {renderStep()}

      {error ? (
        <p role="alert" className={errorClass}>
          {error}
        </p>
      ) : null}

      {isPartnerStep ? null : (
        <footer className="flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className={secondaryButtonClass}
            >
              Back
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className={primaryButtonClass}
          >
            {nextLabel}
          </button>
        </footer>
      )}
    </div>
  );
}
