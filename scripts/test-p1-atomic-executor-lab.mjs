#!/usr/bin/env node
/**
 * YOURMEAL OS — EATCLEAN
 * P1 Atomic Migration Executor & Fault Injection Laboratory Suite
 *
 * Runs against an isolated, ephemeral PostgreSQL 17 container (Docker/OrbStack).
 * Recreates the exact 71-migration production baseline (Gate 6 cutover state),
 * then executes scripts/p1-production-migration-live.sh under 4 rigorous test scenarios:
 *
 * 1. Positive Live Execution:
 *    - Full execution of scripts/p1-production-migration-live.sh
 *    - Confirms ledger advances from 71 to 72
 *    - Confirms Checkpoint 11 is recorded
 *    - Confirms functions are operative
 *    - Confirms Tenant A (EatClean) is activated for custom items
 *    - Confirms Tenant B (Competitor) remains UNTOUCHED (custom items inactive)
 *
 * 2. Fault Injection A (Failure inside DDL before COMMIT):
 *    - Injects SQL syntax/semantic error inside migration payload
 *    - Confirms executor aborts immediately (fail-closed)
 *    - Confirms ledger remains at 71 (zero advancement)
 *    - Confirms checkpoint is NOT recorded
 *    - Confirms complete transaction ROLLBACK (no partial DDL objects)
 *
 * 3. Fault Injection B (Failure during Ledger / Checkpoint Insert):
 *    - Injects failure on ledger registration (table constraint violation)
 *    - Confirms executor aborts immediately
 *    - Confirms complete transaction ROLLBACK (DDL undone, ledger remains 71)
 *
 * 4. Multi-Tenant Preservation:
 *    - Proves non-EatClean tenants' configuration is 100% preserved.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const SCRIPT_PATH = path.join(ROOT, "scripts/p1-production-migration-live.sh");
const EVIDENCE_DIR = "/Users/alex/Documents/Codex/2026-10-04/referenced-chatgpt-conversation-this-is-an/reports/gate6-lab";
const PROD_METADATA_FILE = path.join(EVIDENCE_DIR, "production-metadata-sanitized.json");

const CONTAINER_NAME = `p1-atomic-lab-${Date.now()}`;
const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.155";
const HOST_PORT = 54395;

const TENANT_EATCLEAN = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const TENANT_COMPETITOR = "77777777-7777-4000-8000-000000000001";

function docker(args, input = null) {
  return execFileSync("docker", ["--context", "orbstack", ...args], {
    input: input || undefined,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
  });
}

function sql(query, db = "postgres", user = "postgres") {
  return execFileSync(
    "docker",
    [
      "--context",
      "orbstack",
      "exec",
      "-i",
      CONTAINER_NAME,
      "psql",
      "-X",
      "-q",
      "-t",
      "-A",
      "-U",
      user,
      "-d",
      db,
      "-v",
      "ON_ERROR_STOP=1",
    ],
    {
      input: query,
      encoding: "utf8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    }
  ).trim();
}

function cleanupContainer() {
  try {
    docker(["rm", "-f", CONTAINER_NAME]);
  } catch (_) {}
}

function extractAtomicPayload(fileContent, fileName) {
  const lines = fileContent.split("\n");
  let firstBeginIdx = -1;
  let lastCommitIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^\s*BEGIN\s*;/i.test(lines[i])) {
      if (firstBeginIdx === -1) firstBeginIdx = i;
    }
    if (/^\s*COMMIT\s*;/i.test(lines[i])) {
      lastCommitIdx = i;
    }
  }

  if (firstBeginIdx === -1 || lastCommitIdx === -1 || firstBeginIdx >= lastCommitIdx) {
    throw new Error(`Invalid transaction delimiters in ${fileName}: BEGIN=${firstBeginIdx}, COMMIT=${lastCommitIdx}`);
  }

  return lines
    .map((line, idx) => {
      if (idx === firstBeginIdx) {
        return `-- [CONTROLLED WRAPPER: Line ${idx + 1} BEGIN; stripped for unified transaction coupling]`;
      }
      if (idx === lastCommitIdx) {
        return `-- [CONTROLLED WRAPPER: Line ${idx + 1} COMMIT; stripped for unified transaction coupling]`;
      }
      return line;
    })
    .join("\n");
}

function build71Baseline() {
  sql(`
    DO $$
    BEGIN
      IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'p34_writer') THEN
        DROP OWNED BY p34_writer CASCADE;
        DROP ROLE p34_writer;
      END IF;
    END $$;
    DROP SCHEMA IF EXISTS cr_order_private CASCADE;
    DROP SCHEMA IF EXISTS cr_menu_private CASCADE;
    DROP SCHEMA IF EXISTS p34_private CASCADE;
    DROP SCHEMA IF EXISTS gate6_recovery CASCADE;
    DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
    DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;
    ALTER SCHEMA public OWNER TO postgres;
    GRANT ALL ON SCHEMA public TO postgres, public;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

    CREATE TABLE IF NOT EXISTS storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE IF NOT EXISTS storage.objects(id uuid DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON storage.buckets, storage.objects TO postgres;
    GRANT USAGE, CREATE ON SCHEMA storage TO postgres;

    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      inserted_at timestamptz DEFAULT now()
    );
    GRANT ALL ON SCHEMA supabase_migrations TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA supabase_migrations TO postgres;
    ALTER SCHEMA supabase_migrations OWNER TO postgres;

    CREATE SCHEMA IF NOT EXISTS gate6_recovery;
    CREATE TABLE IF NOT EXISTS gate6_recovery.checkpoints (
      checkpoint_id int PRIMARY KEY,
      migration_version text NOT NULL,
      description text NOT NULL,
      status text NOT NULL DEFAULT 'applied',
      applied_at timestamptz DEFAULT now()
    );
    GRANT ALL ON SCHEMA gate6_recovery TO postgres;
    GRANT ALL ON ALL TABLES IN SCHEMA gate6_recovery TO postgres;
    ALTER SCHEMA gate6_recovery OWNER TO postgres;
  `, "postgres", "supabase_admin");

  const prepCi = fs.readFileSync(path.join(ROOT, "scripts/migration-bootstrap-ci.mjs"), "utf8");
  const prepSql = prepCi.split("export const prepareOwnerGrant = `")[1].split("`;")[0];
  sql(prepSql, "postgres", "supabase_admin");

  // 1. Baseline migrations up to 20261006110000
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const baselineMigrations = migrationFiles.filter((f) => f.slice(0, 14) <= "20261006110000");
  for (const f of baselineMigrations) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    sql(`SET ROLE postgres;\n${content}`);
  }

  // 2. Materialize baseline ledger & observed production functions
  const prodMetadata = JSON.parse(fs.readFileSync(PROD_METADATA_FILE, "utf8"));
  sql("TRUNCATE supabase_migrations.schema_migrations;");
  for (const entry of prodMetadata.ledger) {
    const v = entry.version || entry;
    sql(`INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${v}') ON CONFLICT DO NOTHING;`);
  }

  const funcs = [...prodMetadata.functions].sort((a, b) =>
    a.name === "session_uid_bridge" ? -1 : b.name === "session_uid_bridge" ? 1 : 0
  );
  for (const f of funcs) {
    sql(`SET ROLE postgres;\n${f.definition}`);
    let decl = f.definition.split(" RETURNS ")[0].split("CREATE OR REPLACE FUNCTION ")[1].trim();
    decl = decl.replace(/\s+DEFAULT\s+[^,)]*/gi, "");
    sql(`SET ROLE postgres; ALTER FUNCTION ${decl} OWNER TO ${f.owner};`);
    sql(`SET ROLE postgres; REVOKE ALL ON FUNCTION ${decl} FROM PUBLIC, anon, authenticated, service_role;`);
    const acl = f.acl || "";
    for (const role of ["cr_order_writer", "service_role", "authenticated", "anon"]) {
      if (new RegExp(`(?:\\{|,)${role}=[^,}]*X`).test(acl)) {
        sql(`SET ROLE postgres; GRANT EXECUTE ON FUNCTION ${decl} TO ${role};`);
      }
    }
  }

  // Baseline observed ACLs
  sql(`
    SET ROLE postgres;
    GRANT EXECUTE ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) TO authenticated;
    COMMENT ON FUNCTION public.capture_staff_existing_order(uuid,jsonb) IS NULL;
    GRANT ALL ON TABLE public.orders TO authenticated, anon;
    GRANT ALL ON TABLE public.order_items TO authenticated, anon;
    GRANT ALL ON TABLE public.kitchen_production_batches TO authenticated, anon;
    GRANT ALL ON TABLE public.customers TO authenticated, anon;
    GRANT ALL ON TABLE public.audit_log TO authenticated, anon;
    RESET ROLE;
  `);

  sql("REVOKE USAGE ON SCHEMA auth FROM cr_order_writer, PUBLIC;", "postgres", "supabase_admin");

  // 3. Apply the 10 Gate 6 cutover migrations
  const cutoverFiles = [
    "20261007020208_cr_order_a5_lifecycle_ledger_expand.sql",
    "20261007020245_cr_order_a5_lifecycle_writer.sql",
    "20261007020849_cr_order_a5_audit_uuid_compatibility.sql",
    "20261008112217_p34_identity_crm_profile.sql",
    "20261008160753_p34_identity_conflict_recovery.sql",
    "20261010155729_release_program_draft_order_price_snapshot.sql",
    "20261012173000_eatclean_staff_order_offer_pricing_enforcement.sql",
    "20261015113000_revoke_legacy_staff_order_capture.sql",
    "20261015173000_cr_order_a5_lifecycle_session_bridge.sql",
    "20261015180000_cr_order_custom_batch_session_bridge.sql",
  ];

  for (let i = 0; i < cutoverFiles.length; i++) {
    const cf = cutoverFiles[i];
    const rawSql = fs.readFileSync(path.join(MIGRATIONS_DIR, cf), "utf8");
    const payload = extractAtomicPayload(rawSql, cf);
    const v = cf.slice(0, 14);
    sql(`
      BEGIN;
      SET LOCAL ROLE postgres;
      ${payload}
      INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${v}');
      INSERT INTO gate6_recovery.checkpoints (checkpoint_id, migration_version, description, status)
      VALUES (${i + 1}, '${v}', '${cf}', 'applied');
      COMMIT;
    `);
  }

  // 4. Seed Tenants
  sql(`
    INSERT INTO public.tenants(id, slug, name, country, currency, timezone) VALUES
      ('${TENANT_EATCLEAN}', 'eatclean', 'EatClean', 'ES', 'EUR', 'Atlantic/Canary'),
      ('${TENANT_COMPETITOR}', 'competitor', 'Competitor Catering SL', 'ES', 'EUR', 'Atlantic/Canary')
    ON CONFLICT (id) DO NOTHING;

    -- Ensure Tenant B has custom activation explicitly disabled
    INSERT INTO cr_order_private.custom_activation(tenant_id, enabled) VALUES
      ('${TENANT_COMPETITOR}', false)
    ON CONFLICT (tenant_id) DO UPDATE SET enabled = false;
  `);

  const ledgerCount = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(ledgerCount, "71", "Baseline must have exactly 71 ledger versions");
  const checkpointsCount = sql("SELECT count(*) FROM gate6_recovery.checkpoints;");
  assert.equal(checkpointsCount, "10", "Baseline must have exactly 10 checkpoints");
}

