-- Create a simplified invites table without complex triggers or RLS
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
GRANT ALL ON simple_workspace_invites TO authenticated, anon;
