#!/usr/bin/env node
/**
 * Test Suite: Real Migration Drift Fail-Closed & Atomic Rollback Verification
 * PR #531: A5 Lifecycle Session Bridge Migration (20261015173000)
 *
 * Verifies that the REAL migration file:
 *  1. Enforces fail-closed drift prechecks against pg_proc prosrc SHA-256 hashes,
 *     owners, security flags, search_paths, and ACL privileges.
 *  2. Aborts atomically with full transaction rollback on any detected drift.
 *  3. Applies cleanly when canonical baseline conditions are satisfied.
 *  4. Protects against unexpected subsequent runs.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/20261015173000_cr_order_a5_lifecycle_session_bridge.sql"
);
const BASELINE_MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/20261007020245_cr_order_a5_lifecycle_writer.sql"
);

const LIFECYCLE_BASELINE_HASH =
  "8859600d93efd94b37c7de2d49a68340d433e695f59d6bb51ed9447945dba0d8";
const LIFECYCLE_REPLACEMENT_HASH =
  "4e28f7c539e19f08bf1561b1dfc367f4370a1e732a1c341dbc61657a477ace6f";
const ACTOR_BASELINE_HASH =
  "9094c00b9605600a6e5329dc1d7c2ac7aced0ef57c08b3e83f3b9e02d477894c";
const SESSION_BRIDGE_BASELINE_HASH =
  "c628b78ce1d2a3b15ddbaf7b0a5838fa26c925d332103e53f34ba73b9b227604";

// Execute SQL in the isolated synthetic backend
function sql(query) {
  return execFileSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
    input: query,
    encoding: "utf8",
    cwd: ROOT,
  }).trim();
}

// Execute the real migration file directly
function executeRealMigration() {
  const migrationSql = fs.readFileSync(MIGRATION_PATH, "utf8");
  try {
    const output = execFileSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
      input: migrationSql,
      encoding: "utf8",
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, output: output.trim() };
  } catch (err) {
    const errorText =
      (err.stderr || "") + "\n" + (err.stdout || "") + "\n" + (err.message || "");
    return { ok: false, error: errorText };
  }
}

// Retrieve metadata for a function
function getFunctionMeta(funcName, argTypes) {
  const query = `
    SELECT json_build_object(
      'hash', encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex'),
      'owner', pg_get_userbyid(p.proowner),
      'secdef', p.prosecdef,
      'lang', l.lanname,
      'config', p.proconfig,
      'has_authenticated', has_function_privilege('authenticated', p.oid, 'EXECUTE'),
      'has_anon', has_function_privilege('anon', p.oid, 'EXECUTE'),
      'has_service_role', has_function_privilege('service_role', p.oid, 'EXECUTE'),
      'has_writer', has_function_privilege('cr_order_writer', p.oid, 'EXECUTE')
    )::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'cr_order_private' AND p.proname = '${funcName}'
      AND p.oid = to_regprocedure('cr_order_private.${funcName}(${argTypes})');
  `;
  const raw = sql(query);
  if (!raw) return null;
  return JSON.parse(raw);
}

const IDENTITY_BRIDGE_MIGRATION_PATH = path.join(
  ROOT,
  "supabase/migrations/20261011190421_eatclean_private_session_identity_bridge.sql"
);

// Extract the canonical baseline body of lifecycle_v2 from historical migration
function getCanonicalBaselineLifecycleBody() {
  const baselineMigrationContent = fs.readFileSync(BASELINE_MIGRATION_PATH, "utf8");
  const match = baselineMigrationContent.match(
    /CREATE FUNCTION cr_order_private\.lifecycle_v2\(_tenant uuid, _request uuid, _command jsonb\)\s+RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS \$\$([\s\S]*?)\$\$;/
  );
  if (!match) {
    throw new Error("Could not extract canonical lifecycle_v2 body from baseline migration");
  }
  return match[1];
}

// Extract canonical baseline bodies for session_uid_bridge and actor
function getCanonicalIdentityBridgeBodies() {
  const content = fs.readFileSync(IDENTITY_BRIDGE_MIGRATION_PATH, "utf8");
  const bridgeMatch = content.match(
    /CREATE FUNCTION cr_order_private\.session_uid_bridge\(\) RETURNS uuid\s+LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS \$\$([\s\S]*?)\$\$;/
  );
  const actorMatch = content.match(
    /CREATE OR REPLACE FUNCTION cr_order_private\.actor\(\) RETURNS uuid\s+LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS \$\$([\s\S]*?)\$\$;/
  );
  if (!bridgeMatch || !actorMatch) {
    throw new Error("Could not extract canonical identity bridge bodies from migration");
  }
  return { bridgeBody: bridgeMatch[1], actorBody: actorMatch[1] };
}

const CANONICAL_LIFECYCLE_BODY = getCanonicalBaselineLifecycleBody();
const { bridgeBody: CANONICAL_BRIDGE_BODY, actorBody: CANONICAL_ACTOR_BODY } =
  getCanonicalIdentityBridgeBodies();

// Restores exact canonical baseline for all 3 functions
function restoreCanonicalBaseline() {
  const restoreScript = `
    BEGIN;
    SET LOCAL ROLE postgres;

    -- Ensure session_uid_bridge is canonical
    CREATE OR REPLACE FUNCTION cr_order_private.session_uid_bridge()
    RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $bridge$${CANONICAL_BRIDGE_BODY}$bridge$;
    ALTER FUNCTION cr_order_private.session_uid_bridge() OWNER TO postgres;
    REVOKE ALL ON FUNCTION cr_order_private.session_uid_bridge() FROM PUBLIC, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO cr_order_writer;

    -- Ensure actor() is canonical
    CREATE OR REPLACE FUNCTION cr_order_private.actor()
    RETURNS uuid LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $actor$${CANONICAL_ACTOR_BODY}$actor$;
    ALTER FUNCTION cr_order_private.actor() OWNER TO postgres;
    REVOKE ALL ON FUNCTION cr_order_private.actor() FROM PUBLIC, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION cr_order_private.actor() TO cr_order_writer;

    -- Ensure lifecycle_v2 is canonical baseline
    GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
    CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_v2(_tenant uuid, _request uuid, _command jsonb)
    RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $baseline$${CANONICAL_LIFECYCLE_BODY}$baseline$;
    ALTER FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) OWNER TO cr_order_writer;
    REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
    REVOKE ALL ON FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) FROM PUBLIC, anon, service_role;
    GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) TO authenticated;

    COMMIT;
  `;
  sql(restoreScript);

  // Validate that baseline hashes and attributes match exactly
  const bridge = getFunctionMeta("session_uid_bridge", "");
  assert.equal(bridge.hash, SESSION_BRIDGE_BASELINE_HASH, "Bridge baseline hash mismatch");
  assert.equal(bridge.owner, "postgres", "Bridge owner must be postgres");
  assert.equal(bridge.secdef, true, "Bridge must be secdef");
  assert.equal(bridge.has_writer, true, "Bridge must be executable by cr_order_writer");

  const actor = getFunctionMeta("actor", "");
  assert.equal(actor.hash, ACTOR_BASELINE_HASH, "Actor baseline hash mismatch");
  assert.equal(actor.owner, "postgres", "Actor owner must be postgres");
  assert.equal(actor.secdef, false, "Actor must be secinvoker");

  const lifecycle = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(lifecycle.hash, LIFECYCLE_BASELINE_HASH, "Lifecycle baseline hash mismatch");
  assert.equal(lifecycle.owner, "cr_order_writer", "Lifecycle owner must be cr_order_writer");
  assert.equal(lifecycle.secdef, true, "Lifecycle must be secdef");
  assert.equal(lifecycle.has_authenticated, true, "Lifecycle must be executable by authenticated");
}

console.log("=======================================================================");
console.log("   MIGRATION DRIFT FAIL-CLOSED & ATOMIC ROLLBACK TEST SUITE (PR #531)   ");
console.log("=======================================================================\n");

// Ensure baseline before starting
restoreCanonicalBaseline();
console.log("✓ Initial canonical baseline verified successfully.");
console.log(`  - lifecycle_v2 baseline hash:       ${LIFECYCLE_BASELINE_HASH}`);
console.log(`  - actor baseline hash:              ${ACTOR_BASELINE_HASH}`);
console.log(`  - session_uid_bridge baseline hash: ${SESSION_BRIDGE_BASELINE_HASH}\n`);

// -----------------------------------------------------------------------------
// SCENARIO B: Drift in cr_order_private.lifecycle_v2 source definition
// -----------------------------------------------------------------------------
console.log("--- [SCENARIO B] Drift in lifecycle_v2 source definition ---");
{
  restoreCanonicalBaseline();
  // Tamper lifecycle_v2 definition with an unexpected comment
  sql(`
    GRANT CREATE ON SCHEMA cr_order_private TO cr_order_writer;
    CREATE OR REPLACE FUNCTION cr_order_private.lifecycle_v2(_tenant uuid, _request uuid, _command jsonb)
    RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $tampered$
      -- UNEXPECTED DRIFT IN LIFECYCLE_V2
      ${CANONICAL_LIFECYCLE_BODY}
    $tampered$;
    ALTER FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) OWNER TO cr_order_writer;
    REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;
  `);

  const tamperedMeta = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.notEqual(tamperedMeta.hash, LIFECYCLE_BASELINE_HASH);
  console.log(`  Injected drift; tampered hash: ${tamperedMeta.hash}`);

  const res = executeRealMigration();
  assert.equal(res.ok, false, "Migration must fail when lifecycle_v2 hash drifts");
  assert.match(
    res.error,
    /A5_PRECHECK_FAILED: lifecycle_v2\(uuid,uuid,jsonb\) source hash drift/,
    "Error must specify lifecycle_v2 hash drift"
  );
  console.log("  ✓ Migration aborted with expected exception.");

  // Verify atomic rollback: function still has tampered hash, NOT replacement hash
  const postRollbackMeta = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(
    postRollbackMeta.hash,
    tamperedMeta.hash,
    "Rollback must preserve pre-migration state without partial changes"
  );
  assert.notEqual(
    postRollbackMeta.hash,
    LIFECYCLE_REPLACEMENT_HASH,
    "Must not apply replacement function on failure"
  );
  console.log("  ✓ Atomic rollback verified: function definition remains untouched.");
}

// -----------------------------------------------------------------------------
// SCENARIO C: Drift in cr_order_private.actor() source definition
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO C] Drift in actor() source definition ---");
{
  restoreCanonicalBaseline();
  // Tamper actor definition
  sql(`
    CREATE OR REPLACE FUNCTION cr_order_private.actor()
    RETURNS uuid LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
    BEGIN
      -- UNEXPECTED DRIFT IN ACTOR
      RETURN auth.uid();
    END $$;
  `);

  const tamperedMeta = getFunctionMeta("actor", "");
  assert.notEqual(tamperedMeta.hash, ACTOR_BASELINE_HASH);
  console.log(`  Injected drift; tampered actor hash: ${tamperedMeta.hash}`);

  const res = executeRealMigration();
  assert.equal(res.ok, false, "Migration must fail when actor hash drifts");
  assert.match(
    res.error,
    /A5_PRECHECK_FAILED: actor\(\) source hash drift/,
    "Error must specify actor hash drift"
  );
  console.log("  ✓ Migration aborted with expected exception.");

  // Verify atomic rollback
  const lifecycleMeta = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(
    lifecycleMeta.hash,
    LIFECYCLE_BASELINE_HASH,
    "Rollback must ensure lifecycle_v2 is not replaced"
  );
  console.log("  ✓ Atomic rollback verified: lifecycle_v2 remains at baseline.");
}

// -----------------------------------------------------------------------------
// SCENARIO D: Drift in cr_order_private.session_uid_bridge() source definition
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO D] Drift in session_uid_bridge() source definition ---");
{
  restoreCanonicalBaseline();
  // Tamper bridge definition
  sql(`
    CREATE OR REPLACE FUNCTION cr_order_private.session_uid_bridge()
    RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
      -- UNEXPECTED DRIFT IN BRIDGE
      SELECT NULL::uuid;
    $$;
  `);

  const tamperedMeta = getFunctionMeta("session_uid_bridge", "");
  assert.notEqual(tamperedMeta.hash, SESSION_BRIDGE_BASELINE_HASH);
  console.log(`  Injected drift; tampered bridge hash: ${tamperedMeta.hash}`);

  const res = executeRealMigration();
  assert.equal(res.ok, false, "Migration must fail when bridge hash drifts");
  assert.match(
    res.error,
    /A5_PRECHECK_FAILED: session_uid_bridge\(\) source hash drift/,
    "Error must specify session_uid_bridge hash drift"
  );
  console.log("  ✓ Migration aborted with expected exception.");

  // Verify atomic rollback
  const lifecycleMeta = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(
    lifecycleMeta.hash,
    LIFECYCLE_BASELINE_HASH,
    "Rollback must ensure lifecycle_v2 is not replaced"
  );
  console.log("  ✓ Atomic rollback verified: lifecycle_v2 remains at baseline.");
}

// -----------------------------------------------------------------------------
// SCENARIO E: Drift in Owner or Security Definer / Invoker
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO E] Drift in Owner and Security Definer / Invoker ---");
{
  // E.1: lifecycle_v2 owner drift
  restoreCanonicalBaseline();
  sql(`ALTER FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) OWNER TO postgres;`);
  let res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: lifecycle_v2\(uuid,uuid,jsonb\) owner must be cr_order_writer/);
  console.log("  ✓ E.1: lifecycle_v2 owner drift aborted fail-closed.");

  // E.2: actor secdef drift
  restoreCanonicalBaseline();
  sql(`ALTER FUNCTION cr_order_private.actor() SECURITY DEFINER;`);
  res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: actor\(\) must be SECURITY INVOKER/);
  console.log("  ✓ E.2: actor() secdef drift aborted fail-closed.");

  // E.3: session_uid_bridge secinvoker drift
  restoreCanonicalBaseline();
  sql(`ALTER FUNCTION cr_order_private.session_uid_bridge() SECURITY INVOKER;`);
  res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: session_uid_bridge\(\) must be SECURITY DEFINER/);
  console.log("  ✓ E.3: session_uid_bridge secinvoker drift aborted fail-closed.");
}

// -----------------------------------------------------------------------------
// SCENARIO F: Drift in search_path or ACL privileges
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO F] Drift in search_path or ACL privileges ---");
{
  // F.1: lifecycle_v2 search_path drift
  restoreCanonicalBaseline();
  sql(`ALTER FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) SET search_path = public;`);
  let res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: lifecycle_v2\(uuid,uuid,jsonb\) search_path must be empty/);
  console.log("  ✓ F.1: search_path drift aborted fail-closed.");

  // F.2: missing execute on lifecycle_v2 for authenticated
  restoreCanonicalBaseline();
  sql(`REVOKE EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid, uuid, jsonb) FROM authenticated;`);
  res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: lifecycle_v2\(uuid,uuid,jsonb\) missing EXECUTE for authenticated/);
  console.log("  ✓ F.2: missing authenticated execute aborted fail-closed.");

  // F.3: unexpected execute on session_uid_bridge for authenticated
  restoreCanonicalBaseline();
  sql(`GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO authenticated;`);
  res = executeRealMigration();
  assert.equal(res.ok, false);
  assert.match(res.error, /A5_PRECHECK_FAILED: session_uid_bridge\(\) unexpected EXECUTE for public\/anon\/authenticated/);
  console.log("  ✓ F.3: unexpected bridge execute grant aborted fail-closed.");
}

// F.4-F.8: execute the unchanged migration against real unexpected ACLs.
for (const [name, setup, cleanup] of [
  ['grant option', `GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) TO authenticated WITH GRANT OPTION;`,
    `REVOKE GRANT OPTION FOR EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) FROM authenticated;`],
  ['unexpected grantee', `CREATE ROLE a5_drift_probe NOLOGIN; GRANT EXECUTE ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) TO a5_drift_probe;`,
    `REVOKE ALL ON FUNCTION cr_order_private.lifecycle_v2(uuid,uuid,jsonb) FROM a5_drift_probe; DROP ROLE a5_drift_probe;`],
  ['bridge service_role', `GRANT EXECUTE ON FUNCTION cr_order_private.session_uid_bridge() TO service_role;`,
    `REVOKE ALL ON FUNCTION cr_order_private.session_uid_bridge() FROM service_role;`],
  ['actor PUBLIC', `GRANT EXECUTE ON FUNCTION cr_order_private.actor() TO PUBLIC;`,
    `REVOKE ALL ON FUNCTION cr_order_private.actor() FROM PUBLIC;`],
  ['inherited writer', `GRANT cr_order_writer TO authenticated;`,
    `REVOKE cr_order_writer FROM authenticated;`],
]) {
  restoreCanonicalBaseline();
  sql(setup);
  try {
    const before = sql(`SELECT json_agg(row_to_json(p) ORDER BY p.oid) FROM pg_proc p WHERE p.oid IN (
      'cr_order_private.actor()'::regprocedure, 'cr_order_private.session_uid_bridge()'::regprocedure,
      'cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'::regprocedure);`);
    const res = executeRealMigration();
    assert.equal(res.ok, false, name);
    assert.match(res.error, /A5_PRECHECK_FAILED:/, name);
    const after = sql(`SELECT json_agg(row_to_json(p) ORDER BY p.oid) FROM pg_proc p WHERE p.oid IN (
      'cr_order_private.actor()'::regprocedure, 'cr_order_private.session_uid_bridge()'::regprocedure,
      'cr_order_private.lifecycle_v2(uuid,uuid,jsonb)'::regprocedure);`);
    assert.equal(after, before, `${name}: rejected migration must preserve all function metadata`);
    console.log(`  ✓ ${name}: real migration rejected; function metadata unchanged.`);
  } finally {
    sql(cleanup);
  }
}

// -----------------------------------------------------------------------------
// SCENARIO A: Valid canonical baseline -> migration executes cleanly
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO A] Valid canonical baseline execution ---");
{
  restoreCanonicalBaseline();
  const res = executeRealMigration();
  assert.equal(res.ok, true, `Real migration must succeed on canonical baseline: ${res.error}`);
  console.log("  ✓ Real migration executed cleanly without errors.");

  // Verify post-migration state
  const lifecycle = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(lifecycle.hash, LIFECYCLE_REPLACEMENT_HASH, "Lifecycle hash must match replacement");
  assert.equal(lifecycle.owner, "cr_order_writer", "Lifecycle owner must remain cr_order_writer");
  assert.equal(lifecycle.secdef, true, "Lifecycle must remain SECURITY DEFINER");
  assert.deepEqual(lifecycle.config, ['search_path=""'], "Lifecycle search_path must remain empty");
  assert.equal(lifecycle.has_authenticated, true, "authenticated must have EXECUTE");
  assert.equal(lifecycle.has_anon, false, "anon must NOT have EXECUTE");
  assert.equal(lifecycle.has_service_role, false, "service_role must NOT have EXECUTE");
  console.log("  ✓ Postchecks confirmed: replacement hash, ownership, and strict ACLs verified.");
}

// -----------------------------------------------------------------------------
// SCENARIO G: Subsequent Execution / Idempotency Fail-Closed
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO G] Idempotent Second Run Drift Protection ---");
{
  // Running migration again on the already-upgraded state must fail closed
  // because lifecycle_v2 is now at replacement hash, preventing double-application drift
  const res = executeRealMigration();
  assert.equal(res.ok, false, "Second migration run must fail-closed due to baseline hash guard");
  assert.match(
    res.error,
    /A5_PRECHECK_FAILED: lifecycle_v2\(uuid,uuid,jsonb\) source hash drift/,
    "Error must catch drift from baseline"
  );

  // Database must still have replacement function intact
  const lifecycle = getFunctionMeta("lifecycle_v2", "uuid,uuid,jsonb");
  assert.equal(lifecycle.hash, LIFECYCLE_REPLACEMENT_HASH, "Replacement function must remain intact");
  console.log("  ✓ Re-execution protection verified: fails closed and protects active function.");
}

// -----------------------------------------------------------------------------
// SCENARIO H: Functional Execution Under Authenticated Session
// -----------------------------------------------------------------------------
console.log("\n--- [SCENARIO H] Functional Call Execution under Authenticated Session ---");
{
  const STAFF_USER_ID = sql(`
    SELECT tm.user_id FROM public.tenant_members tm
    JOIN public.user_roles ur ON ur.user_id = tm.user_id AND ur.tenant_id = tm.tenant_id
    WHERE tm.tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870' AND ur.role = 'operations_manager' AND tm.status = 'approved' AND tm.deleted_at IS NULL
    LIMIT 1;
  `);

  assert.match(STAFF_USER_ID, /^[0-9a-f-]{36}$/, "Approved synthetic operations_manager required");
  const testCallSql = `
    DO $$
    DECLARE
      v_res jsonb;
    BEGIN
      PERFORM set_config('role', 'authenticated', true);
      PERFORM set_config('request.jwt.claim.sub', '${STAFF_USER_ID}', true);

      IF auth.uid() IS DISTINCT FROM '${STAFF_USER_ID}'::uuid THEN
        RAISE EXCEPTION 'TEST_FAILED: legitimate lifecycle staff session required';
      END IF;
      BEGIN
        -- Call lifecycle_v2 with invalid input to verify it traverses authentication
        -- and reaches input validation without "permission denied for schema auth"
        PERFORM cr_order_private.lifecycle_v2(
          '8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid,
          gen_random_uuid(),
          jsonb_build_object('bad', 'data')
        );
        RAISE EXCEPTION 'TEST_FAILED: invalid command unexpectedly succeeded';
      EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE <> 'P0001' OR SQLERRM <> 'INPUT_INVALID' THEN
          RAISE EXCEPTION 'TEST_FAILED: expected P0001 INPUT_INVALID, got % %', SQLSTATE, SQLERRM;
        END IF;
      END;
    END $$;
    SELECT 'FUNCTIONAL_INVOCATION_PASS';
  `;

  const functionalResult = sql(testCallSql);
  assert.equal(functionalResult, "FUNCTIONAL_INVOCATION_PASS");
  console.log("  ✓ Legitimate staff invocation reached exact P0001 INPUT_INVALID.");
}

console.log("\n=======================================================================");
console.log("   ALL 17 FOCUSED CASES PASSED (PRECHECK PRESERVATION; NO POST-REPLACEMENT FAILURE INJECTION)        ");
console.log("=======================================================================");
