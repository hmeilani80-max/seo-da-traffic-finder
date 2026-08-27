DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sudah_dibeli','domain_sudah_pernah','traffic_nol'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS research_status text NOT NULL DEFAULT ''belum_diriset''', t);
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t||'_research_status_check');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (research_status IN (''belum_diriset'',''sedang_diriset'',''selesai'',''gagal''))', t, t||'_research_status_check');
    EXECUTE format('UPDATE public.%I SET research_status = ''selesai'' WHERE research_status = ''belum_diriset'' AND (dr IS NOT NULL OR traffic IS NOT NULL)', t);
  END LOOP;
END $$;