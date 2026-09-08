-- Rollback Migration for 20260908120000_customer_deployment_auto_approval.sql
-- Restores original implementation from 20260810180000_tenant_deployments.sql

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
