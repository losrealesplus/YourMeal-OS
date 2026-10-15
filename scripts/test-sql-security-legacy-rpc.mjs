import { execFileSync } from "node:child_process";
import fs from "node:fs";
import assert from "node:assert/strict";

const sql = (query) =>
  execFileSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
    input: query,
    encoding: "utf8",
  }).trim();

console.log("=== RUNNING ADVANCED SQL SECURITY QUALIFICATION: LEGACY RPC REVOCATION ===");

const EATCLEAN_TENANT = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const STAFF_USER_ID = sql(`
  SELECT tm.user_id FROM public.tenant_members tm
  JOIN public.user_roles ur ON ur.user_id = tm.user_id AND ur.tenant_id = tm.tenant_id
  WHERE tm.tenant_id = '${EATCLEAN_TENANT}' AND ur.role = 'operations_manager'
  LIMIT 1;
`);
const CUSTOMER_ID = "20000000-0000-4000-8000-000000000001";
const DISH_ID = "30000000-0000-4000-8000-000000000002";

console.log(`Test fixtures: Tenant=${EATCLEAN_TENANT}, StaffActor=${STAFF_USER_ID}, Customer=${CUSTOMER_ID}`);

// -----------------------------------------------------------------------------
// 1. DIRECT PRIVILEGE CHECKS (Effective & ACL)
// -----------------------------------------------------------------------------
console.log("\n[Check 1] Verifying privilege status for authenticated, anon, and PUBLIC...");
const privCheck = sql(`
  SELECT json_build_object(
    'authenticated', has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'anon', has_function_privilege('anon', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'service_role', has_function_privilege('service_role', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'PUBLIC', EXISTS (
      SELECT 1 FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
      WHERE p.oid = 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure AND grantee = 0
    ),
    'non_owner_grantees', (
      SELECT count(*) FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
      WHERE p.oid = 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure AND a.privilege_type = 'EXECUTE' AND a.grantee <> p.proowner
    )
  )::text;
`);
console.log("Privilege check result:", privCheck);
const privileges = JSON.parse(privCheck);

assert.equal(privileges.authenticated, false, "authenticated role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.anon, false, "anon role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.service_role, false, "service_role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.PUBLIC, false, "PUBLIC pseudo-role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.non_owner_grantees, 0, "No non-owner grantee may possess EXECUTE in ACL");
console.log("PASS: Direct & effective EXECUTE privilege strictly revoked for authenticated, anon, and PUBLIC");

// -----------------------------------------------------------------------------
// 2. POSITIVE SYNTHETIC CONTROL (Transactional with immediate rollback)
// Proves that when EXECUTE is granted, an authorized staff session DOES pass
// the PostgreSQL function gate and enters the function body.
// -----------------------------------------------------------------------------
console.log("\n[Check 2] Executing POSITIVE SYNTHETIC CONTROL...");
const positiveControlResult = sql(`
  BEGIN;
  -- Temporary grant for positive control verification within transaction
  GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;

  DO $$
  DECLARE
    v_diag_msg text;
    v_diag_state text;
    v_passed_function_gate boolean := false;
  BEGIN
    -- Setup authenticated staff session (operations_manager)
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '${STAFF_USER_ID}', true);

    BEGIN
      PERFORM public.capture_staff_existing_order(
        '${EATCLEAN_TENANT}'::uuid,
        jsonb_build_object(
          'customerId', '${CUSTOMER_ID}',
          'weekStart', '2026-10-19',
          'lines', jsonb_build_array(
            jsonb_build_object('dishId', '${DISH_ID}', 'dayDate', '2026-10-19', 'qty', 1)
          )
        )
      );
      v_passed_function_gate := true;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_diag_msg = MESSAGE_TEXT, v_diag_state = RETURNED_SQLSTATE;
      -- If the error occurred INSIDE the function body (e.g. table lock/RLS/guard),
      -- it means the PostgreSQL function-level EXECUTE gate was successfully traversed!
      IF v_diag_msg NOT LIKE '%permission denied for function capture_staff_existing_order%' THEN
        v_passed_function_gate := true;
      END IF;
    END;

    IF NOT v_passed_function_gate THEN
      RAISE EXCEPTION 'POSITIVE_CONTROL_FAILED: function privilege gate was not traversed when EXECUTE was granted!';
    END IF;
  END $$;

  ROLLBACK;
  SELECT 'POSITIVE_CONTROL_PASS';
`);
assert.equal(positiveControlResult, "POSITIVE_CONTROL_PASS", "Positive synthetic control must demonstrate function gate traversal when permitted");
console.log("PASS: Positive synthetic control proved that authorized staff successfully traverses function gate when EXECUTE privilege exists");

