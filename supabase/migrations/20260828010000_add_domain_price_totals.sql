CREATE TABLE IF NOT EXISTS public.domain_price_totals (
  table_name text PRIMARY KEY CHECK (table_name IN ('sudah_dibeli', 'domain_sudah_pernah')),
  total_price numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.domain_price_totals (table_name, total_price)
VALUES
  ('sudah_dibeli', COALESCE((SELECT SUM(price) FROM public.sudah_dibeli), 0)),
  ('domain_sudah_pernah', COALESCE((SELECT SUM(price) FROM public.domain_sudah_pernah), 0))
ON CONFLICT (table_name) DO UPDATE SET
  total_price = EXCLUDED.total_price,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.refresh_domain_price_total()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_table text := TG_TABLE_NAME;
BEGIN
  INSERT INTO public.domain_price_totals (table_name, total_price, updated_at)
  VALUES (
    affected_table,
    CASE affected_table
      WHEN 'sudah_dibeli' THEN COALESCE((SELECT SUM(price) FROM public.sudah_dibeli), 0)
      WHEN 'domain_sudah_pernah' THEN COALESCE((SELECT SUM(price) FROM public.domain_sudah_pernah), 0)
    END,
    now()
  )
  ON CONFLICT (table_name) DO UPDATE SET
    total_price = EXCLUDED.total_price,
    updated_at = EXCLUDED.updated_at;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_sudah_dibeli_price_total ON public.sudah_dibeli;
CREATE TRIGGER trg_refresh_sudah_dibeli_price_total
AFTER INSERT OR UPDATE OF price OR DELETE ON public.sudah_dibeli
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_domain_price_total();

DROP TRIGGER IF EXISTS trg_refresh_domain_sudah_pernah_price_total ON public.domain_sudah_pernah;
CREATE TRIGGER trg_refresh_domain_sudah_pernah_price_total
AFTER INSERT OR UPDATE OF price OR DELETE ON public.domain_sudah_pernah
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_domain_price_total();

ALTER TABLE public.domain_price_totals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read domain price totals" ON public.domain_price_totals;
CREATE POLICY "authenticated read domain price totals"
ON public.domain_price_totals FOR SELECT
TO authenticated USING (true);

GRANT SELECT ON public.domain_price_totals TO authenticated;
GRANT ALL ON public.domain_price_totals TO service_role;
