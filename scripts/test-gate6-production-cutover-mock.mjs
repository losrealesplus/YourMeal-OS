#!/usr/bin/env node
/**
 * YOURMEAL OS — GATE 6 PRODUCTION CUTOVER MOCK TEST SUITE (v2.2)
 *
 * Verifies that scripts/gate6-production-cutover-live.sh executes the cutover sequence
 * faithfully under mock psql without contacting production:
 *
 *   Case 1: Full positive execution (all 10 steps, postchecks pass, barrier released)
 *   Case 2: Failure midway through migrations (stops immediately, barrier remains active)
 *   Case 3: Pre-cutover drift (candidate already exists, aborts before barrier)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCRIPT_PATH = path.join(ROOT, "scripts/gate6-production-cutover-live.sh");
const MOCK_DIR = path.join(ROOT, ".temp/cutover-mock-test");

fs.mkdirSync(MOCK_DIR, { recursive: true });

function setupMockPsql(config = {}) {
  const mockPsqlPath = path.join(MOCK_DIR, "mock_psql.cjs");
  const configPath = path.join(MOCK_DIR, "config.json");
  const queryLogPath = path.join(MOCK_DIR, "queries.log");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  fs.writeFileSync(queryLogPath, "");

  const script = `#!/usr/bin/env node
const fs = require("fs");

let query = "";
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "-c" && i + 1 < args.length) {
    query = args[i + 1];
    i++;
  }
}

if (!query) {
  try {
    query = fs.readFileSync(0, "utf8");
  } catch (_) {}
}

const config = JSON.parse(fs.readFileSync("${configPath}", "utf8"));
const logFile = "${queryLogPath}";
fs.appendFileSync(logFile, query + "\\n---\\n");

if (config.fail_on_step && query.includes("INSERT INTO supabase_migrations.schema_migrations") && query.includes(config.fail_on_step)) {
  console.error("ERROR: Simulated step failure on " + config.fail_on_step);
  process.exit(1);
}

if (query.includes("SET ROLE authenticated; UPDATE public.orders")) {
  console.error("ERROR: 55P03: MAINTENANCE_IN_PROGRESS: Write operations are locked for release cutover.");
  process.exit(0);
}

if (query.includes("current_database()")) {
  console.log("postgres|postgres|10.0.0.1");
} else if (query.includes("SELECT id ||") && query.includes("FROM public.tenants")) {
  console.log("8bba00ba-331b-42c8-9283-4e3836ffb870|EatClean|eatclean");
} else if (query.includes("gate6_recovery.checkpoints WHERE status =")) {
  console.log("71|10|0|10|e2a46e830748cecfbb4479f371a5d23bc67aa688019ffdeb3f7bd6fd8b7f1f1c|3706054148ecf70327e2998967133899f48085c7225df79f486c356bd3a91a12|4e28f7c539e19f08bf1561b1dfc367f4370a1e732a1c341dbc61657a477ace6f|false|false|true|false");
} else if (query.includes("WITH actual_clean AS")) {
  console.log(config.pre_ledger || "61|0|0");
} else if (query.includes("public.dishes WHERE tenant_id")) {
  console.log("1|8|189|16|11|11");
} else {
  console.log("OK");
}
`;

  fs.writeFileSync(mockPsqlPath, script, { mode: 0o755 });
  return { mockPsqlPath, queryLogPath };
}

function runCutover(env = {}) {
  return spawnSync("bash", [SCRIPT_PATH], {
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8"
  });
}

console.log("====================================================================");
console.log("STARTING GATE 6 PRODUCTION CUTOVER MOCK TEST SUITE (v2.2)");
console.log("====================================================================\n");

// -----------------------------------------------------------------------------
// Case 1: Full positive execution
// -----------------------------------------------------------------------------
{
  console.log("[Test 1] Simulating full positive cutover execution...");
  const { mockPsqlPath, queryLogPath } = setupMockPsql();
  const res = runCutover({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 0, `Must exit with status 0 on perfect execution. Output: ${res.stderr}\n${res.stdout}`);
  assert(res.stdout.includes("MANIFEST_ORDER:           PASS"), "MANIFEST_ORDER must be PASS");
  assert(res.stdout.includes("DEPLOY_EXECUTED:          YES"), "DEPLOY_EXECUTED must be YES");
  assert(res.stdout.includes("GATE6_MIGRATIONS_APPLIED: 10/10"), "GATE6_MIGRATIONS_APPLIED must be 10/10");
  assert(res.stdout.includes("FINAL_LEDGER:             71"), "FINAL_LEDGER must be 71");
  assert(res.stdout.includes("DATA_PRESERVATION:        PASS"), "DATA_PRESERVATION must be PASS");
  assert(res.stdout.includes("WRITE_BARRIER:            RELEASED"), "WRITE_BARRIER must be RELEASED");
  assert(res.stdout.includes("GATE6_FINAL_STATUS:       DEPLOYED"), "GATE6_FINAL_STATUS must be DEPLOYED");

  const queryLogs = fs.readFileSync(queryLogPath, "utf8");
  assert(queryLogs.includes("public.gate6_write_barrier_enforce()"), "Must define write barrier function");
  assert(queryLogs.includes("gate6_barrier_"), "Must create barrier triggers");
  assert(queryLogs.includes("gate6_recovery.checkpoints"), "Must initialize checkpoints table");
  assert(queryLogs.includes("DROP FUNCTION IF EXISTS public.gate6_write_barrier_enforce()"), "Must drop barrier on success");

  console.log("  ✓ Test 1 PASS: Full sequence executes cleanly, applies 10/10 migrations, and releases barrier.\n");
}

// -----------------------------------------------------------------------------
// Case 2: Failure midway through migrations (e.g. step 4)
// -----------------------------------------------------------------------------
{
  console.log("[Test 2] Simulating failure during step 4 (CRM identity migration)...");
  const { mockPsqlPath } = setupMockPsql({
    fail_on_step: "20261008112217"
  });
  const res = runCutover({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.notEqual(res.status, 0, "Must exit with non-zero on migration failure");
  assert(res.stderr.includes("ALERTA DE SEGURIDAD: La barrera de escrituras permanece ACTIVA"), "Must announce barrier remains active");
  assert(res.stdout.includes("WRITE_BARRIER:            ACTIVE (Bloqueo de seguridad mantenido)"), "Must state barrier is active in summary");
  assert(res.stdout.includes("GATE6_FINAL_STATUS:       FAILED"), "Must state status is FAILED");
  assert(res.stdout.includes("DEPLOY_EXECUTED:          NO"), "Must NOT report deploy executed");

  console.log("  ✓ Test 2 PASS: Mid-cutover failure halts immediately and locks barrier fail-closed.\n");
}

// -----------------------------------------------------------------------------
// Case 3: Pre-cutover drift (candidates already present)
// -----------------------------------------------------------------------------
{
  console.log("[Test 3] Simulating pre-cutover drift (candidate migration already present)...");
  const { mockPsqlPath } = setupMockPsql({
    pre_ledger: "62|1|0"
  });
  const res = runCutover({
    PSQL_BIN: mockPsqlPath,
    PGPASSWORD: "mock_test_password"
  });

  assert.equal(res.status, 1, "Must exit with status 1 on pre-cutover drift");
  assert(res.stderr.includes("FATAL: Pre-cutover ledger check failed"), "Must report ledger check failure");
  assert(res.stdout.includes("WRITE_BARRIER:            NOT_VERIFIED"), "Barrier was not activated");
  assert(res.stdout.includes("GATE6_FINAL_STATUS:       FAILED"), "Status must be FAILED");

  console.log("  ✓ Test 3 PASS: Pre-cutover drift caught before barrier activation.\n");
}

// Cleanup mock dir
fs.rmSync(MOCK_DIR, { recursive: true, force: true });

console.log("====================================================================");
console.log("ALL CUTOVER TESTS PASSED WITH ZERO DRIFT!");
console.log("====================================================================");
