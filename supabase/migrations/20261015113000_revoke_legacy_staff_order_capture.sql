-- Revoke EXECUTE privilege on legacy atomic staff order capture.
-- Superseded by Universal Intake V2 (Server Functions with cr_order_offer_quote_issue & cr_order_offer_quote_commit).
-- Closes direct SQL RPC bypass vulnerability for authenticated and anon callers.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL ROLE postgres;

-- 1. Explicitly revoke EXECUTE from PUBLIC, anon, authenticated, and service_role.
-- This ensures no PostgREST or direct client session can invoke this legacy function.
REVOKE ALL ON FUNCTION public.capture_staff_existing_order(uuid, jsonb) FROM PUBLIC, anon, authenticated, service_role;

-- 2. Update function comment to document permanent revocation.
COMMENT ON FUNCTION public.capture_staff_existing_order(uuid, jsonb) IS 'DEPRECATED: Legacy EatClean staff order intake RPC. Permanently revoked. All intake flows exclusively through Universal Intake V2.';

COMMIT;
