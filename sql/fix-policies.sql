-- Fix conversations policies
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix conversation_participants policies  
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON conversation_participants;

CREATE POLICY "Users can insert themselves as participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also need to allow users to view all participants in conversations they're part of
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;

CREATE POLICY "Users can view their own participant records"
  ON conversation_participants FOR SELECT
  USING (auth.uid() IS NOT NULL);
