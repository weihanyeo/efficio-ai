import { TeamPage } from "../components/TeamPage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Team() {
  return (
    <RequireAuth>
      <TeamPage />
    </RequireAuth>
  );
}