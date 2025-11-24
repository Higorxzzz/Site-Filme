-- Criar tabela para registrar cliques em links de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_code TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Criar tabela para registrar referências (cadastros)
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para affiliate_clicks
CREATE POLICY "Sistema pode inserir cliques"
ON public.affiliate_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Afiliados podem ver seus próprios cliques"
ON public.affiliate_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.affiliate_code = affiliate_clicks.affiliate_code
    AND profiles.id = auth.uid()
  )
);

CREATE POLICY "Admins podem ver todos os cliques"
ON public.affiliate_clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para affiliate_referrals
CREATE POLICY "Sistema pode inserir referências"
ON public.affiliate_referrals
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Afiliados podem ver suas próprias referências"
ON public.affiliate_referrals
FOR SELECT
USING (auth.uid() = affiliate_id);

CREATE POLICY "Admins podem ver todas as referências"
ON public.affiliate_referrals
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_code ON public.affiliate_clicks(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_user ON public.affiliate_referrals(referred_user_id);