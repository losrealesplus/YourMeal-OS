-- Non-destructive disablement only. Receipt history, quantities and schema remain.
-- Restoration requires a separately reviewed recovery plan; never drop audit data.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.receive_purchase_invoice_v1(uuid, uuid, uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
COMMIT;
