-- Add vip_price column to vip_settings table
ALTER TABLE public.vip_settings 
ADD COLUMN vip_price DECIMAL(10,2) NOT NULL DEFAULT 19.90;

COMMENT ON COLUMN public.vip_settings.vip_price IS 'VIP subscription price in BRL';

-- Enable realtime for vip_settings table
ALTER TABLE public.vip_settings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_settings;