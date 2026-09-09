-- Runtime policy: OpenAI only for generative AI workflows.
-- Additive/idempotent so it is safe whether Wave 1 tables were already applied or not.

DO $$
BEGIN
  IF to_regclass('public.project_intelligence_runs') IS NOT NULL THEN
    ALTER TABLE public.project_intelligence_runs
      ALTER COLUMN provider SET DEFAULT 'openai';
  END IF;
END $$;
