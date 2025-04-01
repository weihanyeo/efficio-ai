-- Create event_notifications table to track sent notifications
CREATE TABLE IF NOT EXISTS event_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('upcoming', 'reminder', 'cancelled', 'updated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure we don't send duplicate notifications of the same type for the same event to the same user
  UNIQUE(event_id, user_id, type)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_notifications_event_id ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_user_id ON event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_type ON event_notifications(type);

-- Add comment to table
COMMENT ON TABLE event_notifications IS 'Tracks notifications sent to users about events';

-- Enable Row Level Security
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for event_notifications table
-- Policy for selecting notifications: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON event_notifications FOR SELECT
USING (user_id = auth.uid());

-- Policy for inserting notifications: Service role can create notifications
CREATE POLICY "Service role can create notifications"
ON event_notifications FOR INSERT
WITH CHECK (true);

-- Policy for updating notifications: Service role can update notifications
CREATE POLICY "Service role can update notifications"
ON event_notifications FOR UPDATE
USING (true);
