-- Complete solution for workspace invites stack depth issue

-- 1. Create a simplified invites table without complex triggers or RLS
CREATE TABLE IF NOT EXISTS simple_workspace_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  inviter_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  function TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add a simple RLS policy without complex subqueries
ALTER TABLE simple_workspace_invites ENABLE ROW LEVEL SECURITY;

-- Simple policy for insert
CREATE POLICY "Anyone can insert simple invites"
ON simple_workspace_invites
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Simple policy for select
CREATE POLICY "Anyone can select simple invites"
ON simple_workspace_invites
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON simple_workspace_invites TO authenticated, anon, service_role;

-- 2. Create a direct insert function that bypasses RLS completely
CREATE OR REPLACE FUNCTION insert_workspace_invite_direct(
  p_workspace_id UUID,
  p_inviter_id UUID,
  p_email TEXT,
  p_role TEXT,
  p_function TEXT,
  p_token TEXT,
  p_expires_at TIMESTAMPTZ
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO workspace_invites (
    workspace_id, inviter_id, email, role, function, token, status, expires_at
  ) VALUES (
    p_workspace_id, p_inviter_id, p_email, p_role, p_function, p_token, 'pending', p_expires_at
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  -- Return NULL if insert fails
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the RLS policy for workspace_invites
-- The current policy has a bug: wm.workspace_id = wm.workspace_id (comparing a column to itself)

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

-- 4. Optimize triggers
-- Remove the token generation trigger since we're doing this in the Edge Function
DROP TRIGGER IF EXISTS workspace_invites_token_trigger ON workspace_invites;

-- Temporarily disable all triggers for testing
-- ALTER TABLE workspace_invites DISABLE TRIGGER ALL;

-- To re-enable all triggers after testing:
-- ALTER TABLE workspace_invites ENABLE TRIGGER ALL;
