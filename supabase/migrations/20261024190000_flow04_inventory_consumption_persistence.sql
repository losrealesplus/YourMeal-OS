-- ============================================================================
-- YOURMEAL OS — FLOW-04 INVENTORY CONSUMPTION PERSISTENCE BRIDGE
-- Subsystem: Platform Core / Inventory & Kitchen Handoff
-- Real PostgreSQL Storage for T1 Plan, T2 Atomic Apply, and T3 Seal
-- ============================================================================

-- 1. Tabla de consumos de inventario planificados y ejecutados
CREATE TABLE IF NOT EXISTS public.inventory_consumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  delivery_date date NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'applied', 'sealed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  sealed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  applied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sealed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_inventory_consumption_day UNIQUE (tenant_id, delivery_date)
);

-- Proteger escritura directa: authenticated solo tiene SELECT. Las mutaciones son exclusivas vía RPCs.
REVOKE ALL ON public.inventory_consumptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inventory_consumptions TO authenticated;
GRANT ALL ON public.inventory_consumptions TO service_role;
ALTER TABLE public.inventory_consumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_consumptions_staff ON public.inventory_consumptions;
CREATE POLICY inventory_consumptions_staff ON public.inventory_consumptions
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id) AND
    (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  );

CREATE INDEX IF NOT EXISTS idx_inventory_consumptions_tenant_day
  ON public.inventory_consumptions (tenant_id, delivery_date);

-- 2. Tabla de líneas desglosadas por ingrediente
CREATE TABLE IF NOT EXISTS public.inventory_consumption_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_id uuid NOT NULL REFERENCES public.inventory_consumptions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  ingredient_name text NOT NULL,
  quantity numeric(12,3) NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'g',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Proteger escritura directa: authenticated solo tiene SELECT.
REVOKE ALL ON public.inventory_consumption_lines FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.inventory_consumption_lines TO authenticated;
GRANT ALL ON public.inventory_consumption_lines TO service_role;
ALTER TABLE public.inventory_consumption_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_consumption_lines_staff ON public.inventory_consumption_lines;
CREATE POLICY inventory_consumption_lines_staff ON public.inventory_consumption_lines
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id) AND
    (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()))
  );

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_lines_cons
  ON public.inventory_consumption_lines (tenant_id, consumption_id);

