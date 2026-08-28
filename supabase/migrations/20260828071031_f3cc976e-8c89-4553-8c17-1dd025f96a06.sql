create table if not exists public.global_domain_cache (
  id uuid primary key default gen_random_uuid(),
  normalized_domain text not null,
  dr numeric,
  traffic numeric,
  backlinks numeric,
  referring_domains numeric,
  top_keywords jsonb,
  top_pages jsonb,
  provider text not null default 'ahrefs_all_in_one',
  authority_checked_at timestamptz,
  traffic_checked_at timestamptz,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists global_domain_cache_domain_idx on public.global_domain_cache(normalized_domain);
grant select on public.global_domain_cache to authenticated;
grant all on public.global_domain_cache to service_role;
alter table public.global_domain_cache enable row level security;
drop policy if exists "read global_domain_cache" on public.global_domain_cache;
create policy "read global_domain_cache" on public.global_domain_cache for select to authenticated using (true);

create table if not exists public.keyword_metrics_cache (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  normalized_keyword text not null,
  country text not null default 'id',
  search_volume numeric,
  keyword_difficulty numeric,
  cpc numeric,
  traffic_potential numeric,
  provider text not null default 'ahrefs_all_in_one',
  checked_at timestamptz not null default now(),
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists keyword_metrics_cache_key_idx on public.keyword_metrics_cache(normalized_keyword, country);
grant select on public.keyword_metrics_cache to authenticated;
grant all on public.keyword_metrics_cache to service_role;
alter table public.keyword_metrics_cache enable row level security;
drop policy if exists "read keyword_metrics_cache" on public.keyword_metrics_cache;
create policy "read keyword_metrics_cache" on public.keyword_metrics_cache for select to authenticated using (true);

create table if not exists public.keyword_rank_cache (
  id uuid primary key default gen_random_uuid(),
  target_domain text not null,
  keyword text not null,
  normalized_keyword text not null,
  country text not null default 'id',
  position integer,
  ranking_url text,
  ranking_title text,
  traffic numeric,
  dr numeric,
  ur numeric,
  provider text not null default 'ahrefs_all_in_one',
  checked_at timestamptz not null default now(),
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists keyword_rank_cache_key_idx on public.keyword_rank_cache(target_domain, normalized_keyword, country);
grant select on public.keyword_rank_cache to authenticated;
grant all on public.keyword_rank_cache to service_role;
alter table public.keyword_rank_cache enable row level security;
drop policy if exists "read keyword_rank_cache" on public.keyword_rank_cache;
create policy "read keyword_rank_cache" on public.keyword_rank_cache for select to authenticated using (true);

create table if not exists public.seo_research_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'ahrefs_all_in_one',
  search_type text not null,
  query text,
  cache_hit boolean not null default false,
  status text not null default 'ok',
  result_count integer,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists seo_research_runs_created_idx on public.seo_research_runs(created_at desc);
grant select on public.seo_research_runs to authenticated;
grant all on public.seo_research_runs to service_role;
alter table public.seo_research_runs enable row level security;
drop policy if exists "read seo_research_runs" on public.seo_research_runs;
create policy "read seo_research_runs" on public.seo_research_runs for select to authenticated using (true);