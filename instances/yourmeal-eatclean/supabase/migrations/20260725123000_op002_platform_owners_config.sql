-- OP-002.1 · Platform Owners as bootstrap configuration (not hardcoded app logic)
-- Source of operational truth: config/bootstrap/platform-owners.json
-- Runtime allowlist: public.platform_owners (synced by npm run seed:platform-owners)

CREATE TABLE IF NOT EXISTS public.platform_owners (
  email text PRIMARY KEY,
  full_name text,
  tenant_slug text NOT NULL DEFAULT 'eatclean-tenerife',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_owners_email_lower CHECK (email = lower(btrim(email))),
  CONSTRAINT platform_owners_tenant_slug_format CHECK (tenant_slug ~ '^[a-z0-9-]+$')
);

COMMENT ON TABLE public.platform_owners IS
  'OP-002: bootstrap allowlist for Platform Owners. Synced from config/bootstrap/platform-owners.json — do not hardcode emails in application source.';

CREATE INDEX IF NOT EXISTS platform_owners_active_idx
  ON public.platform_owners (email)
  WHERE active;

GRANT ALL ON public.platform_owners TO service_role;
-- No direct client reads — emails stay out of the browser bundle / RLS surface.
REVOKE ALL ON public.platform_owners FROM PUBLIC, anon, authenticated;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;

-- Initial bootstrap rows (match config/bootstrap/platform-owners.json).
-- Future ownership changes: edit the JSON config and re-run seed:platform-owners.
INSERT INTO public.platform_owners (email, full_name, tenant_slug, active)
VALUES
  ('alex1409h@gmail.com', 'Alex Hernandez', 'eatclean-tenerife', true),
  ('alexhdezmtinez@gmail.com', 'Alex Hdez Martinez', 'eatclean-tenerife', true)
ON CONFLICT (email) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      tenant_slug = EXCLUDED.tenant_slug,
      active = true,
      updated_at = now();

-- Allowlist now reads configuration table (was hardcoded IMMUTABLE list).
CREATE OR REPLACE FUNCTION public.is_platform_owner_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_owners po
    WHERE po.active
      AND po.email = lower(trim(coalesce(_email, '')))
  );
$$;

COMMENT ON FUNCTION public.is_platform_owner_email(text) IS
  'OP-002: true when email is an active row in public.platform_owners (bootstrap config).';

CREATE OR REPLACE FUNCTION public.ensure_platform_owner_for_user(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_tenant_id uuid;
  v_tenant_slug text;
  v_full_name text;
  v_owner_name text;
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
           NULL
         )
    INTO v_email, v_full_name
  FROM auth.users u
  WHERE u.id = _user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'auth_user_not_found');
  END IF;

  SELECT po.full_name, po.tenant_slug
    INTO v_owner_name, v_tenant_slug
  FROM public.platform_owners po
  WHERE po.active
    AND po.email = v_email;

  IF v_tenant_slug IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'not_platform_owner',
      'email', v_email
    );
  END IF;

  v_full_name := coalesce(v_full_name, v_owner_name, 'Platform Owner');

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = v_tenant_slug
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'tenant_missing',
      'tenant_slug', v_tenant_slug,
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
        'tenant_slug', v_tenant_slug,
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
    'tenant_slug', v_tenant_slug,
    'profile', v_profile_ok,
    'membership', true,
    'roles', jsonb_build_array('saas_admin', 'company_admin'),
    'created_membership', v_member_rows > 0,
    'created_saas_admin', v_created_saas,
    'created_company_admin', v_created_company
  );
END;
$$;

-- Revoke Platform Owner grants when an email is removed/deactivated from bootstrap config.
CREATE OR REPLACE FUNCTION public.revoke_platform_owner_for_email(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(_email, '')));
  v_user_id uuid;
  v_tenant_slug text;
  v_tenant_id uuid;
  v_removed_saas int := 0;
  v_removed_company int := 0;
BEGIN
  IF v_email = '' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'missing_email');
  END IF;

  SELECT po.tenant_slug INTO v_tenant_slug
  FROM public.platform_owners po
  WHERE po.email = v_email;

  IF v_tenant_slug IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'applied', false, 'reason', 'unknown_email');
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(trim(u.email)) = v_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'applied', false,
      'reason', 'auth_user_not_found',
      'email', v_email
    );
  END IF;

  SELECT t.id INTO v_tenant_id
  FROM public.tenants t
  WHERE t.slug = v_tenant_slug
  LIMIT 1;

  DELETE FROM public.user_roles
  WHERE user_id = v_user_id
    AND role = 'saas_admin'
    AND tenant_id IS NULL;
  GET DIAGNOSTICS v_removed_saas = ROW_COUNT;

  IF v_tenant_id IS NOT NULL THEN
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id
      AND role = 'company_admin'
      AND tenant_id = v_tenant_id;
    GET DIAGNOSTICS v_removed_company = ROW_COUNT;
  END IF;

  IF v_removed_saas > 0 OR v_removed_company > 0 THEN
    INSERT INTO public.audit_log (
      tenant_id, actor_id, entity_type, entity_id, action, new_data
    ) VALUES (
      v_tenant_id,
      v_user_id,
      'user_role',
      v_user_id,
      'PLATFORM_OWNER_REVOKED',
      jsonb_build_object(
        'email', v_email,
        'tenant_slug', v_tenant_slug,
        'removed_saas_admin', v_removed_saas > 0,
        'removed_company_admin', v_removed_company > 0,
        'via', 'revoke_platform_owner_for_email'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'applied', v_removed_saas > 0 OR v_removed_company > 0,
    'email', v_email,
    'user_id', v_user_id,
    'removed_saas_admin', v_removed_saas > 0,
    'removed_company_admin', v_removed_company > 0
  );
END;
$$;

COMMENT ON FUNCTION public.revoke_platform_owner_for_email(text) IS
  'OP-002: revoke saas_admin + bootstrap-tenant company_admin when ownership config drops an email.';

REVOKE ALL ON FUNCTION public.revoke_platform_owner_for_email(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_platform_owner_for_email(text) TO service_role;

REVOKE ALL ON FUNCTION public.is_platform_owner_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_owner_email(text) TO authenticated, service_role;

-- Backfill: Auth users whose email is an active Platform Owner in config table.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id
    FROM auth.users u
    WHERE public.is_platform_owner_email(u.email)
  LOOP
    PERFORM public.ensure_platform_owner_for_user(r.id);
  END LOOP;
END $$;
