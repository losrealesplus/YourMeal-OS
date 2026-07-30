ALTER TYPE public.invitation_status ADD VALUE IF NOT EXISTS 'cancelled';

COMMENT ON COLUMN public.tenant_members.id IS 'Operational membership identity (membership_id).';

ALTER TABLE public.employee_profiles ADD COLUMN IF NOT EXISTS membership_id uuid;

ALTER TABLE public.user_invitations
  ADD COLUMN IF NOT EXISTS membership_id uuid,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resent_at timestamptz,
  ADD COLUMN IF NOT EXISTS resent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resent_count integer NOT NULL DEFAULT 0;

UPDATE public.employee_profiles ep
SET membership_id = tm.id
FROM public.tenant_members tm
WHERE ep.membership_id IS NULL AND ep.user_id = tm.user_id AND ep.tenant_id = tm.tenant_id;

UPDATE public.user_invitations ui
SET membership_id = tm.id
FROM public.tenant_members tm
WHERE ui.membership_id IS NULL AND ui.user_id = tm.user_id AND ui.tenant_id = tm.tenant_id;

CREATE INDEX IF NOT EXISTS employee_profiles_membership_id_idx ON public.employee_profiles (membership_id);
CREATE INDEX IF NOT EXISTS user_invitations_membership_id_idx ON public.user_invitations (membership_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employee_profiles_membership_id_fkey') THEN
    ALTER TABLE public.employee_profiles
      ADD CONSTRAINT employee_profiles_membership_id_fkey
      FOREIGN KEY (membership_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'employee_profiles.membership_id FK skipped: %', SQLERRM;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reactivated_at timestamptz,
  ADD COLUMN IF NOT EXISTS reactivated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.current_user_tenants()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'approved' AND deleted_at IS NULL
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id
      AND status = 'approved' AND deleted_at IS NULL
  ) OR public.is_saas_admin(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.current_membership_id(_tenant_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.tenant_members
  WHERE user_id = auth.uid() AND tenant_id = _tenant_id
    AND status = 'approved' AND deleted_at IS NULL
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.current_membership_id(uuid) TO authenticated, service_role;

CREATE TYPE public.identity_event_type AS ENUM (
  'USER_REGISTERED','PROFILE_CREATED','PROFILE_UPDATED',
  'INVITATION_SENT','INVITATION_RESENT','INVITATION_ACCEPTED','INVITATION_EXPIRED',
  'INVITATION_CANCELLED','INVITATION_REVOKED',
  'MEMBERSHIP_CREATED','MEMBERSHIP_APPROVED','MEMBERSHIP_REJECTED','MEMBERSHIP_SUSPENDED',
  'MEMBERSHIP_REVOKED','MEMBERSHIP_REACTIVATED','MEMBERSHIP_ARCHIVED',
  'ROLE_ASSIGNED','ROLE_REMOVED','USER_LAST_LOGIN','PASSWORD_RESET',
  'EMAIL_CHANGED','PHONE_CHANGED','ACCESS_DENIED_INCONSISTENT'
);

CREATE TABLE public.identity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  membership_id uuid,
  event_type public.identity_event_type NOT NULL,
  performed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS identity_events_tenant_user_idx ON public.identity_events (tenant_id, user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS identity_events_membership_idx ON public.identity_events (membership_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS identity_events_type_idx ON public.identity_events (event_type, performed_at DESC);

GRANT SELECT ON public.identity_events TO authenticated;
GRANT ALL ON public.identity_events TO service_role;
ALTER TABLE public.identity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS identity_events_admin_read ON public.identity_events;
CREATE POLICY identity_events_admin_read ON public.identity_events FOR SELECT
  USING (
    public.is_saas_admin(auth.uid())
    OR (tenant_id IS NOT NULL AND (
      public.has_role(auth.uid(), tenant_id, 'company_admin')
      OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    ))
    OR user_id = auth.uid()
  );

COMMENT ON TABLE public.identity_events IS 'Business identity audit / Activity Timeline.';