-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE card_comments;
