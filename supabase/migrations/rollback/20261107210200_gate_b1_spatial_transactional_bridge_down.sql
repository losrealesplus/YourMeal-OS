-- ============================================================================
-- Rollback Migration: 20261107210200_gate_b1_spatial_transactional_bridge_down.sql
-- Subsystem: Inventory Topology / Purchase Receipt / Kitchen Consumption Bridge
-- PR: #567 (Gate B · PR B1)
--
-- Objective:
-- Revert the spatial bridge functions and restore the legacy single-accumulator
-- versions of receive_purchase_invoice_v1 and apply_inventory_consumption_v1.
-- ============================================================================

-- 1. Drop the spatial resolution helper
DROP FUNCTION IF EXISTS public.resolve_inventory_location_v1(uuid, uuid, uuid, uuid);

-- 2. Restore legacy receive_purchase_invoice_v1 (Cost 1A version)
CREATE OR REPLACE FUNCTION public.receive_purchase_invoice_v1(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_receipt_id uuid DEFAULT NULL,
  p_received_lines jsonb DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid;
  v_invoice public.purchase_invoices%ROWTYPE;
  v_line RECORD;
  v_ing RECORD;
  v_receipt_id uuid;
  v_existing_exec public.purchase_receipt_executions%ROWTYPE;
  v_request jsonb;
  v_input jsonb;
  v_target_qty numeric;
  v_normalized_qty numeric;
  v_normalized_cost numeric;
  v_prev_stock numeric;
  v_prev_cost numeric;
  v_new_stock numeric;
  v_new_wac numeric;
  v_custom_qty text;
  v_processed_lines jsonb := '[]'::jsonb;
  v_total_stock_increment numeric := 0;
  v_total_items_processed integer := 0;
  v_remaining_pending_lines integer := 0;
  v_new_status text;
  v_result jsonb;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;
  IF p_actor_id IS NOT NULL AND p_actor_id IS DISTINCT FROM v_actor THEN
    RAISE EXCEPTION 'actor mismatch' USING ERRCODE = '42501';
  END IF;
  IF NOT (public.is_tenant_member(p_tenant_id) AND
    (public.has_any_staff_role(v_actor, p_tenant_id) OR public.is_saas_admin(v_actor))) THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  IF p_received_lines IS NOT NULL THEN
    IF jsonb_typeof(p_received_lines) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'received_lines must be an array' USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(p_received_lines) = 0 THEN
      RAISE EXCEPTION 'received_lines must not be empty' USING ERRCODE = '22023';
    END IF;
    FOR v_input IN SELECT value FROM jsonb_array_elements(p_received_lines) LOOP
      IF jsonb_typeof(v_input) IS DISTINCT FROM 'object'
        OR jsonb_typeof(v_input->'line_id') IS DISTINCT FROM 'string'
        OR jsonb_typeof(v_input->'quantity') IS DISTINCT FROM 'number'
        OR (v_input - 'line_id' - 'quantity') <> '{}'::jsonb THEN
        RAISE EXCEPTION 'invalid receipt line' USING ERRCODE = '22023';
      END IF;
      PERFORM (v_input->>'line_id')::uuid;
      IF (v_input->>'quantity')::numeric <= 0
        OR (v_input->>'quantity')::numeric <> round((v_input->>'quantity')::numeric, 3) THEN
        RAISE EXCEPTION 'invalid receipt quantity' USING ERRCODE = '22023';
      END IF;
    END LOOP;
    IF (SELECT count(*) <> count(DISTINCT (value->>'line_id')::uuid)
        FROM jsonb_array_elements(p_received_lines)) THEN
      RAISE EXCEPTION 'duplicate receipt line' USING ERRCODE = '22023';
    END IF;
  END IF;

  SELECT jsonb_build_object('invoice_id', p_invoice_id, 'lines',
    CASE WHEN p_received_lines IS NULL THEN 'null'::jsonb ELSE
      (SELECT jsonb_agg(jsonb_build_object('line_id', (value->>'line_id')::uuid,
        'quantity', (value->>'quantity')::numeric) ORDER BY (value->>'line_id')::uuid)
       FROM jsonb_array_elements(p_received_lines)) END) INTO v_request;

  v_receipt_id := COALESCE(p_receipt_id, gen_random_uuid());
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || v_receipt_id::text, 0));

  SELECT * INTO v_existing_exec FROM public.purchase_receipt_executions
    WHERE tenant_id = p_tenant_id AND receipt_id = v_receipt_id;
  IF FOUND THEN
    IF v_existing_exec.invoice_id IS DISTINCT FROM p_invoice_id
      OR v_existing_exec.request_payload IS DISTINCT FROM v_request THEN
      RAISE EXCEPTION 'receipt_id reused with different request' USING ERRCODE = '22023';
    END IF;
    RETURN v_existing_exec.execution_payload || jsonb_build_object('idempotent', true);
  END IF;

  SELECT * INTO v_invoice
  FROM public.purchase_invoices
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase invoice % not found for tenant %', p_invoice_id, p_tenant_id USING ERRCODE = 'P0002';
  END IF;

  IF v_invoice.status NOT IN ('draft', 'partially_received') THEN
    RAISE EXCEPTION 'invoice status does not permit receipt: %', v_invoice.status USING ERRCODE = '22023';
  END IF;

  PERFORM id FROM public.purchase_invoice_items
    WHERE purchase_invoice_id = p_invoice_id AND tenant_id = p_tenant_id ORDER BY id FOR UPDATE;

  IF p_received_lines IS NOT NULL AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_received_lines) e
    WHERE NOT EXISTS (SELECT 1 FROM public.purchase_invoice_items i
      WHERE i.id = (e->>'line_id')::uuid AND i.purchase_invoice_id = p_invoice_id AND i.tenant_id = p_tenant_id)
  ) THEN
    RAISE EXCEPTION 'unknown receipt line' USING ERRCODE = '22023';
  END IF;

  PERFORM g.id FROM public.ingredients g WHERE g.tenant_id = p_tenant_id
    AND g.id IN (SELECT item_id FROM public.purchase_invoice_items
      WHERE purchase_invoice_id = p_invoice_id AND tenant_id = p_tenant_id AND item_nature = 'INVENTORYABLE')
    ORDER BY g.id FOR UPDATE;

  FOR v_line IN
    SELECT *
    FROM public.purchase_invoice_items
    WHERE purchase_invoice_id = p_invoice_id AND tenant_id = p_tenant_id
    ORDER BY id ASC
  LOOP
    IF p_received_lines IS NOT NULL AND jsonb_typeof(p_received_lines) = 'array' THEN
      SELECT (elem->>'quantity') INTO v_custom_qty
      FROM jsonb_array_elements(p_received_lines) AS elem
      WHERE (elem->>'line_id')::uuid = v_line.id;

      IF v_custom_qty IS NOT NULL THEN
        v_target_qty := v_custom_qty::numeric;
      ELSE
        v_target_qty := 0;
      END IF;
    ELSE
      v_target_qty := v_line.quantity - v_line.received_quantity;
    END IF;

    IF v_target_qty < 0 THEN
      RAISE EXCEPTION 'Invalid negative reception quantity % for line %', v_target_qty, v_line.id USING ERRCODE = '22003';
    END IF;

    IF v_target_qty = 0 THEN
      CONTINUE;
    END IF;

    IF (v_line.received_quantity + v_target_qty) > v_line.quantity THEN
      RAISE EXCEPTION 'Cannot receive % units for line %. Maximum pending is %',
        v_target_qty, v_line.id, (v_line.quantity - v_line.received_quantity) USING ERRCODE = '22023';
    END IF;

    IF v_line.item_nature IN ('EXPENSE_SERVICE', 'CAPEX_ASSET') THEN
      UPDATE public.purchase_invoice_items
      SET received_quantity = received_quantity + v_target_qty
      WHERE id = v_line.id;

      v_processed_lines := v_processed_lines || jsonb_build_object(
        'line_id', v_line.id,
        'item_id', v_line.item_id,
        'item_name', v_line.item_name,
        'item_nature', v_line.item_nature,
        'received_quantity', v_target_qty,
        'stock_mutated', false,
        'notes', 'Service/CAPEX processed without inventory mutation'
      );
      v_total_items_processed := v_total_items_processed + 1;
      CONTINUE;
    END IF;

    SELECT * INTO v_ing
    FROM public.ingredients
    WHERE id = v_line.item_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ingredient % not found for tenant %', v_line.item_id, p_tenant_id USING ERRCODE = 'P0002';
    END IF;

    IF v_ing.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Ingredient % is deleted/inactive', v_line.item_id USING ERRCODE = '22023';
    END IF;

    IF LOWER(v_line.unit) = 'kg' AND LOWER(v_ing.unit) = 'g' THEN
      v_normalized_qty := v_target_qty * 1000;
      v_normalized_cost := v_line.effective_unit_cost / 1000;
    ELSIF LOWER(v_line.unit) = 'g' AND LOWER(v_ing.unit) = 'kg' THEN
      v_normalized_qty := v_target_qty / 1000;
      v_normalized_cost := v_line.effective_unit_cost * 1000;
    ELSIF LOWER(v_line.unit) = 'l' AND LOWER(v_ing.unit) = 'ml' THEN
      v_normalized_qty := v_target_qty * 1000;
      v_normalized_cost := v_line.effective_unit_cost / 1000;
    ELSIF LOWER(v_line.unit) = 'ml' AND LOWER(v_ing.unit) = 'l' THEN
      v_normalized_qty := v_target_qty / 1000;
      v_normalized_cost := v_line.effective_unit_cost * 1000;
    ELSIF LOWER(v_line.unit) = LOWER(v_ing.unit) THEN
      v_normalized_qty := v_target_qty;
      v_normalized_cost := v_line.effective_unit_cost;
    ELSE
      RAISE EXCEPTION 'Incompatible units between invoice item (%) and ingredient (%): cannot auto-convert',
        v_line.unit, v_ing.unit USING ERRCODE = '22023';
    END IF;

    IF v_normalized_qty <= 0 OR v_normalized_qty <> round(v_normalized_qty, 3) THEN
      RAISE EXCEPTION 'receipt quantity cannot be represented in stock unit' USING ERRCODE = '22023';
    END IF;

    v_prev_stock := v_ing.stock;
    v_prev_cost := v_ing.cost;

    IF v_prev_stock <= 0 THEN
      v_new_wac := round(v_normalized_cost, 4);
    ELSE
      v_new_wac := round(((v_prev_stock * v_prev_cost) + (v_normalized_qty * v_normalized_cost)) / (v_prev_stock + v_normalized_qty), 4);
    END IF;

    v_new_stock := v_prev_stock + v_normalized_qty;

    UPDATE public.ingredients
    SET
      stock = v_new_stock,
      cost = v_new_wac
    WHERE id = v_ing.id AND tenant_id = p_tenant_id;

    INSERT INTO public.item_cost_history (
      id, tenant_id, item_id, source_invoice_item_id, supplier_id, unit_price, allocated_overhead, effective_unit_cost, cost_method, effective_at
    ) VALUES (
      gen_random_uuid(), p_tenant_id, v_ing.id, v_line.id, v_invoice.supplier_id, v_line.unit_price, v_line.allocated_overhead, v_line.effective_unit_cost, 'effective_purchase', now()
    );

    INSERT INTO public.stock_movements (
      id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, reference_line_id, receipt_id, notes, created_by
    ) VALUES (
      gen_random_uuid(), p_tenant_id, v_ing.id, 'PURCHASE_RECEIPT', v_normalized_qty, v_prev_stock, v_new_stock, v_normalized_cost, 'PURCHASE_INVOICE', p_invoice_id, v_line.id, v_receipt_id, 'Recepción física de compra', v_actor
    );

    UPDATE public.purchase_invoice_items
    SET received_quantity = received_quantity + v_target_qty
    WHERE id = v_line.id;

    v_processed_lines := v_processed_lines || jsonb_build_object(
      'line_id', v_line.id,
      'item_id', v_ing.id,
      'item_name', v_line.item_name,
      'item_nature', 'INVENTORYABLE',
      'received_quantity', v_normalized_qty,
      'unit', v_ing.unit,
      'previous_stock', v_prev_stock,
      'new_stock', v_new_stock,
      'previous_wac', v_prev_cost,
      'new_wac', v_new_wac,
      'stock_mutated', true
    );

    v_total_stock_increment := v_total_stock_increment + v_normalized_qty;
    v_total_items_processed := v_total_items_processed + 1;
  END LOOP;

  IF v_total_items_processed = 0 THEN
    RAISE EXCEPTION 'receipt has no pending lines' USING ERRCODE = '22023';
  END IF;

  SELECT COUNT(*) INTO v_remaining_pending_lines
  FROM public.purchase_invoice_items
  WHERE purchase_invoice_id = p_invoice_id
    AND tenant_id = p_tenant_id
    AND received_quantity < quantity;

  IF v_remaining_pending_lines = 0 THEN
    v_new_status := 'received';
  ELSE
    v_new_status := 'partially_received';
  END IF;

  UPDATE public.purchase_invoices
  SET
    status = v_new_status,
    received_at = now(),
    received_by = v_actor,
    updated_at = now()
  WHERE id = p_invoice_id AND tenant_id = p_tenant_id;

  v_result := jsonb_build_object(
    'success', true,
    'invoice_id', p_invoice_id,
    'status', v_new_status,
    'receipt_id', v_receipt_id,
    'idempotent', false,
    'summary', jsonb_build_object(
      'items_processed', v_total_items_processed,
      'total_stock_increment', v_total_stock_increment,
      'remaining_pending_lines', v_remaining_pending_lines
    ),
    'processed_lines', v_processed_lines
  );

  INSERT INTO public.purchase_receipt_executions (
    tenant_id, invoice_id, receipt_id, execution_payload, request_payload, executed_by
  ) VALUES (
    p_tenant_id, p_invoice_id, v_receipt_id, v_result, v_request, v_actor
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_invoice_v1 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receive_purchase_invoice_v1 TO authenticated, service_role;

-- 3. Restore legacy apply_inventory_consumption_v1 (FLOW-04 version)
CREATE OR REPLACE FUNCTION public.apply_inventory_consumption_v1(
  p_tenant_id uuid,
  p_consumption_id uuid,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor uuid;
  v_cons public.inventory_consumptions%ROWTYPE;
  v_line RECORD;
  v_ing RECORD;
  v_norm_qty numeric;
  v_total_req numeric;
  v_prev_stock numeric;
  v_new_stock numeric;
  v_running_stock numeric;
  v_line_prev numeric;
  v_line_new numeric;
  v_processed_lines jsonb := '[]'::jsonb;
  v_total_stock_decrement numeric := 0;
  v_items_count integer := 0;
BEGIN
  v_actor := auth.uid();
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
    END IF;

    IF p_actor_id IS NOT NULL AND p_actor_id IS DISTINCT FROM v_actor THEN
      RAISE EXCEPTION 'actor mismatch' USING ERRCODE = '42501';
    END IF;

    IF NOT (
      public.has_any_staff_role(v_actor, p_tenant_id)
      OR public.is_saas_admin(v_actor)
    ) THEN
      RAISE EXCEPTION 'permission denied: actor % requires staff role for tenant %', v_actor, p_tenant_id USING ERRCODE = '42501';
    END IF;
  ELSE
    v_actor := COALESCE(p_actor_id, v_actor);
  END IF;

  SELECT * INTO v_cons
  FROM public.inventory_consumptions
  WHERE id = p_consumption_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consumption % not found for tenant %', p_consumption_id, p_tenant_id USING ERRCODE = 'P0002';
  END IF;

  IF v_cons.status IN ('applied', 'sealed') THEN
    RETURN jsonb_build_object(
      'success', true,
      'consumption_id', p_consumption_id,
      'status', v_cons.status,
      'idempotent', true,
      'message', 'Consumption already applied'
    );
  END IF;

  IF v_cons.status <> 'planned' THEN
    RAISE EXCEPTION 'applyConsumption requires status=planned (got %)', v_cons.status USING ERRCODE = '22023';
  END IF;

  PERFORM 1
  FROM public.ingredients
  WHERE id IN (
    SELECT DISTINCT ingredient_id
    FROM public.inventory_consumption_lines
    WHERE consumption_id = p_consumption_id AND tenant_id = p_tenant_id
  )
  AND tenant_id = p_tenant_id
  ORDER BY id ASC
  FOR UPDATE;

  FOR v_ing IN
    SELECT *
    FROM public.ingredients
    WHERE id IN (
      SELECT DISTINCT ingredient_id
      FROM public.inventory_consumption_lines
      WHERE consumption_id = p_consumption_id AND tenant_id = p_tenant_id
    )
    AND tenant_id = p_tenant_id
    ORDER BY id ASC
  LOOP
    IF v_ing.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Ingredient % is deleted/inactive', v_ing.id USING ERRCODE = '22023';
    END IF;

    v_total_req := 0;
    FOR v_line IN
      SELECT *
      FROM public.inventory_consumption_lines
      WHERE consumption_id = p_consumption_id
        AND tenant_id = p_tenant_id
        AND ingredient_id = v_ing.id
      ORDER BY id ASC
    LOOP
      IF LOWER(v_line.unit) = 'kg' AND LOWER(v_ing.unit) = 'g' THEN
        v_norm_qty := v_line.quantity * 1000;
      ELSIF LOWER(v_line.unit) = 'g' AND LOWER(v_ing.unit) = 'kg' THEN
        v_norm_qty := v_line.quantity / 1000;
      ELSIF LOWER(v_line.unit) = 'l' AND LOWER(v_ing.unit) = 'ml' THEN
        v_norm_qty := v_line.quantity * 1000;
      ELSIF LOWER(v_line.unit) = 'ml' AND LOWER(v_ing.unit) = 'l' THEN
        v_norm_qty := v_line.quantity / 1000;
      ELSIF LOWER(v_line.unit) = LOWER(v_ing.unit) THEN
        v_norm_qty := v_line.quantity;
      ELSE
        RAISE EXCEPTION 'Incompatible units between consumption line (%) and ingredient (%): cannot auto-convert',
          v_line.unit, v_ing.unit USING ERRCODE = '22023';
      END IF;

      v_total_req := v_total_req + v_norm_qty;
    END LOOP;

    IF (v_ing.stock - v_total_req) < 0 THEN
      RAISE EXCEPTION 'insufficient_stock: ingredient % has % available, required %',
        v_ing.id, v_ing.stock, v_total_req USING ERRCODE = '22023';
    END IF;

    v_prev_stock := v_ing.stock;
    v_new_stock := v_prev_stock - v_total_req;

    UPDATE public.ingredients
    SET stock = v_new_stock
    WHERE id = v_ing.id AND tenant_id = p_tenant_id;

    v_running_stock := v_prev_stock;
    FOR v_line IN
      SELECT *
      FROM public.inventory_consumption_lines
      WHERE consumption_id = p_consumption_id
        AND tenant_id = p_tenant_id
        AND ingredient_id = v_ing.id
      ORDER BY id ASC
    LOOP
      IF LOWER(v_line.unit) = 'kg' AND LOWER(v_ing.unit) = 'g' THEN
        v_norm_qty := v_line.quantity * 1000;
      ELSIF LOWER(v_line.unit) = 'g' AND LOWER(v_ing.unit) = 'kg' THEN
        v_norm_qty := v_line.quantity / 1000;
      ELSIF LOWER(v_line.unit) = 'l' AND LOWER(v_ing.unit) = 'ml' THEN
        v_norm_qty := v_line.quantity * 1000;
      ELSIF LOWER(v_line.unit) = 'ml' AND LOWER(v_ing.unit) = 'l' THEN
        v_norm_qty := v_line.quantity / 1000;
      ELSE
        v_norm_qty := v_line.quantity;
      END IF;

      v_line_prev := v_running_stock;
      v_line_new := v_running_stock - v_norm_qty;
      v_running_stock := v_line_new;

      INSERT INTO public.stock_movements (
        tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, reference_line_id, created_by, notes
      ) VALUES (
        p_tenant_id, v_ing.id, 'PRODUCTION_CONSUMPTION', v_norm_qty, v_line_prev, v_line_new, v_ing.cost, 'PRODUCTION_ORDER', p_consumption_id, v_line.id, v_actor, 'FLOW-04 Consumo de producción aplicado'
      );

      v_processed_lines := v_processed_lines || jsonb_build_object(
        'line_id', v_line.id,
        'ingredient_id', v_ing.id,
        'quantity', v_norm_qty,
        'previous_stock', v_line_prev,
        'new_stock', v_line_new,
        'unit_cost', v_ing.cost
      );

      v_total_stock_decrement := v_total_stock_decrement + v_norm_qty;
      v_items_count := v_items_count + 1;
    END LOOP;
  END LOOP;

  UPDATE public.inventory_consumptions
  SET status = 'applied', applied_at = now(), applied_by = v_actor
  WHERE id = p_consumption_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'consumption_id', p_consumption_id,
    'status', 'applied',
    'idempotent', false,
    'summary', jsonb_build_object(
      'items_processed', v_items_count,
      'total_stock_decrement', v_total_stock_decrement
    ),
    'lines', v_processed_lines
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_inventory_consumption_v1 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_inventory_consumption_v1 TO authenticated, service_role;
