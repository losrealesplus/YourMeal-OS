-- Migration: 20261022081500_cr_order_rollback_v1_rpc.sql
-- Description: Atomic operational rollback RPC for v1 orders with strict tenant isolation,
--              concurrency control, required justification reason, and in-transaction audit logging.

CREATE OR REPLACE FUNCTION public.rollback_order_status_v1(
  p_tenant_id uuid,
  p_order_id uuid,
  p_expected_current_status public.order_status,
  p_target_status public.order_status,
  p_reason text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_id uuid;
  v_trimmed_reason text;
  v_valid_transition boolean := false;
BEGIN
  -- 1. Authentication check
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- 2. Authorization check (staff role or saas admin for this tenant)
  IF NOT (
    public.has_any_staff_role(v_actor_id, p_tenant_id)
    OR public.is_saas_admin(v_actor_id)
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- 3. Mandatory reason check
  v_trimmed_reason := btrim(p_reason);
  IF v_trimmed_reason IS NULL OR length(v_trimmed_reason) = 0 THEN
    RAISE EXCEPTION 'Rollback reason is required';
  END IF;

  -- 4. Transition validation:
  -- prepared -> in_production
  -- in_production -> confirmed
  -- ready_for_delivery -> prepared
  IF p_expected_current_status = 'prepared' AND p_target_status = 'in_production' THEN
    v_valid_transition := true;
  ELSIF p_expected_current_status = 'in_production' AND p_target_status = 'confirmed' THEN
    v_valid_transition := true;
  ELSIF p_expected_current_status = 'ready_for_delivery' AND p_target_status = 'prepared' THEN
    v_valid_transition := true;
  END IF;

  IF NOT v_valid_transition THEN
    RAISE EXCEPTION 'Invalid rollback transition from % to %', p_expected_current_status, p_target_status;
  END IF;

  -- 5. Concurrency control: Lock order row FOR UPDATE with tenant isolation
  SELECT * INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.tenant_id = p_tenant_id
    AND o.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- 6. v2 canonical invariant: Reject rollback on write_contract_version = 2
  IF v_order.write_contract_version = 2 THEN
    RAISE EXCEPTION 'Rollback is not supported on canonical v2 orders';
  END IF;

  -- 7. Current status match check
  IF v_order.status <> p_expected_current_status THEN
    RAISE EXCEPTION 'Concurrency conflict: order is in status %, expected %', v_order.status, p_expected_current_status;
  END IF;

  -- 8. Atomic mutation: Update order status
  UPDATE public.orders
  SET status = p_target_status
  WHERE id = p_order_id
    AND tenant_id = p_tenant_id
  RETURNING * INTO v_order;

  -- 9. Atomic mutation: Insert immutable audit log within the SAME transaction
  INSERT INTO public.audit_log (
    tenant_id,
    actor_id,
    entity_type,
    entity_id,
    action,
    old_data,
    new_data
  ) VALUES (
    p_tenant_id,
    v_actor_id,
    'order',
    p_order_id,
    'status_change',
    jsonb_build_object('status', p_expected_current_status),
    jsonb_build_object('status', p_target_status, 'reason', v_trimmed_reason, 'isRollback', true)
  );

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rollback_order_status_v1(uuid, uuid, public.order_status, public.order_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_order_status_v1(uuid, uuid, public.order_status, public.order_status, text) TO service_role;