-- 3. Función transaccional atómica para T1: create_inventory_consumption_plan_v1
CREATE OR REPLACE FUNCTION public.create_inventory_consumption_plan_v1(
  p_tenant_id uuid,
  p_delivery_date date,
  p_lines jsonb,
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
  v_line_elem jsonb;
  v_ing_id uuid;
  v_ing_name text;
  v_qty numeric;
  v_unit text;
  v_canonical jsonb;
  v_requested jsonb;
  v_stored jsonb;
BEGIN
  -- 1. Identificación y Autorización
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

  IF p_delivery_date IS NULL THEN
    RAISE EXCEPTION 'delivery date required' USING ERRCODE = '22023';
  END IF;
  -- Serializes the absent-row case as well as retries. No unique-key race.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_delivery_date::text, 0));

  -- Same canonical production source used by loadProductionPlanInput; quantities
  -- are derived in the database, never trusted merely because the caller is staff.
  WITH portions AS (
    SELECT oi.dish_id, sum(oi.qty) AS qty
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id AND o.tenant_id = oi.tenant_id
    WHERE oi.tenant_id = p_tenant_id AND oi.day_date = p_delivery_date
      AND oi.item_kind = 'dish' AND oi.deleted_at IS NULL AND oi.qty > 0
      AND o.deleted_at IS NULL
      AND o.status IN ('confirmed','in_production','prepared','ready_for_delivery','out_for_delivery','delivered')
    GROUP BY oi.dish_id
  ), requirements AS (
    SELECT di.ingredient_id, di.unit, sum(p.qty * di.qty) AS quantity
    FROM portions p
    JOIN public.dish_ingredients di ON di.dish_id = p.dish_id AND di.tenant_id = p_tenant_id
    JOIN public.ingredients i ON i.id = di.ingredient_id AND i.tenant_id = p_tenant_id AND i.deleted_at IS NULL
    WHERE di.qty > 0
    GROUP BY di.ingredient_id, di.unit
  )
  SELECT jsonb_agg(jsonb_build_object('ingredient_id', ingredient_id, 'quantity', quantity, 'unit', unit)
    ORDER BY ingredient_id, unit) INTO v_canonical FROM requirements;
  IF v_canonical IS NULL THEN
    RAISE EXCEPTION 'No canonical production source for delivery date' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT FROM jsonb_array_elements(v_canonical) e
    WHERE (e->>'quantity')::numeric <> round((e->>'quantity')::numeric,3)) THEN
    RAISE EXCEPTION 'Canonical quantity exceeds stock precision' USING ERRCODE = '22023';
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Consumption plan requires a lines array' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'Consumption plan requires at least one recipe line' USING ERRCODE = '22023';
  END IF;
  FOR v_line_elem IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    IF jsonb_typeof(v_line_elem) IS DISTINCT FROM 'object'
      OR jsonb_typeof(v_line_elem->'ingredient_id') IS DISTINCT FROM 'string'
      OR jsonb_typeof(v_line_elem->'quantity') IS DISTINCT FROM 'number'
      OR jsonb_typeof(v_line_elem->'unit') IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Invalid consumption line' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF (SELECT count(*) <> count(DISTINCT ((e->>'ingredient_id')::uuid, e->>'unit'))
    FROM jsonb_array_elements(p_lines) e) THEN
    RAISE EXCEPTION 'Duplicate consumption line' USING ERRCODE = '22023';
  END IF;
  SELECT jsonb_agg(jsonb_build_object('ingredient_id',(e->>'ingredient_id')::uuid,
    'quantity',(e->>'quantity')::numeric,'unit',e->>'unit')
    ORDER BY (e->>'ingredient_id')::uuid,e->>'unit') INTO v_requested
    FROM jsonb_array_elements(p_lines) e;
  IF v_requested IS DISTINCT FROM v_canonical THEN
    RAISE EXCEPTION 'Consumption quantities differ from canonical production' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cons FROM public.inventory_consumptions
    WHERE tenant_id = p_tenant_id AND delivery_date = p_delivery_date FOR UPDATE;
  IF FOUND THEN
    SELECT jsonb_agg(jsonb_build_object('ingredient_id',ingredient_id,'quantity',quantity,'unit',unit)
      ORDER BY ingredient_id,unit) INTO v_stored FROM public.inventory_consumption_lines
      WHERE consumption_id = v_cons.id AND tenant_id = p_tenant_id;
    IF v_stored IS DISTINCT FROM v_canonical THEN
      RAISE EXCEPTION 'Existing consumption plan differs from canonical production; explicit reconciliation required'
        USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('success',true,'consumption_id',v_cons.id,'status',v_cons.status,
      'delivery_date',v_cons.delivery_date,'idempotent',true,'created_at',v_cons.created_at);
  END IF;

  -- 4. Inserción atómica de cabecera y líneas en la misma transacción
  INSERT INTO public.inventory_consumptions (
    tenant_id,
    delivery_date,
    status,
    created_by
  ) VALUES (
    p_tenant_id,
    p_delivery_date,
    'planned',
    v_actor
  )
  RETURNING * INTO v_cons;

  FOR v_line_elem IN SELECT * FROM jsonb_array_elements(v_canonical)
  LOOP
    v_ing_id := (v_line_elem->>'ingredient_id')::uuid;
    SELECT name INTO v_ing_name FROM public.ingredients WHERE id = v_ing_id AND tenant_id = p_tenant_id;
    v_qty := (v_line_elem->>'quantity')::numeric;
    v_unit := COALESCE(v_line_elem->>'unit', 'g');

    INSERT INTO public.inventory_consumption_lines (
      consumption_id,
      tenant_id,
      ingredient_id,
      ingredient_name,
      quantity,
      unit
    ) VALUES (
      v_cons.id,
      p_tenant_id,
      v_ing_id,
      v_ing_name,
      v_qty,
      v_unit
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'consumption_id', v_cons.id,
    'status', 'planned',
    'delivery_date', v_cons.delivery_date,
    'idempotent', false,
    'created_at', v_cons.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_inventory_consumption_plan_v1 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_inventory_consumption_plan_v1 TO authenticated, service_role;

-- 4. Función transaccional atómica para T2: apply_inventory_consumption_v1
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
  -- 1. Identificación y Autorización
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

  -- 2. Bloqueo pesimista del registro de consumo (FOR UPDATE)
  SELECT * INTO v_cons
  FROM public.inventory_consumptions
  WHERE id = p_consumption_id AND tenant_id = p_tenant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Consumption % not found for tenant %', p_consumption_id, p_tenant_id USING ERRCODE = 'P0002';
  END IF;

  -- Idempotencia (FLOW04-I2 Single Apply): si ya está aplicado o sellado, retornar sin descontar
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

  -- 3. Bloqueo determinista (ORDER BY id ASC FOR UPDATE) de todos los ingredientes involucrados
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

  -- 4. Validación de existencias agrupadas tras adquirir el bloqueo (evita saldo negativo y sobreventa concurrente)
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

    -- Calcular consumo total requerido para este ingrediente agregando todas las líneas
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

    -- Verificar que el saldo no quede negativo
    IF (v_ing.stock - v_total_req) < 0 THEN
      RAISE EXCEPTION 'insufficient_stock: ingredient % has % available, required %',
        v_ing.id, v_ing.stock, v_total_req USING ERRCODE = '22023';
    END IF;

    -- 5. Mutación de existencias: decrementar stock manteniendo WAC (v_ing.cost) estrictamente intacto
    v_prev_stock := v_ing.stock;
    v_new_stock := v_prev_stock - v_total_req;

    UPDATE public.ingredients
    SET stock = v_new_stock
    WHERE id = v_ing.id AND tenant_id = p_tenant_id;

    -- 6. Asiento inmutable en stock_movements para cada línea
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
        created_by,
        notes
      ) VALUES (
        p_tenant_id,
        v_ing.id,
        'PRODUCTION_CONSUMPTION',
        v_norm_qty,
        v_line_prev,
        v_line_new,
        v_ing.cost, -- WAC estrictamente inalterado
        'PRODUCTION_ORDER',
        p_consumption_id,
        v_line.id,
        v_actor,
        'FLOW-04 Consumo de producción aplicado'
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

  -- 7. Transición de estado a 'applied'
  UPDATE public.inventory_consumptions
  SET
    status = 'applied',
    applied_at = now(),
    applied_by = v_actor
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

-- 5. Función atómica para T3: seal_inventory_consumption_v1
CREATE OR REPLACE FUNCTION public.seal_inventory_consumption_v1(
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
BEGIN
  -- 1. Identificación y Autorización
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

  IF v_cons.status = 'sealed' THEN
    RETURN jsonb_build_object(
      'success', true,
      'consumption_id', p_consumption_id,
      'status', 'sealed',
      'idempotent', true,
      'message', 'Consumption already sealed'
    );
  END IF;

  IF v_cons.status <> 'applied' THEN
    RAISE EXCEPTION 'sealConsumption requires status=applied (got %)', v_cons.status USING ERRCODE = '22023';
  END IF;

  UPDATE public.inventory_consumptions
  SET
    status = 'sealed',
    sealed_at = now(),
    sealed_by = v_actor
  WHERE id = p_consumption_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'consumption_id', p_consumption_id,
    'status', 'sealed',
    'idempotent', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.seal_inventory_consumption_v1 FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seal_inventory_consumption_v1 TO authenticated, service_role;
