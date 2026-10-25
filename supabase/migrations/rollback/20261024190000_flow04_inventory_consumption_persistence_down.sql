-- ============================================================================
-- YOURMEAL OS — FLOW-04 INVENTORY CONSUMPTION PERSISTENCE BRIDGE (NON-DESTRUCTIVE ROLLBACK)
-- Subsystem: Platform Core / Inventory & Kitchen Handoff
-- Rollback for 20261024190000_flow04_inventory_consumption_persistence.sql
-- ============================================================================
-- Estrategia de reversión segura y sin pérdida de información:
-- 1. Pre-producción (sin datos históricos): Si no existen consumos registrados,
--    se eliminan las funciones y estructuras limpiamente.
-- 2. Post-producción / Con datos existentes: Si ya existen consumos registrados,
--    se bloquea la ejecución de nuevos planes (REVOKE EXECUTE / DROP FUNCTION),
--    preservando intactas las tablas de auditoría e histórico para trazabilidad.
-- ============================================================================

BEGIN;

-- 1. Desactivación inmediata de puntos de entrada operativos
REVOKE EXECUTE ON FUNCTION public.create_inventory_consumption_plan_v1(uuid, date, jsonb, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.apply_inventory_consumption_v1(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.seal_inventory_consumption_v1(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.create_inventory_consumption_plan_v1(uuid, date, jsonb, uuid);
DROP FUNCTION IF EXISTS public.apply_inventory_consumption_v1(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.seal_inventory_consumption_v1(uuid, uuid, uuid);

-- 2. Protección no destructiva de datos históricos
DO $$
DECLARE
  v_has_data boolean := false;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'inventory_consumptions'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.inventory_consumptions LIMIT 1)' INTO v_has_data;
    
    IF v_has_data THEN
      RAISE NOTICE 'Rollback seguro: Se detectaron registros en inventory_consumptions. Se preservan las tablas para evitar pérdida de datos históricos.';
      -- Revocar cualquier acceso de escritura remanente garantizando inmutabilidad histórica
      REVOKE INSERT, UPDATE, DELETE ON public.inventory_consumptions FROM PUBLIC, anon, authenticated;
      REVOKE INSERT, UPDATE, DELETE ON public.inventory_consumption_lines FROM PUBLIC, anon, authenticated;
    ELSE
      RAISE NOTICE 'Rollback limpio: No se detectaron registros. Se eliminan las tablas sin riesgo de pérdida de datos.';
      DROP TABLE IF EXISTS public.inventory_consumption_lines;
      DROP TABLE IF EXISTS public.inventory_consumptions;
    END IF;
  END IF;
END $$;

COMMIT;
