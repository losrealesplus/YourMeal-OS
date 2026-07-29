CREATE TYPE public.membership_status AS ENUM ('pending','approved','rejected','suspended','revoked');
CREATE TYPE public.membership_type AS ENUM ('customer','employee','supplier','company','company_employee');
CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','expired','revoked');
CREATE TYPE public.provisioning_channel AS ENUM ('self_registration','invitation','provisioning');

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

COMMENT ON TABLE public.profiles IS 'Global person profile (1:1 with auth.users). Not tenant-scoped. Identity != Profile.';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON public.profiles (phone)
  WHERE phone IS NOT NULL AND length(trim(phone)) > 0;

ALTER TABLE public.tenant_members
  ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS membership_type public.membership_type NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS status public.membership_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provisioning_channel public.provisioning_channel NOT NULL DEFAULT 'provisioning',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.tenant_members
SET approved_at = COALESCE(approved_at, joined_at, now()),
    created_at = COALESCE(created_at, joined_at, now())
WHERE status = 'approved';

CREATE UNIQUE INDEX IF NOT EXISTS tenant_members_id_unique ON public.tenant_members (id);

COMMENT ON TABLE public.tenant_members IS 'Membership Persona-Tenant. Access requires status=approved AND a Role. Create != access.';

CREATE OR REPLACE FUNCTION public.current_user_tenants()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.tenant_members
  WHERE user_id = auth.uid() AND status = 'approved'
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND tenant_id = _tenant_id AND status = 'approved'
  ) OR public.is_saas_admin(auth.uid())
$$;

CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  membership_type public.membership_type NOT NULL,
  intended_role public.app_role,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  channel public.provisioning_channel NOT NULL DEFAULT 'invitation',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  accepted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_invitations_pending_unique
  ON public.user_invitations (tenant_id, lower(email)) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS user_invitations_tenant_idx ON public.user_invitations (tenant_id);

GRANT SELECT ON public.user_invitations TO authenticated;
GRANT ALL ON public.user_invitations TO service_role;
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_invitations_admin_read ON public.user_invitations FOR SELECT
  USING (
    public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin')
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
  );

CREATE TABLE public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department text,
  position text,
  employee_number text,
  hire_date date,
  manager_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

GRANT SELECT ON public.employee_profiles TO authenticated;
GRANT ALL ON public.employee_profiles TO service_role;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_profiles_self_or_admin_read ON public.employee_profiles FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_saas_admin(auth.uid())
    OR public.has_role(auth.uid(), tenant_id, 'company_admin')
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
  );

COMMENT ON TABLE public.employee_profiles IS 'Employment data for tenant staff. Separate from Identity, Profile, Membership, and Role.';