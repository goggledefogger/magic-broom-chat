-- Create gallery_cards table
CREATE TABLE gallery_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create card_comments table
CREATE TABLE card_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES gallery_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gallery_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- Gallery cards: authenticated can select in joined channels
CREATE POLICY "gallery_cards_select_authenticated" ON gallery_cards
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = gallery_cards.channel_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Gallery cards: authenticated can insert in joined channels
CREATE POLICY "gallery_cards_insert_authenticated" ON gallery_cards
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = gallery_cards.channel_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Gallery cards: instructors can delete any card
CREATE POLICY "gallery_cards_delete_instructor" ON gallery_cards
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );

-- Card comments: authenticated can select in joined channels
CREATE POLICY "card_comments_select_authenticated" ON card_comments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM gallery_cards
      JOIN channel_members ON channel_members.channel_id = gallery_cards.channel_id
      WHERE gallery_cards.id = card_comments.card_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Card comments: authenticated can insert in joined channels
CREATE POLICY "card_comments_insert_authenticated" ON card_comments
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM gallery_cards
      JOIN channel_members ON channel_members.channel_id = gallery_cards.channel_id
      WHERE gallery_cards.id = card_comments.card_id
        AND channel_members.user_id = auth.uid()
    )
  );

-- Card comments: instructors can delete any comment
CREATE POLICY "card_comments_delete_instructor" ON card_comments
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );
