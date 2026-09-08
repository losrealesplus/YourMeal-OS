-- Migration: 20260908120000_customer_deployment_auto_approval.sql
-- Description: ADR 0064 — Auto-approve customer self-registration from active trusted deployments.
-- Invariants:
--   1. Server-side authority: platform + identifier lookup in public.tenant_deployments.
--   2. Atomic & race-condition safe: INSERT ... ON CONFLICT (tenant_id, user_id).
--   3. Administrative protection: ONLY customer self-registration receives approved status; staff/employee/admin memberships are never mutated.
--   4. AUTH USER != CUSTOMER: Creates approved tenant_members row only; public.customers is untouched.

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

  -- 1. Trusted Deployment Lookup
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

  -- 2. Atomic Upsert for Customer Self-Registration
  -- Concurrency-safe: atomic row lock on (tenant_id, user_id) composite PK.
  -- Admin protection: CASE statement preserves existing status for non-customer or non-self_registration rows.
  INSERT INTO public.tenant_members (
    tenant_id,
    user_id,
    status,
    membership_type,
    provisioning_channel,
    approved_at
  )
  VALUES (
    v_tenant_id,
    v_uid,
    'approved'::public.membership_status,
    'customer'::public.membership_type,
    'self_registration'::public.provisioning_channel,
    now()
  )
  ON CONFLICT (tenant_id, user_id) DO UPDATE
  SET
    status = CASE
      WHEN tenant_members.membership_type = 'customer'::public.membership_type
       AND tenant_members.provisioning_channel = 'self_registration'::public.provisioning_channel
       AND tenant_members.status = 'pending'::public.membership_status
      THEN 'approved'::public.membership_status
      ELSE tenant_members.status
    END,
    approved_at = CASE
      WHEN tenant_members.membership_type = 'customer'::public.membership_type
       AND tenant_members.provisioning_channel = 'self_registration'::public.provisioning_channel
       AND tenant_members.status = 'pending'::public.membership_status
      THEN COALESCE(tenant_members.approved_at, now())
      ELSE tenant_members.approved_at
    END
  RETURNING id, status, (xmax = 0) INTO v_membership_id, v_status, v_created;

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
  'ADR 0064 / Phase 2.3: active trusted deployment creates or reconciles approved customer membership. Concurrency-safe with administrative role protection.';
