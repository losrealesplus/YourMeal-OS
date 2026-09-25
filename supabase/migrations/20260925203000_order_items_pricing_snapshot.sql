-- Migration: 20260925203000_order_items_pricing_snapshot.sql
-- CR-OPS-03: Pricing Integrity & Order Line Snapshots (Opción B)
-- Guarantees permanent line item financial snapshot immutability.

-- 1. Add snapshot columns to order_items
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS unit_price numeric(12, 4) NULL,
  ADD COLUMN IF NOT EXISTS price_snapshot_status text NOT NULL DEFAULT 'captured';

-- 2. Add CHECK constraint on price_snapshot_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_price_snapshot_status_check'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_price_snapshot_status_check
      CHECK (price_snapshot_status IN ('captured', 'explicit_zero', 'historical_unavailable'));
  END IF;
END $$;

-- 3. Add CHECK constraint on unit_price consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_unit_price_status_consistency'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_unit_price_status_consistency
      CHECK (
        (price_snapshot_status = 'historical_unavailable' AND unit_price IS NULL)
        OR (price_snapshot_status = 'explicit_zero' AND unit_price = 0)
        OR (price_snapshot_status = 'captured' AND unit_price IS NOT NULL AND unit_price >= 0)
      );
  END IF;
END $$;

-- 4. Backfill existing historical data safely (Zero Invention Policy for Class C)
-- Class B: Orders where total = 0 -> unit_price = 0, explicit_zero
UPDATE public.order_items oi
SET unit_price = 0,
    price_snapshot_status = 'explicit_zero'
FROM public.orders o
WHERE oi.order_id = o.id
  AND o.total = 0
  AND oi.unit_price IS NULL;

-- Class A: Single-line orders where total > 0 -> unit_price = total / qty, captured
WITH single_item_orders AS (
  SELECT order_id
  FROM public.order_items
  GROUP BY order_id
  HAVING count(*) = 1
)
UPDATE public.order_items oi
SET unit_price = ROUND((o.total / GREATEST(oi.qty, 1))::numeric, 4),
    price_snapshot_status = 'captured'
FROM public.orders o
JOIN single_item_orders sio ON sio.order_id = o.id
WHERE oi.order_id = o.id
  AND o.total > 0
  AND oi.unit_price IS NULL;

-- Class C: Multi-line historical orders without item breakdown -> historical_unavailable, unit_price = NULL
UPDATE public.order_items
SET unit_price = NULL,
    price_snapshot_status = 'historical_unavailable'
WHERE unit_price IS NULL;

-- 5. Update program_draft_order RPC to support and snapshot unit_price and price_snapshot_status
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
  v_unit_price numeric(12,4);
  v_status text;
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
    IF (v_item->>'unit_price') IS NOT NULL THEN
      v_unit_price := (v_item->>'unit_price')::numeric;
      v_status := COALESCE(v_item->>'price_snapshot_status', CASE WHEN v_unit_price = 0 THEN 'explicit_zero' ELSE 'captured' END);
    ELSE
      -- Fallback to dish catalog price if not explicitly passed
      SELECT d.price INTO v_unit_price
      FROM public.dishes d
      WHERE d.id = (v_item->>'dish_id')::uuid;

      v_unit_price := COALESCE(v_unit_price, 0);
      v_status := CASE WHEN v_unit_price = 0 THEN 'explicit_zero' ELSE 'captured' END;
    END IF;

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
      v_unit_price,
      v_status
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
