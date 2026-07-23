-- Hardening INC-05: atomic draft order + items
-- Hardening INC-07: seed order programming / confirmation flags

CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_row public.order_items%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_tenant_member(_tenant_id) THEN
    RAISE EXCEPTION 'not a tenant member';
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) < 1 THEN
    RAISE EXCEPTION 'items required';
  END IF;

  -- Customer must belong to tenant; customers may only program for themselves.
  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(_tenant_id, auth.uid())
        OR public.is_saas_admin(auth.uid())
      )
  ) THEN
    RAISE EXCEPTION 'customer not allowed';
  END IF;

  INSERT INTO public.orders (
    tenant_id,
    customer_id,
    week_start,
    status,
    total,
    notes
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1)
    )
    RETURNING * INTO v_row;

    v_items := v_items || jsonb_build_array(to_jsonb(v_row));
  END LOOP;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.program_draft_order(uuid, uuid, date, numeric, text, jsonb) TO service_role;

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'order_programming',
  'CAP-004 — program Draft order mutation',
  true,
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'order_programming' AND tenant_id IS NULL
);

INSERT INTO public.feature_flags (key, description, enabled, tenant_id, metadata)
SELECT
  'order_confirmation',
  'CAP-006 — confirm Draft → Confirmed mutation',
  true,
  NULL,
  '{}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'order_confirmation' AND tenant_id IS NULL
);
