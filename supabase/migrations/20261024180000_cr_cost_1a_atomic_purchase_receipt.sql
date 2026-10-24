-- ============================================================================
-- YOURMEAL OS — ATOMIC PURCHASE RECEIPT & STOCK INTEGRATION (CR-COST-1A)
-- Subsystem: Platform Core / Cost Intelligence
-- Safe, Atomic, Idempotent Physical Receipt for Goods & Expense Segregation
-- ============================================================================

-- 1. Extensión de purchase_invoices
ALTER TABLE public.purchase_invoices
  ADD COLUMN IF NOT EXISTS received_at timestamptz,
  ADD COLUMN IF NOT EXISTS received_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pi_status'
  ) THEN
    ALTER TABLE public.purchase_invoices DROP CONSTRAINT check_pi_status;
  END IF;
  ALTER TABLE public.purchase_invoices
    ADD CONSTRAINT check_pi_status
    CHECK (status IN ('draft', 'partially_received', 'received', 'posted', 'cancelled'));
END $$;

-- 2. Extensión de purchase_invoice_items
ALTER TABLE public.purchase_invoice_items
  ADD COLUMN IF NOT EXISTS item_nature text NOT NULL DEFAULT 'INVENTORYABLE',
  ADD COLUMN IF NOT EXISTS received_quantity numeric(12,3) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pii_item_nature'
  ) THEN
    ALTER TABLE public.purchase_invoice_items
      ADD CONSTRAINT check_pii_item_nature
      CHECK (item_nature IN ('INVENTORYABLE', 'EXPENSE_SERVICE', 'CAPEX_ASSET'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_pii_received_qty'
  ) THEN
    ALTER TABLE public.purchase_invoice_items
      ADD CONSTRAINT check_pii_received_qty
      CHECK (received_quantity >= 0);
  END IF;
END $$;

-- 3. Tabla inmutable de movimientos de existencias (stock_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('PURCHASE_RECEIPT', 'PRODUCTION_CONSUMPTION', 'MANUAL_ADJUSTMENT', 'WASTE_DISPOSAL')),
  quantity numeric(12,3) NOT NULL,
  previous_stock numeric(12,3) NOT NULL,
  new_stock numeric(12,3) NOT NULL,
  unit_cost numeric(12,4) NOT NULL,
  reference_document_type text NOT NULL CHECK (reference_document_type IN ('PURCHASE_INVOICE', 'DELIVERY_NOTE', 'PRODUCTION_ORDER', 'ADJUSTMENT_NOTE')),
  reference_document_id uuid NOT NULL,
  reference_line_id uuid,
  receipt_id uuid,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.stock_movements FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_movements_staff ON public.stock_movements;
CREATE POLICY stock_movements_staff ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND
    (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_ingredient
  ON public.stock_movements (tenant_id, ingredient_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_ref_doc
  ON public.stock_movements (tenant_id, reference_document_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_receipt_id
  ON public.stock_movements (tenant_id, receipt_id);

-- 4. Tabla de ejecuciones de recepción (Idempotency Ledger)
CREATE TABLE IF NOT EXISTS public.purchase_receipt_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE RESTRICT,
  receipt_id uuid NOT NULL,
  execution_payload jsonb NOT NULL,
  request_payload jsonb NOT NULL,
  executed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_receipt_execution UNIQUE (tenant_id, receipt_id)
);

REVOKE ALL ON public.purchase_receipt_executions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.purchase_receipt_executions TO authenticated;
GRANT ALL ON public.purchase_receipt_executions TO service_role;
ALTER TABLE public.purchase_receipt_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_receipt_executions_staff ON public.purchase_receipt_executions;
CREATE POLICY purchase_receipt_executions_staff ON public.purchase_receipt_executions
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id) AND
    (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid())));

CREATE INDEX IF NOT EXISTS idx_purchase_receipt_executions_invoice
  ON public.purchase_receipt_executions (tenant_id, invoice_id);

