CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  search_count INTEGER NOT NULL DEFAULT 1,
  first_searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX search_history_user_query_idx
  ON public.search_history (user_id, normalized_query);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own search_history"
  ON public.search_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE VIEW public.domain_price_totals
WITH (security_invoker = true) AS
  SELECT
    'sudah_dibeli'::text AS table_name,
    COALESCE(SUM(price), 0)::numeric AS total_price,
    COALESCE(MAX(created_at), to_timestamp(0)) AS updated_at
  FROM public.sudah_dibeli
  UNION ALL
  SELECT
    'domain_sudah_pernah'::text AS table_name,
    COALESCE(SUM(price), 0)::numeric AS total_price,
    COALESCE(MAX(created_at), to_timestamp(0)) AS updated_at
  FROM public.domain_sudah_pernah;

GRANT SELECT ON public.domain_price_totals TO authenticated;
GRANT ALL ON public.domain_price_totals TO service_role;