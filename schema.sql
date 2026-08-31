-- ==============================================================================
-- CHATLY SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Run this in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/_/sql
-- 2. Click "New query"
-- 3. Paste this script and click "Run"
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  profile_photo TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  bio TEXT DEFAULT 'Exploring connections nearby.',
  interests TEXT[] DEFAULT ARRAY['🏎️ F1', '💻 Coding'],
  current_status TEXT DEFAULT '👋 Just saying hi',
  social_availability TEXT DEFAULT 'open' CHECK (social_availability IN ('open', 'maybe', 'busy')),
  is_discoverable BOOLEAN DEFAULT true,
  ghost_mode BOOLEAN DEFAULT false,
  session_duration_type TEXT DEFAULT '1h' CHECK (session_duration_type IN ('30m', '1h', 'until_off')),
  location_session_expires_at TIMESTAMPTZ,
  approximate_distance TEXT DEFAULT '~20m',
  radar_angle_deg NUMERIC DEFAULT 0,
  radar_distance_pct NUMERIC DEFAULT 30,
  is_online BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated 
USING (auth.uid() = id OR (is_discoverable = true AND ghost_mode = false));

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- TRIGGER FOR NEW USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_username TEXT;
  extracted_display_name TEXT;
  extracted_bio TEXT;
  extracted_photo TEXT;
  extracted_status TEXT;
  extracted_availability TEXT;
BEGIN
  extracted_username := COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  extracted_display_name := COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1));
  extracted_bio := COALESCE(new.raw_user_meta_data->>'bio', 'Exploring connections nearby.');
  extracted_photo := COALESCE(new.raw_user_meta_data->>'profile_photo', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  extracted_status := COALESCE(new.raw_user_meta_data->>'current_status', '👋 Just saying hi');
  extracted_availability := COALESCE(new.raw_user_meta_data->>'social_availability', 'open');

  INSERT INTO public.profiles (
    id, username, display_name, profile_photo, bio, current_status, social_availability,
    is_discoverable, ghost_mode, radar_angle_deg, radar_distance_pct
  ) VALUES (
    new.id, extracted_username, extracted_display_name, extracted_photo, extracted_bio, extracted_status, extracted_availability,
    true, false, floor(random() * 360), floor(25 + random() * 65)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- COMPANION TABLES
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (timezone('utc'::text, now()) + interval '1 hour') NOT NULL
);

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connection requests involving them"
ON public.connection_requests FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests"
ON public.connection_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update connection requests"
ON public.connection_requests FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_message_snippet TEXT,
  last_message_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connections they participate in"
ON public.connections FOR SELECT TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections"
ON public.connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update connections they participate in"
ON public.connections FOR UPDATE TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- AUTOMATIC CONNECTION CREATION TRIGGER WHEN REQUEST ACCEPTED
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF new.status = 'accepted' AND (old.status IS NULL OR old.status != 'accepted') THEN
    INSERT INTO public.connections (user1_id, user2_id, last_message_snippet, last_message_time)
    VALUES (new.sender_id, new.receiver_id, 'Connected! Say hi 🎉', timezone('utc'::text, now()));
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_connection_request_accepted ON public.connection_requests;
CREATE TRIGGER on_connection_request_accepted
  AFTER UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE PROCEDURE public.handle_connection_accepted();

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Connection members can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = messages.connection_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Connection members can insert messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.connections c
    WHERE c.id = messages.connection_id
      AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their blocked list"
ON public.blocked_users FOR ALL TO authenticated
USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Harassment', 'Spam', 'Fake profile', 'Inappropriate behavior', 'Other')),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports"
ON public.reports FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- REALTIME REPLICATION (For live multi-device radar, requests, and chat)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

