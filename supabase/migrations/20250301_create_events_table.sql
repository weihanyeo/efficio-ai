-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  description TEXT,
  type TEXT NOT NULL,
  color TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event organizers table
CREATE TABLE IF NOT EXISTS event_organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'organizer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event agenda items table
CREATE TABLE IF NOT EXISTS event_agenda_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  speaker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event checklist items table
CREATE TABLE IF NOT EXISTS event_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security

CREATE POLICY "Users can insert their own events" 
ON events FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON events FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON events FOR DELETE 
USING (auth.uid() = user_id);

-- Event organizers policies
CREATE POLICY "Anyone can view event organizers" 
ON event_organizers FOR SELECT USING (true);

CREATE POLICY "Event owners can insert organizers" 
ON event_organizers FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);

CREATE POLICY "Event owners can delete organizers" 
ON event_organizers FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);

-- Event attendees policies
CREATE POLICY "Anyone can view event attendees" 
ON event_attendees FOR SELECT USING (true);

CREATE POLICY "Event owners can insert attendees" 
ON event_attendees FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);

CREATE POLICY "Attendees can update their own status" 
ON event_attendees FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Event owners can delete attendees" 
ON event_attendees FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);

-- Event agenda items policies
CREATE POLICY "Anyone can view event agenda items" 
ON event_agenda_items FOR SELECT USING (true);

CREATE POLICY "Event owners can manage agenda items" 
ON event_agenda_items 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);

-- Event checklist items policies
CREATE POLICY "Anyone can view event checklist items" 
ON event_checklist_items FOR SELECT USING (true);

CREATE POLICY "Event owners can manage checklist items" 
ON event_checklist_items 
USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = event_id AND events.user_id = auth.uid()
  )
);