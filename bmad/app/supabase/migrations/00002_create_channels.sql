-- Create channel type enum
CREATE TYPE channel_type AS ENUM ('standard', 'gallery');

-- Create channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type channel_type NOT NULL DEFAULT 'standard',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create channel_members table
CREATE TABLE channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, user_id)
);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Channels policies
CREATE POLICY "channels_select_authenticated" ON channels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "channels_insert_authenticated" ON channels
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "channels_update_instructor" ON channels
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );

CREATE POLICY "channels_delete_instructor" ON channels
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );

-- Channel members policies
CREATE POLICY "channel_members_select_own" ON channel_members
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "channel_members_insert_own" ON channel_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "channel_members_delete_own" ON channel_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());
