-- Repair discovered during manual Wave 0/1 validation on 2026-09-10.
-- Production had an internal workspace and two existing auth users, but zero
-- workspace memberships. This intentionally provisions only accounts that
-- existed before the repair cutoff; future public signups are NOT auto-joined.

WITH target_workspace AS (
  SELECT id
  FROM public.app_workspaces
  WHERE slug = 'internal-seo-team'
  LIMIT 1
)
INSERT INTO public.app_workspace_members (workspace_id, user_id, role, status)
SELECT tw.id, u.id, 'member', 'active'
FROM target_workspace tw
CROSS JOIN auth.users u
WHERE u.created_at < TIMESTAMPTZ '2026-09-10 00:00:00+00'
ON CONFLICT (workspace_id, user_id) DO NOTHING;
