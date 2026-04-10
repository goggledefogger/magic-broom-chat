-- Provenance table for imported content (Meet chat backfill, future sources).
-- Each row points to exactly one of (message, gallery_card).
-- source_fingerprint UNIQUE gives idempotency for re-runs.

CREATE TABLE message_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  gallery_card_id UUID REFERENCES gallery_cards(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  session_date DATE NOT NULL,
  original_author_raw TEXT NOT NULL,
  original_timestamp_raw TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL UNIQUE,
  import_batch_id TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((message_id IS NOT NULL) <> (gallery_card_id IS NOT NULL))
);

CREATE INDEX idx_message_imports_session_date ON message_imports (session_date);
CREATE INDEX idx_message_imports_source ON message_imports (source);
CREATE INDEX idx_message_imports_batch ON message_imports (import_batch_id);

ALTER TABLE message_imports ENABLE ROW LEVEL SECURITY;

-- Only instructors can read provenance. Students do not need visibility.
CREATE POLICY "message_imports_select_instructor" ON message_imports
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );
