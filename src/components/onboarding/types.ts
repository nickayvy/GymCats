import type { OnboardingDraft } from "@/lib/onboarding/schema";

export interface StepProps {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}
