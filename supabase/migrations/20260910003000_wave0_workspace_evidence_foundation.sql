-- Wave 0 — Workspace, evidence/import, and shared-access foundation.
-- Additive only: preserve existing tables, rows, owner access, and working flows.

-- ---------------------------------------------------------------------------
-- Workspace model
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_personal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_workspaces_personal_creator_idx
  ON public.app_workspaces (created_by)
  WHERE is_personal = true;

CREATE TABLE IF NOT EXISTS public.app_workspace_members (
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS app_workspace_members_user_idx
  ON public.app_workspace_members (user_id, status);

-- ---------------------------------------------------------------------------
-- Add workspace_id to existing operational tables without replacing them.
-- ---------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.placement_orders
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.backlinks
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.app_workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_workspace_idx ON public.projects (workspace_id);
CREATE INDEX IF NOT EXISTS placement_orders_workspace_idx ON public.placement_orders (workspace_id);
CREATE INDEX IF NOT EXISTS backlinks_workspace_idx ON public.backlinks (workspace_id);

-- Needed for workspace-consistent project-scoped foreign keys below.
CREATE UNIQUE INDEX IF NOT EXISTS projects_id_workspace_uidx
  ON public.projects (id, workspace_id);

-- ---------------------------------------------------------------------------
-- Security helpers. SECURITY DEFINER prevents RLS recursion when checking
-- membership; functions expose only booleans/ids, never privileged row data.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.app_workspace_members m
      WHERE m.workspace_id = p_workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_workspace_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.app_workspace_members m
      WHERE m.workspace_id = p_workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
        AND m.role IN ('owner', 'admin')
    );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_workspace_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO authenticated, service_role;

