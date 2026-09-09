-- Synced from production migration history on 2026-09-10.

CREATE POLICY "evidence own folder write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "evidence own folder update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-evidence' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'project-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "evidence own folder delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "evidence workspace read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-evidence'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.project_evidence e
        WHERE e.storage_path = storage.objects.name
          AND public.is_workspace_member(e.workspace_id)
      )
    )
  );
