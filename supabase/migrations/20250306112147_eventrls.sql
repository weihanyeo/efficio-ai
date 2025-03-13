-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
-- Policy for selecting events: Users can view events in their workspace
CREATE POLICY "Users can view workspace events"
ON events FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE member_id = auth.uid()
  )
);

-- Policy for inserting events: Users can create events in their workspace
CREATE POLICY "Users can create workspace events"
ON events FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE member_id = auth.uid()
  )
);

-- Policy for updating events: Users can update events in their workspace
CREATE POLICY "Users can update workspace events"
ON events FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE member_id = auth.uid()
  )
)
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE member_id = auth.uid()
  )
);

-- Policy for deleting events: Users can delete events in their workspace
CREATE POLICY "Users can delete workspace events"
ON events FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id 
    FROM workspace_members 
    WHERE member_id = auth.uid()
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;