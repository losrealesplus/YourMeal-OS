import { execFileSync } from "node:child_process";
import fs from "node:fs";
import assert from "node:assert/strict";

const sql = (query) =>
  execFileSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
    input: query,
    encoding: "utf8",
  }).trim();

console.log("=== RUNNING SQL SECURITY QUALIFICATION: LEGACY RPC REVOCATION ===");

// 1. Direct privilege checks on public.capture_staff_existing_order(uuid,jsonb)
console.log("\n[Check 1] Verifying privilege status for authenticated, anon, PUBLIC...");
const privCheck = sql(`
  SELECT json_build_object(
    'authenticated', has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'anon', has_function_privilege('anon', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'PUBLIC', EXISTS (
      SELECT 1 FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
      WHERE p.oid = 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure AND grantee = 0
    )
  )::text;
`);
console.log("Privilege check result:", privCheck);
const privileges = JSON.parse(privCheck);

assert.equal(privileges.authenticated, false, "authenticated role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.anon, false, "anon role MUST NOT have EXECUTE on capture_staff_existing_order");
assert.equal(privileges.PUBLIC, false, "PUBLIC pseudo-role MUST NOT have EXECUTE on capture_staff_existing_order");
console.log("PASS: Direct EXECUTE privilege strictly revoked for authenticated, anon, and PUBLIC");

// 2. Direct invocation test as authenticated role (must be rejected with permission denied)
console.log("\n[Check 2] Testing direct invocation as authenticated role...");
const directCallResult = sql(`
  DO $$
  BEGIN
    SET LOCAL ROLE authenticated;
    BEGIN
      PERFORM public.capture_staff_existing_order(
        '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid,
        '{"customerId": "20000000-0000-4000-8000-000000000001", "weekStart": "2026-10-19", "lines": []}'::jsonb
      );
      RAISE EXCEPTION 'TEST_FAILED: authenticated was able to execute capture_staff_existing_order!';
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected SQLSTATE 42501 (permission denied for function)
    END;
  END $$;
  SELECT 'DIRECT_CALL_BLOCKED';
`);
assert.equal(directCallResult, "DIRECT_CALL_BLOCKED", "Direct execution by authenticated role must fail with insufficient_privilege");
console.log("PASS: Direct call by authenticated role rejected with 42501 (permission denied)");

// 3. Direct invocation test as anon role (must be rejected with permission denied)
console.log("\n[Check 3] Testing direct invocation as anon role...");
const anonCallResult = sql(`
  DO $$
  BEGIN
    SET LOCAL ROLE anon;
    BEGIN
      PERFORM public.capture_staff_existing_order(
        '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid,
        '{"customerId": "20000000-0000-4000-8000-000000000001", "weekStart": "2026-10-19", "lines": []}'::jsonb
      );
      RAISE EXCEPTION 'TEST_FAILED: anon was able to execute capture_staff_existing_order!';
    EXCEPTION WHEN insufficient_privilege THEN
      -- Expected SQLSTATE 42501 (permission denied for function)
    END;
  END $$;
  SELECT 'ANON_CALL_BLOCKED';
`);
assert.equal(anonCallResult, "ANON_CALL_BLOCKED", "Direct execution by anon role must fail with insufficient_privilege");
console.log("PASS: Direct call by anon role rejected with 42501 (permission denied)");

// 4. Static regrant prevention audit on activate-eatclean-staff-existing-order.sql
console.log("\n[Check 4] Auditing activate-eatclean-staff-existing-order.sql against accidental regranting...");
const activateSql = fs.readFileSync("scripts/release/activate-eatclean-staff-existing-order.sql", "utf8");
assert(
  !activateSql.includes("GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated"),
  "FATAL: activate-eatclean-staff-existing-order.sql still contains GRANT EXECUTE TO authenticated!",
);
assert(
  activateSql.includes("REVOKE ALL ON FUNCTION public.capture_staff_existing_order"),
  "FATAL: activate-eatclean-staff-existing-order.sql missing explicit REVOKE!",
);
console.log("PASS: activate-eatclean-staff-existing-order.sql permanently disallows re-granting EXECUTE");

// 5. Runbook verification: test executing the proposed production runbook (PRECHECK, CAMBIO, POSTCHECK)
console.log("\n[Check 5] Testing proposed production runbook (revoke-eatclean-legacy-staff-existing-order.sql)...");
// First, grant execute temporarily to simulate production state before revocation
sql(`
  SET ROLE postgres;
  GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;
`);
const simulatedPreState = sql(`
  SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');
`);
assert.equal(simulatedPreState, "t", "Failed to simulate pre-revocation production state");
console.log("Simulated pre-revocation production state: authenticated EXECUTE = true");

// Execute the production runbook
const runbookSql = fs.readFileSync("scripts/release/revoke-eatclean-legacy-staff-existing-order.sql", "utf8");
const runbookResult = sql(`
  SET ROLE postgres;
  ${runbookSql}
  SELECT 'RUNBOOK_SUCCESS';
`);
assert(runbookResult.includes("RUNBOOK_SUCCESS"), "Production runbook failed execution!");

// Assert postcheck outcome: authenticated is revoked
const postRunbookPrivCheck = sql(`
  SELECT json_build_object(
    'authenticated', has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'anon', has_function_privilege('anon', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE'),
    'PUBLIC', EXISTS (
      SELECT 1 FROM pg_proc p
      CROSS JOIN LATERAL aclexplode(coalesce(p.proacl, acldefault('f', p.proowner)))
      WHERE p.oid = 'public.capture_staff_existing_order(uuid,jsonb)'::regprocedure AND grantee = 0
    )
  )::text;
`);
const postRunbookPrivs = JSON.parse(postRunbookPrivCheck);
assert.equal(postRunbookPrivs.authenticated, false, "authenticated role MUST NOT have EXECUTE after runbook");
assert.equal(postRunbookPrivs.anon, false, "anon role MUST NOT have EXECUTE after runbook");
assert.equal(postRunbookPrivs.PUBLIC, false, "PUBLIC role MUST NOT have EXECUTE after runbook");
console.log("PASS: Production runbook successfully revoked legacy RPC; all postchecks satisfied");

// 6. Canonical V2 functions integrity check
console.log("\n[Check 6] Verifying canonical V2 functions and triggers remain intact...");
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
console.log("=== ALL SQL SECURITY CHECKS PASSED (6/6) PASS ===");
console.log("========================================================");
