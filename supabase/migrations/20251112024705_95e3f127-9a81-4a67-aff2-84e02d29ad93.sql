-- Criar tabela para configurações de anúncios
CREATE TABLE public.ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interval_minutes integer NOT NULL DEFAULT 40,
  ads_required_for_free_time integer NOT NULL DEFAULT 5,
  free_time_hours integer NOT NULL DEFAULT 24,
  redirect_url text NOT NULL DEFAULT 'https://example.com/ad',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

-- Política para todos lerem as configurações
CREATE POLICY "Anyone can view ad settings"
ON public.ad_settings
FOR SELECT
USING (true);

-- Política para admins gerenciarem
CREATE POLICY "Admins can manage ad settings"
ON public.ad_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir configuração padrão
INSERT INTO public.ad_settings (interval_minutes, ads_required_for_free_time, free_time_hours, redirect_url)
VALUES (40, 5, 24, 'https://example.com/ad');

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ad_settings_updated_at
BEFORE UPDATE ON public.ad_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();