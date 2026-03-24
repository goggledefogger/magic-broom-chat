-- Add foreign keys from user_id columns to profiles table
-- This enables PostgREST embedded joins like profiles(display_name, avatar_url)

ALTER TABLE messages
  ADD CONSTRAINT messages_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE gallery_cards
  ADD CONSTRAINT gallery_cards_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE card_comments
  ADD CONSTRAINT card_comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);

ALTER TABLE reactions
  ADD CONSTRAINT reactions_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id);