-- 5. Función transaccional atómica: receive_purchase_invoice_v1
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
  -- Identity comes exclusively from the authenticated session, never client input.
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

  -- SQL NULL alone means full receipt. JSON null, objects and empty arrays fail closed.
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
      -- Cast rejects malformed UUIDs; three decimals match persisted quantities.
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
  -- Serialize a receipt key even when competing requests name different invoices.
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

  -- 3. Bloqueo pesimista del documento de compra
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
  -- Lock lines and ingredients in stable order across invoices to avoid deadlocks.
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

  -- 4. Procesamiento atómico línea por línea
  FOR v_line IN
    SELECT *
    FROM public.purchase_invoice_items
    WHERE purchase_invoice_id = p_invoice_id AND tenant_id = p_tenant_id
    ORDER BY id ASC
  LOOP
    -- Determinar cantidad a recibir
    IF p_received_lines IS NOT NULL AND jsonb_typeof(p_received_lines) = 'array' THEN
      -- Buscar si esta línea fue especificada en el JSON de entrada
      SELECT (elem->>'quantity') INTO v_custom_qty
      FROM jsonb_array_elements(p_received_lines) AS elem
      WHERE (elem->>'line_id')::uuid = v_line.id;

      IF v_custom_qty IS NOT NULL THEN
        v_target_qty := v_custom_qty::numeric;
      ELSE
        v_target_qty := 0;
      END IF;
    ELSE
      -- Modo recepción completa: lo restante por recibir
      v_target_qty := v_line.quantity - v_line.received_quantity;
    END IF;

    -- Validar que la cantidad no sea negativa
    IF v_target_qty < 0 THEN
      RAISE EXCEPTION 'Invalid negative reception quantity % for line %', v_target_qty, v_line.id USING ERRCODE = '22003';
    END IF;

    -- Si no hay nada que recibir en esta línea, continuar
    IF v_target_qty = 0 THEN
      CONTINUE;
    END IF;

    -- Validar que no se reciba más de lo pendiente
    IF (v_line.received_quantity + v_target_qty) > v_line.quantity THEN
      RAISE EXCEPTION 'Cannot receive % units for line %. Maximum pending is %',
        v_target_qty, v_line.id, (v_line.quantity - v_line.received_quantity) USING ERRCODE = '22023';
    END IF;

    -- 4A. Líneas no inventariables: Servicios / Gastos Operativos y CAPEX
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

    -- 4B. Mercancía Inventariable (INVENTORYABLE)
    -- Obtener y bloquear el ingrediente en el inventario real
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

    -- Normalización y conversión de unidades
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

    -- Cálculo del nuevo Precio Medio Ponderado (WAC) canónico
    IF v_prev_stock <= 0 THEN
      v_new_wac := round(v_normalized_cost, 4);
    ELSE
      v_new_wac := round(((v_prev_stock * v_prev_cost) + (v_normalized_qty * v_normalized_cost)) / (v_prev_stock + v_normalized_qty), 4);
    END IF;

    v_new_stock := v_prev_stock + v_normalized_qty;

    -- Mutación atómica en public.ingredients
    UPDATE public.ingredients
    SET
      stock = v_new_stock,
      cost = v_new_wac
    WHERE id = v_ing.id AND tenant_id = p_tenant_id;

    -- Asiento inmutable en public.item_cost_history
    INSERT INTO public.item_cost_history (
      id,
      tenant_id,
      item_id,
      source_invoice_item_id,
      supplier_id,
      unit_price,
      allocated_overhead,
      effective_unit_cost,
      cost_method,
      effective_at
    ) VALUES (
      gen_random_uuid(),
      p_tenant_id,
      v_ing.id,
      v_line.id,
      v_invoice.supplier_id,
      v_line.unit_price,
      v_line.allocated_overhead,
      v_line.effective_unit_cost,
      'effective_purchase',
      now()
    );

    -- Registro en trazabilidad de stock (stock_movements)
    INSERT INTO public.stock_movements (
      id,
      tenant_id,
      ingredient_id,
      movement_type,
      quantity,
      previous_stock,
      new_stock,
      unit_cost,
      reference_document_type,
      reference_document_id,
      reference_line_id,
      receipt_id,
      notes,
      created_by
    ) VALUES (
      gen_random_uuid(),
      p_tenant_id,
      v_ing.id,
      'PURCHASE_RECEIPT',
      v_normalized_qty,
      v_prev_stock,
      v_new_stock,
      v_normalized_cost,
      'PURCHASE_INVOICE',
      p_invoice_id,
      v_line.id,
      v_receipt_id,
      'Recepción física de compra',
      v_actor
    );

    -- Actualizar cantidad recibida en la línea
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

  -- 5. Evaluación del estado global de la factura
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

  -- 6. Construir resultado y registrar en purchase_receipt_executions para idempotencia
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
    tenant_id,
    invoice_id,
    receipt_id,
    execution_payload,
    request_payload,
    executed_by
  ) VALUES (
    p_tenant_id,
    p_invoice_id,
    v_receipt_id,
    v_result,
    v_request,
    v_actor
  );

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.receive_purchase_invoice_v1 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receive_purchase_invoice_v1 TO authenticated, service_role;
