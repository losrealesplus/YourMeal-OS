-- ============================================================================
-- Migration: 20261107210200_gate_b1_spatial_transactional_bridge.sql
-- Subsystem: Inventory Topology / Purchase Receipt / Kitchen Consumption Bridge
-- PR: #567 (Gate B · PR B1)
--
-- Objective:
-- Connect legacy purchase receipt (Cost 1A) and kitchen consumption (FLOW-04)
-- to the canonical spatial inventory table (inventory_balances) without triggers
-- or degraded views. ingredients.stock is maintained strictly as an aggregate
-- legacy compatibility projection.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper: Deterministic Spatial Location Resolution
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_inventory_location_v1(
  p_tenant_id uuid,
  p_center_id uuid DEFAULT NULL,
  p_location_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  center_id uuid,
  warehouse_id uuid,
  location_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_count integer;
  v_default_locs_count integer;
  v_assigned_centers uuid[];
  v_caller_uid uuid := auth.uid();
  v_effective_user_id uuid;
BEGIN
  -- Security check: Caller identity and tenant membership
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF v_caller_uid IS NULL THEN
      RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
    END IF;
    IF NOT public.is_tenant_member(p_tenant_id) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
    -- Anti-spoofing check: non-admin caller cannot impersonate another user_id
    IF p_user_id IS NOT NULL AND p_user_id IS DISTINCT FROM v_caller_uid AND NOT public.is_saas_admin(v_caller_uid) THEN
      RAISE EXCEPTION 'user mismatch: cannot resolve location on behalf of another user' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_effective_user_id := COALESCE(p_user_id, v_caller_uid);

  -- 1. Explicit Location Specified
  IF p_location_id IS NOT NULL THEN
    SELECT l.center_id, l.warehouse_id, l.id
    INTO center_id, warehouse_id, location_id
    FROM public.inventory_locations l
    JOIN public.warehouses w ON w.id = l.warehouse_id AND w.tenant_id = l.tenant_id
    JOIN public.production_centers c ON c.id = l.center_id AND c.tenant_id = l.tenant_id
    WHERE l.id = p_location_id 
      AND l.tenant_id = p_tenant_id 
      AND l.is_active = true 
      AND w.is_active = true 
      AND c.is_active = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'LOCATION_NOT_FOUND_OR_INACTIVE: Location % is not active or does not exist in tenant %', 
        p_location_id, p_tenant_id USING ERRCODE = 'P0002';
    END IF;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2. Explicit Center Specified
  IF p_center_id IS NOT NULL THEN
    SELECT count(l.id) INTO v_count
    FROM public.inventory_locations l
    JOIN public.warehouses w ON w.id = l.warehouse_id AND w.tenant_id = l.tenant_id
    JOIN public.production_centers c ON c.id = l.center_id AND c.tenant_id = l.tenant_id
    WHERE l.tenant_id = p_tenant_id 
      AND l.center_id = p_center_id 
      AND l.is_default = true 
      AND l.is_active = true 
      AND w.is_active = true 
      AND c.is_active = true;

    IF v_count = 0 THEN
      RAISE EXCEPTION 'MISSING_DEFAULT_LOCATION: Center % has no active default location', 
        p_center_id USING ERRCODE = 'P0002';
    ELSIF v_count > 1 THEN
      RAISE EXCEPTION 'AMBIGUOUS_INVENTORY_LOCATION: Center % has % default locations; explicit location_id required', 
        p_center_id, v_count USING ERRCODE = '22023';
    END IF;

    SELECT l.center_id, l.warehouse_id, l.id
    INTO center_id, warehouse_id, location_id
    FROM public.inventory_locations l
    JOIN public.warehouses w ON w.id = l.warehouse_id AND w.tenant_id = l.tenant_id
    WHERE l.tenant_id = p_tenant_id 
      AND l.center_id = p_center_id 
      AND l.is_default = true 
      AND l.is_active = true 
      AND w.is_active = true;

    RETURN NEXT;
    RETURN;
  END IF;

  -- 3. Infer from User Center Assignment
  IF v_effective_user_id IS NOT NULL THEN
    SELECT array_agg(DISTINCT uca.center_id) INTO v_assigned_centers
    FROM public.user_center_assignments uca
    JOIN public.production_centers c ON c.id = uca.center_id AND c.tenant_id = uca.tenant_id
    WHERE uca.tenant_id = p_tenant_id 
      AND uca.user_id = v_effective_user_id
      AND c.is_active = true;

    IF cardinality(v_assigned_centers) = 1 THEN
      RETURN QUERY SELECT * FROM public.resolve_inventory_location_v1(p_tenant_id, v_assigned_centers[1], NULL, NULL);
      RETURN;
    ELSIF cardinality(v_assigned_centers) > 1 THEN
      RAISE EXCEPTION 'AMBIGUOUS_INVENTORY_LOCATION: User is assigned to % active centers; explicit center_id required',
        cardinality(v_assigned_centers) USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 4. Tenant-wide Active Default Resolution
  SELECT count(DISTINCT l.center_id), count(l.id)
  INTO v_count, v_default_locs_count
  FROM public.inventory_locations l
  JOIN public.warehouses w ON w.id = l.warehouse_id AND w.tenant_id = l.tenant_id
  JOIN public.production_centers c ON c.id = l.center_id AND c.tenant_id = l.tenant_id
  WHERE l.tenant_id = p_tenant_id 
    AND l.is_default = true 
    AND l.is_active = true 
    AND w.is_active = true 
    AND c.is_active = true;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'MISSING_INVENTORY_LOCATION: Tenant % has no active default inventory location', 
      p_tenant_id USING ERRCODE = 'P0002';
  ELSIF v_count > 1 THEN
    RAISE EXCEPTION 'AMBIGUOUS_INVENTORY_LOCATION: Tenant % has % default locations across centers; explicit center_id or location_id required', 
      p_tenant_id, v_count USING ERRCODE = '22023';
  END IF;

  SELECT l.center_id, l.warehouse_id, l.id
  INTO center_id, warehouse_id, location_id
  FROM public.inventory_locations l
  JOIN public.warehouses w ON w.id = l.warehouse_id AND w.tenant_id = l.tenant_id
  JOIN public.production_centers c ON c.id = l.center_id AND c.tenant_id = l.tenant_id
  WHERE l.tenant_id = p_tenant_id 
    AND l.is_default = true 
    AND l.is_active = true 
    AND w.is_active = true 
    AND c.is_active = true;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_inventory_location_v1(uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_inventory_location_v1(uuid, uuid, uuid, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. Updated receive_purchase_invoice_v1 (Atomic Spatial Mutation)
-- ----------------------------------------------------------------------------
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
  v_loc RECORD;
  v_bal_id uuid;
  v_new_bal_stock numeric;
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
        OR (v_input - 'line_id' - 'quantity' - 'location_id') <> '{}'::jsonb THEN
        RAISE EXCEPTION 'invalid receipt line' USING ERRCODE = '22023';
      END IF;
      PERFORM (v_input->>'line_id')::uuid;
      IF (v_input->>'location_id') IS NOT NULL THEN
        PERFORM (v_input->>'location_id')::uuid;
      END IF;
      IF (v_input->>'quantity')::numeric <= 0 OR (v_input->>'quantity')::numeric <> round((v_input->>'quantity')::numeric, 3) THEN
        RAISE EXCEPTION 'quantity must be positive with at most 3 decimal places' USING ERRCODE = '22023';
      END IF;
    END LOOP;
    IF (SELECT count(*) <> count(DISTINCT (e->>'line_id')::uuid) FROM jsonb_array_elements(p_received_lines) e) THEN
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
    RAISE EXCEPTION 'received line does not belong to invoice' USING ERRCODE = '22023';
  END IF;

  -- Pessimistic serialization lock across all target ingredients (ordered by ID)
  PERFORM i.id
  FROM public.ingredients i
  WHERE i.id IN (
    SELECT item_id FROM public.purchase_invoice_items
    WHERE purchase_invoice_id = p_invoice_id AND tenant_id = p_tenant_id AND item_nature = 'INVENTORYABLE'
  ) AND i.tenant_id = p_tenant_id
  ORDER BY i.id
  FOR UPDATE;

  FOR v_line IN
    SELECT pii.*, (SELECT value FROM jsonb_array_elements(p_received_lines) WHERE (value->>'line_id')::uuid = pii.id) AS raw_input
    FROM public.purchase_invoice_items pii
    WHERE pii.purchase_invoice_id = p_invoice_id
      AND pii.tenant_id = p_tenant_id
      AND pii.item_nature = 'INVENTORYABLE'
      AND pii.received_quantity < pii.quantity
      AND (p_received_lines IS NULL OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(p_received_lines) WHERE (value->>'line_id')::uuid = pii.id
      ))
    ORDER BY pii.id ASC
  LOOP
    IF p_received_lines IS NULL THEN
      v_target_qty := v_line.quantity - v_line.received_quantity;
    ELSE
      v_target_qty := (v_line.raw_input->>'quantity')::numeric;
    END IF;

    IF (v_line.received_quantity + v_target_qty) > v_line.quantity THEN
      RAISE EXCEPTION 'received quantity exceeds remaining quantity for item %', v_line.item_name USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_ing
    FROM public.ingredients
    WHERE id = v_line.item_id AND tenant_id = p_tenant_id;

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

    v_prev_stock := v_ing.stock;
    v_prev_cost := v_ing.cost;

    IF v_prev_stock <= 0 THEN
      v_new_wac := round(v_normalized_cost, 4);
    ELSE
      v_new_wac := round(((v_prev_stock * v_prev_cost) + (v_normalized_qty * v_normalized_cost)) / (v_prev_stock + v_normalized_qty), 4);
    END IF;

    -- 1. Deterministic Spatial Location Resolution
    SELECT * INTO v_loc
    FROM public.resolve_inventory_location_v1(
      p_tenant_id, 
      NULL, 
      CASE WHEN (v_line.raw_input->>'location_id') IS NOT NULL THEN (v_line.raw_input->>'location_id')::uuid ELSE NULL END, 
      v_actor
    );

    -- 2. Concurrency-Safe Absent/Present Mutation on inventory_balances
    INSERT INTO public.inventory_balances (
      tenant_id, center_id, warehouse_id, location_id, ingredient_id, stock_quantity, updated_at
    ) VALUES (
      p_tenant_id, v_loc.center_id, v_loc.warehouse_id, v_loc.location_id, v_ing.id, v_normalized_qty, now()
    )
    ON CONFLICT (tenant_id, location_id, ingredient_id)
    DO UPDATE SET
      stock_quantity = public.inventory_balances.stock_quantity + EXCLUDED.stock_quantity,
      updated_at = now()
    RETURNING id, stock_quantity INTO v_bal_id, v_new_bal_stock;

    -- 3. Deterministic Aggregate Legacy Projection to ingredients.stock
    UPDATE public.ingredients
    SET
      stock = (
        SELECT COALESCE(SUM(b.stock_quantity), 0.000)
        FROM public.inventory_balances b
        WHERE b.tenant_id = p_tenant_id AND b.ingredient_id = v_ing.id
      ),
      cost = v_new_wac
    WHERE id = v_ing.id AND tenant_id = p_tenant_id
    RETURNING stock INTO v_new_stock;

    -- 4. Audit Trail & Stock Movement Entries
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
      'stock_mutated', true,
      'location_id', v_loc.location_id,
      'location_balance', v_new_bal_stock
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
  SET status = v_new_status, received_at = now(), received_by = v_actor
  WHERE id = p_invoice_id;

  v_result := jsonb_build_object(
    'success', true,
    'receipt_id', v_receipt_id,
    'invoice_id', p_invoice_id,
    'status', v_new_status,
    'summary', jsonb_build_object(
      'items_processed', v_total_items_processed,
      'total_stock_increment', v_total_stock_increment,
      'remaining_pending_lines', v_remaining_pending_lines
    ),
    'processed_lines', v_processed_lines,
    'idempotent', false
  );

  INSERT INTO public.purchase_receipt_executions (tenant_id, receipt_id, invoice_id, request_payload, execution_payload)
  VALUES (p_tenant_id, v_receipt_id, p_invoice_id, v_request, v_result);

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_invoice_v1(uuid, uuid, uuid, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receive_purchase_invoice_v1(uuid, uuid, uuid, jsonb, uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 3. Updated apply_inventory_consumption_v1 (Atomic Spatial Mutation)
-- ----------------------------------------------------------------------------
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
  v_loc RECORD;
  v_total_req numeric;
  v_norm_qty numeric;
  v_prev_stock numeric;
  v_new_stock numeric;
  v_new_bal_stock numeric;
  v_running_stock numeric;
  v_line_prev numeric;
  v_line_new numeric;
  v_processed_lines jsonb := '[]'::jsonb;
  v_total_stock_decrement numeric := 0;
  v_items_count integer := 0;
  v_centers_count integer;
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
      public.is_tenant_member(p_tenant_id) AND
      (public.has_any_staff_role(v_actor, p_tenant_id) OR public.is_saas_admin(v_actor))
    ) THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_actor := COALESCE(p_actor_id, v_actor);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_consumption_id::text, 0));

  SELECT * INTO v_cons
  FROM public.inventory_consumptions
  WHERE id = p_consumption_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'consumption plan not found: %', p_consumption_id USING ERRCODE = 'P0002';
  END IF;

  IF v_cons.status = 'applied' OR v_cons.status = 'sealed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'consumption_id', p_consumption_id,
      'status', v_cons.status
    );
  END IF;

  IF v_cons.status <> 'planned' THEN
    RAISE EXCEPTION 'consumption plan must be planned: %', v_cons.status USING ERRCODE = '22023';
  END IF;

  -- 1. Check Active Production Centers (Fail-Closed on Multi-Center Ambiguity)
  SELECT count(*) INTO v_centers_count
  FROM public.production_centers
  WHERE tenant_id = p_tenant_id AND is_active = true;

  IF v_centers_count > 1 THEN
    RAISE EXCEPTION 'AMBIGUOUS_CONSUMPTION_CENTER: Tenant % has multiple production centers (% centers). FLOW-04 consumption cannot determine consumption center without explicit center binding.',
      p_tenant_id, v_centers_count USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_loc
  FROM public.resolve_inventory_location_v1(p_tenant_id, NULL, NULL, v_actor);

  -- Pessimistic serialization lock across all target ingredients (ordered by ID)
  PERFORM i.id
  FROM public.ingredients i
  WHERE i.id IN (
    SELECT DISTINCT ingredient_id
    FROM public.inventory_consumption_lines
    WHERE consumption_id = p_consumption_id AND tenant_id = p_tenant_id
  ) AND i.tenant_id = p_tenant_id
  ORDER BY i.id
  FOR UPDATE;

  FOR v_ing IN
    SELECT DISTINCT i.*
    FROM public.ingredients i
    JOIN public.inventory_consumption_lines l ON l.ingredient_id = i.id
    WHERE l.consumption_id = p_consumption_id
      AND l.tenant_id = p_tenant_id
    ORDER BY i.id ASC
  LOOP
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

    -- 2. Concurrency-Safe Decrement on inventory_balances
    UPDATE public.inventory_balances
    SET stock_quantity = stock_quantity - v_total_req,
        updated_at = now()
    WHERE tenant_id = p_tenant_id
      AND center_id = v_loc.center_id
      AND warehouse_id = v_loc.warehouse_id
      AND location_id = v_loc.location_id
      AND ingredient_id = v_ing.id
      AND stock_quantity >= v_total_req
    RETURNING stock_quantity INTO v_new_bal_stock;

    IF NOT FOUND THEN
      SELECT stock_quantity INTO v_prev_stock
      FROM public.inventory_balances
      WHERE tenant_id = p_tenant_id 
        AND location_id = v_loc.location_id 
        AND ingredient_id = v_ing.id;

      RAISE EXCEPTION 'insufficient_stock: ingredient % in location % has % available, required %',
        v_ing.id, v_loc.location_id, COALESCE(v_prev_stock, 0.000), v_total_req USING ERRCODE = '22023';
    END IF;

    -- 3. Deterministic Aggregate Legacy Projection to ingredients.stock
    UPDATE public.ingredients
    SET stock = (
      SELECT COALESCE(SUM(b.stock_quantity), 0.000)
      FROM public.inventory_balances b
      WHERE b.tenant_id = p_tenant_id AND b.ingredient_id = v_ing.id
    )
    WHERE id = v_ing.id AND tenant_id = p_tenant_id
    RETURNING stock INTO v_new_stock;

    v_prev_stock := v_new_stock + v_total_req;
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
    'summary', jsonb_build_object(
      'items_processed', v_items_count,
      'total_stock_decrement', v_total_stock_decrement
    ),
    'lines', v_processed_lines,
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_inventory_consumption_v1(uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_inventory_consumption_v1(uuid, uuid, uuid) TO authenticated, service_role;