-- Automatically make a newly-created workspace creator its owner.
CREATE OR REPLACE FUNCTION public.add_workspace_creator_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_workspace_members (workspace_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active')
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET role = 'owner', status = 'active';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS add_workspace_creator_member_trigger ON public.app_workspaces;
CREATE TRIGGER add_workspace_creator_member_trigger
AFTER INSERT ON public.app_workspaces
FOR EACH ROW EXECUTE FUNCTION public.add_workspace_creator_member();

-- Internal helper used by migration/DB triggers. It is intentionally not
-- executable by normal authenticated clients with an arbitrary user id.
CREATE OR REPLACE FUNCTION public.ensure_personal_workspace_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT w.id INTO v_workspace_id
  FROM public.app_workspaces w
  WHERE w.created_by = p_user_id AND w.is_personal = true
  ORDER BY w.created_at
  LIMIT 1;

  IF v_workspace_id IS NULL THEN
    INSERT INTO public.app_workspaces (name, created_by, is_personal)
    VALUES ('SEO Workspace', p_user_id, true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_workspace_id;

    IF v_workspace_id IS NULL THEN
      SELECT w.id INTO v_workspace_id
      FROM public.app_workspaces w
      WHERE w.created_by = p_user_id AND w.is_personal = true
      ORDER BY w.created_at
      LIMIT 1;
    END IF;
  END IF;

  INSERT INTO public.app_workspace_members (workspace_id, user_id, role, status)
  VALUES (v_workspace_id, p_user_id, 'owner', 'active')
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET status = 'active';

  RETURN v_workspace_id;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_personal_workspace_for_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_personal_workspace_for_user(uuid) TO service_role;

-- Authenticated helper for future UI/services. It only operates on auth.uid().
CREATE OR REPLACE FUNCTION public.ensure_default_workspace()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN public.ensure_personal_workspace_for_user(v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_default_workspace() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_default_workspace() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Backfill current operational rows into one personal workspace per owner.
-- No user_id values are changed.
-- ---------------------------------------------------------------------------

WITH existing_users AS (
  SELECT user_id FROM public.projects
  UNION
  SELECT user_id FROM public.placement_orders
  UNION
  SELECT user_id FROM public.backlinks
)
SELECT public.ensure_personal_workspace_for_user(eu.user_id)
FROM existing_users eu
WHERE eu.user_id IS NOT NULL;

UPDATE public.projects p
SET workspace_id = public.ensure_personal_workspace_for_user(p.user_id)
WHERE p.workspace_id IS NULL;

UPDATE public.placement_orders po
SET workspace_id = COALESCE(
  (SELECT p.workspace_id FROM public.projects p WHERE p.id = po.project_id),
  public.ensure_personal_workspace_for_user(po.user_id)
)
WHERE po.workspace_id IS NULL;

UPDATE public.backlinks b
SET workspace_id = COALESCE(
  (SELECT p.workspace_id FROM public.projects p WHERE p.id = b.project_id),
  public.ensure_personal_workspace_for_user(b.user_id)
)
WHERE b.workspace_id IS NULL;

-- Keep current client code working: new rows get a workspace automatically.
CREATE OR REPLACE FUNCTION public.assign_project_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    NEW.workspace_id := public.ensure_personal_workspace_for_user(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_child_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
BEGIN
  IF NEW.workspace_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.project_id IS NOT NULL THEN
    SELECT p.workspace_id INTO v_workspace_id
    FROM public.projects p
    WHERE p.id = NEW.project_id;
  END IF;

  NEW.workspace_id := COALESCE(
    v_workspace_id,
    public.ensure_personal_workspace_for_user(NEW.user_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_assign_workspace ON public.projects;
CREATE TRIGGER projects_assign_workspace
BEFORE INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.assign_project_workspace();

DROP TRIGGER IF EXISTS placement_orders_assign_workspace ON public.placement_orders;
CREATE TRIGGER placement_orders_assign_workspace
BEFORE INSERT ON public.placement_orders
FOR EACH ROW EXECUTE FUNCTION public.assign_child_workspace();

DROP TRIGGER IF EXISTS backlinks_assign_workspace ON public.backlinks;
CREATE TRIGGER backlinks_assign_workspace
BEFORE INSERT ON public.backlinks
FOR EACH ROW EXECUTE FUNCTION public.assign_child_workspace();

-- ---------------------------------------------------------------------------
-- RLS for workspace metadata.
-- Existing owner-only operational policies remain in place. We add shared READ
-- access only; shared writes can be enabled later after Wave 1 UI is validated.
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_workspace_members TO authenticated;
GRANT ALL ON public.app_workspaces TO service_role;
GRANT ALL ON public.app_workspace_members TO service_role;

ALTER TABLE public.app_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_member_read" ON public.app_workspaces;
CREATE POLICY "workspace_member_read"
ON public.app_workspaces FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_workspace_member(id));

DROP POLICY IF EXISTS "workspace_creator_insert" ON public.app_workspaces;
CREATE POLICY "workspace_creator_insert"
ON public.app_workspaces FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "workspace_admin_update" ON public.app_workspaces;
CREATE POLICY "workspace_admin_update"
ON public.app_workspaces FOR UPDATE TO authenticated
USING (created_by = auth.uid() OR public.is_workspace_admin(id))
WITH CHECK (created_by = auth.uid() OR public.is_workspace_admin(id));

DROP POLICY IF EXISTS "workspace_admin_delete" ON public.app_workspaces;
CREATE POLICY "workspace_admin_delete"
ON public.app_workspaces FOR DELETE TO authenticated
USING (created_by = auth.uid() OR public.is_workspace_admin(id));

DROP POLICY IF EXISTS "workspace_members_read" ON public.app_workspace_members;
CREATE POLICY "workspace_members_read"
ON public.app_workspace_members FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "workspace_members_admin_insert" ON public.app_workspace_members;
CREATE POLICY "workspace_members_admin_insert"
ON public.app_workspace_members FOR INSERT TO authenticated
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "workspace_members_admin_update" ON public.app_workspace_members;
CREATE POLICY "workspace_members_admin_update"
ON public.app_workspace_members FOR UPDATE TO authenticated
USING (public.is_workspace_admin(workspace_id))
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "workspace_members_admin_delete" ON public.app_workspace_members;
CREATE POLICY "workspace_members_admin_delete"
ON public.app_workspace_members FOR DELETE TO authenticated
USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "projects_workspace_read" ON public.projects;
CREATE POLICY "projects_workspace_read"
ON public.projects FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "placement_orders_workspace_read" ON public.placement_orders;
CREATE POLICY "placement_orders_workspace_read"
ON public.placement_orders FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "backlinks_workspace_read" ON public.backlinks;
CREATE POLICY "backlinks_workspace_read"
ON public.backlinks FOR SELECT TO authenticated
USING (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Wave 1 data foundations: registry/evidence/import only. No UI is added here.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  provider text NOT NULL,
  connection_type text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  external_account_ref text,
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_connections_project_workspace_fk
    FOREIGN KEY (project_id, workspace_id)
    REFERENCES public.projects(id, workspace_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.project_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  source_type text NOT NULL,
  title text NOT NULL,
  original_filename text,
  mime_type text,
  storage_path text,
  source_url text,
  raw_text text,
  extracted_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  processing_status text NOT NULL DEFAULT 'pending',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_evidence_project_workspace_fk
    FOREIGN KEY (project_id, workspace_id)
    REFERENCES public.projects(id, workspace_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.data_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid,
  module text NOT NULL,
  source_type text NOT NULL,
  original_filename text,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  normalization_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT data_imports_project_workspace_fk
    FOREIGN KEY (project_id, workspace_id)
    REFERENCES public.projects(id, workspace_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS project_connections_project_idx
  ON public.project_connections (project_id, provider);
CREATE INDEX IF NOT EXISTS project_evidence_project_idx
  ON public.project_evidence (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS data_imports_project_idx
  ON public.data_imports (project_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_evidence TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.data_imports TO authenticated;
GRANT ALL ON public.project_connections TO service_role;
GRANT ALL ON public.project_evidence TO service_role;
GRANT ALL ON public.data_imports TO service_role;

ALTER TABLE public.project_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_connections_workspace_access" ON public.project_connections;
CREATE POLICY "project_connections_workspace_access"
ON public.project_connections FOR ALL TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "project_evidence_workspace_access" ON public.project_evidence;
CREATE POLICY "project_evidence_workspace_access"
ON public.project_evidence FOR ALL TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "data_imports_workspace_access" ON public.data_imports;
CREATE POLICY "data_imports_workspace_access"
ON public.data_imports FOR ALL TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

-- Reuse the existing updated_at trigger function already used by projects.
DROP TRIGGER IF EXISTS update_app_workspaces_updated_at ON public.app_workspaces;
CREATE TRIGGER update_app_workspaces_updated_at
BEFORE UPDATE ON public.app_workspaces
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_connections_updated_at ON public.project_connections;
CREATE TRIGGER update_project_connections_updated_at
BEFORE UPDATE ON public.project_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_evidence_updated_at ON public.project_evidence;
CREATE TRIGGER update_project_evidence_updated_at
BEFORE UPDATE ON public.project_evidence
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_data_imports_updated_at ON public.data_imports;
CREATE TRIGGER update_data_imports_updated_at
BEFORE UPDATE ON public.data_imports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
