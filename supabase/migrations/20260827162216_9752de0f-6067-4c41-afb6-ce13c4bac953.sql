CREATE OR REPLACE FUNCTION public.claim_unowned_rows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'harus login';
  END IF;
  UPDATE public.domain_sudah_pernah SET user_id = auth.uid() WHERE user_id IS NULL;
  UPDATE public.traffic_nol SET user_id = auth.uid() WHERE user_id IS NULL;
  UPDATE public.sudah_dibeli SET user_id = auth.uid() WHERE user_id IS NULL;
  UPDATE public.check_logs SET user_id = auth.uid() WHERE user_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_unowned_rows() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_unowned_rows() TO authenticated;