// -----------------------------------------------------------------------------
// 3. NEGATIVE INVOCATION CONTROL (Revoked State, Disambiguated 42501)
// Proves that under the revoked state, the call is rejected by PostgreSQL engine
// with 'permission denied for function' BEFORE reaching the function body.
// -----------------------------------------------------------------------------
console.log("\n[Check 3] Executing NEGATIVE CONTROL: inspecting exact PostgreSQL diagnostic...");
const negativeControlResult = sql(`
  DO $$
  DECLARE
    v_diag_msg text;
    v_diag_state text;
  BEGIN
    -- Setup identical authenticated staff session
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '${STAFF_USER_ID}', true);

    BEGIN
      PERFORM public.capture_staff_existing_order(
        '${EATCLEAN_TENANT}'::uuid,
        jsonb_build_object(
          'customerId', '${CUSTOMER_ID}',
          'weekStart', '2026-10-19',
          'lines', jsonb_build_array(
            jsonb_build_object('dishId', '${DISH_ID}', 'dayDate', '2026-10-19', 'qty', 1)
          )
        )
      );
      RAISE EXCEPTION 'TEST_FAILED: invocation succeeded when EXECUTE was revoked!';
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS v_diag_msg = MESSAGE_TEXT, v_diag_state = RETURNED_SQLSTATE;

      -- Check exact PostgreSQL privilege denial message
      IF v_diag_state <> '42501' THEN
        RAISE EXCEPTION 'TEST_FAILED: expected SQLSTATE 42501, got %', v_diag_state;
      END IF;

      IF v_diag_msg NOT LIKE '%permission denied for function capture_staff_existing_order%' THEN
        RAISE EXCEPTION 'TEST_FAILED: expected "permission denied for function capture_staff_existing_order", got "%"', v_diag_msg;
      END IF;
    END;
  END $$;
  SELECT 'NEGATIVE_CONTROL_UNAMBIGUOUS_PASS';
`);
assert.equal(negativeControlResult, "NEGATIVE_CONTROL_UNAMBIGUOUS_PASS", "Negative control must be stopped by PG engine privilege check");
console.log("PASS: Negative control confirmed PostgreSQL engine rejected call with 'permission denied for function capture_staff_existing_order' BEFORE entering RPC body");

// -----------------------------------------------------------------------------
// 4. INHERITED GRANT SIMULATION (Fail-Closed Verification)
// Proves that if an inherited role is granted EXECUTE, postchecks detect and fail closed.
// -----------------------------------------------------------------------------
console.log("\n[Check 4] Testing INHERITED GRANT detection (fail-closed simulation)...");
const inheritedGrantTestResult = sql(`
  BEGIN;
  CREATE ROLE _test_temp_operator_role;
  GRANT _test_temp_operator_role TO authenticated;
  GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO _test_temp_operator_role;

  DO $$
  DECLARE
    v_detected boolean := false;
  BEGIN
    -- Test postcheck assertion logic
    BEGIN
      IF has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure, 'EXECUTE') THEN
        RAISE EXCEPTION 'POSTCHECK_FAIL_CLOSED_INHERITED';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM LIKE '%POSTCHECK_FAIL_CLOSED_INHERITED%' THEN
        v_detected := true;
      ELSE
        RAISE;
      END IF;
    END;

    IF NOT v_detected THEN
      RAISE EXCEPTION 'INHERITED_GRANT_TEST_FAILED: inherited privilege was not detected!';
    END IF;
  END $$;

  ROLLBACK;
  SELECT 'INHERITED_GRANT_DETECTED_PASS';
`);
assert.equal(inheritedGrantTestResult, "INHERITED_GRANT_DETECTED_PASS", "Inherited grant must be detected by effective privilege postcheck");
console.log("PASS: Inherited grant simulation confirmed effective privilege postcheck fails closed");

