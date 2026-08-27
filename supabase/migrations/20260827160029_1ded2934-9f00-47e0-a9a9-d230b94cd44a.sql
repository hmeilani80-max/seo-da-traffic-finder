CREATE TABLE public.domain_sudah_pernah (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  dr numeric,
  traffic numeric,
  checked_at timestamptz not null default now(),
  status text not null default 'sudah_pernah',
  notes text,
  created_at timestamptz not null default now()
);

CREATE TABLE public.traffic_nol (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  dr numeric,
  traffic numeric not null default 0,
  checked_at timestamptz not null default now(),
  status text not null default 'traffic_nol',
  notes text,
  created_at timestamptz not null default now()
);

CREATE TABLE public.sudah_dibeli (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  dr numeric,
  traffic numeric,
  checked_at timestamptz not null default now(),
  status text not null default 'sudah_dibeli',
  notes text,
  created_at timestamptz not null default now()
);

CREATE TABLE public.check_logs (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  hasil text not null,
  dr numeric,
  traffic numeric,
  pesan text,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_dsp_domain ON public.domain_sudah_pernah (lower(domain));
CREATE INDEX idx_tn_domain ON public.traffic_nol (lower(domain));
CREATE INDEX idx_sd_domain ON public.sudah_dibeli (lower(domain));
CREATE INDEX idx_logs_created ON public.check_logs (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.domain_sudah_pernah TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.traffic_nol TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sudah_dibeli TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_logs TO anon, authenticated;
GRANT ALL ON public.domain_sudah_pernah TO service_role;
GRANT ALL ON public.traffic_nol TO service_role;
GRANT ALL ON public.sudah_dibeli TO service_role;
GRANT ALL ON public.check_logs TO service_role;

ALTER TABLE public.domain_sudah_pernah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_nol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sudah_dibeli ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "akses penuh domain_sudah_pernah" ON public.domain_sudah_pernah FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "akses penuh traffic_nol" ON public.traffic_nol FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "akses penuh sudah_dibeli" ON public.sudah_dibeli FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "akses penuh check_logs" ON public.check_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);