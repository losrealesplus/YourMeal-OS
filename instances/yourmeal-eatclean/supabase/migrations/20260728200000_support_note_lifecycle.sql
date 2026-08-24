-- EP-OPS-003 Support Correction: issue lifecycle (resolve → close)
-- Enables Outcome "Issues Resolved" without redesigning Auth/RBAC.

DO $$ BEGIN
  CREATE TYPE public.support_note_status AS ENUM ('open', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.support_notes
  ADD COLUMN IF NOT EXISTS status public.support_note_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

COMMENT ON COLUMN public.support_notes.status IS
  'Support case lifecycle: open → resolved → closed (EP-OPS-003 Issues Resolved)';

CREATE INDEX IF NOT EXISTS support_notes_tenant_status_kind_idx
  ON public.support_notes (tenant_id, status, kind)
  WHERE deleted_at IS NULL;
