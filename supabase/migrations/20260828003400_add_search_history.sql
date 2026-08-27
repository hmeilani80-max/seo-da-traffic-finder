create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  query text not null,
  normalized_query text not null,
  search_count integer not null default 1,
  first_searched_at timestamptz not null default now(),
  last_searched_at timestamptz not null default now()
);

create unique index if not exists search_history_user_query_idx
  on public.search_history(user_id, normalized_query);

create index if not exists search_history_user_last_searched_idx
  on public.search_history(user_id, last_searched_at desc);

alter table public.search_history enable row level security;

drop policy if exists "own search_history" on public.search_history;
create policy "own search_history"
  on public.search_history
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
