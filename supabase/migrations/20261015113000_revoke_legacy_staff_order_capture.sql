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

-- 3. Assert effective permissions and absence of unexpected grants before COMMIT (fail-closed).
DO $$
DECLARE
  v_proc_oid oid := to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)');
BEGIN
  IF v_proc_oid IS NULL THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: capture_staff_existing_order(uuid,jsonb) not found.';
  END IF;

  -- 3.1 Assert authenticated, anon, and service_role have no effective EXECUTE
  IF has_function_privilege('authenticated', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: authenticated has effective EXECUTE on legacy capture RPC.';
  END IF;

  IF has_function_privilege('anon', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: anon has effective EXECUTE on legacy capture RPC.';
  END IF;

  IF has_function_privilege('service_role', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: service_role has effective EXECUTE on legacy capture RPC.';
  END IF;

  -- 3.2 Assert absence of PUBLIC or any unexpected non-owner grantee in ACL
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    WHERE p.oid = v_proc_oid
      AND a.privilege_type = 'EXECUTE'
      AND a.grantee <> p.proowner
  ) THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: Non-owner role retains EXECUTE on legacy capture RPC.';
  END IF;

  -- 3.3 Assert owner retains EXECUTE
  IF NOT has_function_privilege('postgres', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'MIGRATION_ASSERTION_FAILED: postgres owner lost EXECUTE privilege.';
  END IF;
END $$;

COMMIT;
