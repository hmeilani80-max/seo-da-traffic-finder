-- Ensure the private evidence bucket exists for GitHub-only Wave 1 deployment.
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-evidence', 'project-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = false;
