import { DashboardPage } from "../components/DashboardPage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Dashboard() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  );
}