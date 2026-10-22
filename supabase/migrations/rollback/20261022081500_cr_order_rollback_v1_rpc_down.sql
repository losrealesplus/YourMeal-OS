-- Migration Rollback: 20261022081500_cr_order_rollback_v1_rpc_down.sql
DROP FUNCTION IF EXISTS public.rollback_order_status_v1(uuid, uuid, public.order_status, public.order_status, text);
