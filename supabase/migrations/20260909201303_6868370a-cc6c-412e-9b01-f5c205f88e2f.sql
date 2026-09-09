-- Synced from production migration history on 2026-09-10.
-- Wave 1: Project workspace foundation.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS objectives text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_market text,
  ADD COLUMN IF NOT EXISTS current_problem text,
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS budget_indication text,
  ADD COLUMN IF NOT EXISTS competitors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS discovery_notes text;

CREATE TABLE IF NOT EXISTS public.project_intelligence_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'lovable',
  model text,
  status text NOT NULL DEFAULT 'ok',
  error text,
  input_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_intelligence_runs TO authenticated;
GRANT ALL ON public.project_intelligence_runs TO service_role;
ALTER TABLE public.project_intelligence_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_intelligence_runs_workspace_members"
  ON public.project_intelligence_runs FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER update_project_intelligence_runs_updated_at
  BEFORE UPDATE ON public.project_intelligence_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.project_field_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  run_id uuid REFERENCES public.project_intelligence_runs(id) ON DELETE SET NULL,
  field text NOT NULL,
  suggested_value text NOT NULL,
  rationale text,
  status text NOT NULL DEFAULT 'pending',
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_field_suggestions TO authenticated;
GRANT ALL ON public.project_field_suggestions TO service_role;
ALTER TABLE public.project_field_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_field_suggestions_workspace_members"
  ON public.project_field_suggestions FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER update_project_field_suggestions_updated_at
  BEFORE UPDATE ON public.project_field_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.project_data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.app_workspaces(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  status text NOT NULL DEFAULT 'not_connected',
  notes text,
  updated_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, source_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_data_sources TO authenticated;
GRANT ALL ON public.project_data_sources TO service_role;
ALTER TABLE public.project_data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_data_sources_workspace_members"
  ON public.project_data_sources FOR ALL TO authenticated
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));
CREATE TRIGGER update_project_data_sources_updated_at
  BEFORE UPDATE ON public.project_data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_intelligence_runs_project ON public.project_intelligence_runs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_suggestions_project ON public.project_field_suggestions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_evidence_project ON public.project_evidence(project_id, created_at DESC);
