-- Synced from production migration history on 2026-09-10.

CREATE OR REPLACE FUNCTION public.set_workspace_from_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND auth.uid() IS NOT NULL THEN
    SELECT m.workspace_id INTO NEW.workspace_id
    FROM public.app_workspace_members m
    WHERE m.user_id = auth.uid() AND m.status = 'active'
    ORDER BY m.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_from_membership() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS set_workspace_projects ON public.projects;
CREATE TRIGGER set_workspace_projects BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_from_membership();

DROP TRIGGER IF EXISTS set_workspace_placement_orders ON public.placement_orders;
CREATE TRIGGER set_workspace_placement_orders BEFORE INSERT ON public.placement_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_from_membership();

DROP TRIGGER IF EXISTS set_workspace_backlinks ON public.backlinks;
CREATE TRIGGER set_workspace_backlinks BEFORE INSERT ON public.backlinks
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_from_membership();
