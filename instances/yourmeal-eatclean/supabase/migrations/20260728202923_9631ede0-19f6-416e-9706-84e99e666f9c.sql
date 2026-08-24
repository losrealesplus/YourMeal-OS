DO $$ BEGIN
  CREATE TYPE public.support_note_status AS ENUM ('open', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.support_notes
  ADD COLUMN IF NOT EXISTS status public.support_note_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS support_notes_tenant_status_kind_idx
  ON public.support_notes (tenant_id, status, kind)
  WHERE deleted_at IS NULL;