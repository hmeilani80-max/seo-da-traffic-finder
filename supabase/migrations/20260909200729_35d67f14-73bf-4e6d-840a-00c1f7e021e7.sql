-- Synced from production migration history on 2026-09-10.
-- Wave 0: Architecture & Security Foundation (ADDITIVE ONLY)

CREATE TABLE IF NOT EXISTS public.app_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_workspaces TO authenticated;
GRANT ALL ON public.app_workspaces TO service_role;
ALTER TABLE public.app_workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.app_workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_workspace_members_user
  ON public.app_workspace_members(user_id) WHERE status = 'active';

GRANT SELECT ON public.app_workspace_members TO authenticated;
GRANT ALL ON public.app_workspace_members TO service_role;
ALTER TABLE public.app_workspace_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_workspace_members m
    WHERE m.workspace_id = _workspace_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS app_workspaces_member_read ON public.app_workspaces;
CREATE POLICY app_workspaces_member_read ON public.app_workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(id));

DROP POLICY IF EXISTS app_workspace_members_self_read ON public.app_workspace_members;
CREATE POLICY app_workspace_members_self_read ON public.app_workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id));

ALTER TABLE public.projects         ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id);
ALTER TABLE public.placement_orders ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id);
ALTER TABLE public.backlinks        ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id);

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_placement_orders_workspace ON public.placement_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_workspace ON public.backlinks(workspace_id);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'prospect';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS activated_at timestamptz;

DO $$
DECLARE
  ws_id uuid;
BEGIN
  SELECT id INTO ws_id FROM public.app_workspaces WHERE slug = 'internal-seo-team';

  IF ws_id IS NULL THEN
    INSERT INTO public.app_workspaces (name, slug)
    VALUES ('Tim SEO Internal', 'internal-seo-team')
    RETURNING id INTO ws_id;
  END IF;

  INSERT INTO public.app_workspace_members (workspace_id, user_id, role, status)
  SELECT ws_id, u.user_id, 'member', 'active'
  FROM (
    SELECT DISTINCT user_id FROM public.projects WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id FROM public.placement_orders WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id FROM public.backlinks WHERE user_id IS NOT NULL
  ) u
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.projects         SET workspace_id = ws_id WHERE workspace_id IS NULL;
  UPDATE public.placement_orders SET workspace_id = ws_id WHERE workspace_id IS NULL;
  UPDATE public.backlinks        SET workspace_id = ws_id WHERE workspace_id IS NULL;
END $$;

DROP POLICY IF EXISTS projects_workspace_members ON public.projects;
CREATE POLICY projects_workspace_members ON public.projects
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS placement_orders_workspace_members ON public.placement_orders;
CREATE POLICY placement_orders_workspace_members ON public.placement_orders
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS backlinks_workspace_members ON public.backlinks;
CREATE POLICY backlinks_workspace_members ON public.backlinks
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

CREATE TABLE IF NOT EXISTS public.project_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  source_type text NOT NULL DEFAULT 'manual_upload',
  title text,
  original_filename text,
  mime_type text,
  storage_path text,
  source_url text,
  raw_text text,
  extracted_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'pending',
  processing_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_evidence TO authenticated;
GRANT ALL ON public.project_evidence TO service_role;
ALTER TABLE public.project_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_evidence_workspace_members ON public.project_evidence
  FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE INDEX IF NOT EXISTS idx_project_evidence_project ON public.project_evidence(project_id);

CREATE TABLE IF NOT EXISTS public.data_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  module text NOT NULL,
  source_type text NOT NULL DEFAULT 'manual_upload',
  original_filename text,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalization_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  error text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_imports TO authenticated;
GRANT ALL ON public.data_imports TO service_role;
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_imports_workspace_members ON public.data_imports
  FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

CREATE INDEX IF NOT EXISTS idx_data_imports_project ON public.data_imports(project_id);

DROP TRIGGER IF EXISTS update_app_workspaces_updated_at ON public.app_workspaces;
CREATE TRIGGER update_app_workspaces_updated_at BEFORE UPDATE ON public.app_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_workspace_members_updated_at ON public.app_workspace_members;
CREATE TRIGGER update_app_workspace_members_updated_at BEFORE UPDATE ON public.app_workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_evidence_updated_at ON public.project_evidence;
CREATE TRIGGER update_project_evidence_updated_at BEFORE UPDATE ON public.project_evidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_imports_updated_at ON public.data_imports;
CREATE TRIGGER update_data_imports_updated_at BEFORE UPDATE ON public.data_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
