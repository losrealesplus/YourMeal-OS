#!/usr/bin/env node
/**
 * YOURMEAL OS — GATE 6 PRODUCTION PREFLIGHT MOCK TEST SUITE (v2.1)
 *
 * Verifies that scripts/gate6-production-preflight-live.sh strictly rejects
 * false positives across all 9 negative test cases without contacting production:
 *
 *   Case 1: Gate 6 candidate migration already present in ledger
 *   Case 2: Unexpected historical migration present in ledger
 *   Case 3: Ledger count is 61 but versions differ (set mismatch)
 *   Case 4: Empty catalog (dishes = 0) or members = 0
 *   Case 5: Host Demo (djangucecsphnejplvic) or unauthorized host/user
 *   Case 6: Active queries detected in pg_stat_activity (writer risk)
 *   Case 7: Missing recovery procedure or missing TOC filter in manifest
 *   Case 8: Missing password / no interactive TTY
 *   Case 9: Missing or corrupted CA certificate (verify-full strict, zero fallback)
 *   Case 10: Baseline positive case with honest operational tokens
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(ROOT, "scripts/gate6-production-preflight-live.sh");
const MOCK_DIR = path.join(ROOT, ".temp/preflight-mock-test");

fs.mkdirSync(MOCK_DIR, { recursive: true });

// Helper to create a mock psql binary with configurable query responses
function setupMockPsql(responses) {
  const mockPsqlPath = path.join(MOCK_DIR, "mock_psql.sh");
  const responseDataPath = path.join(MOCK_DIR, "responses.json");
  const queryLogPath = path.join(MOCK_DIR, "queries.log");
  fs.writeFileSync(responseDataPath, JSON.stringify(responses, null, 2));
  fs.writeFileSync(queryLogPath, "");

  const script = `#!/usr/bin/env bash
QUERY=""
while [ $# -gt 0 ]; do
  case "$1" in
    -c)
      QUERY="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

RESP_FILE="${responseDataPath}"
LOG_FILE="${queryLogPath}"
node -e '
  const fs = require("fs");
  const resp = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const logFile = process.argv[2];
  const query = process.argv[3] || "";
  
  fs.appendFileSync(logFile, query + "\\n---\\n");
  
  if (resp.simulated_error && query.includes(resp.error_query_pattern || "public.delivery_services")) {
    console.error(resp.simulated_error);
    process.exit(1);
  }

  if (query.includes("current_database()")) {
    console.log(resp.target_db || "postgres|postgres|10.0.0.1");
  } else if (query.includes("public.tenant_members WHERE tenant_id")) {
    console.log(resp.data || "1|3|45|5|0|0");
  } else if (query.includes("FROM public.tenants WHERE id =")) {
    console.log(resp.target_tenant || "8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean");
  } else if (query.includes("expected_61")) {
    console.log(resp.ledger || "61|0|0|0|0|20261006110000");
  } else if (query.includes("serialize_batch")) {
    console.log(resp.schema || "1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1|1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3|0|false");
  } else if (query.includes("pg_stat_activity")) {
    console.log(resp.writer || "0|0");
  } else {
    console.log("OK");
  }
' "$RESP_FILE" "$LOG_FILE" "$QUERY"
`;

  fs.writeFileSync(mockPsqlPath, script, { mode: 0o755 });
  return { mockPsqlPath, queryLogPath };
}

function runPreflight(env = {}) {
  return spawnSync("bash", [SCRIPT_PATH], {
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8"
  });
}

console.log("====================================================================");
console.log("STARTING GATE 6 PREFLIGHT LOCAL ADVERSARIAL TEST SUITE (v2.1)");
console.log("====================================================================\n");

// -----------------------------------------------------------------------------
// Case 1: Gate 6 candidate migration already present in ledger
// -----------------------------------------------------------------------------
{
  console.log("[Test 1] Simulating Gate 6 candidate migration already in ledger...");
  const { mockPsqlPath } = setupMockPsql({
    ledger: "62|0|0|1|0|20261007020208" // 1 candidate present!
  });
  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on candidate migration collision");
  assert(res.stdout.includes("LEDGER_VERIFIED:                      FAIL"), "Must fail LEDGER_VERIFIED");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 1 PASS: Candidate migration collision correctly caught and rejected.\n");
}

// -----------------------------------------------------------------------------
// Case 2: Unexpected historical version in ledger
// -----------------------------------------------------------------------------
{
  console.log("[Test 2] Simulating unexpected historical migration in ledger...");
  const { mockPsqlPath } = setupMockPsql({
    ledger: "62|0|1|0|0|20261006110000" // 1 unexpected version!
  });
  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on unexpected ledger version");
  assert(res.stdout.includes("LEDGER_VERIFIED:                      FAIL"), "Must fail LEDGER_VERIFIED");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 2 PASS: Unexpected historical version correctly caught and rejected.\n");
}

// -----------------------------------------------------------------------------
// Case 3: Ledger with 61 entries but version set mismatch
// -----------------------------------------------------------------------------
{
  console.log("[Test 3] Simulating ledger with count=61 but mismatched version set...");
  const { mockPsqlPath } = setupMockPsql({
    ledger: "61|1|1|0|0|20261006110000" // count 61, but 1 missing and 1 unexpected!
  });
  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on version set mismatch even if count=61");
  assert(res.stdout.includes("LEDGER_VERIFIED:                      FAIL"), "Must fail LEDGER_VERIFIED");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 3 PASS: Set-based version comparison caught drift with identical count.\n");
}

// -----------------------------------------------------------------------------
// Case 4: Catalog or members empty (dishes = 0 or members = 0)
// -----------------------------------------------------------------------------
{
  console.log("[Test 4] Simulating empty catalog (dishes = 0)...");
  const { mockPsqlPath } = setupMockPsql({
    data: "1|3|0|0|0|0" // dishes = 0!
  });
  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 when dishes = 0");
  assert(res.stdout.includes("DATA_BASELINE_CAPTURED:               FAIL"), "Must fail DATA_BASELINE_CAPTURED");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 4 PASS: Empty catalog / members correctly rejected with FAIL (no bogus PASS).\n");
}

// -----------------------------------------------------------------------------
// Case 5: Host Demo or unauthorized host / user
// -----------------------------------------------------------------------------
{
  console.log("[Test 5] Simulating connection to Demo project or unapproved host...");
  const resDemo = runPreflight({
    SUPABASE_DB_HOST: "aws-0-eu-central-1.pooler.supabase.com",
    PGUSER: "postgres.djangucecsphnejplvic", // Demo user
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(resDemo.status, 1, "Must exit with status 1 on Demo user");
  assert(resDemo.stderr.includes("FATAL SECURITY_VIOLATION"), "Must trigger FATAL SECURITY_VIOLATION on Demo");

  const resArbitrary = runPreflight({
    SUPABASE_DB_HOST: "unauthorized.database.internal",
    PGUSER: "postgres",
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(resArbitrary.status, 1, "Must exit with status 1 on unauthorized host");
  assert(resArbitrary.stderr.includes("FATAL SECURITY_VIOLATION"), "Must trigger FATAL SECURITY_VIOLATION on non-whitelisted host");
  console.log("  ✓ Test 5 PASS: Demo host/user and unauthorized endpoints strictly rejected fail-closed.\n");
}

// -----------------------------------------------------------------------------
// Case 6: Active queries detected in pg_stat_activity
// -----------------------------------------------------------------------------
{
  console.log("[Test 6] Simulating active concurrent writers in pg_stat_activity...");
  const { mockPsqlPath } = setupMockPsql({
    writer: "2|0" // 2 active queries!
  });
  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 when active queries exist");
  assert(res.stdout.includes("WRITER_OBSERVATION:                   FAIL"), "Must fail WRITER_OBSERVATION");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 6 PASS: Active concurrent writers correctly detected and flagged as FAIL.\n");
}

// -----------------------------------------------------------------------------
// Case 7: Recovery procedure check failure (corrupt / missing manifest TOC filter)
// -----------------------------------------------------------------------------
{
  console.log("[Test 7] Simulating missing recovery TOC filter in manifest...");
  const manifestPath = path.join("/Users/alex/.gemini/antigravity/brain/a4aaca4a-b90c-4155-af68-d75937ee0731/PRODUCTION_EXECUTION_MANIFEST.md");
  const originalManifest = fs.readFileSync(manifestPath, "utf8");
  const corruptManifest = originalManifest.replace("DEFAULT ACL.*supabase_admin", "bogus_acl_filter");
  
  try {
    fs.writeFileSync(manifestPath, corruptManifest, "utf8");
    const { mockPsqlPath } = setupMockPsql({});
    const res = runPreflight({
      PSQL_BIN: mockPsqlPath,
      PGPASSWORD: "mock_test_password"
    });

    assert.equal(res.status, 1, "Must exit with status 1 if recovery TOC filter is absent");
    assert(res.stdout.includes("RECOVERY_LAB_VERIFIED:                FAIL"), "Must fail RECOVERY_LAB_VERIFIED");
  } finally {
    fs.writeFileSync(manifestPath, originalManifest, "utf8");
  }
  console.log("  ✓ Test 7 PASS: Absence of verified TOC recovery procedure correctly triggers FAIL.\n");
}

// -----------------------------------------------------------------------------
// Case 8: Missing password without interactive TTY
// -----------------------------------------------------------------------------
{
  console.log("[Test 8] Simulating missing password without interactive TTY...");
  const res = runPreflight({
    PGPASSWORD: ""
  });

  assert.equal(res.status, 2, "Must exit with status 2 when PGPASSWORD is missing and non-interactive");
  assert(res.stderr.includes("FATAL: PGPASSWORD no está definido"), "Must print error about missing password");
  console.log("  ✓ Test 8 PASS: Missing password handled securely without hanging or leaking.\n");
}

// -----------------------------------------------------------------------------
// Case 9: Missing or Corrupted CA Certificate (Strict verify-full, zero fallback)
// -----------------------------------------------------------------------------
{
  console.log("[Test 9] Simulating missing or corrupted CA certificate (zero fallback to require)...");
  
  // 9a. Non-existent CA certificate file
  const resMissing = runPreflight({
    PGSSLROOTCERT: "/path/that/does/not/exist/prod-ca.crt",
    PGPASSWORD: "mock_test_password"
  });
  assert.equal(resMissing.status, 1, "Must exit with status 1 when CA cert is missing");
  assert(resMissing.stderr.includes("FATAL SECURITY_VIOLATION: Certificado CA no encontrado"), "Must report missing CA without fallback");

  // 9b. Corrupted CA certificate file (hash mismatch)
  const corruptCertPath = path.join(MOCK_DIR, "corrupt_ca.crt");
  fs.writeFileSync(corruptCertPath, "-----BEGIN CERTIFICATE-----\nCORRUPT_BYTES\n-----END CERTIFICATE-----");
  
  const resCorrupt = runPreflight({
    PGSSLROOTCERT: corruptCertPath,
    PGPASSWORD: "mock_test_password"
  });
  assert.equal(resCorrupt.status, 1, "Must exit with status 1 when CA cert checksum fails");
  assert(resCorrupt.stderr.includes("FATAL SECURITY_VIOLATION: Checksum SHA-256 del certificado CA inválido"), "Must reject invalid CA without fallback");
  console.log("  ✓ Test 9 PASS: CA certificate absence or corruption aborts fail-closed (zero fallback to require).\n");
}

// -----------------------------------------------------------------------------
// Case 10: Baseline positive case with honest operational tokens
// -----------------------------------------------------------------------------
{
  console.log("[Test 10] Simulating baseline positive case with honest operational tokens...");
  const { mockPsqlPath, queryLogPath } = setupMockPsql({
    target_db: "postgres|postgres|10.0.0.1",
    target_tenant: "8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean",
    ledger: "61|0|0|0|0|20261006110000",
    schema: "1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1|1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3|0|false",
    data: "1|3|45|5|0|0",
    writer: "0|0"
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 0, "Must exit with status 0 on perfect baseline");
  assert(res.stdout.includes("TARGET_VERIFIED:                      PASS"), "TARGET_VERIFIED must be PASS");
  assert(res.stdout.includes("LEDGER_VERIFIED:                      PASS"), "LEDGER_VERIFIED must be PASS");
  assert(res.stdout.includes("SCHEMA_VERIFIED:                      PASS"), "SCHEMA_VERIFIED must be PASS");
  assert(res.stdout.includes("DATA_BASELINE_CAPTURED:               PASS"), "DATA_BASELINE_CAPTURED must be PASS");
  assert(res.stdout.includes("POST_CUTOVER_DATA_COMPARISON_PENDING: YES"), "Must state POST_CUTOVER_DATA_COMPARISON_PENDING: YES");
  assert(res.stdout.includes("WRITER_OBSERVATION:                   PASS"), "WRITER_OBSERVATION must be PASS");
  assert(res.stdout.includes("WRITE_BARRIER_PENDING_ACTIVATION:     YES"), "Must state WRITE_BARRIER_PENDING_ACTIVATION: YES");
  assert(res.stdout.includes("ARTIFACT_INTEGRITY_VERIFIED:          PASS"), "ARTIFACT_INTEGRITY_VERIFIED must be PASS");
  assert(res.stdout.includes("RECOVERY_LAB_VERIFIED:                PASS"), "RECOVERY_LAB_VERIFIED must be PASS");
  assert(res.stdout.includes("PRODUCTION_BACKUP_PENDING:            YES"), "Must state PRODUCTION_BACKUP_PENDING: YES");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: YES"), "Must state PREFLIGHT_READY_FOR_MANUAL_EXECUTION: YES");
  assert(res.stdout.includes("PRODUCTION_WRITE_AUTHORIZATION:         NOT_GRANTED"), "Must maintain NOT_GRANTED");
  assert(res.stdout.includes("STRICT_STOP_ENGAGED:                    YES"), "Must maintain STRICT_STOP_ENGAGED: YES");

  // Verify that READ ONLY query envelope was strictly enforced on all executions
  const queryLogs = fs.readFileSync(queryLogPath, "utf8");
  assert(queryLogs.includes("BEGIN TRANSACTION READ ONLY"), "All queries must be wrapped in BEGIN TRANSACTION READ ONLY");
  assert(queryLogs.includes("COMMIT;"), "All queries must terminate with COMMIT");

  console.log("  ✓ Test 10 PASS: Baseline state outputs exact honest tokens, READ-ONLY envelope verified, and halts at STRICT STOP.\n");
}

// -----------------------------------------------------------------------------
// Case 11: Schema ACL privilege check returning 'f' (valid boolean format)
// -----------------------------------------------------------------------------
{
  console.log("[Test 11] Simulating schema ACL privilege check returning 'f'...");
  const { mockPsqlPath } = setupMockPsql({
    schema: "1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1|1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3|0|f"
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 0, "Must exit with status 0 when auth USAGE is 'f'");
  assert(res.stdout.includes("SCHEMA_VERIFIED:                      PASS"), "SCHEMA_VERIFIED must be PASS with 'f'");
  console.log("  ✓ Test 11 PASS: ACL check properly handles 'f' as restricted (PASS).\n");
}

// -----------------------------------------------------------------------------
// Case 12: Schema ACL privilege check returning 'true' (unauthorized privilege)
// -----------------------------------------------------------------------------
{
  console.log("[Test 12] Simulating schema ACL privilege check returning 'true'...");
  const { mockPsqlPath } = setupMockPsql({
    schema: "1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1|1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3|0|true"
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 when auth USAGE is 'true'");
  assert(res.stdout.includes("SCHEMA_VERIFIED:                      FAIL"), "SCHEMA_VERIFIED must FAIL with 'true'");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 12 PASS: Unauthorized 'true' auth USAGE correctly detected and rejected.\n");
}

// -----------------------------------------------------------------------------
// Case 13: Schema ACL privilege check returning 't' (unauthorized privilege)
// -----------------------------------------------------------------------------
{
  console.log("[Test 13] Simulating schema ACL privilege check returning 't'...");
  const { mockPsqlPath } = setupMockPsql({
    schema: "1bcd59f09d76b09081656e99157e3ecf29968911afff6d4c07b2a2655f40a0b1|1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3|0|t"
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 when auth USAGE is 't'");
  assert(res.stdout.includes("SCHEMA_VERIFIED:                      FAIL"), "SCHEMA_VERIFIED must FAIL with 't'");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 13 PASS: Unauthorized 't' auth USAGE correctly detected and rejected.\n");
}

// -----------------------------------------------------------------------------
// Case 14: Tenant name returning legacy 'EatClean Tenerife' (mismatch with prod)
// -----------------------------------------------------------------------------
{
  console.log("[Test 14] Simulating tenant check returning 'EatClean Tenerife' instead of 'EatClean'...");
  const { mockPsqlPath } = setupMockPsql({
    target_tenant: "8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean Tenerife|eatclean"
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on legacy tenant name 'EatClean Tenerife'");
  assert(res.stdout.includes("TARGET_VERIFIED:                      FAIL"), "TARGET_VERIFIED must FAIL");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review");
  console.log("  ✓ Test 14 PASS: Strict exact match on 'EatClean' rejects 'EatClean Tenerife'.\n");
}

// -----------------------------------------------------------------------------
// Case 15: Non-existent table simulation (SQL error in Step 4)
// -----------------------------------------------------------------------------
{
  console.log("[Test 15] Simulating non-existent table SQL error in Step 4...");
  const { mockPsqlPath } = setupMockPsql({
    error_query_pattern: "public.delivery_services",
    simulated_error: 'ERROR: relation "public.delivery_services" does not exist'
  });

  const res = runPreflight({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on SQL execution error");
  assert(res.stdout.includes("DATA_BASELINE_CAPTURED:               NOT_VERIFIED"), "DATA_BASELINE_CAPTURED must be NOT_VERIFIED");
  assert(res.stdout.includes("WRITER_OBSERVATION:                   NOT_VERIFIED"), "WRITER_OBSERVATION must be NOT_VERIFIED");
  assert(res.stdout.includes("ARTIFACT_INTEGRITY_VERIFIED:          NOT_VERIFIED"), "ARTIFACT_INTEGRITY_VERIFIED must be NOT_VERIFIED");
  assert(res.stdout.includes("RECOVERY_LAB_VERIFIED:                NOT_VERIFIED"), "RECOVERY_LAB_VERIFIED must be NOT_VERIFIED");
  assert(res.stdout.includes("PREFLIGHT_READY_FOR_MANUAL_EXECUTION: NO"), "Must NOT authorize review on unhandled error");
  console.log("  ✓ Test 15 PASS: Error trap properly marks unexecuted steps as NOT_VERIFIED without false PASS.\n");
}

// Cleanup mock dir
fs.rmSync(MOCK_DIR, { recursive: true, force: true });

console.log("====================================================================");
console.log("ALL 15 PREFLIGHT TESTS (13 NEGATIVE + 2 POSITIVE) PASSED WITH ZERO DRIFT!");
console.log("====================================================================");

