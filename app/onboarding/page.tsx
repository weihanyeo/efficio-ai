import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import { RequireAuth } from "../components/auth/RequireAuth";
import { FirstTimeNewbie } from "../components/auth/FirstTimeNewbie";

export default function Onboarding() {
  return (
    <RequireAuth>
      <FirstTimeNewbie>
        <OnboardingFlow />
      </FirstTimeNewbie>
    </RequireAuth>
  );
}