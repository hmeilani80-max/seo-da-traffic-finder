ALTER TABLE public.domain_sudah_pernah
  ADD COLUMN IF NOT EXISTS keyword text,
  ADD COLUMN IF NOT EXISTS target_page text,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS price numeric;