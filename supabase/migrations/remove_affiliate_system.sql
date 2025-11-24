-- Remove tables
DROP TABLE IF EXISTS public.affiliate_clicks;
DROP TABLE IF EXISTS public.affiliate_referrals;
DROP TABLE IF EXISTS public.affiliate_conversions;
DROP TABLE IF EXISTS public.affiliate_settings;
DROP TABLE IF EXISTS public.affiliate_withdrawals;

-- Remove columns from profiles table
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS affiliate_balance,
DROP COLUMN IF EXISTS affiliate_code,
DROP COLUMN IF EXISTS is_affiliate,
DROP COLUMN IF EXISTS referred_by;

-- Remove RLS policies (assuming they exist)
-- RLS policies are usually named like 'enable_select_for_affiliate_clicks'
-- Since we don't know the exact names, we'll rely on the table drop to clean up.

-- Remove functions (assuming they exist)
DROP FUNCTION IF EXISTS public.generate_affiliate_code;

-- Remove the edge function (handled by file removal in phase 3, but good to have a cleanup here)
-- Supabase CLI handles edge function removal on deploy, but we'll remove the file just in case.
-- The file was already removed in phase 3.

-- Remove types (if any custom types were created, but usually not for this)
-- We assume no custom types were created for affiliate system.

-- Final check: Ensure the profiles table is clean
-- SELECT * FROM public.profiles;
