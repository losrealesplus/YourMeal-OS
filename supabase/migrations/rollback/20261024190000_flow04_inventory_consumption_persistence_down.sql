-- ============================================================================
-- YOURMEAL OS — FLOW-04 INVENTORY CONSUMPTION PERSISTENCE BRIDGE (ROLLBACK)
-- Subsystem: Platform Core / Inventory & Kitchen Handoff
-- Rollback for 20261024190000_flow04_inventory_consumption_persistence.sql
-- ============================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.seal_inventory_consumption_v1(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.apply_inventory_consumption_v1(uuid, uuid, uuid);

DROP TABLE IF EXISTS public.inventory_consumption_lines;
DROP TABLE IF EXISTS public.inventory_consumptions;

COMMIT;
