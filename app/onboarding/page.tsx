import { OnboardingFlow } from "../components/onboarding/OnboardingFlow";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Onboarding() {
  return (
    <RequireAuth>
      <OnboardingFlow />
    </RequireAuth>
  );
}