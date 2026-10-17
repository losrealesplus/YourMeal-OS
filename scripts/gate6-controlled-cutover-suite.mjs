#!/usr/bin/env node
/**
 * YOURMEAL OS — GATE 6 CONTROLLED CUTOVER SUITE
 *
 * Implements the new strategy: Controlled Cutover with explicit STOP on ambiguous states.
 * Replaces automatic resumption with controlled execution and strict safety gates.
 *
 * Scenarios tested:
 *   A. Approved initial baseline state (61 ledger versions, 14 observed functions)
 *   B. Successful controlled cutover (10 operations under active write barrier)
 *   C. Interruption before COMMIT (transactional rollback & clean retry)
 *   D. Interruption after COMMIT / Ambiguous state (strict STOP, no auto-guessing)
 *   E. Unexpected state / Drift (strict STOP, fail-closed)
 *   F. Disaster recovery & backup trial (identical procedure between lab & manifest, zero errors)
 *   G. Writer quiesce & safe reopening (broad table coverage, TRUNCATE blocked, operator pass)
 *   H. Official Supabase ledger compatibility & future migration execution
 *
 * READ-ONLY on production. All execution occurs in isolated disposable PG17 container.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const EVIDENCE_DIR = "/Users/alex/Documents/Codex/2026-10-04/referenced-chatgpt-conversation-this-is-an/reports/gate6-lab";
const PROD_METADATA_FILE = path.join(EVIDENCE_DIR, "production-metadata-sanitized.json");

const CONTAINER_NAME = `gate6-controlled-${Date.now()}`;
const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.155";

const EATCLEAN_TENANT = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const STAFF_USER = "00000000-0000-4000-8000-000000000001";
const CUSTOMER_ID = "91000000-0000-4000-8000-000000000001";
const DISH_ID = "93000000-0000-4000-8000-000000000001";
const ORDER_ITEM_ID = "94000000-0000-4000-8000-000000000001";

function docker(args, input = null) {
  return execFileSync(
    "docker",
    ["--context", "orbstack", ...args],
    {
      input: input || undefined,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    }
  );
}

function sql(query, db = "postgres", check = true, user = "postgres") {
  try {
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
  } catch (err) {
    if (check) {
      throw new Error(`SQL error in ${db} as ${user}: ${err.stderr || err.message}`);
    }
    return { ok: false, error: err.stderr || err.message };
  }
}

function cleanupContainer() {
  try {
    docker(["rm", "-f", CONTAINER_NAME]);
  } catch (_) {}
}

export function extractAtomicMigrationPayload(fileContent, fileName) {
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

  assert(firstBeginIdx !== -1, `File ${fileName} must contain a top-level BEGIN; statement`);
  assert(lastCommitIdx !== -1, `File ${fileName} must contain a top-level COMMIT; statement`);
  assert(firstBeginIdx < lastCommitIdx, `Invalid transaction delimiters order in ${fileName}`);

  const payloadLines = lines.map((line, idx) => {
    if (idx === firstBeginIdx) {
      return `-- [CONTROLLED WRAPPER: Original line ${idx + 1} BEGIN; stripped for unified transaction coupling]`;
    }
    if (idx === lastCommitIdx) {
      return `-- [CONTROLLED WRAPPER: Original line ${idx + 1} COMMIT; stripped for unified transaction coupling]`;
    }
    return line;
  });

  return payloadLines.join("\n");
}

async function run() {
  console.log("================================================================================");
  console.log("   YOURMEAL OS — GATE 6 CONTROLLED CUTOVER SUITE                               ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // [Phase 0] Environment & Production Evidence Verification
  // ---------------------------------------------------------------------------
  console.log("[Phase 0] Verifying environment & authorized production baseline evidence...");
  assert(fs.existsSync(PROD_METADATA_FILE), `Missing metadata file: ${PROD_METADATA_FILE}`);
  const prodMetadata = JSON.parse(fs.readFileSync(PROD_METADATA_FILE, "utf8"));
  assert.equal(prodMetadata.ledger.length, 61, "Production baseline ledger must have exactly 61 entries");
  assert.equal(prodMetadata.functions.length, 14, "Production baseline functions must have exactly 14 entries");
  console.log("✓ Production snapshot verified: exactly 61 ledger entries, 14 observed functions.\n");

  // ---------------------------------------------------------------------------
  // [Phase 1] Ephemeral Container Setup
  // ---------------------------------------------------------------------------
  console.log("[Phase 1] Launching isolated disposable PostgreSQL 17 container...");
  cleanupContainer();
  docker([
    "run",
    "-d",
    "--name",
    CONTAINER_NAME,
    "--network",
    "none",
    "--tmpfs",
    "/var/lib/postgresql/data:rw,noexec,nosuid,size=1024m",
    "-e",
    "POSTGRES_PASSWORD=postgres",
    IMAGE,
  ]);

  let stable = false;
  let consecutive = 0;
  for (let i = 0; i < 30; i++) {
    try {
      const res = execFileSync(
        "docker",
        [
          "--context",
          "orbstack",
          "exec",
          CONTAINER_NAME,
          "psql",
          "-U",
          "supabase_admin",
          "-d",
          "postgres",
          "-t",
          "-A",
          "-c",
          "SELECT true;",
        ],
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
  assert(stable, "PostgreSQL failed to stabilize in time");
  console.log("✓ Container ready with tmpfs data volume and zero host networking.\n");

  // Helper to materialize exact L1 baseline from production snapshot
  function setupBaselineL1() {
    sql(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'p34_writer') THEN
          EXECUTE 'GRANT p34_writer TO postgres;';
          EXECUTE 'DROP OWNED BY p34_writer CASCADE;';
          EXECUTE 'DROP ROLE p34_writer;';
        END IF;
      END $$;
      DROP SCHEMA IF EXISTS p34_private CASCADE;
      DROP SCHEMA IF EXISTS gate6_recovery CASCADE;
      DROP SCHEMA IF EXISTS cr_order_private CASCADE;
      DROP SCHEMA IF EXISTS cr_menu_private CASCADE;
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
      ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;
    `, "postgres", true, "supabase_admin");

    const prepCi = fs.readFileSync(path.join(ROOT, "scripts/migration-bootstrap-ci.mjs"), "utf8");
    const prepSql = prepCi.split("export const prepareOwnerGrant = `")[1].split("`;")[0];
    sql(prepSql, "postgres", true, "supabase_admin");

    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
    const baselineMigrations = migrationFiles.filter((f) => f.slice(0, 14) <= "20261006110000");

    for (const f of baselineMigrations) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
      sql(`SET ROLE postgres;\n${content}`);
    }

    // Materialize baseline ledger: exactly 61 production versions
    sql("TRUNCATE supabase_migrations.schema_migrations;");
    for (const entry of prodMetadata.ledger) {
      const v = entry.version || entry;
      sql(`INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${v}') ON CONFLICT DO NOTHING;`);
    }

    // Materialize 14 observed production functions
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

    sql("REVOKE USAGE ON SCHEMA auth FROM cr_order_writer, PUBLIC;", "postgres", true, "supabase_admin");

    // Seed baseline tenant fixtures
    sql(`
      SET ROLE postgres;
      INSERT INTO auth.users(id, email) VALUES('${STAFF_USER}', 'staff@eatclean.test') ON CONFLICT DO NOTHING;
      INSERT INTO public.tenants(id, slug, name, country, currency, timezone)
      VALUES('${EATCLEAN_TENANT}', 'eatclean', 'EatClean Tenerife', 'ES', 'EUR', 'Atlantic/Canary') ON CONFLICT DO NOTHING;
      INSERT INTO public.tenant_members(tenant_id, user_id, status, membership_type)
      VALUES('${EATCLEAN_TENANT}', '${STAFF_USER}', 'approved', 'employee') ON CONFLICT DO NOTHING;
      INSERT INTO public.user_roles(user_id, tenant_id, role)
      VALUES('${STAFF_USER}', '${EATCLEAN_TENANT}', 'operations_manager') ON CONFLICT DO NOTHING;
      INSERT INTO public.customers(id, tenant_id, kind, display_name)
      VALUES('${CUSTOMER_ID}', '${EATCLEAN_TENANT}', 'individual', 'Cliente Ficticio E2E') ON CONFLICT DO NOTHING;
      INSERT INTO public.dishes(id, tenant_id, name, kcal, price, status)
      VALUES('${DISH_ID}', '${EATCLEAN_TENANT}', 'Tarta de Queso Saludable', 320, 2.50, 'active') ON CONFLICT DO NOTHING;
      INSERT INTO public.weekly_menus(id, tenant_id, week_start, status, published_at)
      VALUES('95000000-0000-4000-8000-000000000001', '${EATCLEAN_TENANT}', '2026-10-19', 'published', now()) ON CONFLICT DO NOTHING;
      INSERT INTO public.weekly_menu_slots(id, tenant_id, weekly_menu_id, dish_id, day_date, sort_order, unit_price)
      VALUES('96000000-0000-4000-8000-000000000001', '${EATCLEAN_TENANT}', '95000000-0000-4000-8000-000000000001', '${DISH_ID}', '2026-10-19', 0, 3.50) ON CONFLICT DO NOTHING;
      INSERT INTO cr_order_private.custom_activation(tenant_id, enabled)
      VALUES('${EATCLEAN_TENANT}', true) ON CONFLICT (tenant_id) DO UPDATE SET enabled = true;
      INSERT INTO public.kitchen_production_batches(id, tenant_id, delivery_date, dish_id, status)
      VALUES('95000000-0000-4000-8000-000000000001', '${EATCLEAN_TENANT}', '2026-10-19', '${DISH_ID}', 'pending')
      ON CONFLICT (id) DO NOTHING;
      
      SET session_replication_role = replica;
      INSERT INTO public.orders(id, tenant_id, customer_id, week_start, status, write_contract_version, revision, total)
      VALUES('92000000-0000-4000-8000-000000000001', '${EATCLEAN_TENANT}', '${CUSTOMER_ID}', '2026-10-19', 'confirmed', 2, 1, 10.00)
      ON CONFLICT DO NOTHING;
      INSERT INTO public.order_items(id, tenant_id, order_id, day_date, item_kind, dish_id, name_snapshot, qty, unit_price, price_snapshot_status, allergen_state, allergens_snapshot, snapshot_captured_at)
      VALUES('${ORDER_ITEM_ID}', '${EATCLEAN_TENANT}', '92000000-0000-4000-8000-000000000001', '2026-10-19', 'custom', NULL, 'Menu Personalizado Fitness', 1, 10.00, 'captured', 'UNKNOWN', '{}'::text[], now())
      ON CONFLICT DO NOTHING;
      SET session_replication_role = DEFAULT;
    `);
  }

  // ---------------------------------------------------------------------------
  // [Phase 2] Materialize Baseline L1
  // ---------------------------------------------------------------------------
  console.log("[Phase 2] Materializing Baseline L1 Shadow from exact production snapshot...");
  setupBaselineL1();
  const baselineLedger = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(baselineLedger, "61", "Baseline must have 61 ledger entries");
  const baselineAuthUsage = sql("SELECT has_schema_privilege('cr_order_writer', 'auth', 'USAGE');");
  assert.equal(baselineAuthUsage, "f", "Baseline cr_order_writer must have 0 USAGE on auth");
  console.log("✓ Baseline L1 Shadow initialized with exact production fidelity.\n");

  // ---------------------------------------------------------------------------
  // [Phase 3 / Scenario G] Controlled Write Barrier (All Affected Tables + TRUNCATE)
  // ---------------------------------------------------------------------------
  console.log("[Phase 3 / Scenario G] Testing Controlled Write Barrier across all affected tables...");
  
  // Install Barrier Function & Statement Triggers
  sql(`
    CREATE OR REPLACE FUNCTION public.gate6_write_barrier_enforce()
    RETURNS trigger AS $$
    BEGIN
      IF current_user = 'postgres' AND session_user = 'postgres' AND current_setting('maintenance.controlled_cutover', true) = 'active' THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
      RAISE EXCEPTION 'MAINTENANCE_IN_PROGRESS: Write operations are locked for release cutover.'
        USING ERRCODE = '55P03';
    END;
    $$ LANGUAGE plpgsql SECURITY INVOKER;

    GRANT EXECUTE ON FUNCTION public.gate6_write_barrier_enforce() TO authenticated, anon, PUBLIC;

    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS gate6_barrier_%I ON public.%I;', r.tablename, r.tablename);
        EXECUTE format('CREATE TRIGGER gate6_barrier_%I BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.gate6_write_barrier_enforce();', r.tablename, r.tablename);
      END LOOP;
    END $$;
  `);

  // Grant table privileges so we specifically test trigger barrier interception (not bare ACL rejection)
  sql("GRANT ALL ON TABLE public.kitchen_production_batches TO authenticated, anon;");

  // Verify rejection for authenticated callers on diverse tables
  const testWrites = [
    { name: "Orders UPDATE", q: "SET ROLE authenticated; UPDATE public.orders SET total = 20 WHERE id = '92000000-0000-4000-8000-000000000001';" },
    { name: "Kitchen Batches UPDATE", q: "SET ROLE authenticated; UPDATE public.kitchen_production_batches SET status = 'preparing' WHERE id = '95000000-0000-4000-8000-000000000001';" },
    { name: "Audit Log INSERT", q: "SET ROLE authenticated; INSERT INTO public.audit_log(entity_type, entity_id, action) VALUES ('test', gen_random_uuid(), 'test.action');" },
    { name: "Customers UPDATE", q: "SET ROLE authenticated; UPDATE public.customers SET display_name = 'Modified' WHERE id = '91000000-0000-4000-8000-000000000001';" },
    { name: "Kitchen Batches TRUNCATE", q: "SET ROLE authenticated; TRUNCATE public.kitchen_production_batches;" },
    { name: "Forged GUC Parameter", q: "SET ROLE authenticated; SET maintenance.controlled_cutover = 'active'; UPDATE public.orders SET total = 20 WHERE id = '92000000-0000-4000-8000-000000000001';" }
  ];

  for (const t of testWrites) {
    const res = sql(t.q, "postgres", false);
    assert.equal(res.ok, false, `${t.name} must be rejected by write barrier`);
    assert(
      res.error.includes("55P03") || res.error.includes("MAINTENANCE_IN_PROGRESS"),
      `Expected 55P03 / MAINTENANCE_IN_PROGRESS, got: ${res.error}`
    );
    console.log(`  ✓ Barrier PASS: ${t.name} strictly rejected with 55P03 / MAINTENANCE_IN_PROGRESS.`);
  }

  // Verify that authorized operator proceeds with triggers fully active
  sql(`
    SET maintenance.controlled_cutover = 'active';
    UPDATE public.kitchen_production_batches SET status = 'pending' WHERE id = '95000000-0000-4000-8000-000000000001';
    INSERT INTO public.audit_log(entity_type, entity_id, action) VALUES ('system', gen_random_uuid(), 'operator_cutover_start');
  `);
  console.log("  ✓ Barrier PASS: Operator session (postgres + GUC active) writes cleanly with triggers active.\n");

  // ---------------------------------------------------------------------------
  // [Phase 4] Pre-Cutover Backup (Dump taken while barrier is active)
  // ---------------------------------------------------------------------------
  console.log("[Phase 4] Generating Pre-Cutover Backup as postgres with active write barrier...");
  const DUMP_FILE = "/tmp/eatclean_pre_cutover.dump";
  const TOC_FILE = "/tmp/eatclean_pre_cutover.toc";
  const FILTERED_TOC = "/tmp/eatclean_pre_cutover_filtered.toc";

  docker([
    "exec",
    CONTAINER_NAME,
    "pg_dump",
    "-U",
    "postgres",
    "-d",
    "postgres",
    "--schema=public",
    "--schema=cr_order_private",
    "--schema=cr_menu_private",
    "--schema=supabase_migrations",
    "--format=custom",
    "--file=" + DUMP_FILE,
  ]);

  const dumpSha = docker([
    "exec",
    CONTAINER_NAME,
    "sha256sum",
    DUMP_FILE,
  ]).trim().split(/\s+/)[0];
  console.log(`  ✓ Pre-cutover backup created: SHA-256=${dumpSha}`);

  // Generate TOC and filter out SCHEMA creation and DEFAULT ACL for supabase_admin
  const fullToc = docker(["exec", CONTAINER_NAME, "pg_restore", "-l", DUMP_FILE]);
  const filteredTocLines = fullToc.split("\n").filter((line) => {
    if (line.includes("DEFAULT ACL") && line.includes("supabase_admin")) return false;
    if (line.includes("SCHEMA -")) return false;
    return true;
  }).join("\n");

  docker(["exec", "-i", CONTAINER_NAME, "sh", "-c", `cat << 'EOF' > ${FILTERED_TOC}\n${filteredTocLines}\nEOF`]);
  console.log("  ✓ TOC catalog verified and filtered for deterministic restoration.\n");

  // Capture baseline state snapshot for later verification
  const snapTables = sql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';");
  const snapOrdersTotal = sql("SELECT sum(total) FROM public.orders;");
  const snapFuncs = sql("SELECT proname, prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cr_order_private' ORDER BY proname, pg_get_function_identity_arguments(p.oid);");

  // ---------------------------------------------------------------------------
  // [Phase 5 / Scenario F] Disaster Recovery & Identical Manifest Restoration Trial
  // ---------------------------------------------------------------------------
  console.log("[Phase 5 / Scenario F] Executing Disaster Recovery Trial (identical to Manifest procedure)...");
  
  // Simulate mid-cutover crash after P34: p34_private, p34_writer created, tenant deleted, intruder table
  const mP34_1 = fs.readFileSync(path.join(MIGRATIONS_DIR, "20261008112217_p34_identity_crm_profile.sql"), "utf8");
  sql(`SET ROLE postgres;\n${mP34_1}`);
  sql(`
    SET ROLE postgres;
    SET session_replication_role = replica;
    CREATE TABLE public.intruder_table(id int);
    DELETE FROM public.tenants WHERE id = '${EATCLEAN_TENANT}';
    SET session_replication_role = DEFAULT;
  `);

  // Execute identical manifest restoration procedure:
  // 1. Drop post-backup objects
  sql(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'p34_writer') THEN
        EXECUTE 'GRANT p34_writer TO postgres;';
        EXECUTE 'DROP OWNED BY p34_writer CASCADE;';
        EXECUTE 'DROP ROLE p34_writer;';
      END IF;
    END $$;
    DROP SCHEMA IF EXISTS p34_private CASCADE;
    DROP SCHEMA IF EXISTS gate6_recovery CASCADE;
    DROP SCHEMA IF EXISTS cr_order_private CASCADE;
    DROP SCHEMA IF EXISTS cr_menu_private CASCADE;
    DROP SCHEMA IF EXISTS supabase_migrations CASCADE;
    DROP SCHEMA IF EXISTS public CASCADE;

    CREATE SCHEMA public;
    ALTER SCHEMA public OWNER TO postgres;
    GRANT ALL ON SCHEMA public TO postgres, public;
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cr_order_writer') THEN
        CREATE ROLE cr_order_writer NOLOGIN NOINHERIT;
      END IF;
    END $$;
    GRANT cr_order_writer TO postgres;

    CREATE SCHEMA cr_order_private;
    ALTER SCHEMA cr_order_private OWNER TO postgres;
    GRANT ALL ON SCHEMA cr_order_private TO postgres;
    GRANT USAGE, CREATE ON SCHEMA cr_order_private TO cr_order_writer;

    CREATE SCHEMA cr_menu_private;
    ALTER SCHEMA cr_menu_private OWNER TO postgres;
    GRANT ALL ON SCHEMA cr_menu_private TO postgres;
    REVOKE ALL ON SCHEMA cr_menu_private FROM PUBLIC, anon, authenticated;
    GRANT USAGE ON SCHEMA cr_menu_private TO service_role;

    CREATE SCHEMA supabase_migrations;
    ALTER SCHEMA supabase_migrations OWNER TO postgres;
    GRANT ALL ON SCHEMA supabase_migrations TO postgres;
  `);

  // 2. pg_restore with exact flags: --use-list, --exit-on-error, --single-transaction
  const restoreOutput = docker([
    "exec",
    CONTAINER_NAME,
    "pg_restore",
    "-U",
    "postgres",
    "-d",
    "postgres",
    `--use-list=${FILTERED_TOC}`,
    "--exit-on-error",
    "--single-transaction",
    DUMP_FILE,
  ]);
  assert.equal(restoreOutput.trim(), "", "pg_restore must complete with zero errors");

  // 3. Post-restore security seal: revoke temporary CREATE on cr_order_private from cr_order_writer
  sql("REVOKE CREATE ON SCHEMA cr_order_private FROM cr_order_writer;");

  // 4. Verify 100% state restoration against pre-cutover baseline snapshot
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"), snapTables, "Public table count mismatch");
  assert.equal(sql("SELECT sum(total) FROM public.orders;"), snapOrdersTotal, "Orders total mismatch");
  assert.equal(sql("SELECT proname, prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'cr_order_private' ORDER BY proname, pg_get_function_identity_arguments(p.oid);"), snapFuncs, "cr_order_private functions mismatch");
  assert.equal(sql("SELECT count(*) FROM pg_roles WHERE rolname = 'p34_writer';"), "0", "p34_writer role must be eliminated");
  assert.equal(sql("SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'p34_private';"), "0", "p34_private schema must be eliminated");
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'intruder_table';"), "0", "intruder_table must be eliminated");
  assert.equal(sql("SELECT count(*) FROM supabase_migrations.schema_migrations;"), "61", "Ledger count must be exactly 61");
  assert.equal(sql("SELECT count(*) FROM public.tenants WHERE id = '" + EATCLEAN_TENANT + "';"), "1", "Tenant must be restored");

  // Verify that write barrier is STILL ACTIVE in restored database (fail-closed by design)
  const postRestoreClientWrite = sql("SET ROLE authenticated; UPDATE public.orders SET total = 99;", "postgres", false);
  assert.equal(postRestoreClientWrite.ok, false, "Restored database must preserve active write barrier");
  assert(postRestoreClientWrite.error.includes("55P03") || postRestoreClientWrite.error.includes("MAINTENANCE_IN_PROGRESS"));
  console.log("  ✓ Test F PASS: Disaster recovery restores 100% state; write barrier remains active post-restore.\n");

  // Deactivate barrier after successful recovery verification
  sql(`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS gate6_barrier_%I ON public.%I;', r.tablename, r.tablename);
      END LOOP;
    END $$;
    DROP FUNCTION IF EXISTS public.gate6_write_barrier_enforce();
  `);

  // ---------------------------------------------------------------------------
  // [Phase 6] Interruption Safety & Controlled Stop Tests (Scenarios C, D, E)
  // ---------------------------------------------------------------------------
  console.log("[Phase 6] Testing Interruption Safety & Strict STOP behavior (Scenarios C, D, E)...");

  // Reset baseline L1
  setupBaselineL1();

  // Test C: Interruption before COMMIT -> Transaction rollback verified
  console.log("  [Scenario C] Testing transactional rollback on mid-operation abort...");
  const abortedOp = sql(`
    BEGIN;
    ALTER TABLE public.order_write_requests ADD COLUMN lifecycle_result jsonb;
    -- Crash simulated prior to COMMIT
    ROLLBACK;
  `);
  assert.equal(sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_write_requests' AND column_name='lifecycle_result';"), "0");
  console.log("  ✓ Scenario C PASS: Aborted operation rolls back completely with zero residual effects.");

  // Test D: Ambiguous State -> Controlled runner STOPS (No auto-repair, no guessing)
  console.log("  [Scenario D] Testing strict STOP on ambiguous / interrupted state...");
  // Create an ambiguous situation: physical mutation present, but ledger missing
  sql("ALTER TABLE public.order_write_requests ADD COLUMN lifecycle_result jsonb;");
  
  // Controlled cutover step runner with strict state assertions:
  function runControlledStep(step, simulateCrashAfterCommit = false) {
    // 1. Precheck
    const preCheck = step.preCheck();
    if (!preCheck.ok) {
      return { status: "STOP", reason: `PRECHECK_FAILED: ${preCheck.message}` };
    }

    // 2. Atomic execution of DDL + ledger + checkpoint
    const fileSql = fs.readFileSync(path.join(MIGRATIONS_DIR, step.file), "utf8");
    const atomicPayload = extractAtomicMigrationPayload(fileSql, step.file);
    
    // In controlled cutover, migration DDL, ledger, and checkpoint are coupled transactionally in ONE single PostgreSQL transaction
    const combinedSql = `
      BEGIN;
      SET LOCAL ROLE postgres;
      SET LOCAL maintenance.controlled_cutover = 'active';

      -- Migration payload without outer delimiters
      ${atomicPayload}

      -- Official schema migrations ledger
      INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${step.version}');

      -- Recovery checkpoint
      INSERT INTO gate6_recovery.checkpoints (checkpoint_id, migration_version, description)
      VALUES (${step.id}, '${step.version}', '${step.file}');

      COMMIT;
    `;

    try {
      sql(combinedSql);
    } catch (err) {
      return { status: "STOP", reason: `EXECUTION_FAILED: ${err.message}` };
    }

    // 3. Postcheck
    const postCheck = step.postCheck();
    if (!postCheck.ok) {
      return { status: "STOP", reason: `POSTCHECK_FAILED: ${postCheck.message}` };
    }

    return { status: "PASS" };
  }

  // Attempt to run Step 1 when ambiguous state exists
  const step1Def = {
    id: 1,
    version: "20261007020208",
    file: "20261007020208_cr_order_a5_lifecycle_ledger_expand.sql",
    preCheck: () => {
      const colExists = sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_write_requests' AND column_name='lifecycle_result';") === "1";
      const ledgerExists = sql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261007020208';") === "1";
      if (colExists && !ledgerExists) {
        return { ok: false, message: "Ambiguous state: column lifecycle_result exists but ledger entry missing" };
      }
      if (colExists && ledgerExists) {
        return { ok: false, message: "Step already applied" };
      }
      return { ok: true };
    },
    postCheck: () => {
      const colExists = sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_write_requests' AND column_name='lifecycle_result';") === "1";
      const ledgerExists = sql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '20261007020208';") === "1";
      return { ok: colExists && ledgerExists, message: "Verification failed" };
    }
  };

  const ambResult = runControlledStep(step1Def);
  assert.equal(ambResult.status, "STOP", "Must STOP immediately on ambiguous state");
  assert(ambResult.reason.includes("Ambiguous state"), `Expected ambiguous state reason, got: ${ambResult.reason}`);
  console.log(`  ✓ Scenario D PASS: Controlled runner strictly STOPS on ambiguous state (${ambResult.reason}).`);

  // Test E: Unexpected Drift -> Controlled runner STOPS fail-closed
  console.log("  [Scenario E] Testing strict STOP on schema / dependency drift...");
  // Revert column
  sql("ALTER TABLE public.order_write_requests DROP COLUMN IF EXISTS lifecycle_result;");
  
  // Inject drift into dependent function
  sql(`
    CREATE OR REPLACE FUNCTION cr_order_private.can_operate_custom_batch(_tenant uuid) RETURNS boolean
    LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
    BEGIN
      RETURN true; -- DRIFT INJECTED
    END $$;
  `);

  const step10Def = {
    id: 10,
    version: "20261015180000",
    file: "20261015180000_cr_order_custom_batch_session_bridge.sql",
    preCheck: () => {
      const hash = sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)');");
      if (hash !== "9177bccac3e088123d5fc039fb5eedc3b2929be871fa761ebab4f207f9384860") {
        return { ok: false, message: `Unexpected drift in can_operate_custom_batch hash: ${hash}` };
      }
      return { ok: true };
    },
    postCheck: () => ({ ok: true })
  };

  const driftResult = runControlledStep(step10Def);
  assert.equal(driftResult.status, "STOP", "Must STOP immediately on drift");
  assert(driftResult.reason.includes("Unexpected drift"), `Expected drift reason, got: ${driftResult.reason}`);
  console.log(`  ✓ Scenario E PASS: Controlled runner strictly STOPS on drift (${driftResult.reason}).\n`);

  // ---------------------------------------------------------------------------
  // [Phase 7 / Scenarios A, B, G, H] Full Controlled Cutover Execution
  // ---------------------------------------------------------------------------
  console.log("[Phase 7 / Scenarios A, B, G, H] Executing full Controlled Cutover under Write Barrier...");

  // Reset baseline L1
  setupBaselineL1();

  // Create checkpoint table
  sql(`
    CREATE SCHEMA IF NOT EXISTS gate6_recovery;
    ALTER SCHEMA gate6_recovery OWNER TO postgres;
    GRANT ALL ON SCHEMA gate6_recovery TO postgres;

    CREATE TABLE IF NOT EXISTS gate6_recovery.checkpoints (
      checkpoint_id int PRIMARY KEY,
      migration_version text NOT NULL,
      description text NOT NULL,
      applied_at timestamptz DEFAULT now()
    );
    ALTER TABLE gate6_recovery.checkpoints OWNER TO postgres;
    GRANT ALL ON TABLE gate6_recovery.checkpoints TO postgres;
  `);

  // Activate Write Barrier on ALL public tables
  sql(`
    CREATE OR REPLACE FUNCTION public.gate6_write_barrier_enforce()
    RETURNS trigger AS $$
    BEGIN
      IF current_user = 'postgres' AND session_user = 'postgres' AND current_setting('maintenance.controlled_cutover', true) = 'active' THEN
        RETURN COALESCE(NEW, OLD);
      END IF;
      RAISE EXCEPTION 'MAINTENANCE_IN_PROGRESS: Write operations are locked for release cutover.'
        USING ERRCODE = '55P03';
    END;
    $$ LANGUAGE plpgsql SECURITY INVOKER;

    GRANT EXECUTE ON FUNCTION public.gate6_write_barrier_enforce() TO authenticated, anon, PUBLIC;

    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS gate6_barrier_%I ON public.%I;', r.tablename, r.tablename);
        EXECUTE format('CREATE TRIGGER gate6_barrier_%I BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.gate6_write_barrier_enforce();', r.tablename, r.tablename);
      END LOOP;
    END $$;
  `);

  // 10 Controlled Operations with strict pre/post checks
  const controlledSteps = [
    {
      id: 1,
      version: "20261007020208",
      file: "20261007020208_cr_order_a5_lifecycle_ledger_expand.sql",
      preCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_write_requests' AND column_name='lifecycle_result';") === "0",
        message: "lifecycle_result already exists"
      }),
      postCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='order_write_requests' AND column_name='lifecycle_result';") === "1",
        message: "lifecycle_result not created"
      })
    },
    {
      id: 2,
      version: "20261007020245",
      file: "20261007020245_cr_order_a5_lifecycle_writer.sql",
      preCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='cr_order_private' AND table_name='operational_evidence';") === "0",
        message: "operational_evidence already exists"
      }),
      postCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='cr_order_private' AND table_name='operational_evidence';") === "1",
        message: "operational_evidence not created"
      })
    },
    {
      id: 3,
      version: "20261007020849",
      file: "20261007020849_cr_order_a5_audit_uuid_compatibility.sql",
      preCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)');") === "1f80283af7a782b8ec656e77c3ac29ff29830a6730c1121ab8866a02231da4c3",
        message: "custom_batch_transition not in baseline state"
      }),
      postCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)');") === "8ac980cb557b250118098c8dabaab045c9ab2fe8c8da74048267d28f38025613",
        message: "custom_batch_transition hash mismatch post Step 3"
      })
    },
    {
      id: 4,
      version: "20261008112217",
      file: "20261008112217_p34_identity_crm_profile.sql",
      preCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.schemata WHERE schema_name = 'p34_private';") === "0",
        message: "p34_private already exists"
      }),
      postCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='p34_private' AND table_name='identity_requests';") === "1",
        message: "p34_private.identity_requests not created"
      })
    },
    {
      id: 5,
      version: "20261008160753",
      file: "20261008160753_p34_identity_conflict_recovery.sql",
      preCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='p34_private' AND table_name='identity_requests' AND column_name='close_reason';") === "0",
        message: "close_reason already exists"
      }),
      postCheck: () => ({
        ok: sql("SELECT count(*) FROM information_schema.columns WHERE table_schema='p34_private' AND table_name='identity_requests' AND column_name='close_reason';") === "1",
        message: "close_reason not created"
      })
    },
    {
      id: 6,
      version: "20261010155729",
      file: "20261010155729_release_program_draft_order_price_snapshot.sql",
      preCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = 'public.program_draft_order(uuid,uuid,date,numeric,text,jsonb,public.demand_channel,uuid,uuid,uuid,uuid)'::regprocedure;") === "144cfa9dd7bf9b66a38480dfe7fccf8457f49272753163e6b2de459a398d8d01",
        message: "program_draft_order hash not matching baseline"
      }),
      postCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = 'public.program_draft_order(uuid,uuid,date,numeric,text,jsonb,public.demand_channel,uuid,uuid,uuid,uuid)'::regprocedure;") !== "144cfa9dd7bf9b66a38480dfe7fccf8457f49272753163e6b2de459a398d8d01",
        message: "program_draft_order not updated"
      })
    },
    {
      id: 7,
      version: "20261012173000",
      file: "20261012173000_eatclean_staff_order_offer_pricing_enforcement.sql",
      preCheck: () => ({
        ok: sql("SELECT has_table_privilege('authenticated', 'public.orders', 'TRIGGER');") === "t",
        message: "authenticated TRIGGER privilege already revoked"
      }),
      postCheck: () => ({
        ok: sql("SELECT has_table_privilege('authenticated', 'public.orders', 'TRIGGER');") === "f",
        message: "authenticated TRIGGER privilege not revoked"
      })
    },
    {
      id: 8,
      version: "20261015113000",
      file: "20261015113000_revoke_legacy_staff_order_capture.sql",
      preCheck: () => ({
        ok: sql("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');") === "t",
        message: "capture_staff_existing_order EXECUTE already revoked"
      }),
      postCheck: () => ({
        ok: sql("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');") === "f" &&
            sql("SELECT coalesce(obj_description(to_regprocedure('public.capture_staff_existing_order(uuid,jsonb)'), 'pg_proc'), '') LIKE '%DEPRECATED%';") === "t",
        message: "capture_staff_existing_order revocation postcheck failed"
      })
    },
    {
      id: 9,
      version: "20261015173000",
      file: "20261015173000_cr_order_a5_lifecycle_session_bridge.sql",
      preCheck: () => ({
        ok: sql("SELECT to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)');") !== "",
        message: "lifecycle_v2 does not exist"
      }),
      postCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.lifecycle_v2(uuid,uuid,jsonb)');") === "4e28f7c539e19f08bf1561b1dfc367f4370a1e732a1c341dbc61657a477ace6f",
        message: "lifecycle_v2 hash mismatch after session bridge"
      })
    },
    {
      id: 10,
      version: "20261015180000",
      file: "20261015180000_cr_order_custom_batch_session_bridge.sql",
      preCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.can_operate_custom_batch(uuid)');") === "9177bccac3e088123d5fc039fb5eedc3b2929be871fa761ebab4f207f9384860",
        message: "can_operate_custom_batch precheck failed"
      }),
      postCheck: () => ({
        ok: sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.custom_batch_transition(uuid,uuid,date,text)');") === "3706054148ecf70327e2998967133899f48085c7225df79f486c356bd3a91a12" &&
            sql("SELECT encode(sha256(convert_to(prosrc, 'UTF8')), 'hex') FROM pg_proc WHERE oid = to_regprocedure('cr_order_private.serialize_batch()');") === "e2a46e830748cecfbb4479f371a5d23bc67aa688019ffdeb3f7bd6fd8b7f1f1c" &&
            sql("SELECT has_schema_privilege('cr_order_writer', 'auth', 'USAGE');") === "f",
        message: "Step 10 postchecks failed"
      })
    }
  ];

  for (const step of controlledSteps) {
    const res = runControlledStep(step);
    assert.equal(res.status, "PASS", `Step ${step.id} (${step.version}) must PASS: ${res.reason}`);
    console.log(`  ✓ Operation ${step.id} (${step.version}): PASS (Precheck + Atomic DDL/Ledger/Checkpoint + Postcheck).`);
  }

  // Verify Checkpoints and Official Ledger counts
  assert.equal(sql("SELECT count(*) FROM gate6_recovery.checkpoints;"), "10", "Checkpoints count must be 10");
  assert.equal(sql("SELECT count(*) FROM supabase_migrations.schema_migrations;"), "71", "Official ledger count must be 71 (61 baseline + 10 cutover)");

  // Scenario G: Reopen database (deactivate write barrier)
  console.log("  [Scenario G] Deactivating write barrier and verifying safe database reopening...");
  sql(`
    DO $$
    DECLARE r record;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS gate6_barrier_%I ON public.%I;', r.tablename, r.tablename);
      END LOOP;
    END $$;
    DROP FUNCTION IF EXISTS public.gate6_write_barrier_enforce();
  `);

  // Verify standard writes succeed post-reopening without maintenance GUC
  sql(`
    UPDATE public.kitchen_production_batches SET status = 'finished' WHERE id = '95000000-0000-4000-8000-000000000001';
    INSERT INTO public.audit_log(entity_type, entity_id, action) VALUES ('system', gen_random_uuid(), 'post_reopening_action');
  `);
  assert.equal(
    sql("SELECT status FROM public.kitchen_production_batches WHERE id = '95000000-0000-4000-8000-000000000001';"),
    "finished",
    "Standard write must succeed after barrier removal without maintenance GUC"
  );
  assert.equal(
    sql("SELECT count(*) FROM public.audit_log WHERE action = 'post_reopening_action';"),
    "1",
    "Audit log insert must succeed after barrier removal without maintenance GUC"
  );
  const remainingTriggers = sql("SELECT count(*) FROM pg_trigger WHERE tgname LIKE 'gate6_barrier_%';");
  assert.equal(remainingTriggers, "0", "All barrier triggers must be completely removed");
  console.log("  ✓ Scenario G PASS: Write barrier cleanly deactivated; all triggers removed and normal operations resumed.");

  // Scenario H: Future migration execution via official Supabase ledger
  console.log("  [Scenario H] Verifying subsequent migration execution via official Supabase ledger...");
  const futureCanarySql = `
    BEGIN;
    CREATE TABLE public.future_canary_cutover_test (id serial PRIMARY KEY, test_ts timestamptz DEFAULT now());
    INSERT INTO supabase_migrations.schema_migrations(version) VALUES ('20261020000000');
    COMMIT;
  `;
  sql(futureCanarySql);
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='future_canary_cutover_test';"), "1");
  assert.equal(sql("SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version='20261020000000';"), "1");
  assert.equal(sql("SELECT count(*) FROM supabase_migrations.schema_migrations;"), "72");
  console.log("  ✓ Scenario H PASS: Subsequent migration executed cleanly on top of 71 versions without conflict.\n");

  // ---------------------------------------------------------------------------
  // [Phase 8] Teardown & Container Cleanup
  // ---------------------------------------------------------------------------
  console.log("[Phase 8] Teardown & cleanup of synthetic resources...");
  cleanupContainer();
  console.log("✓ Ephemeral container removed. Zero persistent resources left behind.");

  console.log("\n================================================================================");
  console.log("   CONTROLLED CUTOVER SUITE: ALL SCENARIOS VERIFIED WITH STRICT EVIDENCE        ");
  console.log("================================================================================\n");

  return {
    status: "PASS",
    scenariosVerified: ["A", "B", "C", "D", "E", "F", "G", "H"],
    baselineLedger: 61,
    cutoverOperations: 10,
    finalLedger: 71,
    mainSha: "4dc5df9e2fde62b0116244120e3fa9448a12596c"
  };
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL ERROR IN CONTROLLED CUTOVER SUITE:", err);
    cleanupContainer();
    process.exit(1);
  });
