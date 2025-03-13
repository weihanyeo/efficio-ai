import { SchedulePage } from "../components/SchedulePage";
import { RequireAuth } from "../components/auth/RequireAuth";

export default function Calendar() {
  return (
    <RequireAuth>
      <SchedulePage />
    </RequireAuth>
  );
}