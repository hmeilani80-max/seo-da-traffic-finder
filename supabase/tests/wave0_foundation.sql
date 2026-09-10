-- Wave 0 foundation verification (read-only assertions).
-- Safe to run against production: this script does not create, update, or delete application data.

DO $$
DECLARE
  missing_tables text;
BEGIN
  SELECT string_agg(req.table_name, ', ' ORDER BY req.table_name)
  INTO missing_tables
  FROM (VALUES
    ('app_workspaces'),
    ('app_workspace_members'),
    ('project_evidence'),
    ('data_imports')
  ) AS req(table_name)
  LEFT JOIN pg_class c
    ON c.relname = req.table_name
   AND c.relkind = 'r'
  LEFT JOIN pg_namespace n
    ON n.oid = c.relnamespace
   AND n.nspname = 'public'
  WHERE c.oid IS NULL OR n.oid IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Wave 0 missing required tables: %', missing_tables;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'projects',
        'placement_orders',
        'backlinks',
        'app_workspaces',
        'app_workspace_members',
        'project_evidence',
        'data_imports'
      )
      AND c.relkind = 'r'
      AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'Wave 0 requires RLS on all project/workspace foundation tables';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.app_workspaces
    WHERE slug = 'internal-seo-team'
  ) THEN
    RAISE EXCEPTION 'Wave 0 internal workspace is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.app_workspace_members
    WHERE status = 'active'
  ) THEN
    RAISE EXCEPTION 'Wave 0 has no active workspace member';
  END IF;

  IF EXISTS (SELECT 1 FROM public.projects WHERE workspace_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.placement_orders WHERE workspace_id IS NULL)
     OR EXISTS (SELECT 1 FROM public.backlinks WHERE workspace_id IS NULL) THEN
    RAISE EXCEPTION 'Wave 0 found project-scoped rows without workspace_id';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id = 'project-evidence'
      AND public = false
  ) THEN
    RAISE EXCEPTION 'Wave 0 project-evidence bucket is missing or public';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE NOT t.tgisinternal
      AND t.tgname IN (
        'set_workspace_projects',
        'set_workspace_placement_orders',
        'set_workspace_backlinks'
      )
  ) <> 3 THEN
    RAISE EXCEPTION 'Wave 0 automatic workspace assignment triggers are incomplete';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'evidence own folder write',
        'evidence own folder update',
        'evidence own folder delete',
        'evidence workspace read'
      )
  ) <> 4 THEN
    RAISE EXCEPTION 'Wave 0 evidence Storage policies are incomplete';
  END IF;

  IF has_function_privilege('anon', 'public.is_workspace_member(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Wave 0 is_workspace_member must not be executable by anon';
  END IF;

  IF NOT has_function_privilege(
    'authenticated',
    'public.is_workspace_member(uuid)',
    'EXECUTE'
  ) THEN
    RAISE EXCEPTION 'Wave 0 is_workspace_member must be executable by authenticated';
  END IF;
END $$;

SELECT
  'PASS' AS wave0_foundation,
  (SELECT count(*) FROM public.app_workspaces) AS workspaces,
  (SELECT count(*) FROM public.app_workspace_members WHERE status = 'active') AS active_members,
  (SELECT count(*) FROM auth.users) AS auth_users,
  (SELECT count(*) FROM public.projects WHERE workspace_id IS NULL) AS orphan_projects,
  (SELECT count(*) FROM public.placement_orders WHERE workspace_id IS NULL) AS orphan_placement_orders,
  (SELECT count(*) FROM public.backlinks WHERE workspace_id IS NULL) AS orphan_backlinks;
