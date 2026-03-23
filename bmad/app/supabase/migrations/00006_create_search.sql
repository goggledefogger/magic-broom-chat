-- Add search vector column to messages
ALTER TABLE messages
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Add search vector column to gallery_cards
ALTER TABLE gallery_cards
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;

-- GIN indexes for full-text search
CREATE INDEX idx_messages_search_vector ON messages USING GIN (search_vector);
CREATE INDEX idx_gallery_cards_search_vector ON gallery_cards USING GIN (search_vector);
