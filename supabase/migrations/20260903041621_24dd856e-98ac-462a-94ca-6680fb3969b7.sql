alter table public.keyword_metrics_cache add column if not exists language text not null default 'id';
alter table public.keyword_rank_cache add column if not exists language text not null default 'id';

drop index if exists public.keyword_metrics_cache_key_idx;
create unique index if not exists keyword_metrics_cache_key_lang_idx
  on public.keyword_metrics_cache(normalized_keyword, country, language);

drop index if exists public.keyword_rank_cache_key_idx;
create unique index if not exists keyword_rank_cache_key_lang_idx
  on public.keyword_rank_cache(target_domain, normalized_keyword, country, language);