-- Part 2: staff role helper + transition RPC (after new enum values are committed)

CREATE OR REPLACE FUNCTION public.has_any_staff_role(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN (
        'company_admin',
        'operations_manager',
        'kitchen',
        'purchasing',
        'inventory',
        'production',
        'support',
        'accounting',
        'logistics',
        'delivery'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.transition_order_status(
  p_tenant_id uuid,
  p_order_id uuid,
  p_to_status public.order_status
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_from public.order_status;
  v_ok boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT (
    public.has_any_staff_role(auth.uid(), p_tenant_id)
    OR public.is_saas_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT * INTO v_order
  FROM public.orders o
  WHERE o.id = p_order_id
    AND o.tenant_id = p_tenant_id
    AND o.deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  v_from := v_order.status;

  IF v_from = 'confirmed' AND p_to_status = 'in_production' THEN v_ok := true; END IF;
  IF v_from = 'in_production' AND p_to_status = 'prepared' THEN v_ok := true; END IF;
  IF v_from = 'prepared' AND p_to_status = 'ready_for_delivery' THEN v_ok := true; END IF;
  IF v_from = 'ready_for_delivery' AND p_to_status = 'out_for_delivery' THEN v_ok := true; END IF;
  IF v_from = 'out_for_delivery' AND p_to_status IN ('delivered', 'delivery_issue') THEN v_ok := true; END IF;
  IF v_from = 'delivery_issue' AND p_to_status = 'out_for_delivery' THEN v_ok := true; END IF;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'invalid transition % → %', v_from, p_to_status;
  END IF;

  UPDATE public.orders
  SET status = p_to_status
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transition_order_status(uuid, uuid, public.order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_order_status(uuid, uuid, public.order_status) TO service_role;
