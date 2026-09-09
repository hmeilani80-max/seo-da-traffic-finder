-- All rows already have owners; this SECURITY DEFINER helper is no longer needed
-- and allowed any signed-in user to claim unowned rows.
DROP FUNCTION IF EXISTS public.claim_unowned_rows();