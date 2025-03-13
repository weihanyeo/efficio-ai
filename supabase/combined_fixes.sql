-- Combined fixes for workspace_invites stack depth issue

-- 1. Fix the RLS policy for workspace_invites
-- The current policy has a bug: wm.workspace_id = wm.workspace_id (comparing a column to itself)
-- This is likely causing infinite recursion or excessive stack usage

-- Drop the existing policies
DROP POLICY IF EXISTS "Workspace admins can create invites" ON workspace_invites;
DROP POLICY IF EXISTS "Workspace admins can update invites" ON workspace_invites;
DROP POLICY IF EXISTS "Workspace members can view invites" ON workspace_invites;

-- Recreate the policies with correct conditions
CREATE POLICY "Workspace admins can create invites"
ON workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_invites.workspace_id
    AND wm.member_id = auth.uid()
    AND wm.role = 'Admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_invites.workspace_id
    AND w.owner_id = auth.uid()
  )
);

CREATE POLICY "Workspace admins can update invites"
ON workspace_invites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_invites.workspace_id
    AND wm.member_id = auth.uid()
    AND wm.role = 'Admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_invites.workspace_id
    AND w.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_invites.workspace_id
    AND wm.member_id = auth.uid()
    AND wm.role = 'Admin'
  )
  OR
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_invites.workspace_id
    AND w.owner_id = auth.uid()
  )
);

CREATE POLICY "Workspace members can view invites"
ON workspace_invites
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.workspace_id = workspace_invites.workspace_id
    AND wm.member_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.id = workspace_invites.workspace_id
    AND w.owner_id = auth.uid()
  )
);

-- 2. Optimize triggers
-- Remove the token generation trigger since we're doing this in the Edge Function
DROP TRIGGER IF EXISTS workspace_invites_token_trigger ON workspace_invites;

-- Optional: Temporarily disable all triggers for testing
-- ALTER TABLE workspace_invites DISABLE TRIGGER ALL;

-- To re-enable all triggers after testing:
-- ALTER TABLE workspace_invites ENABLE TRIGGER ALL;
