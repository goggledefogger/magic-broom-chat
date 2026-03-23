-- Create reactions table
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  emoji TEXT NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  card_id UUID REFERENCES gallery_cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Exactly one of message_id or card_id must be non-null
  CONSTRAINT reactions_target_check CHECK (
    (message_id IS NOT NULL AND card_id IS NULL)
    OR (message_id IS NULL AND card_id IS NOT NULL)
  ),

  -- One reaction per user per emoji per target
  UNIQUE (user_id, emoji, message_id),
  UNIQUE (user_id, emoji, card_id)
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Authenticated can select all reactions
CREATE POLICY "reactions_select_authenticated" ON reactions
  FOR SELECT TO authenticated USING (true);

-- Authenticated can insert own reactions
CREATE POLICY "reactions_insert_authenticated" ON reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Authenticated can delete own reactions
CREATE POLICY "reactions_delete_own" ON reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());
