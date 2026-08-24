-- Phase 2.3 — Trusted Deployment → Tenant binding (MVP minimum).
--
-- PRODUCT LOCKS:
--   RULE 016 — Deployment → Tenant is SaaS-only, server-side
--   BrandConfig / client appId are NOT authority (lookup claim only)
--   ADR 0018 — association creates pending only; never auto-approve
--   Customer never supplies tenant_id
--
-- Scope:
--   - tenant_deployments registry
--   - request_tenant_association_for_deployment (authenticated)
--   - seed EatClean Android/iOS package → EatClean Tenerife
--   - SaaS-only write via RLS + upsert RPC for saas_admin

CREATE TABLE IF NOT EXISTS public.tenant_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  identifier text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_deployments_platform_identifier_uidx UNIQUE (platform, identifier)
);

COMMENT ON TABLE public.tenant_deployments IS
  'Phase 2.3 SaaS-administered Deployment Registry. Maps platform+identifier → tenant_id.';

CREATE INDEX IF NOT EXISTS tenant_deployments_tenant_idx
  ON public.tenant_deployments (tenant_id);

ALTER TABLE public.tenant_deployments ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.tenant_deployments TO authenticated;
GRANT ALL ON public.tenant_deployments TO service_role;

-- Authenticated may read active rows (resolve path uses SECURITY DEFINER RPC anyway).
CREATE POLICY tenant_deployments_select ON public.tenant_deployments
  FOR SELECT TO authenticated
  USING (true);

-- Writes only via saas_admin (or service_role / SECURITY DEFINER helpers).
CREATE POLICY tenant_deployments_saas_write ON public.tenant_deployments
  FOR ALL TO authenticated
  USING (public.is_saas_admin(auth.uid()))
  WITH CHECK (public.is_saas_admin(auth.uid()));

-- Seed EatClean Tenerife package identity (idempotent).
INSERT INTO public.tenant_deployments (tenant_id, platform, identifier, is_primary, status)
SELECT t.id, p.platform, p.identifier, true, 'active'
FROM public.tenants t
CROSS JOIN (
  VALUES
    ('android', 'com.yourmealos.eatclean'),
    ('ios', 'com.yourmealos.eatclean')
) AS p(platform, identifier)
WHERE t.id = '7823e85a-986f-401f-9bbe-e4e431ff3be1'
ON CONFLICT (platform, identifier) DO UPDATE
SET
  tenant_id = EXCLUDED.tenant_id,
  status = 'active',
  is_primary = EXCLUDED.is_primary,
  updated_at = now();

-- Cold association via deployment claim (no client tenant_id).
CREATE OR REPLACE FUNCTION public.request_tenant_association_for_deployment(
  p_platform text,
  p_identifier text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_platform text;
  v_identifier text;
  v_tenant_id uuid;
  v_tenant_name text;
  v_tenant_status public.tenant_status;
  v_membership_id uuid;
  v_status public.membership_status;
  v_created boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_platform := lower(btrim(COALESCE(p_platform, '')));
  v_identifier := btrim(COALESCE(p_identifier, ''));

  IF v_platform NOT IN ('android', 'ios', 'web') THEN
    RAISE EXCEPTION 'invalid deployment platform';
  END IF;

  IF v_identifier = '' OR char_length(v_identifier) > 255 THEN
    RAISE EXCEPTION 'invalid deployment identifier';
  END IF;

  SELECT d.tenant_id, t.name, t.status
  INTO v_tenant_id, v_tenant_name, v_tenant_status
  FROM public.tenant_deployments d
  JOIN public.tenants t ON t.id = d.tenant_id
  WHERE d.platform = v_platform
    AND d.identifier = v_identifier
    AND d.status = 'active'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'deployment not found';
  END IF;

  IF v_tenant_status IS DISTINCT FROM 'active'::public.tenant_status THEN
    RAISE EXCEPTION 'tenant not available';
  END IF;

  SELECT tm.id, tm.status
  INTO v_membership_id, v_status
  FROM public.tenant_members tm
  WHERE tm.tenant_id = v_tenant_id
    AND tm.user_id = v_uid
  LIMIT 1;

  IF v_membership_id IS NULL THEN
    INSERT INTO public.tenant_members (
      tenant_id,
      user_id,
      status,
      membership_type,
      provisioning_channel
    )
    VALUES (
      v_tenant_id,
      v_uid,
      'pending'::public.membership_status,
      'customer'::public.membership_type,
      'self_registration'::public.provisioning_channel
    )
    RETURNING id, status INTO v_membership_id, v_status;
    v_created := true;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id', v_tenant_id,
    'display_name', v_tenant_name,
    'membership_id', v_membership_id,
    'status', v_status,
    'created', v_created
  );
END;
$$;

COMMENT ON FUNCTION public.request_tenant_association_for_deployment(text, text) IS
  'Phase 2.3: platform+identifier → pending tenant_members. No client tenant_id. Never auto-approves.';

REVOKE ALL ON FUNCTION public.request_tenant_association_for_deployment(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_tenant_association_for_deployment(text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_tenant_association_for_deployment(text, text) TO authenticated;

-- SaaS helper: upsert deployment binding.
CREATE OR REPLACE FUNCTION public.upsert_tenant_deployment(
  p_tenant_id uuid,
  p_platform text,
  p_identifier text,
  p_is_primary boolean DEFAULT false
)
RETURNS public.tenant_deployments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.tenant_deployments;
  v_platform text;
  v_identifier text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_saas_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  v_platform := lower(btrim(COALESCE(p_platform, '')));
  v_identifier := btrim(COALESCE(p_identifier, ''));

  IF v_platform NOT IN ('android', 'ios', 'web') THEN
    RAISE EXCEPTION 'invalid deployment platform';
  END IF;
  IF v_identifier = '' OR char_length(v_identifier) > 255 THEN
    RAISE EXCEPTION 'invalid deployment identifier';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants t WHERE t.id = p_tenant_id) THEN
    RAISE EXCEPTION 'tenant not found';
  END IF;

  INSERT INTO public.tenant_deployments (
    tenant_id, platform, identifier, is_primary, status
  )
  VALUES (
    p_tenant_id, v_platform, v_identifier, COALESCE(p_is_primary, false), 'active'
  )
  ON CONFLICT (platform, identifier) DO UPDATE
  SET
    tenant_id = EXCLUDED.tenant_id,
    is_primary = EXCLUDED.is_primary,
    status = 'active',
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_tenant_deployment(uuid, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_tenant_deployment(uuid, text, text, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.upsert_tenant_deployment(uuid, text, text, boolean) TO authenticated;
