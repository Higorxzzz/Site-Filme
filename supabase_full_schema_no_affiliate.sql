-- =================================================================================================
-- SCHEMA: public
-- =================================================================================================

-- Set search path to public schema
SET search_path = public, pg_catalog;

-- -------------------------------------------------------------------------------------------------
-- 1. TABLES
-- -------------------------------------------------------------------------------------------------

-- Table: profiles
CREATE TABLE profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    email text UNIQUE NOT NULL,
    username text UNIQUE,
    full_name text,
    avatar_url text,
    is_vip boolean DEFAULT false NOT NULL,
    vip_expires_at timestamp with time zone,
    is_admin boolean DEFAULT false NOT NULL,
    ad_preference text DEFAULT 'one_per_40min'::text NOT NULL,
    ad_free_until timestamp with time zone,
    ads_watched_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone
);

-- Table: media_items
CREATE TABLE media_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tmdb_id integer UNIQUE NOT NULL,
    title text NOT NULL,
    type text NOT NULL, -- 'movie' or 'series'
    release_date date,
    poster_path text,
    backdrop_path text,
    overview text,
    runtime integer,
    rating numeric DEFAULT 0.0 NOT NULL,
    vote_count integer DEFAULT 0 NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: genres
CREATE TABLE genres (
    id integer PRIMARY KEY,
    name text UNIQUE NOT NULL
);

-- Table: media_genres (Junction table for many-to-many relationship)
CREATE TABLE media_genres (
    media_id uuid REFERENCES media_items(id) ON DELETE CASCADE,
    genre_id integer REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, genre_id)
);

-- Table: favorites
CREATE TABLE favorites (
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    media_id uuid REFERENCES media_items(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, media_id)
);

-- Table: media_logs (For tracking user views)
CREATE TABLE media_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    media_id uuid REFERENCES media_items(id) ON DELETE CASCADE,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, media_id) -- Assuming one log entry per user per media item
);

-- Table: ad_settings
CREATE TABLE ad_settings (
    id integer PRIMARY KEY DEFAULT 1,
    interval_minutes integer DEFAULT 40 NOT NULL,
    ads_required_for_free_time integer DEFAULT 5 NOT NULL,
    free_time_hours integer DEFAULT 24 NOT NULL,
    UNIQUE (id)
);

-- Table: ad_urls
CREATE TABLE ad_urls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: logs (For admin actions)
CREATE TABLE logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Table: vip_plans
CREATE TABLE vip_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price numeric NOT NULL,
    duration_days integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- -------------------------------------------------------------------------------------------------
-- 2. FUNCTIONS
-- -------------------------------------------------------------------------------------------------

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update media views count
CREATE OR REPLACE FUNCTION public.update_media_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.media_items
  SET views = views + 1
  WHERE id = NEW.media_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------------------------------------------
-- 3. TRIGGERS
-- -------------------------------------------------------------------------------------------------

-- Trigger to create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update media views on new media_logs entry
CREATE TRIGGER on_media_log_created
  AFTER INSERT ON public.media_logs
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_media_views();

-- -------------------------------------------------------------------------------------------------
-- 4. RLS (Row Level Security) POLICIES
-- -------------------------------------------------------------------------------------------------

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_plans ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Media Items RLS
CREATE POLICY "Public read access for all users" ON media_items
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert media items" ON media_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can update media items" ON media_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can delete media items" ON media_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Genres RLS
CREATE POLICY "Public read access for genres" ON genres
  FOR SELECT USING (true);

-- Media Genres RLS
CREATE POLICY "Public read access for media_genres" ON media_genres
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage media_genres" ON media_genres
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Favorites RLS
CREATE POLICY "Users can manage their own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

-- Media Logs RLS
CREATE POLICY "Users can manage their own media logs" ON media_logs
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all media logs" ON media_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Ad Settings RLS
CREATE POLICY "Public read access for ad settings" ON ad_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage ad settings" ON ad_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Ad URLs RLS
CREATE POLICY "Public read access for ad urls" ON ad_urls
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage ad urls" ON ad_urls
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Logs RLS
CREATE POLICY "Admins can view all logs" ON logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Admins can insert logs" ON logs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- VIP Plans RLS
CREATE POLICY "Public read access for vip plans" ON vip_plans
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage vip plans" ON vip_plans
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- -------------------------------------------------------------------------------------------------
-- 5. INITIAL DATA (Optional, but recommended for settings)
-- -------------------------------------------------------------------------------------------------

-- Insert default ad settings if the table is empty
INSERT INTO ad_settings (id, interval_minutes, ads_required_for_free_time, free_time_hours)
VALUES (1, 40, 5, 24)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------------------------------
-- 6. INDEXES (Optional, but good practice)
-- -------------------------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_media_items_type ON media_items (type);
CREATE INDEX IF NOT EXISTS idx_media_items_is_published ON media_items (is_published);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_media_logs_user_id ON media_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_media_logs_media_id ON media_logs (media_id);
