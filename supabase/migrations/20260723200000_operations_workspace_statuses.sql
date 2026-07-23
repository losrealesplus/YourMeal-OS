-- Part 1: extend enums (must commit before function uses new labels)

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'prepared';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'ready_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'out_for_delivery';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'delivery_issue';

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operations_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';
