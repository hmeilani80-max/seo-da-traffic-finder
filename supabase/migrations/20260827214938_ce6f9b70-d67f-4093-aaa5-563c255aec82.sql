REVOKE ALL ON FUNCTION public.claim_unowned_rows() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_unowned_rows() TO service_role;