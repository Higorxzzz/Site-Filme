-- Criar enum para preferência de anúncios
CREATE TYPE public.ad_preference_type AS ENUM ('five_at_once', 'one_per_40min');

-- Adicionar colunas à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN ad_preference ad_preference_type DEFAULT 'one_per_40min',
ADD COLUMN ad_free_until timestamp with time zone DEFAULT NULL;

-- Criar tabela para armazenar URLs de redirecionamento
CREATE TABLE public.ad_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela ad_urls
ALTER TABLE public.ad_urls ENABLE ROW LEVEL SECURITY;

-- Política para todos poderem ler os URLs ativos
CREATE POLICY "Anyone can view active ad URLs"
ON public.ad_urls
FOR SELECT
USING (is_active = true);

-- Política para admins gerenciarem URLs
CREATE POLICY "Admins can manage ad URLs"
ON public.ad_urls
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir alguns URLs de exemplo
INSERT INTO public.ad_urls (url) VALUES
('https://example.com/ad1'),
('https://example.com/ad2'),
('https://example.com/ad3'),
('https://example.com/ad4'),
('https://example.com/ad5');