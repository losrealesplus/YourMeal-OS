-- Part 1: enum catch-up (values only, no usage in this migration)
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'prepared';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivery_issue';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';

-- Part 2: soft-delete columns (ADR 0006)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.customer_addresses ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_tenant_active_idx
  ON public.orders (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS customers_tenant_active_idx
  ON public.customers (tenant_id) WHERE deleted_at IS NULL;

-- Part 3: B2B / delivery columns on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_address_id uuid REFERENCES public.customer_addresses(id) ON DELETE SET NULL;

-- Part 4: OP-002 platform owner bootstrap functions
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_saas_admin_uidx
  ON public.user_roles (user_id)
  WHERE role = 'saas_admin' AND tenant_id IS NULL;

CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT false;
$$;

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_for_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_tenant_id uuid;
  v_full_name text;
  v_created_saas boolean := false;
  v_created_company boolean := false;
  v_member_rows int := 0;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_user_id');
  END IF;

  SELECT lower(trim(u.email)),
         coalesce(
           nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
           nullif(trim(u.raw_user_meta_data->>'name'), ''),
           'Platform Owner'
         )
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = _user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
  END IF;

  IF NOT public.is_platform_owner_email(v_email) THEN
    RETURN jsonb_build_object('ok', true, 'applied', false, 'reason', 'not_platform_owner', 'email', v_email);
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = 'eatclean-tenerife'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'tenant_missing', 'email', v_email);
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, v_full_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
      WHEN public.profiles.full_name IS NULL OR btrim(public.profiles.full_name) = ''
      THEN EXCLUDED.full_name ELSE public.profiles.full_name END;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, _user_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_member_rows = ROW_COUNT;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'saas_admin' AND tenant_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, NULL, 'saas_admin');
    v_created_saas := true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = v_tenant_id AND role = 'company_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, v_tenant_id, 'company_admin');
    v_created_company := true;
  END IF;

  IF v_member_rows > 0 OR v_created_saas OR v_created_company THEN
    INSERT INTO public.audit_log (tenant_id, actor_id, entity_type, entity_id, action, new_data)
    VALUES (
      v_tenant_id, _user_id, 'user_role', _user_id, 'PLATFORM_OWNER_ENSURED',
      jsonb_build_object(
        'email', v_email,
        'via', 'ensure_platform_owner_for_user',
        'created_membership', v_member_rows > 0,
        'created_saas_admin', v_created_saas,
        'created_company_admin', v_created_company
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'applied', true, 'email', v_email, 'user_id', _user_id,
    'tenant_id', v_tenant_id, 'tenant_slug', 'eatclean-tenerife',
    'profile', true, 'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  RETURN public.ensure_platform_owner_for_user(v_uid);
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_for_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_session() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_for_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_session() TO authenticated, service_role;