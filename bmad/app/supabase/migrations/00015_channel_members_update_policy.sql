-- Allow users to update their own channel_members row (needed to persist last_read_at)
CREATE POLICY "channel_members_update_own" ON channel_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
