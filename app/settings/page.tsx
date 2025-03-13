import { SettingsPage } from "../components/SettingsPage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Settings() {
  return (
    <RequireAuth>
      <SettingsPage />
    </RequireAuth>
  );
}