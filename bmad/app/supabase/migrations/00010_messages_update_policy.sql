-- Allow users to edit their own messages
CREATE POLICY "messages_update_own" ON messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
