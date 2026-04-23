-- Gallery cards: authenticated can update their own cards
CREATE POLICY "gallery_cards_update_owner" ON gallery_cards
  FOR UPDATE TO authenticated USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );
