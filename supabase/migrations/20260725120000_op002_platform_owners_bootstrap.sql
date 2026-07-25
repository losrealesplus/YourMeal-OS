-- OP-002 · Permanent Platform Owners Bootstrap
-- Auth → Profile → Membership → user_roles → RBAC
-- Idempotent. No new roles/enums. No RBAC bypass.

-- Prevent duplicate platform saas_admin rows (NULL tenant_id breaks UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_saas_admin_uidx
  ON public.user_roles (user_id)
  WHERE role = 'saas_admin' AND tenant_id IS NULL;

CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(trim(coalesce(_email, ''))) IN (
    'alex1409h@gmail.com',
    'alexhdezmtinez@gmail.com'
  );
$$;

COMMENT ON FUNCTION public.is_platform_owner_email(text) IS
  'OP-002: permanent Platform Owner allowlist (emails only; grants via ensure_platform_owner_for_user).';

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
  v_profile_ok boolean := false;
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
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'not_platform_owner',
      'email', v_email
    );
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = 'eatclean-tenerife'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'tenant_missing',
      'tenant_slug', 'eatclean-tenerife',
      'email', v_email
    );
  END IF;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, v_full_name)
  ON CONFLICT (id) DO UPDATE
    SET full_name = CASE
      WHEN public.profiles.full_name IS NULL
        OR btrim(public.profiles.full_name) = ''
      THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END;
  v_profile_ok := true;

  INSERT INTO public.tenant_members (tenant_id, user_id)
  VALUES (v_tenant_id, _user_id)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_member_rows = ROW_COUNT;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'saas_admin'
      AND tenant_id IS NULL
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, NULL, 'saas_admin');
    v_created_saas := true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = v_tenant_id
      AND role = 'company_admin'
  ) THEN
    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_user_id, v_tenant_id, 'company_admin');
    v_created_company := true;
  END IF;

  -- Audit only when something new was granted (idempotent re-runs stay quiet).
  IF v_member_rows > 0 OR v_created_saas OR v_created_company THEN
    INSERT INTO public.audit_log (
      tenant_id, actor_id, entity_type, entity_id, action, new_data
    ) VALUES (
      v_tenant_id,
      _user_id,
      'user_role',
      _user_id,
      'PLATFORM_OWNER_ENSURED',
      jsonb_build_object(
        'email', v_email,
        'tenant_slug', 'eatclean-tenerife',
        'roles', jsonb_build_array('saas_admin', 'company_admin'),
        'via', 'ensure_platform_owner_for_user',
        'created_membership', v_member_rows > 0,
        'created_saas_admin', v_created_saas,
        'created_company_admin', v_created_company
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'applied', true,
    'email', v_email,
    'user_id', _user_id,
    'tenant_id', v_tenant_id,
    'tenant_slug', 'eatclean-tenerife',
    'profile', v_profile_ok,
    'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

COMMENT ON FUNCTION public.ensure_platform_owner_for_user(uuid) IS
  'OP-002: idempotent Platform Owner grants (saas_admin + company_admin on EatClean Tenerife).';

-- First-login path: authenticated caller ensures grants for self only.
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

COMMENT ON FUNCTION public.ensure_platform_owner_session() IS
  'OP-002: session bootstrap for permanent Platform Owners on first login.';

-- Extend signup trigger: profile (existing) + platform-owner grants when email matches.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF public.is_platform_owner_email(NEW.email) THEN
    PERFORM public.ensure_platform_owner_for_user(NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_for_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ensure_platform_owner_session() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_for_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_platform_owner_session() TO authenticated, service_role;

-- Backfill: any existing Auth users already matching the allowlist.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id
    FROM auth.users
    WHERE public.is_platform_owner_email(email)
  LOOP
    PERFORM public.ensure_platform_owner_for_user(r.id);
  END LOOP;
END $$;
