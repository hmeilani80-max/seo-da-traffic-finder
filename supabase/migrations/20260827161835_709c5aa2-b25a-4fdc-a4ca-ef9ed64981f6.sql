ALTER TABLE public.check_logs ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.domain_sudah_pernah ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.sudah_dibeli ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();
ALTER TABLE public.traffic_nol ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "akses penuh check_logs" ON public.check_logs;
DROP POLICY IF EXISTS "akses penuh domain_sudah_pernah" ON public.domain_sudah_pernah;
DROP POLICY IF EXISTS "akses penuh sudah_dibeli" ON public.sudah_dibeli;
DROP POLICY IF EXISTS "akses penuh traffic_nol" ON public.traffic_nol;

REVOKE ALL ON public.check_logs FROM anon;
REVOKE ALL ON public.domain_sudah_pernah FROM anon;
REVOKE ALL ON public.sudah_dibeli FROM anon;
REVOKE ALL ON public.traffic_nol FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_sudah_pernah TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sudah_dibeli TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.traffic_nol TO authenticated;
GRANT ALL ON public.check_logs TO service_role;
GRANT ALL ON public.domain_sudah_pernah TO service_role;
GRANT ALL ON public.sudah_dibeli TO service_role;
GRANT ALL ON public.traffic_nol TO service_role;

CREATE POLICY "own check_logs" ON public.check_logs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own domain_sudah_pernah" ON public.domain_sudah_pernah FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own sudah_dibeli" ON public.sudah_dibeli FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own traffic_nol" ON public.traffic_nol FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());