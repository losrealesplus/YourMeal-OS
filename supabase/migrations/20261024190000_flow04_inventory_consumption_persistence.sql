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

GRANT SELECT, INSERT, UPDATE ON public.inventory_consumptions TO authenticated;
GRANT ALL ON public.inventory_consumptions TO service_role;
ALTER TABLE public.inventory_consumptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_consumptions' AND policyname = 'inventory_consumptions_staff'
  ) THEN
    CREATE POLICY inventory_consumptions_staff ON public.inventory_consumptions
      FOR ALL TO authenticated
      USING (public.is_tenant_member(tenant_id))
      WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
  END IF;
END $$;

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

GRANT SELECT, INSERT ON public.inventory_consumption_lines TO authenticated;
GRANT ALL ON public.inventory_consumption_lines TO service_role;
ALTER TABLE public.inventory_consumption_lines ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_consumption_lines' AND policyname = 'inventory_consumption_lines_staff'
  ) THEN
    CREATE POLICY inventory_consumption_lines_staff ON public.inventory_consumption_lines
      FOR ALL TO authenticated
      USING (public.is_tenant_member(tenant_id))
      WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_consumption_lines_cons
  ON public.inventory_consumption_lines (tenant_id, consumption_id);

-- 3. Función transaccional atómica para T2: apply_inventory_consumption_v1
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
  v_prev_stock numeric;
  v_new_stock numeric;
  v_processed_lines jsonb := '[]'::jsonb;
  v_total_stock_decrement numeric := 0;
  v_items_count integer := 0;
BEGIN
  -- 1. Identificación y Autorización
  v_actor := COALESCE(auth.uid(), p_actor_id);
  
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
    END IF;

    IF NOT (
      public.has_any_staff_role(v_actor, p_tenant_id)
      OR public.is_saas_admin(v_actor)
    ) THEN
      RAISE EXCEPTION 'permission denied: actor % requires staff role for tenant %', v_actor, p_tenant_id USING ERRCODE = '42501';
    END IF;
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

  -- 3. Pre-validación FLOW04-I3: Verificar existencias de TODAS las líneas antes de cualquier mutación
  FOR v_line IN
    SELECT l.*, i.stock, i.cost, i.unit AS ing_unit, i.deleted_at
    FROM public.inventory_consumption_lines l
    JOIN public.ingredients i ON i.id = l.ingredient_id AND i.tenant_id = p_tenant_id
    WHERE l.consumption_id = p_consumption_id AND l.tenant_id = p_tenant_id
    ORDER BY l.ingredient_id ASC
  LOOP
    IF v_line.deleted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Ingredient % is deleted/inactive', v_line.ingredient_id USING ERRCODE = '22023';
    END IF;

    -- Normalizar unidad
    IF LOWER(v_line.unit) = 'kg' AND LOWER(v_line.ing_unit) = 'g' THEN
      v_norm_qty := v_line.quantity * 1000;
    ELSIF LOWER(v_line.unit) = 'g' AND LOWER(v_line.ing_unit) = 'kg' THEN
      v_norm_qty := v_line.quantity / 1000;
    ELSIF LOWER(v_line.unit) = 'l' AND LOWER(v_line.ing_unit) = 'ml' THEN
      v_norm_qty := v_line.quantity * 1000;
    ELSIF LOWER(v_line.unit) = 'ml' AND LOWER(v_line.ing_unit) = 'l' THEN
      v_norm_qty := v_line.quantity / 1000;
    ELSIF LOWER(v_line.unit) = LOWER(v_line.ing_unit) THEN
      v_norm_qty := v_line.quantity;
    ELSE
      RAISE EXCEPTION 'Incompatible units between consumption line (%) and ingredient (%): cannot auto-convert',
        v_line.unit, v_line.ing_unit USING ERRCODE = '22023';
    END IF;

    -- Comprobar disponibilidad
    IF (v_line.stock - v_norm_qty) < 0 THEN
      RAISE EXCEPTION 'insufficient_stock: ingredient % has % available, required %',
        v_line.ingredient_id, v_line.stock, v_norm_qty USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- 4. Ejecución atómica de decrementos con bloqueo FOR UPDATE y asientos en stock_movements
  FOR v_line IN
    SELECT *
    FROM public.inventory_consumption_lines
    WHERE consumption_id = p_consumption_id AND tenant_id = p_tenant_id
    ORDER BY ingredient_id ASC
  LOOP
    SELECT * INTO v_ing
    FROM public.ingredients
    WHERE id = v_line.ingredient_id AND tenant_id = p_tenant_id
    FOR UPDATE;

    -- Normalizar unidad
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

    v_prev_stock := v_ing.stock;
    v_new_stock := v_prev_stock - v_norm_qty;

    -- Mutación: se descuenta el stock SIN modificar el WAC (v_ing.cost permanece inalterado)
    UPDATE public.ingredients
    SET stock = v_new_stock
    WHERE id = v_ing.id AND tenant_id = p_tenant_id;

    -- Asiento inmutable en stock_movements
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
      v_prev_stock,
      v_new_stock,
      v_ing.cost,
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
      'previous_stock', v_prev_stock,
      'new_stock', v_new_stock,
      'unit_cost', v_ing.cost
    );

    v_total_stock_decrement := v_total_stock_decrement + v_norm_qty;
    v_items_count := v_items_count + 1;
  END LOOP;

  -- 5. Transición de estado a 'applied'
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

-- 4. Función atómica para T3: seal_inventory_consumption_v1
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
  v_actor := COALESCE(auth.uid(), p_actor_id);

  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF v_actor IS NULL THEN
      RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
    END IF;

    IF NOT (
      public.has_any_staff_role(v_actor, p_tenant_id)
      OR public.is_saas_admin(v_actor)
    ) THEN
      RAISE EXCEPTION 'permission denied: actor % requires staff role for tenant %', v_actor, p_tenant_id USING ERRCODE = '42501';
    END IF;
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
