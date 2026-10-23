-- Recovered from 55889fc9; installation only, application flag remains disabled.
-- Description: Atomic operational rollback RPC for v1 orders with strict tenant isolation,
--              concurrency control, required justification reason, and in-transaction audit logging.

CREATE OR REPLACE FUNCTION public.rollback_order_status_v1(
  p_tenant_id uuid,
  p_order_id uuid,
  p_expected_current_status public.order_status,
  p_target_status public.order_status,
  p_reason text,
  p_expected_revision integer DEFAULT NULL,
  p_expected_dates date[] DEFAULT NULL,
  p_allow_multi_day boolean DEFAULT false,
  p_operating_date date DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_id uuid;
  v_trimmed_reason text;
  v_valid_transition boolean := false;
  v_dates date[];
  v_expected_dates date[];
  v_service public.delivery_services%ROWTYPE;
  v_service_target public.delivery_service_status;
  v_source_rank integer;
BEGIN
  -- 1. Authentication check
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- 2. Strict operational authorization check:
  -- Only operational roles with order modification and kitchen execution capabilities are authorized.
  -- Excludes non-operational staff roles (accounting, purchasing, inventory, support, driver, employee, customer).
  IF NOT (
    public.is_saas_admin(v_actor_id)
    OR public.has_role(v_actor_id, p_tenant_id, 'company_admin'::public.app_role)
    OR public.has_role(v_actor_id, p_tenant_id, 'operations_manager'::public.app_role)
    OR public.has_role(v_actor_id, p_tenant_id, 'kitchen'::public.app_role)
    OR public.has_role(v_actor_id, p_tenant_id, 'production'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  -- 3. Mandatory reason check
  v_trimmed_reason := btrim(p_reason);
  IF v_trimmed_reason IS NULL OR length(v_trimmed_reason) = 0 OR length(v_trimmed_reason) > 2000 THEN
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

  IF p_expected_revision IS NULL OR v_order.revision IS DISTINCT FROM p_expected_revision THEN
    RAISE EXCEPTION 'Revision conflict: reload order before rollback';
  END IF;

  -- Lock dependents before validating the full contract; do not silently reverse delivery work.
  PERFORM 1 FROM public.order_items
    WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL FOR UPDATE;
  PERFORM 1 FROM public.delivery_services
    WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL FOR UPDATE;
  SELECT array_agg(d ORDER BY d) INTO v_dates FROM (
    SELECT day_date AS d FROM public.order_items
      WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL
    UNION
    SELECT delivery_date AS d FROM public.delivery_services
      WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL
  ) dates;
  SELECT array_agg(DISTINCT d ORDER BY d) INTO v_expected_dates FROM unnest(p_expected_dates) d;
  IF coalesce(cardinality(v_dates),0)=0 OR array_position(v_dates,NULL) IS NOT NULL
    OR v_dates IS DISTINCT FROM v_expected_dates THEN
    RAISE EXCEPTION 'Temporal scope conflict: reload all delivery dates';
  END IF;
  IF (cardinality(v_dates)>1 OR (p_operating_date IS NOT NULL AND v_dates<>ARRAY[p_operating_date]))
    AND p_allow_multi_day IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Explicit multi-day confirmation required';
  END IF;
  v_source_rank := array_position(ARRAY['in_production','prepared','ready_for_delivery'], p_expected_current_status::text);
  v_service_target := (CASE WHEN p_target_status='confirmed' THEN 'pending' ELSE p_target_status::text END)::public.delivery_service_status;
  IF EXISTS (SELECT 1 FROM public.delivery_services
    WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL
      AND status::text NOT IN ('pending','cancelled')
      AND (array_position(ARRAY['in_production','prepared','ready_for_delivery'], status::text) IS NULL
        OR array_position(ARRAY['in_production','prepared','ready_for_delivery'], status::text)>v_source_rank)) THEN
    RAISE EXCEPTION 'Dependent delivery services require separate correction';
  END IF;
  -- Only synchronized source microstates move back. Earlier/cancelled days are preserved.
  FOR v_service IN SELECT * FROM public.delivery_services
    WHERE tenant_id=p_tenant_id AND order_id=p_order_id AND deleted_at IS NULL
      AND status::text=p_expected_current_status::text ORDER BY id
  LOOP
    UPDATE public.delivery_services SET status=v_service_target
      WHERE tenant_id=p_tenant_id AND id=v_service.id;
    INSERT INTO public.audit_log(tenant_id,actor_id,entity_type,entity_id,action,old_data,new_data)
      VALUES(p_tenant_id,v_actor_id,'delivery_service',v_service.id,'status_change',
        jsonb_build_object('status',v_service.status),
        jsonb_build_object('status',v_service_target,'reason',v_trimmed_reason,'isRollback',true,
          'orderId',p_order_id,'deliveryDate',v_service.delivery_date));
  END LOOP;

  -- 8. Atomic mutation: Update order status
  UPDATE public.orders
  SET status = p_target_status, revision = revision + 1
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
    jsonb_build_object('status', p_target_status, 'reason', v_trimmed_reason, 'isRollback', true, 'deliveryDates', to_jsonb(v_dates), 'revision', v_order.revision)
  );

  RETURN v_order;
END;
$$;

-- Functions are executable by PUBLIC by default: explicitly close that path.
REVOKE ALL ON FUNCTION public.rollback_order_status_v1(uuid, uuid, public.order_status, public.order_status, text, integer, date[], boolean, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rollback_order_status_v1(uuid, uuid, public.order_status, public.order_status, text, integer, date[], boolean, date) TO authenticated;
