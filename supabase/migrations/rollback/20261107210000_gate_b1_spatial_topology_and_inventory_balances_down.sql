-- ============================================================================
-- Rollback Migration: 20261107210000_gate_b1_spatial_topology_and_inventory_balances_down.sql
-- Subsystem: YourMeal OS Core / Inventory (Gate B · PR B1)
-- ============================================================================

DROP FUNCTION IF EXISTS public.assign_user_to_center_v1(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_ingredient_balances_v1(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.provision_initial_tenant_center_v1(uuid, text);
DROP VIEW IF EXISTS public.v_ingredient_stocks CASCADE;
DROP FUNCTION IF EXISTS public.has_center_access(uuid, uuid, uuid);

DROP TABLE IF EXISTS public.user_center_assignments CASCADE;
DROP TABLE IF EXISTS public.inventory_balances CASCADE;
DROP TABLE IF EXISTS public.inventory_locations CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.production_centers CASCADE;

DROP TYPE IF EXISTS public.warehouse_type CASCADE;

ALTER TABLE public.ingredients DROP CONSTRAINT IF EXISTS uq_ingredients_tenant_id;
