-- ==============================================================================
-- YOURMEAL OS / EATCLEAN — PRODUCTION RUNBOOK (PENDING HUMAN APPROVAL)
-- PROCEDURE: Revocation of EXECUTE on public.capture_staff_existing_order(uuid,jsonb)
--
-- STATUS: DRAFT FOR HUMAN REVIEW — DO NOT EXECUTE AUTOMATICALLY
-- ENVIRONMENT: Supabase Production (Target: EatClean / YourMeal OS)
-- BUSINESS IMPACT: ZERO table writes; closes legacy RPC bypass vector.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PRECHECK
-- Validates preconditions, schema integrity, and detects permission status/drift
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_proc_oid oid;
  v_definition_hash text;
  v_auth_has_exec boolean;
  v_anon_has_exec boolean;
BEGIN
  -- 1.1 Project & Tenant Verification
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid) THEN
    RAISE EXCEPTION 'PRECHECK_FAILED: EatClean tenant 8bba00ba-331b-42c8-9283-4e3836ffb870 not found.';
  END IF;

  -- 1.2 Function Existence and Signature Verification
  v_proc_oid := to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)');
  IF v_proc_oid IS NULL THEN
    RAISE EXCEPTION 'PRECHECK_FAILED: public.capture_staff_existing_order(uuid,jsonb) does not exist.';
  END IF;

  -- 1.3 Definition Drift Check (matches migration 20261011163814)
  SELECT encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex') INTO v_definition_hash
  FROM pg_proc p WHERE p.oid = v_proc_oid;
  IF v_definition_hash IS DISTINCT FROM 'b953706417c7689974ca855f2108fcb24a2b937d159407dfbf3313b97e5ce8ea' THEN
    RAISE WARNING 'PRECHECK_NOTICE: capture_staff_existing_order definition hash differs from base migration (current: %).', v_definition_hash;
  END IF;

  -- 1.4 Inspect Current Permission Status
  v_auth_has_exec := has_function_privilege('authenticated', v_proc_oid, 'EXECUTE');
  v_anon_has_exec := has_function_privilege('anon', v_proc_oid, 'EXECUTE');

  RAISE NOTICE 'PRECHECK_STATUS: authenticated EXECUTE = %, anon EXECUTE = %', v_auth_has_exec, v_anon_has_exec;

  -- 1.5 Canonical V2 Dependency Verification (must exist and remain intact)
  IF to_regprocedure('cr_order_private.session_uid_bridge()') IS NULL THEN
    RAISE EXCEPTION 'PRECHECK_FAILED: cr_order_private.session_uid_bridge() missing.';
  END IF;
  IF to_regprocedure('cr_order_private.guard_legacy_offer()') IS NULL THEN
    RAISE EXCEPTION 'PRECHECK_FAILED: cr_order_private.guard_legacy_offer() missing.';
  END IF;

  RAISE NOTICE 'PRECHECK_COMPLETE: All prechecks passed. Ready for proposed transaction.';
END $$;

-- ------------------------------------------------------------------------------
-- 2. CAMBIO PROPUESTO (MINIMAL TRANSACTION)
-- Revokes EXECUTE on legacy capture RPC exclusively.
-- Zero rows modified, zero DDL schema changes.
-- ------------------------------------------------------------------------------
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = pg_catalog, pg_temp;

REVOKE ALL ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) IS 'DEPRECATED: Legacy EatClean staff order intake RPC. Permanently revoked. All intake flows exclusively through Universal Intake V2.';

COMMIT;

-- ------------------------------------------------------------------------------
-- 3. POSTCHECK
-- Confirms that authenticated, anon, and PUBLIC cannot execute the legacy RPC.
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_proc_oid oid := to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)');
BEGIN
  IF v_proc_oid IS NULL THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: Function public.capture_staff_existing_order(uuid,jsonb) not found.';
  END IF;

  IF has_function_privilege('authenticated', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: authenticated still has EXECUTE privilege on legacy RPC.';
  END IF;

  IF has_function_privilege('anon', v_proc_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: anon has EXECUTE privilege on legacy RPC.';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_proc p CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) WHERE p.oid = v_proc_oid AND grantee = 0) THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: PUBLIC has EXECUTE privilege on legacy RPC.';
  END IF;

  -- Verify canonical V2 infrastructure remains unaffected
  IF to_regprocedure('cr_order_private.session_uid_bridge()') IS NULL
  OR to_regprocedure('cr_order_private.guard_legacy_offer()') IS NULL THEN
    RAISE EXCEPTION 'POSTCHECK_FAILED: Canonical V2 dependencies were affected.';
  END IF;

  RAISE NOTICE 'POSTCHECK_COMPLETE: Legacy RPC EXECUTE successfully revoked for authenticated, anon, and PUBLIC. V2 intact.';
END $$;

-- ------------------------------------------------------------------------------
-- 4. RECUPERACIÓN (ROLLBACK RUNBOOK)
-- ONLY TO BE EXECUTED UNDER FORMAL INDEPENDENT HUMAN EMERGENCY AUTHORIZATION.
-- Automatic rollback is strictly prohibited.
--
-- To restore previous state if authorized:
--   BEGIN;
--   SET LOCAL lock_timeout = '5s';
--   SET LOCAL statement_timeout = '30s';
--   SET LOCAL search_path = pg_catalog, pg_temp;
--   GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;
--   COMMIT;
-- ------------------------------------------------------------------------------
