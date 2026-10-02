-- Rollback Migration: 20261002100000_cr_cust_01_customer_dietary_profiles_down.sql
-- CR-CUST-01 Rollback: Drop dietary profile table and remove orders snapshot column.

ALTER TABLE public.orders DROP COLUMN IF EXISTS dietary_snapshot;
DROP TABLE IF EXISTS public.customer_dietary_profiles CASCADE;
