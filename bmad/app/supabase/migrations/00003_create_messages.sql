-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for channel message lookups
CREATE INDEX idx_messages_channel_id ON messages (channel_id);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can select messages in channels they belong to
CREATE POLICY "messages_select_authenticated" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Authenticated users can insert messages in channels they belong to
CREATE POLICY "messages_insert_authenticated" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = messages.channel_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Instructors can delete any message
CREATE POLICY "messages_delete_instructor" ON messages
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );
