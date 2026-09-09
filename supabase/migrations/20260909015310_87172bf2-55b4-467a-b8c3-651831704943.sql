DROP POLICY IF EXISTS "read global_domain_cache" ON public.global_domain_cache;
DROP POLICY IF EXISTS "read keyword_metrics_cache" ON public.keyword_metrics_cache;
DROP POLICY IF EXISTS "read keyword_rank_cache" ON public.keyword_rank_cache;
DROP POLICY IF EXISTS "read seo_research_runs" ON public.seo_research_runs;

REVOKE ALL ON public.global_domain_cache FROM authenticated;
REVOKE ALL ON public.keyword_metrics_cache FROM authenticated;
REVOKE ALL ON public.keyword_rank_cache FROM authenticated;
REVOKE ALL ON public.seo_research_runs FROM authenticated;

GRANT ALL ON public.global_domain_cache TO service_role;
GRANT ALL ON public.keyword_metrics_cache TO service_role;
GRANT ALL ON public.keyword_rank_cache TO service_role;
GRANT ALL ON public.seo_research_runs TO service_role;