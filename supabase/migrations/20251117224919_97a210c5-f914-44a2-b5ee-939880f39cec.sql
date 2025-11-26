-- Drop trigger first, then recreate function with proper security
DROP TRIGGER IF EXISTS update_profiles_vip_updated_at ON public.profiles;
DROP FUNCTION IF EXISTS public.update_vip_updated_at();

CREATE OR REPLACE FUNCTION public.update_vip_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_vip IS DISTINCT FROM OLD.is_vip OR NEW.vip_expires_at IS DISTINCT FROM OLD.vip_expires_at THEN
    NEW.vip_updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_profiles_vip_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_vip_updated_at();