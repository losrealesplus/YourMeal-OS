-- Release correction B. Preserves existing owner, ACL and authorization checks.
-- STOP on provider/catalog drift rather than replacing an unknown implementation.
BEGIN;
DO $$ DECLARE target regprocedure := 'public.program_draft_order(uuid,uuid,date,numeric,text,jsonb,public.demand_channel,uuid,uuid,uuid,uuid)'::regprocedure;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid=target AND prosecdef AND proowner='postgres'::regrole
   AND encode(sha256(convert_to(prosrc,'UTF8')),'hex')='144cfa9dd7bf9b66a38480dfe7fccf8457f49272753163e6b2de459a398d8d01')
 THEN RAISE EXCEPTION 'RELEASE_ORDER_WRITER_DEFINITION_DRIFT'; END IF;
END $$;
CREATE OR REPLACE FUNCTION public.program_draft_order(
  _tenant_id uuid,
  _customer_id uuid,
  _week_start date,
  _total numeric,
  _notes text,
  _items jsonb,
  _demand_channel public.demand_channel DEFAULT 'individual',
  _company_id uuid DEFAULT NULL,
  _site_id uuid DEFAULT NULL,
  _organizational_unit_id uuid DEFAULT NULL,
  _delivery_group_id uuid DEFAULT NULL
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.customers c
    WHERE c.id = _customer_id
      AND c.tenant_id = _tenant_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = auth.uid()
        OR public.has_any_staff_role(auth.uid(), _tenant_id)
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
    notes,
    demand_channel,
    company_id,
    site_id,
    organizational_unit_id,
    delivery_group_id
  )
  VALUES (
    _tenant_id,
    _customer_id,
    _week_start,
    'draft',
    _total,
    _notes,
    COALESCE(_demand_channel, 'individual'),
    _company_id,
    _site_id,
    _organizational_unit_id,
    _delivery_group_id
  )
  RETURNING * INTO v_order;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    INSERT INTO public.order_items (
      tenant_id,
      order_id,
      dish_id,
      day_date,
      qty,
      unit_price,
      price_snapshot_status
    )
    VALUES (
      _tenant_id,
      v_order.id,
      (v_item->>'dish_id')::uuid,
      (v_item->>'day_date')::date,
      COALESCE((v_item->>'qty')::integer, 1),
      (SELECT price FROM public.dishes WHERE id=(v_item->>'dish_id')::uuid AND tenant_id=_tenant_id),
      CASE WHEN (SELECT price FROM public.dishes WHERE id=(v_item->>'dish_id')::uuid AND tenant_id=_tenant_id)=0 THEN 'explicit_zero' ELSE 'captured' END
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

COMMIT;
