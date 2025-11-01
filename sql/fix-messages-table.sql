-- Drop the old messages table and recreate with correct schema
DROP TABLE IF EXISTS messages CASCADE;

-- Recreate messages table with correct columns
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT,
  target_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Enable Realtime
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
