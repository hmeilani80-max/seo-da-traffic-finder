-- Wave 1 Project Workspace verification.
-- Production-safe: creates uniquely named UAT rows and removes them in the same DO statement.
-- If an assertion fails, the DO statement is rolled back automatically.

DO $$
DECLARE
  v_ws uuid;
  v_user uuid;
  v_project uuid;
  v_run uuid;
  v_suggestion uuid;
  v_import uuid;
  v_marker text := '__wave1_uat_' || replace(gen_random_uuid()::text, '-', '') || '__';
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
    RAISE EXCEPTION 'Wave 1 prerequisites missing: internal workspace or auth user';
  END IF;

  INSERT INTO public.projects (
    workspace_id, user_id, name, client_domain, lifecycle_status
  ) VALUES (
    v_ws, v_user, v_marker, 'example.com', 'prospect'
  ) RETURNING id INTO v_project;

  UPDATE public.projects
  SET industry = 'Test Industry',
      objectives = ARRAY['Objective A'],
      target_market = 'Test Market',
      current_problem = 'Test Problem',
      contact_person = 'Test Contact',
      budget_indication = 'Manual',
      competitors = ARRAY['competitor.example'],
      discovery_notes = 'Test note',
      lifecycle_status = 'assessment'
  WHERE id = v_project;

  INSERT INTO public.project_evidence (
    workspace_id, project_id, created_by, source_type, title, source_url,
    raw_text, processing_status, extracted_metadata
  ) VALUES (
    v_ws, v_project, v_user, 'link', v_marker, 'https://example.com',
    'Grounded evidence text', 'ready', '{"uat":true}'::jsonb
  );

  INSERT INTO public.project_data_sources (
    workspace_id, project_id, source_key, status, notes, updated_by
  ) VALUES (
    v_ws, v_project, 'google_search_console', 'available', v_marker, v_user
  );

  INSERT INTO public.data_imports (
    workspace_id, project_id, module, source_type, original_filename,
    mapping, normalization_summary, status, created_by
  ) VALUES (
    v_ws, v_project, 'project_competitors', 'csv_upload', v_marker || '.csv',
    '{"domain":"domain"}'::jsonb,
    '{"raw_count":1,"valid_count":1,"normalized_domains":["competitor.example"]}'::jsonb,
    'confirmed', v_user
  ) RETURNING id INTO v_import;

  INSERT INTO public.project_intelligence_runs (
    workspace_id, project_id, provider, status, input_summary, output, created_by
  ) VALUES (
    v_ws, v_project, 'openai', 'ok', '{"evidence_count":1}'::jsonb,
    '{"businessUnderstanding":"UAT","recommendedNextActions":["Review"]}'::jsonb,
    v_user
  ) RETURNING id INTO v_run;

  INSERT INTO public.project_field_suggestions (
    workspace_id, project_id, run_id, field, suggested_value, rationale, status
  ) VALUES (
    v_ws, v_project, v_run, 'industry', 'Suggested Industry', 'UAT', 'pending'
  ) RETURNING id INTO v_suggestion;

  UPDATE public.projects
  SET industry = 'Suggested Industry'
  WHERE id = v_project;

  UPDATE public.project_field_suggestions
  SET status = 'accepted', decided_by = v_user, decided_at = now()
  WHERE id = v_suggestion;

  IF NOT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = v_project
      AND lifecycle_status = 'assessment'
      AND industry = 'Suggested Industry'
      AND objectives = ARRAY['Objective A']
      AND competitors = ARRAY['competitor.example']
  ) THEN
    RAISE EXCEPTION 'Wave 1 progressive Project update failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_evidence
    WHERE project_id = v_project AND processing_status = 'ready'
  ) THEN
    RAISE EXCEPTION 'Wave 1 Evidence persistence failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_data_sources
    WHERE project_id = v_project
      AND source_key = 'google_search_console'
      AND status = 'available'
  ) THEN
    RAISE EXCEPTION 'Wave 1 Data Source Registry failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.data_imports
    WHERE id = v_import AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Wave 1 structured import persistence failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_intelligence_runs
    WHERE id = v_run AND status = 'ok'
  ) THEN
    RAISE EXCEPTION 'Wave 1 intelligence run persistence failed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.project_field_suggestions
    WHERE id = v_suggestion AND status = 'accepted'
  ) THEN
    RAISE EXCEPTION 'Wave 1 suggestion decision failed';
  END IF;

  -- data_imports does not cascade-delete with a Project, so remove it first.
  DELETE FROM public.data_imports WHERE id = v_import;
  DELETE FROM public.projects WHERE id = v_project;
END $$;

-- Final residue check. Expected result: all zeros.
SELECT
  (SELECT count(*) FROM public.projects WHERE name LIKE '__wave1_uat_%__') AS residual_projects,
  (SELECT count(*) FROM public.project_evidence WHERE title LIKE '__wave1_uat_%__') AS residual_evidence,
  (SELECT count(*) FROM public.data_imports WHERE original_filename LIKE '__wave1_uat_%__.csv') AS residual_imports;
