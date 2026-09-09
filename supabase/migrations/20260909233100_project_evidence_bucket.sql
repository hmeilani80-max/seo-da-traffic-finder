-- Mirror the existing production Storage bucket so a clean environment can
-- reproduce the Wave 0 evidence foundation. Kept idempotent because the bucket
-- already exists in production.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-evidence', 'project-evidence', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;
