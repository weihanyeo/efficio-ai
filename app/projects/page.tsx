import { ProjectsPage } from "../components/ProjectsPage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Projects() {
  return (
    <RequireAuth>
      <ProjectsPage />
    </RequireAuth>
  );
}