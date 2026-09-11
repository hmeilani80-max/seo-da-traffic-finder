-- Wave 2 Comprehensive Site Audit verification.
-- Production-safe: creates isolated rows and removes them in the same transaction scope.

DO $$
DECLARE
  v_ws uuid;
  v_user uuid;
  v_project uuid;
  v_audit uuid;
  v_finding uuid;
  v_analysis uuid;
  v_task uuid;
  v_marker text := '__wave2_uat_' || replace(gen_random_uuid()::text, '-', '') || '__';
  v_table text;
BEGIN
  SELECT id INTO v_ws
  FROM public.app_workspaces
  WHERE slug = 'internal-seo-team'
  LIMIT 1;

  SELECT id INTO v_user
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_ws IS NULL OR v_user IS NULL THEN
    RAISE EXCEPTION 'Wave 2 prerequisites missing: internal workspace or auth user';
  END IF;

  FOREACH v_table IN ARRAY ARRAY['site_audits', 'audit_findings', 'audit_ai_analyses', 'tasks']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = v_table AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on %', v_table;
    END IF;

    IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = v_table) < 4 THEN
      RAISE EXCEPTION 'Expected explicit CRUD RLS policies on %', v_table;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND table_name = v_table
        AND grantee = 'anon'
    ) THEN
      RAISE EXCEPTION 'anon must not have table grants on %', v_table;
    END IF;
  END LOOP;

  INSERT INTO public.projects (
    workspace_id, user_id, name, client_domain, lifecycle_status
  ) VALUES (
    v_ws, v_user, v_marker, 'example.com', 'assessment'
  ) RETURNING id INTO v_project;

  INSERT INTO public.site_audits (
    workspace_id, project_id, created_by, target_url, status,
    source_summary, summary, completed_at
  ) VALUES (
    v_ws, v_project, v_user, 'https://example.com/', 'partial',
    '{"method":"public_crawl","pages_succeeded":1}'::jsonb,
    '{"total_findings":1,"issue":1}'::jsonb,
    now()
  ) RETURNING id INTO v_audit;

  INSERT INTO public.audit_findings (
    workspace_id, project_id, audit_id, category, check_key, title,
    status, url, evidence, source_type, source_ref
  ) VALUES (
    v_ws, v_project, v_audit, 'Metadata', 'title:0', 'Title tag tersedia',
    'issue', 'https://example.com/', '{"title":null,"length":0}'::jsonb,
    'public_crawl', 'https://example.com/'
  ) RETURNING id INTO v_finding;

  INSERT INTO public.audit_ai_analyses (
    workspace_id, project_id, audit_id, provider, status,
    input_summary, output, created_by
  ) VALUES (
    v_ws, v_project, v_audit, 'openai', 'ok',
    '{"finding_count":1}'::jsonb,
    '{"executiveSummary":"UAT","priorityOrder":["title:0"],"issueAnalyses":[],"nextActions":["Fix title"]}'::jsonb,
    v_user
  ) RETURNING id INTO v_analysis;

  INSERT INTO public.tasks (
    workspace_id, project_id, title, description, status, priority,
    source_type, source_id, source_refs, created_by
  ) VALUES (
    v_ws, v_project, 'Title tag tersedia', 'Wave 2 UAT', 'todo', 'high',
    'audit_finding', v_finding,
    jsonb_build_array(jsonb_build_object('type','audit_finding','id',v_finding,'audit_id',v_audit)),
    v_user
  ) RETURNING id INTO v_task;

  IF NOT EXISTS (
    SELECT 1 FROM public.site_audits
    WHERE id = v_audit AND project_id = v_project AND status = 'partial'
  ) THEN
    RAISE EXCEPTION 'Site Audit persistence failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.audit_findings
    WHERE id = v_finding AND audit_id = v_audit AND status = 'issue'
      AND evidence->>'length' = '0'
  ) THEN
    RAISE EXCEPTION 'Factual finding persistence failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.audit_ai_analyses
    WHERE id = v_analysis AND audit_id = v_audit AND provider = 'openai'
  ) THEN
    RAISE EXCEPTION 'AI analysis separation failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.tasks
    WHERE id = v_task AND source_type = 'audit_finding' AND source_id = v_finding
      AND status = 'todo'
  ) THEN
    RAISE EXCEPTION 'Audit to Task persistence failed';
  END IF;

  -- Project deletion cascades through Wave 2 project-scoped rows.
  DELETE FROM public.projects WHERE id = v_project;
END $$;

SELECT
  (SELECT count(*) FROM public.projects WHERE name LIKE '__wave2_uat_%__') AS residual_projects,
  (SELECT count(*) FROM public.site_audits a JOIN public.projects p ON p.id = a.project_id WHERE p.name LIKE '__wave2_uat_%__') AS residual_audits,
  (SELECT count(*) FROM public.tasks t JOIN public.projects p ON p.id = t.project_id WHERE p.name LIKE '__wave2_uat_%__') AS residual_tasks;
