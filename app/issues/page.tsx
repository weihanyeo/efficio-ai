import { MainContent } from "../components/MainContent";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Issues() {
  return (
    <RequireAuth>
      <MainContent />
    </RequireAuth>
  );
}