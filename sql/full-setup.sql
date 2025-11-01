-- ============================================
-- COMPLETE SUPABASE SETUP FOR CHAT APPLICATION
-- ============================================

-- Step 1: Create enum for user roles
CREATE TYPE app_role AS ENUM ('candidate', 'employer', 'admin');

-- Step 2: Create all tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  company_logo TEXT,
  contact_details TEXT,
  skills TEXT[],
  disability_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  translated_text TEXT,
  target_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Step 4: Create utility functions
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Create SIMPLIFIED RLS Policies (to avoid recursion issues)
-- PROFILES
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- USER ROLES
CREATE POLICY "user_roles_select_policy" ON user_roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "user_roles_insert_policy" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- CONVERSATIONS: Allow all authenticated users
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE TO authenticated
  USING (true);

-- CONVERSATION_PARTICIPANTS: Allow all authenticated users
CREATE POLICY "participants_select_policy" ON conversation_participants
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "participants_insert_policy" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- MESSAGES: Allow all authenticated users
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Step 8: Create function to auto-populate profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger for auto-populating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Backfill existing users into profiles
INSERT INTO public.profiles (id, full_name)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) 
DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

-- Step 11: Create global conversation for public chat
INSERT INTO conversations (id) 
VALUES ('00000000-0000-0000-0000-000000000001') 
ON CONFLICT (id) DO NOTHING;

-- Step 12: Enable Realtime for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Next steps:
-- 1. Verify tables were created
-- 2. Test authentication and profile creation
-- 3. Test chat functionality
