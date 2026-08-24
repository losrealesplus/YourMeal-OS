-- Re-assert dish schema alignment to trigger types.ts regeneration.
ALTER TABLE public.dishes
  ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT 'legacy-uncategorized',
  ADD COLUMN IF NOT EXISTS recipe_id text NULL,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'dish_status' AND e.enumlabel = 'inactive'
  ) THEN
    ALTER TYPE public.dish_status ADD VALUE 'inactive';
  END IF;
END $$;