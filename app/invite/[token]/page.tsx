'use client';

import { InvitePage } from "../../../components/InvitePage";
import { RequireAuth } from "../../../components/auth/RequireAuth";
import { useParams } from "next/navigation";

export default function Invite() {
  const params = useParams();
  const token = params.token as string;
  
  return (
    <RequireAuth>
      <InvitePage token={token} />
    </RequireAuth>
  );
}