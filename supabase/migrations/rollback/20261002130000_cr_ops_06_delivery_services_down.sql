-- Rollback: 20261002130000_cr_ops_06_delivery_services_down.sql
-- Reverts CR-OPS-06 delivery_services table, RPC function, and enum.

DROP FUNCTION IF EXISTS public.transition_delivery_service_status(uuid, uuid, public.delivery_service_status, uuid, text);
DROP TABLE IF EXISTS public.delivery_services CASCADE;
DROP TYPE IF EXISTS public.delivery_service_status CASCADE;
