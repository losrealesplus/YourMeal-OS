#!/usr/bin/env node
/**
 * ============================================================================
 * DEPRECATED / HISTORICAL AUDIT PRESERVED ONLY
 * DO NOT USE FOR OPERATIONAL EXECUTION.
 * Superseded by: scripts/gate6-controlled-cutover-suite.mjs
 * Strategy changed from automatic heuristic recovery to Controlled Cutover.
 * ============================================================================
 *
 * GATE 6: Realistic Reconciliation Laboratory & Hardened Strategy C Validation (LEGACY)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "supabase/migrations");
const CODEX_LAB_DIR = "/Users/alex/Documents/Codex/2026-10-04/referenced-chatgpt-conversation-this-is-an/reports/gate6-lab";
const METADATA_PATH = path.join(CODEX_LAB_DIR, "production-metadata-sanitized.json");

const CONTAINER_NAME = `gate6-reconciliation-lab-${Date.now()}`;
const IMAGE = "public.ecr.aws/supabase/postgres@sha256:3866d94d8426927e8db3f1c5d790752292bfbe27b5f1f46e199ae1b7d3c1710b";
const LABEL = "gate6-reconciliation-4dc5df9e";

const EATCLEAN_TENANT = "8bba00ba-331b-42c8-9283-4e3836ffb870";
const STAFF_USER = "91000000-0000-4000-8000-000000000001";
const CUSTOMER_ID = "92000000-0000-4000-8000-000000000001";
const DISH_ID = "93000000-0000-4000-8000-000000000001";

function docker(args, input = null, check = true) {
  try {
    return execFileSync("docker", ["--context", "orbstack", ...args], {
      input,
      encoding: "utf8",
      timeout: 180000,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    if (check) {
      throw new Error(`Docker error: ${err.stderr || err.message}`);
    }
    return err.stdout || "";
  }
}

function sql(query, db = "postgres", check = true) {
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
        "supabase_admin",
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
      throw new Error(`SQL error in ${db}: ${err.stderr || err.message}`);
    }
    return { ok: false, error: err.stderr || err.message };
  }
}

function cleanupContainer() {
  try {
    docker(["rm", "-f", CONTAINER_NAME], null, false);
  } catch (_) {}
}

async function run() {
  console.log("================================================================================");
  console.log("   YOURMEAL OS — GATE 6 REALISTIC RECONCILIATION LABORATORY (POST-#531)          ");
  console.log("================================================================================\n");

  // Step 0: Verify source integrity & recovered evidence
  console.log("[Phase 0] Verifying environment & recovered evidence...");
  assert(fs.existsSync(METADATA_PATH), "production-metadata-sanitized.json must be present");
  const prodMetadata = JSON.parse(fs.readFileSync(METADATA_PATH, "utf8"));
  console.log(`✓ Recovered Codex lab metadata: ${prodMetadata.ledger.length} ledger entries up to ${prodMetadata.ledger.at(-1).version}`);
  console.log(`✓ Observed functions in production snapshot: ${prodMetadata.functions.length}`);

  // Step 1: Start isolated container
  console.log("\n[Phase 1] Launching isolated disposable PostgreSQL 17 container...");
  cleanupContainer();
  docker([
    "run",
    "-d",
    "--pull",
    "never",
    "--name",
    CONTAINER_NAME,
    "--label",
    `yourmeal.gate6=${LABEL}`,
    "--network",
    "none",
    "--memory",
    "1610612736",
    "--tmpfs",
    "/var/lib/postgresql/data:rw,size=1610612736",
    "-e",
    "POSTGRES_PASSWORD=gate6-synthetic-local-only",
    IMAGE,
  ]);

  // Wait for PG stability across potential entrypoint restarts
  let stable = false;
  let consecutive = 0;
  for (let i = 0; i < 60; i++) {
    try {
      const res = docker(
        [
          "exec",
          CONTAINER_NAME,
          "psql",
          "-X",
          "-q",
          "-t",
          "-A",
          "-U",
          "supabase_admin",
          "-d",
          "postgres",
          "-c",
          "SELECT to_regclass('auth.users') IS NOT NULL AND to_regnamespace('storage') IS NOT NULL;",
        ],
        null,
        false
      );
      if (res.trim() === "t") {
        consecutive++;
        if (consecutive >= 4) {
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
  console.log("✓ Container ready with tmpfs data volume and zero host networking.");

  // Step 2: Build historical baseline (62 migrations up to 20261006110000)
  console.log("\n[Phase 2] Bootstrapping baseline L0 to version 20261006110000...");
  sql(`
    CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(), bucket_id text, name text, owner uuid);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON storage.buckets, storage.objects TO postgres;
    GRANT USAGE, CREATE ON SCHEMA storage TO postgres;
    CREATE SCHEMA gate6_lab;
    CREATE TABLE gate6_lab.executed_files(version text PRIMARY KEY, sha256 text, executed_at timestamptz DEFAULT now());
    CREATE TABLE gate6_lab.reconciled_versions(version text PRIMARY KEY, name text, reason text, disposition text);
  `);

  // Explicit owner prerequisite for CI baseline setup
  const prepCi = fs.readFileSync(path.join(ROOT, "scripts/migration-bootstrap-ci.mjs"), "utf8");
  const prepSql = prepCi.split("export const prepareOwnerGrant = `")[1].split("`;")[0];
  sql(prepSql);

  // Apply baseline migrations
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  let baselineCount = 0;
  for (const f of migrationFiles) {
    const version = f.slice(0, 14);
    if (version > "20261006110000") break;
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    sql(`SET ROLE postgres;\n${content}`);
    sql(`INSERT INTO gate6_lab.executed_files VALUES ('${version}', '${crypto.createHash("sha256").update(content).digest("hex")}');`);
    baselineCount++;
  }
  console.log(`✓ Applied ${baselineCount} historical migrations up to 20261006110000.`);

  // Step 3: Reproduce exact L1 observed production state
  console.log("\n[Phase 3] Constructing realistic L1 Shadow from observed production metadata...");
  // Drop customer_quality_dismissals (observed absent in production)
  sql("DROP TABLE IF EXISTS public.customer_quality_dismissals;");

  // Materialize observed production functions with exact hashes, owners, and ACLs
  const funcs = prodMetadata.functions.slice().sort((a, b) =>
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

  // Set observed production authorities:
  // 1. cr_order_writer has NO USAGE on schema auth
  sql("REVOKE USAGE ON SCHEMA auth FROM cr_order_writer;");
  // 2. Excess TRIGGER, TRUNCATE privileges observed in production on orders & order_items
  sql("SET ROLE postgres; GRANT TRIGGER, TRUNCATE ON public.orders, public.order_items TO anon, authenticated;");
  // 3. Record observed production ledger reference table (NOT as executed migrations)
  sql(`
    CREATE TABLE gate6_lab.production_ledger_reference(version text, name text);
    INSERT INTO gate6_lab.production_ledger_reference
    SELECT x->>'version', x->>'name' FROM jsonb_array_elements($$${JSON.stringify(prodMetadata.ledger)}$$::jsonb) x;
  `);

  // Verify L1 Shadow matches observed production metadata
  console.log("  Verifying L1 Shadow cryptographic signatures against observed production snapshot:");
  for (const f of funcs) {
    const prosrcHash = sql(`
      SELECT encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex')
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = '${f.schema}' AND p.proname = '${f.name}';
    `);
    assert(
      prosrcHash.includes(f.source_sha256),
      `Hash mismatch for observed function ${f.name}: got ${prosrcHash}, expected ${f.source_sha256}`
    );
  }
  const initialWriterUsage = sql("SELECT has_schema_privilege('cr_order_writer', 'auth', 'USAGE');");
  assert.equal(initialWriterUsage, "f", "L1 Shadow must NOT have auth schema USAGE for cr_order_writer");
  const initialLegacyPriv = sql("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');");
  assert.equal(initialLegacyPriv, "f", "L1 Shadow must reflect legacy RPC already revoked");
  const initialTriggerPriv = sql("SELECT has_table_privilege('authenticated', 'public.orders', 'TRIGGER');");
  assert.equal(initialTriggerPriv, "t", "L1 Shadow must reproduce observed excess TRIGGER privilege prior to hardening");
  console.log("✓ L1 Shadow confirmed: exact reproduction of observed production definitions, owners, and ACLs.");

  // Seed baseline tenant and menu fixtures (EatClean tenant 8bba00ba-331b-42c8-9283-4e3836ffb870 exists in production)
  console.log("  Seeding baseline EatClean tenant and menu fixtures...");
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
  `);

  // Step 4: Execute Hardened Strategy C on L1 Shadow
  console.log("\n[Phase 4] Executing Hardened Strategy C on L1 Shadow...");

  const pendingMigrations = migrationFiles.filter((f) => f.slice(0, 14) > "20261006110000");
  assert.equal(pendingMigrations.length, 12, "Exactly 12 pending migrations expected");

  console.log("  12 Pending Migration Dispositions:");
  const executedOrder = [];
  const reconciledOmitted = [];

  for (const f of pendingMigrations) {
    const v = f.slice(0, 14);

    if (v === "20261010155728") {
      // release_cr_order_writer_auth_usage.sql
      // Superseded by A5 session_uid_bridge architecture in PR #531
      reconciledOmitted.push({
        version: v,
        file: f,
        disposition: "RECONCILED/SUPERSEDED",
        rationale: "Unexecutable by postgres (auth schema owned by supabase_admin); rendered moot by PR #531 session_uid_bridge",
      });
      console.log(`  - [${v}] ${f} -> RECONCILED/SUPERSEDED (No USAGE auth needed under session_uid_bridge)`);
      continue;
    }

    if (v === "20261011163814") {
      // staff_existing_order_atomic_capture.sql
      // Pre-materialized in production & already revoked by PR #530 / runbook
      reconciledOmitted.push({
        version: v,
        file: f,
        disposition: "RECONCILED/PRE_MATERIALIZED",
        rationale: "Function already materialized in production; re-running would collision 42723 and re-grant EXECUTE to authenticated",
      });
      console.log(`  - [${v}] ${f} -> RECONCILED/PRE_MATERIALIZED (Pre-existing in production, revoked by PR #530)`);
      continue;
    }

    if (v === "20261011190421") {
      // eatclean_private_session_identity_bridge.sql
      // Pre-materialized in production
      reconciledOmitted.push({
        version: v,
        file: f,
        disposition: "RECONCILED/PRE_MATERIALIZED",
        rationale: "session_uid_bridge, actor, can_operate_custom_batch, guard_legacy_offer already present with approved hashes",
      });
      console.log(`  - [${v}] ${f} -> RECONCILED/PRE_MATERIALIZED (Bridge & guards already present with canonical hashes)`);
      continue;
    }

    // Genuinely execute forward-only migration
    console.log(`  - [${v}] ${f} -> EXECUTING FORWARD-ONLY...`);
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    sql(`SET ROLE postgres;\n${content}`);
    sql(`INSERT INTO gate6_lab.executed_files VALUES ('${v}', '${crypto.createHash("sha256").update(content).digest("hex")}');`);
    executedOrder.push({ version: v, file: f });
  }

  // Record reconciled versions in dedicated reconciliation table
  for (const r of reconciledOmitted) {
    sql(`
      INSERT INTO gate6_lab.reconciled_versions VALUES ('${r.version}', '${r.file}', '${r.rationale}', '${r.disposition}');
    `);
  }

  console.log(`✓ Genuinely executed: ${executedOrder.length} migrations.`);
  console.log(`✓ Reconciled without false execution: ${reconciledOmitted.length} migrations.`);

  // Step 5: Verify post-reconciliation security invariants
  console.log("\n[Phase 5] Verifying post-reconciliation security invariants & privilege hardening...");

  // 1. TRIGGER and TRUNCATE must be revoked from anon and authenticated
  const ordersTrigger = sql("SELECT has_table_privilege('authenticated', 'public.orders', 'TRIGGER');");
  const ordersTruncate = sql("SELECT has_table_privilege('authenticated', 'public.orders', 'TRUNCATE');");
  const itemsTrigger = sql("SELECT has_table_privilege('anon', 'public.order_items', 'TRIGGER');");
  const itemsTruncate = sql("SELECT has_table_privilege('anon', 'public.order_items', 'TRUNCATE');");
  assert.equal(ordersTrigger, "f", "TRIGGER on orders must be revoked");
  assert.equal(ordersTruncate, "f", "TRUNCATE on orders must be revoked");
  assert.equal(itemsTrigger, "f", "TRIGGER on order_items must be revoked");
  assert.equal(itemsTruncate, "f", "TRUNCATE on order_items must be revoked");
  console.log("  ✓ Privilege hardening verified: TRIGGER and TRUNCATE revoked from anon and authenticated.");

  // 2. Legacy RPC strictly closed
  const legacyPrivAuth = sql("SELECT has_function_privilege('authenticated', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');");
  const legacyPrivAnon = sql("SELECT has_function_privilege('anon', 'public.capture_staff_existing_order(uuid,jsonb)', 'EXECUTE');");
  assert.equal(legacyPrivAuth, "f", "Legacy RPC must NOT have EXECUTE for authenticated");
  assert.equal(legacyPrivAnon, "f", "Legacy RPC must NOT have EXECUTE for anon");
  console.log("  ✓ Legacy RPC boundary verified: capture_staff_existing_order sealed.");

  // 3. cr_order_writer has NO USAGE on schema auth
  const writerAuth = sql("SELECT has_schema_privilege('cr_order_writer', 'auth', 'USAGE');");
  assert.equal(writerAuth, "f", "cr_order_writer must NOT have USAGE on schema auth");
  console.log("  ✓ Architectural separation verified: cr_order_writer does NOT possess auth schema USAGE.");

  // 4. lifecycle_v2 has replacement hash & proper owner/secdef
  const lifecycleHash = sql(`
    SELECT encode(sha256(convert_to(p.prosrc, 'UTF8')), 'hex')
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cr_order_private' AND p.proname = 'lifecycle_v2';
  `);
  assert.equal(
    lifecycleHash,
    "4e28f7c539e19f08bf1561b1dfc367f4370a1e732a1c341dbc61657a477ace6f",
    "lifecycle_v2 must possess replacement hash from PR #531"
  );
  const lifecycleOwner = sql(`
    SELECT pg_get_userbyid(p.proowner)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'cr_order_private' AND p.proname = 'lifecycle_v2';
  `);
  assert.equal(lifecycleOwner, "cr_order_writer", "lifecycle_v2 owner must be cr_order_writer");
  console.log("  ✓ A5 lifecycle bridge verified: lifecycle_v2 is active under replacement hash 4e28f7c5...");

  // Step 6: Validate T19 (Repeatability of reconciliation procedure & fail-closed protection)
  console.log("\n[Phase 6] Validating T19 (Reconciliation repeatability & idempotency)...");
  // 1. Re-running the hardening & revocation runbook must be strictly idempotent
  const revokeRunbook = fs.readFileSync(path.join(ROOT, "scripts/release/revoke-eatclean-legacy-staff-existing-order.sql"), "utf8");
  sql(`SET ROLE postgres;\n${revokeRunbook}`);
  sql(`SET ROLE postgres;\n${revokeRunbook}`);
  console.log("  ✓ Revocation runbook executed twice: strictly idempotent.");

  // 2. Re-running migration 20261015173000 on already-migrated state must fail-closed safely
  const a5MigrationSql = fs.readFileSync(path.join(MIGRATIONS_DIR, "20261015173000_cr_order_a5_lifecycle_session_bridge.sql"), "utf8");
  const doubleRunResult = sql(`SET ROLE postgres;\n${a5MigrationSql}`, "postgres", false);
  assert.equal(doubleRunResult.ok, false, "Double application of migration must fail-closed on hash drift");
  assert(doubleRunResult.error.includes("source hash drift"), "Must specifically catch baseline hash drift");
  console.log("  ✓ Anti-drift protection verified: second execution safely aborted fail-closed without side effects.");

  // Step 7: Functional A5 Order Lifecycle & E2E Validation on Reconciled L1
  console.log("\n[Phase 7] Executing Functional Order Lifecycle (Draft -> Quote -> Confirm) on Reconciled L1...");

  // Seed minimal test fixtures
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
  `);

  // Issue commercial quote
  const requestId = crypto.randomUUID();
  const quoteCommand = {
    operation: "capture",
    customer: { kind: "existing", id: CUSTOMER_ID },
    weekStart: "2026-10-19",
    autoConfirm: false,
    demandChannel: "individual",
    lines: [{ kind: "dish", dishId: DISH_ID, dayDate: "2026-10-19", qty: 1 }],
  };
  const commercialContext = {
    active: true,
    mode: "individual_line_pricing_v1",
    policyHash: "a".repeat(64),
  };

  const quoteRaw = sql(`
    SET ROLE service_role;
    SELECT public.cr_order_offer_quote_issue(
      '${EATCLEAN_TENANT}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestId}'::uuid,
      $$${JSON.stringify(quoteCommand)}$$::jsonb,
      $$${JSON.stringify(commercialContext)}$$::jsonb
    );
  `);
  const quote = JSON.parse(quoteRaw);
  assert.equal(quote.total, "3.50", "Quoted price must be 3.50 € from weekly menu slot");
  console.log(`  ✓ Canonical V2 Quote issued: quoteId=${quote.quoteId}, total=3.50 €`);

  // Commit order draft
  const commitRaw = sql(`
    SET ROLE service_role;
    SELECT public.cr_order_offer_quote_commit(
      '${EATCLEAN_TENANT}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestId}'::uuid,
      '${quote.quoteId}'::uuid,
      $$${JSON.stringify(quoteCommand)}$$::jsonb,
      $$${JSON.stringify(commercialContext)}$$::jsonb
    );
  `);
  const commit = JSON.parse(commitRaw);
  const orderId = commit.order.id;
  assert.equal(commit.order.status, "draft", "Initial committed order must be in draft");
  assert.equal(commit.order.write_contract_version, 2, "write_contract_version must be 2");
  console.log(`  ✓ Canonical V2 Commit executed: orderId=${orderId}, status=draft, revision=${commit.committedRevision}`);

  // Transition order from draft -> confirmed via A5 lifecycle_v2
  const lifecycleCommand = {
    schemaVersion: 1,
    orderId: orderId,
    action: "confirm",
    fromState: "draft",
    expectedRevision: commit.committedRevision,
  };
  const lifecycleRequestId = crypto.randomUUID();

  console.log("  Executing cr_order_lifecycle_v2 transition (draft -> confirmed) under authenticated session...");
  const lifecycleRaw = sql(`
    BEGIN;
    SET LOCAL ROLE authenticated;
    DO $$ BEGIN PERFORM set_config('request.jwt.claim.sub', '${STAFF_USER}', true); END $$;
    SELECT public.cr_order_lifecycle_v2(
      '${EATCLEAN_TENANT}'::uuid,
      '${lifecycleRequestId}'::uuid,
      $$${JSON.stringify(lifecycleCommand)}$$::jsonb
    );
    COMMIT;
  `);
  const jsonLine = lifecycleRaw.split("\n").map(l => l.trim()).find(l => l.startsWith("{"));
  const lifecycleResult = JSON.parse(jsonLine || lifecycleRaw);
  assert.equal(lifecycleResult.outcome, "COMMITTED", "Lifecycle transition outcome must be COMMITTED");
  assert.equal(lifecycleResult.toState, "confirmed", "Lifecycle transition toState must be confirmed");
  assert.equal(lifecycleResult.committedRevision, 2, "Committed revision must increment to 2");
  console.log("  ✓ A5 Lifecycle transition SUCCEEDED without 'permission denied for schema auth'!");

  // Verify order in database
  const orderRow = sql(`
    SELECT status, revision, write_contract_version, total
    FROM public.orders WHERE id = '${orderId}';
  `);
  assert.equal(orderRow, "confirmed|2|2|3.50", "Database order row must be confirmed, rev 2, contract v2, total 3.50");
  console.log("  ✓ Database assertion verified: order is persisted as confirmed with revision 2.");

  // Verify kitchen queue visibility
  const kitchenRows = sql(`
    SELECT o.id, o.status, i.day_date, i.dish_id, i.unit_price
    FROM public.orders o
    JOIN public.order_items i ON i.order_id = o.id AND i.tenant_id = o.tenant_id
    WHERE o.tenant_id = '${EATCLEAN_TENANT}'
      AND o.id = '${orderId}'
      AND o.status::text IN ('confirmed', 'in_production', 'prepared')
      AND i.deleted_at IS NULL;
  `);
  assert(kitchenRows.includes(orderId), "Order must be visible in kitchen queue query");
  console.log(`  ✓ Kitchen queue visibility verified: ${kitchenRows}`);

  // Step 8: Clean up synthetic container
  console.log("\n[Phase 8] Teardown & cleanup of synthetic resources...");
  cleanupContainer();
  console.log("✓ Container removed. No persistent resources left behind.");

  console.log("\n================================================================================");
  console.log("   GATE 6 RECONCILIATION LABORATORY COMPLETED: ALL PHASES PASS                  ");
  console.log("================================================================================\n");

  return {
    mainSha: "4dc5df9e2fde62b0116244120e3fa9448a12596c",
    reconciliationStrategy: "Hardened Strategy C (Forward-only with verified supersession/pre-materialization)",
    dispositions: {
      genuinelyApplied: executedOrder,
      reconciledOmitted: reconciledOmitted,
    },
  };
}

run()
  .then((res) => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("FATAL ERROR IN GATE 6 LAB:", err);
    cleanupContainer();
    process.exit(1);
  });
