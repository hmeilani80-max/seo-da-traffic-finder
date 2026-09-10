-- Wave 2 — Comprehensive Site Audit
-- Additive schema only. Existing SEO/backlink data is untouched.

CREATE TABLE IF NOT EXISTS public.site_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  target_url text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  source_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_audits_project_created_idx
  ON public.site_audits(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS site_audits_workspace_idx
  ON public.site_audits(workspace_id);

CREATE TABLE IF NOT EXISTS public.audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES public.site_audits(id) ON DELETE CASCADE,
  category text NOT NULL,
  check_key text NOT NULL,
  title text NOT NULL,
  status text NOT NULL
    CHECK (status IN ('passed', 'urgent', 'issue', 'warning', 'not_found', 'unable_to_verify')),
  url text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type text NOT NULL DEFAULT 'public_crawl',
  source_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id, check_key)
);

CREATE INDEX IF NOT EXISTS audit_findings_audit_status_idx
  ON public.audit_findings(audit_id, status);
CREATE INDEX IF NOT EXISTS audit_findings_project_idx
  ON public.audit_findings(project_id);

CREATE TABLE IF NOT EXISTS public.audit_ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  audit_id uuid NOT NULL REFERENCES public.site_audits(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text,
  status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error')),
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_ai_analyses_audit_created_idx
  ON public.audit_ai_analyses(audit_id, created_at DESC);

-- Minimal task model required for Audit → Task. Wave 5 can extend this additively.
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  source_type text,
  source_id uuid,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_project_status_idx
  ON public.tasks(project_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_audit_finding_once_idx
  ON public.tasks(project_id, source_id)
  WHERE source_type = 'audit_finding' AND source_id IS NOT NULL;

ALTER TABLE public.site_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.site_audits FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_findings FROM anon, authenticated;
REVOKE ALL ON TABLE public.audit_ai_analyses FROM anon, authenticated;
REVOKE ALL ON TABLE public.tasks FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_audits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_findings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_ai_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;

GRANT ALL ON TABLE public.site_audits TO service_role;
GRANT ALL ON TABLE public.audit_findings TO service_role;
GRANT ALL ON TABLE public.audit_ai_analyses TO service_role;
GRANT ALL ON TABLE public.tasks TO service_role;

-- Separate policies make intended operations explicit and testable.
CREATE POLICY "site_audits_workspace_select" ON public.site_audits
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "site_audits_workspace_insert" ON public.site_audits
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = (SELECT auth.uid()));
CREATE POLICY "site_audits_workspace_update" ON public.site_audits
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "site_audits_workspace_delete" ON public.site_audits
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "audit_findings_workspace_select" ON public.audit_findings
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "audit_findings_workspace_insert" ON public.audit_findings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "audit_findings_workspace_update" ON public.audit_findings
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "audit_findings_workspace_delete" ON public.audit_findings
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "audit_ai_analyses_workspace_select" ON public.audit_ai_analyses
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "audit_ai_analyses_workspace_insert" ON public.audit_ai_analyses
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = (SELECT auth.uid()));
CREATE POLICY "audit_ai_analyses_workspace_update" ON public.audit_ai_analyses
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "audit_ai_analyses_workspace_delete" ON public.audit_ai_analyses
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "tasks_workspace_select" ON public.tasks
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));
CREATE POLICY "tasks_workspace_insert" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(workspace_id) AND created_by = (SELECT auth.uid()));
CREATE POLICY "tasks_workspace_update" ON public.tasks
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE POLICY "tasks_workspace_delete" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(workspace_id));
