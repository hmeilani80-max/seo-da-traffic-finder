-- Internal-only hardening.
-- Existing permissive owner policies are preserved for compatibility, but these
-- restrictive policies require active workspace membership for project-scoped data.

DROP POLICY IF EXISTS projects_internal_workspace_required ON public.projects;
CREATE POLICY projects_internal_workspace_required ON public.projects
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS placement_orders_internal_workspace_required ON public.placement_orders;
CREATE POLICY placement_orders_internal_workspace_required ON public.placement_orders
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS backlinks_internal_workspace_required ON public.backlinks;
CREATE POLICY backlinks_internal_workspace_required ON public.backlinks
  AS RESTRICTIVE
  FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(workspace_id));
