-- Adiciona coluna para salvar o progresso dos anúncios assistidos
ALTER TABLE public.profiles 
ADD COLUMN ads_watched_count integer NOT NULL DEFAULT 0;