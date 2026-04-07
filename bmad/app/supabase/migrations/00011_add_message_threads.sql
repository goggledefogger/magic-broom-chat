-- Add threading support: parent_id references the root message
ALTER TABLE messages ADD COLUMN parent_id UUID REFERENCES messages(id) ON DELETE CASCADE;

-- Index for fetching thread replies
CREATE INDEX idx_messages_parent_id ON messages (parent_id) WHERE parent_id IS NOT NULL;
