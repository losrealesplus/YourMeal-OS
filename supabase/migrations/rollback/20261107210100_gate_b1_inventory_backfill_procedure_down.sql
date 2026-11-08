-- ============================================================================
-- Rollback Migration: 20261107210100_gate_b1_inventory_backfill_procedure_down.sql
-- Subsystem: YourMeal OS Core / Inventory (Gate B · PR B1)
-- ============================================================================

DROP FUNCTION IF EXISTS public.rollback_gate_b1_backfill_v1(uuid);
DROP FUNCTION IF EXISTS public.execute_gate_b1_backfill_v1();
DROP TABLE IF EXISTS public.inventory_backfill_executions CASCADE;
DROP TABLE IF EXISTS public.inventory_backfill_discrepancies CASCADE;
