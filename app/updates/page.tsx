import { ProjectUpdatesPage } from "../components/ProjectUpdatesPage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function UpdatesPage() {
  return (
    <RequireAuth>
      <ProjectUpdatesPage />
    </RequireAuth>
  );
}