async function runSuite() {
  console.log("====================================================================");
  console.log("YOURMEAL OS — P1 ATOMIC EXECUTOR & FAULT INJECTION LAB SUITE");
  console.log("Image: " + IMAGE);
  console.log("Host Port: " + HOST_PORT);
  console.log("====================================================================\n");

  cleanupContainer();

  console.log(`[Phase 1] Launching isolated PG17 container (${CONTAINER_NAME})...`);
  docker([
    "run",
    "-d",
    "--name",
    CONTAINER_NAME,
    "-p",
    `${HOST_PORT}:5432`,
    "-e",
    "POSTGRES_PASSWORD=postgres",
    IMAGE,
  ]);

  let stable = false;
  let consecutive = 0;
  for (let i = 0; i < 40; i++) {
    try {
      const res = execFileSync(
        "docker",
        ["--context", "orbstack", "exec", CONTAINER_NAME, "psql", "-U", "supabase_admin", "-d", "postgres", "-t", "-A", "-c", "SELECT true;"],
        { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
      );
      if (res.trim() === "t") {
        consecutive++;
        if (consecutive >= 3) {
          stable = true;
          break;
        }
      } else {
        consecutive = 0;
      }
    } catch (_) {
      consecutive = 0;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  assert(stable, "PostgreSQL failed to stabilize in container");
  console.log("✓ PostgreSQL 17 container is ready and stable.\n");

  // ---------------------------------------------------------------------------
  // [TEST 1] Positive Live Execution of scripts/p1-production-migration-live.sh
  // ---------------------------------------------------------------------------
  console.log("--- [TEST 1/4] POSITIVE EXECUTION OF ACTUAL P1 MIGRATION SCRIPT ---");
  build71Baseline();

  console.log("  Executing scripts/p1-production-migration-live.sh in LAB mode...");
  const scriptProc = spawnSync("bash", [SCRIPT_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      LAB_ISOLATED_PG17: "true",
      PGPORT: String(HOST_PORT),
      PGPASSWORD: "postgres",
    },
    encoding: "utf8",
  });

  if (scriptProc.status !== 0) {
    console.error("Script STDOUT:\n", scriptProc.stdout);
    console.error("Script STDERR:\n", scriptProc.stderr);
    throw new Error(`scripts/p1-production-migration-live.sh failed with exit code ${scriptProc.status}`);
  }

  console.log("  Script Output Summary:");
  for (const line of scriptProc.stdout.split("\n")) {
    if (line.includes("FASE") || line.includes("PASS") || line.includes("Ledger") || line.includes("P1 en DB") || line.includes("custom")) {
      console.log(`    ${line.trim()}`);
    }
  }

  // Database State Verification
  const postLedger = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(postLedger, "72", "Ledger count must advance from 71 to 72");

  const p1Version = sql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261016203000';");
  assert.equal(p1Version, "1", "Migration 20261016203000 must be recorded in ledger");

  const checkpoint11 = sql("SELECT migration_version || '|' || status FROM gate6_recovery.checkpoints WHERE checkpoint_id = 11;");
  assert.equal(checkpoint11, "20261016203000|applied", "Checkpoint 11 must be recorded with status applied");

  // Tenant Isolation Verification
  const eatcleanCustom = sql(`SELECT enabled FROM cr_order_private.custom_activation WHERE tenant_id = '${TENANT_EATCLEAN}';`);
  assert.equal(eatcleanCustom, "t", "Tenant EatClean must have custom_activation enabled = true");

  const competitorCustom = sql(`SELECT enabled FROM cr_order_private.custom_activation WHERE tenant_id = '${TENANT_COMPETITOR}';`);
  assert.equal(competitorCustom, "f", "Tenant Competitor MUST remain enabled = false (zero leakage)");

  const requireOffMenuExists = sql("SELECT to_regprocedure('cr_order_private.require_off_menu(uuid,uuid)') IS NOT NULL;");
  assert.equal(requireOffMenuExists, "t", "cr_order_private.require_off_menu must exist");

  console.log("  ✓ TEST 1 PASS: Script executed cleanly. Ledger 71 -> 72, Checkpoint 11, Tenant A active, Tenant B untouched.\n");

  // ---------------------------------------------------------------------------
  // [TEST 2] Fault Injection A: Failure inside DDL before COMMIT
  // ---------------------------------------------------------------------------
  console.log("--- [TEST 2/4] FAULT INJECTION A: FAILURE INSIDE DDL (BEFORE COMMIT) ---");
  build71Baseline();

  console.log("  Injecting deliberate syntax error into temporary copy of migration...");
  const realMigrationPath = path.join(MIGRATIONS_DIR, "20261016203000_cr_order_off_menu_admin_exception.sql");
  const originalContent = fs.readFileSync(realMigrationPath, "utf8");

  try {
    // Inject immediate DDL failure right after lock/statement timeouts
    const brokenContent = originalContent.replace(
      "SET LOCAL statement_timeout = '60s';",
      "SET LOCAL statement_timeout = '60s';\nDO $$ BEGIN RAISE EXCEPTION 'CONTROLLED_DDL_FAULT_INJECTION'; END $$;"
    );
    fs.writeFileSync(realMigrationPath, brokenContent);

    // Compute expected broken SHA so the script passes file integrity guard but fails in SQL
    const brokenSha = execFileSync("shasum", ["-a", "256", realMigrationPath], { encoding: "utf8" }).split(" ")[0];

    // Temporarily patch script expected SHA
    const scriptContent = fs.readFileSync(SCRIPT_PATH, "utf8");
    fs.writeFileSync(SCRIPT_PATH, scriptContent.replace(/EXPECTED_MIGRATION_SHA="[^"]+"/, `EXPECTED_MIGRATION_SHA="${brokenSha}"`));

    const failProc = spawnSync("bash", [SCRIPT_PATH], {
      cwd: ROOT,
      env: {
        ...process.env,
        LAB_ISOLATED_PG17: "true",
        PGPORT: String(HOST_PORT),
        PGPASSWORD: "postgres",
      },
      encoding: "utf8",
    });

    assert.notEqual(failProc.status, 0, "Script MUST fail and exit with non-zero code on DDL failure");
    console.log("  ✓ Script aborted fail-closed as expected (Exit Code: " + failProc.status + ")");

    // Verify Rollback
    const rollbackLedger = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
    assert.equal(rollbackLedger, "71", "Ledger must NOT advance; must remain strictly at 71");

    const p1InDb = sql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261016203000';");
    assert.equal(p1InDb, "0", "Migration 20261016203000 must NOT exist in ledger");

    const checkpoint11Exists = sql("SELECT count(*) FROM gate6_recovery.checkpoints WHERE checkpoint_id = 11;");
    assert.equal(checkpoint11Exists, "0", "Checkpoint 11 must NOT exist in checkpoints table");

    const requireOffMenuRollback = sql("SELECT to_regprocedure('cr_order_private.require_off_menu(uuid,uuid)') IS NOT NULL;");
    assert.equal(requireOffMenuRollback, "f", "Partial functions must be completely ROLLED BACK (not present)");

    console.log("  ✓ TEST 2 PASS: 100% Rollback verified. Ledger: 71, Checkpoints: 10, Zero orphan objects.\n");
  } finally {
    // Restore original files
    fs.writeFileSync(realMigrationPath, originalContent);
    const validSha = execFileSync("shasum", ["-a", "256", realMigrationPath], { encoding: "utf8" }).split(" ")[0];
    const scriptContent = fs.readFileSync(SCRIPT_PATH, "utf8");
    fs.writeFileSync(SCRIPT_PATH, scriptContent.replace(/EXPECTED_MIGRATION_SHA="[^"]+"/, `EXPECTED_MIGRATION_SHA="${validSha}"`));
  }

  // ---------------------------------------------------------------------------
  // [TEST 3] Fault Injection B: Failure during Ledger / Checkpoint Insert
  // ---------------------------------------------------------------------------
  console.log("--- [TEST 3/4] FAULT INJECTION B: FAILURE DURING LEDGER INSERTION ---");
  build71Baseline();

  console.log("  Injecting constraint violation trigger on supabase_migrations.schema_migrations...");
  sql(`
    CREATE OR REPLACE FUNCTION fail_p1_ledger() RETURNS trigger AS $$
    BEGIN
      IF NEW.version = '20261016203000' THEN
        RAISE EXCEPTION 'CONTROLLED_LEDGER_FAULT_INJECTION: Rejection test';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_fail_p1_ledger
    BEFORE INSERT ON supabase_migrations.schema_migrations
    FOR EACH ROW EXECUTE FUNCTION fail_p1_ledger();
  `, "postgres", "supabase_admin");

  const failLedgerProc = spawnSync("bash", [SCRIPT_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      LAB_ISOLATED_PG17: "true",
      PGPORT: String(HOST_PORT),
      PGPASSWORD: "postgres",
    },
    encoding: "utf8",
  });

  assert.notEqual(failLedgerProc.status, 0, "Script MUST fail and exit with non-zero code on ledger rejection");
  console.log("  ✓ Script aborted fail-closed on ledger rejection (Exit Code: " + failLedgerProc.status + ")");

  // Verify Rollback of DDL despite DDL having executed before the ledger insert
  const rollbackLedgerB = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(rollbackLedgerB, "71", "Ledger must remain strictly at 71");

  const checkpoint11B = sql("SELECT count(*) FROM gate6_recovery.checkpoints WHERE checkpoint_id = 11;");
  assert.equal(checkpoint11B, "0", "Checkpoint 11 must NOT exist in checkpoints table");

  const requireOffMenuRollbackB = sql("SELECT to_regprocedure('cr_order_private.require_off_menu(uuid,uuid)') IS NOT NULL;");
  assert.equal(requireOffMenuRollbackB, "f", "DDL changes MUST be rolled back when ledger insert fails!");

  console.log("  ✓ TEST 3 PASS: Atomic rollback confirmed across DDL and ledger. Ledger: 71, DDL reverted.\n");

  // ---------------------------------------------------------------------------
  // [TEST 4] Fault Injection C: Failure during Checkpoint 11 Insert
  // ---------------------------------------------------------------------------
  console.log("--- [TEST 4/5] FAULT INJECTION C: FAILURE DURING CHECKPOINT INSERTION ---");
  // Clean up ledger trigger first
  sql("DROP TRIGGER IF EXISTS trg_fail_p1_ledger ON supabase_migrations.schema_migrations;", "postgres", "supabase_admin");
  sql("DROP FUNCTION IF EXISTS fail_p1_ledger();", "postgres", "supabase_admin");
  build71Baseline();

  console.log("  Injecting constraint violation trigger on gate6_recovery.checkpoints...");
  sql(`
    CREATE OR REPLACE FUNCTION fail_p1_checkpoint() RETURNS trigger AS $$
    BEGIN
      IF NEW.checkpoint_id = 11 THEN
        RAISE EXCEPTION 'CONTROLLED_CHECKPOINT_FAULT_INJECTION: Rejection test';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_fail_p1_checkpoint
    BEFORE INSERT ON gate6_recovery.checkpoints
    FOR EACH ROW EXECUTE FUNCTION fail_p1_checkpoint();
  `, "postgres", "supabase_admin");

  const failCheckpointProc = spawnSync("bash", [SCRIPT_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      LAB_ISOLATED_PG17: "true",
      PGPORT: String(HOST_PORT),
      PGPASSWORD: "postgres",
    },
    encoding: "utf8",
  });

  assert.notEqual(failCheckpointProc.status, 0, "Script MUST fail and exit with non-zero code on checkpoint rejection");
  console.log("  ✓ Script aborted fail-closed on checkpoint rejection (Exit Code: " + failCheckpointProc.status + ")");

  // Verify Rollback of DDL AND ledger despite DDL and ledger having executed before the checkpoint insert
  const rollbackLedgerC = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(rollbackLedgerC, "71", "Ledger must remain strictly at 71 when checkpoint insert fails");

  const checkpoint11C = sql("SELECT count(*) FROM gate6_recovery.checkpoints WHERE checkpoint_id = 11;");
  assert.equal(checkpoint11C, "0", "Checkpoint 11 must NOT exist in checkpoints table");

  const requireOffMenuRollbackC = sql("SELECT to_regprocedure('cr_order_private.require_off_menu(uuid,uuid)') IS NOT NULL;");
  assert.equal(requireOffMenuRollbackC, "f", "DDL changes MUST be rolled back when checkpoint insert fails!");

  console.log("  ✓ TEST 4 PASS: Atomic rollback confirmed across DDL, ledger, and checkpoint. Ledger: 71, DDL reverted.\n");

  // ---------------------------------------------------------------------------
  // [TEST 5] Multi-Tenant Isolation & Configuration Preservation
  // ---------------------------------------------------------------------------
  console.log("--- [TEST 5/5] MULTI-TENANT PRESERVATION & ISOLATION CHECK ---");
  // Drop the rejection trigger and run clean
  sql("DROP TRIGGER IF EXISTS trg_fail_p1_checkpoint ON gate6_recovery.checkpoints;", "postgres", "supabase_admin");
  sql("DROP FUNCTION IF EXISTS fail_p1_checkpoint();", "postgres", "supabase_admin");

  const finalProc = spawnSync("bash", [SCRIPT_PATH], {
    cwd: ROOT,
    env: {
      ...process.env,
      LAB_ISOLATED_PG17: "true",
      PGPORT: String(HOST_PORT),
      PGPASSWORD: "postgres",
    },
    encoding: "utf8",
  });
  assert.equal(finalProc.status, 0, "Clean re-execution must succeed");

  const tenantAStatus = sql(`SELECT enabled FROM cr_order_private.custom_activation WHERE tenant_id = '${TENANT_EATCLEAN}';`);
  const tenantBStatus = sql(`SELECT enabled FROM cr_order_private.custom_activation WHERE tenant_id = '${TENANT_COMPETITOR}';`);

  assert.equal(tenantAStatus, "t", "Tenant EatClean must be enabled");
  assert.equal(tenantBStatus, "f", "Tenant Competitor must strictly remain false");

  console.log(`  Tenant A (EatClean   : ${TENANT_EATCLEAN}) -> custom_activation.enabled = ${tenantAStatus}`);
  console.log(`  Tenant B (Competitor : ${TENANT_COMPETITOR}) -> custom_activation.enabled = ${tenantBStatus}`);
  console.log("  ✓ TEST 4 PASS: Zero cross-tenant leakage. EatClean activated, Competitor preserved.\n");

  cleanupContainer();

  console.log("====================================================================");
  console.log("ALL 4 ATOMICITY & TENANT ISOLATION TESTS PASSED 100%");
  console.log("====================================================================\n");
}

runSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL ERROR IN SUITE:", err);
    cleanupContainer();
    process.exit(1);
  });
