--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'user'
);


--
-- Name: check_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.check_status AS ENUM (
    'pending',
    'ok',
    'not_found',
    'error'
);


--
-- Name: media_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.media_type AS ENUM (
    'movie',
    'series'
);


--
-- Name: clean_expired_cache(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.clean_expired_cache() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM public.api_cache WHERE expires_at < now();
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: log_admin_action(text, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_admin_action(p_action text, p_item_id uuid, p_status text, p_message text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_logs (action, item_id, status, message)
  VALUES (p_action, p_item_id, p_status, p_message)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    item_id uuid,
    status text NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: api_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.api_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cache_key text NOT NULL,
    data jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: episodes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.episodes (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    season_id uuid NOT NULL,
    number integer NOT NULL,
    title text NOT NULL,
    synopsis text NOT NULL,
    duration text NOT NULL,
    thumbnail text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: media_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.media_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tmdb_id integer NOT NULL,
    type public.media_type NOT NULL,
    title text NOT NULL,
    poster_url text,
    synopsis text,
    seasons integer DEFAULT 1,
    published boolean DEFAULT false,
    embed_url text,
    last_check_status public.check_status DEFAULT 'pending'::public.check_status,
    last_check_message text,
    last_check_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: movies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movies (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    cover text NOT NULL,
    year integer NOT NULL,
    rating numeric(3,1),
    genre text[] NOT NULL,
    synopsis text NOT NULL,
    duration text NOT NULL,
    trailer text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT movies_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (10)::numeric)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: seasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seasons (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    series_id uuid NOT NULL,
    number integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: series; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.series (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    cover text NOT NULL,
    year integer NOT NULL,
    rating numeric(3,1),
    genre text[] NOT NULL,
    synopsis text NOT NULL,
    trailer text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT series_rating_check CHECK (((rating >= (0)::numeric) AND (rating <= (10)::numeric)))
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: api_cache api_cache_cache_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_cache
    ADD CONSTRAINT api_cache_cache_key_key UNIQUE (cache_key);


--
-- Name: api_cache api_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.api_cache
    ADD CONSTRAINT api_cache_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_season_id_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_season_id_number_key UNIQUE (season_id, number);


--
-- Name: media_items media_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_items
    ADD CONSTRAINT media_items_pkey PRIMARY KEY (id);


--
-- Name: media_items media_items_tmdb_id_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.media_items
    ADD CONSTRAINT media_items_tmdb_id_type_key UNIQUE (tmdb_id, type);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: seasons seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_pkey PRIMARY KEY (id);


--
-- Name: seasons seasons_series_id_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_series_id_number_key UNIQUE (series_id, number);


--
-- Name: series series_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: media_items update_media_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_media_items_updated_at BEFORE UPDATE ON public.media_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: movies update_movies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: series update_series_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_logs admin_logs_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.media_items(id) ON DELETE SET NULL;


--
-- Name: episodes episodes_season_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.seasons(id) ON DELETE CASCADE;


--
-- Name: movies movies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: seasons seasons_series_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seasons
    ADD CONSTRAINT seasons_series_id_fkey FOREIGN KEY (series_id) REFERENCES public.series(id) ON DELETE CASCADE;


--
-- Name: series series_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.series
    ADD CONSTRAINT series_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: episodes Admins can delete episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete episodes" ON public.episodes FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movies Admins can delete movies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete movies" ON public.movies FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seasons Admins can delete seasons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete seasons" ON public.seasons FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: series Admins can delete series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete series" ON public.series FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: episodes Admins can insert episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert episodes" ON public.episodes FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_logs Admins can insert logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert logs" ON public.admin_logs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movies Admins can insert movies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert movies" ON public.movies FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seasons Admins can insert seasons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert seasons" ON public.seasons FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: series Admins can insert series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert series" ON public.series FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: api_cache Admins can manage cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage cache" ON public.api_cache USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: media_items Admins can manage media_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage media_items" ON public.media_items USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: episodes Admins can update episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update episodes" ON public.episodes FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movies Admins can update movies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update movies" ON public.movies FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: seasons Admins can update seasons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update seasons" ON public.seasons FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: series Admins can update series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update series" ON public.series FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_logs Admins can view logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view logs" ON public.admin_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: episodes Anyone can view episodes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view episodes" ON public.episodes FOR SELECT USING (true);


--
-- Name: movies Anyone can view movies; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view movies" ON public.movies FOR SELECT USING (true);


--
-- Name: media_items Anyone can view published items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published items" ON public.media_items FOR SELECT USING ((published = true));


--
-- Name: seasons Anyone can view seasons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view seasons" ON public.seasons FOR SELECT USING (true);


--
-- Name: series Anyone can view series; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view series" ON public.series FOR SELECT USING (true);


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: admin_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: api_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: episodes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

--
-- Name: media_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;

--
-- Name: movies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: seasons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

--
-- Name: series; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


