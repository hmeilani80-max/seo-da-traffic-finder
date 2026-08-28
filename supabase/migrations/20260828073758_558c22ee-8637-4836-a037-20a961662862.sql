CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  client_domain text,
  description text,
  status text NOT NULL DEFAULT 'aktif',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_own_rows" ON public.projects FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.placement_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  source_domain text NOT NULL,
  target_url text,
  keyword text,
  anchor_text text,
  status text NOT NULL DEFAULT 'draft',
  price numeric,
  placed_at date,
  notes text,
  dr numeric,
  traffic numeric,
  search_volume numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS placement_orders_project_idx ON public.placement_orders (project_id);
CREATE INDEX IF NOT EXISTS placement_orders_user_idx ON public.placement_orders (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.placement_orders TO authenticated;
GRANT ALL ON public.placement_orders TO service_role;
ALTER TABLE public.placement_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placement_orders_own_rows" ON public.placement_orders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  placement_order_id uuid REFERENCES public.placement_orders(id) ON DELETE CASCADE,
  source_domain text NOT NULL,
  source_url text,
  target_url text,
  keyword text,
  anchor_text text,
  link_type text NOT NULL DEFAULT 'dofollow',
  status text NOT NULL DEFAULT 'aktif',
  dr numeric,
  traffic numeric,
  first_seen_at timestamptz,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS backlinks_project_idx ON public.backlinks (project_id);
CREATE INDEX IF NOT EXISTS backlinks_user_idx ON public.backlinks (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backlinks TO authenticated;
GRANT ALL ON public.backlinks TO service_role;
ALTER TABLE public.backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "backlinks_own_rows" ON public.backlinks FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_placement_orders_updated_at ON public.placement_orders;
CREATE TRIGGER update_placement_orders_updated_at BEFORE UPDATE ON public.placement_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_backlinks_updated_at ON public.backlinks;
CREATE TRIGGER update_backlinks_updated_at BEFORE UPDATE ON public.backlinks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();