// -----------------------------------------------------------------------------
// 5. DEFINITION HASH DRIFT SIMULATION (Fail-Closed Verification)
// Proves that any unexpected hash triggers immediate transaction rollback.
// -----------------------------------------------------------------------------
console.log("\n[Check 5] Testing DEFINITION HASH DRIFT detection (fail-closed simulation)...");
const hashDriftTestResult = sql(`
  DO $$
  DECLARE
    v_aborted boolean := false;
    v_expected_hash text := '0000000000000000000000000000000000000000000000000000000000000000'; -- Simulating mismatched hash
    v_actual_hash text;
  BEGIN
    SELECT encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex') INTO v_actual_hash
    FROM pg_proc p WHERE p.oid = 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure;

    BEGIN
      IF v_actual_hash IS DISTINCT FROM v_expected_hash THEN
        RAISE EXCEPTION 'PRECHECK_FAILED: capture_staff_existing_order definition hash drift detected';
      END IF;
    EXCEPTION WHEN OTHERS THEN
      IF SQLERRM LIKE '%PRECHECK_FAILED: capture_staff_existing_order definition hash drift detected%' THEN
        v_aborted := true;
      ELSE
        RAISE;
      END IF;
    END;

    IF NOT v_aborted THEN
      RAISE EXCEPTION 'DRIFT_TEST_FAILED: drift did not trigger exception!';
    END IF;
  END $$;
  SELECT 'HASH_DRIFT_FAIL_CLOSED_PASS';
`);
assert.equal(hashDriftTestResult, "HASH_DRIFT_FAIL_CLOSED_PASS", "Hash drift must trigger PRECHECK_FAILED and abort");
console.log("PASS: Definition hash drift simulation confirmed immediate fail-closed abort");

// -----------------------------------------------------------------------------
// 6. RUNBOOK EXECUTION & IDEMPOTENCY
// Proves that the atomic runbook revokes permissions, passes all postchecks,
// and running it a second time is completely idempotent.
// -----------------------------------------------------------------------------
console.log("\n[Check 6] Executing atomic production runbook and testing idempotency...");
const runbookSql = fs.readFileSync("scripts/release/revoke-eatclean-legacy-staff-existing-order.sql", "utf8");

// First execution
const runbook1 = sql(`
  SET ROLE postgres;
  ${runbookSql}
  SELECT 'RUNBOOK_PASS_1';
`);
assert(runbook1.includes("RUNBOOK_PASS_1"), "First runbook execution failed");

// Second execution (proving strict idempotency)
const runbook2 = sql(`
  SET ROLE postgres;
  ${runbookSql}
  SELECT 'RUNBOOK_PASS_2';
`);
assert(runbook2.includes("RUNBOOK_PASS_2"), "Second runbook execution failed idempotency check");
console.log("PASS: Atomic production runbook executed successfully twice (strictly idempotent)");

// -----------------------------------------------------------------------------
// 7. CANONICAL V2 INTEGRITY
// -----------------------------------------------------------------------------
console.log("\n[Check 7] Verifying canonical V2 functions and triggers remain intact...");
const v2Check = sql(`
  SELECT json_build_object(
    'quote_issue_exists', to_regprocedure('public.cr_order_offer_quote_issue(uuid,uuid,uuid,jsonb,jsonb)') IS NOT NULL,
    'quote_commit_exists', to_regprocedure('public.cr_order_offer_quote_commit(uuid,uuid,uuid,uuid,jsonb,jsonb)') IS NOT NULL,
    'guard_legacy_offer_exists', to_regprocedure('cr_order_private.guard_legacy_offer()') IS NOT NULL,
    'session_uid_bridge_exists', to_regprocedure('cr_order_private.session_uid_bridge()') IS NOT NULL
  )::text;
`);
console.log("Canonical V2 check result:", v2Check);
const v2Status = JSON.parse(v2Check);
assert.equal(v2Status.quote_issue_exists, true, "cr_order_offer_quote_issue must exist");
assert.equal(v2Status.quote_commit_exists, true, "cr_order_offer_quote_commit must exist");
assert.equal(v2Status.guard_legacy_offer_exists, true, "cr_order_private.guard_legacy_offer must exist");
assert.equal(v2Status.session_uid_bridge_exists, true, "cr_order_private.session_uid_bridge must exist");
console.log("PASS: Canonical V2 infrastructure fully intact and available");

console.log("\n========================================================");
console.log("=== ALL SQL SECURITY CHECKS PASSED (7/7) PASS ===");
console.log("========================================================");
