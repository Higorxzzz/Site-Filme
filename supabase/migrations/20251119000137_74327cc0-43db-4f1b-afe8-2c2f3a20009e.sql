-- Add vip_duration_days column to vip_settings table
ALTER TABLE public.vip_settings 
ADD COLUMN vip_duration_days integer NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.vip_settings.vip_duration_days IS 'Duration of VIP subscription in days';