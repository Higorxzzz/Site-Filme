-- Add VIP columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_vip BOOLEAN DEFAULT false,
ADD COLUMN vip_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN vip_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN vip_updated_at TIMESTAMP WITH TIME ZONE;

-- Create VIP settings table for admin configuration
CREATE TABLE public.vip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_payment_enabled BOOLEAN DEFAULT false,
  monthly_price_cents INTEGER DEFAULT 1999,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default VIP settings
INSERT INTO public.vip_settings (test_payment_enabled, monthly_price_cents)
VALUES (false, 1999);

-- Enable RLS on vip_settings
ALTER TABLE public.vip_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view VIP settings
CREATE POLICY "Anyone can view VIP settings"
ON public.vip_settings
FOR SELECT
USING (true);

-- Policy: Admins can manage VIP settings
CREATE POLICY "Admins can manage VIP settings"
ON public.vip_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create VIP logs table
CREATE TABLE public.vip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vip_logs
ALTER TABLE public.vip_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all VIP logs
CREATE POLICY "Admins can view VIP logs"
ON public.vip_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Policy: System can insert VIP logs
CREATE POLICY "System can insert VIP logs"
ON public.vip_logs
FOR INSERT
WITH CHECK (true);

-- Create trigger to update vip_updated_at
CREATE OR REPLACE FUNCTION public.update_vip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_vip != OLD.is_vip OR NEW.vip_expires_at != OLD.vip_expires_at THEN
    NEW.vip_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_vip_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_vip_updated_at();