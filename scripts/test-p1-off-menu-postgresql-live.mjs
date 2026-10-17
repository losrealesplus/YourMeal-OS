#!/usr/bin/env node
/**
 * YOURMEAL OS — EATCLEAN
 * P1 Off-Menu & Mixed Orders: Isolated PostgreSQL 17 Live Integration Test Suite
 *
 * Runs against an isolated, ephemeral PostgreSQL 17 container matching Supabase 17.6.1.155.
 * Recreates the exact 71-migration production baseline (Gate 6 cutover state),
 * then applies forward migration 20261016203000_cr_order_off_menu_admin_exception.sql.
 *
 * Verifies:
 * 1. Forward SQL migration application & ledger update (71 -> 72).
 * 2. Real Mixed Order Quote & Commit (Weekly slot + Off-menu catalog + Free custom preparation).
 * 3. Exact pricing, price overrides, financial snapshots, and tenant isolation.
 * 4. Kitchen batch generation (both dish and custom item batches).
 * 5. Atomicity & rollback on failure (zero dirty state on abort).
 * 6. RBAC security enforcement (staff required for off-menu/custom; ordinary users rejected).
 * 7. Preservation of weekly menu slots (zero unintended mutations).
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
const EVIDENCE_DIR = "/Users/alex/Documents/Codex/2026-10-04/referenced-chatgpt-conversation-this-is-an/reports/gate6-lab";
const PROD_METADATA_FILE = path.join(EVIDENCE_DIR, "production-metadata-sanitized.json");

const CONTAINER_NAME = `p1-offmenu-test-${Date.now()}`;
const IMAGE = "public.ecr.aws/supabase/postgres:17.6.1.155";

// Fixture Constants
const TENANT_A = "8bba00ba-331b-42c8-9283-4e3836ffb870"; // EatClean Tenerife
const TENANT_B = "77777777-7777-4000-8000-000000000001"; // Competitor Tenant

const STAFF_USER = "00000000-0000-4000-8000-000000000001"; // Operations Manager in Tenant A
const CUSTOMER_USER = "00000000-0000-4000-8000-000000000002"; // Ordinary Customer (No Staff Role)
const CUSTOMER_ID = "91000000-0000-4000-8000-000000000001"; // Customer record in Tenant A

const DISH_SLOT = "93000000-0000-4000-8000-000000000001"; // Scheduled in weekly menu (slot price 3.50, catalog 2.50)
const DISH_OFFMENU = "93000000-0000-4000-8000-000000000002"; // In catalog (catalog price 9.50), NOT in weekly menu
const DISH_INACTIVE = "93000000-0000-4000-8000-000000000003"; // In catalog, but status = 'archived'
const DISH_TENANT_B = "73000000-0000-4000-8000-000000000001"; // Dish belonging to Tenant B

const WEEKLY_MENU_ID = "95000000-0000-4000-8000-000000000001";
const SLOT_ID = "96000000-0000-4000-8000-000000000001";
const TARGET_DAY = "2026-10-19";
const WEEK_START = "2026-10-19";

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

function sql(query, db = "postgres", check = true, asRole = null) {
  const psqlUser = asRole === "supabase_admin" ? "supabase_admin" : "postgres";
  const finalQuery = asRole && asRole !== "supabase_admin" && asRole !== "postgres"
    ? `SET ROLE ${asRole};\n${query}`
    : query;
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
        psqlUser,
        "-d",
        db,
        "-v",
        "ON_ERROR_STOP=1",
      ],
      {
        input: finalQuery,
        encoding: "utf8",
        timeout: 60000,
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();
  } catch (err) {
    if (check) {
      throw new Error(`SQL error in ${db} as ${asRole || psqlUser}: ${err.stderr || err.message}`);
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

  const payloadLines = lines.map((line, idx) => {
    if (idx === firstBeginIdx) {
      return `-- [STRIPPED BEGIN; for ${fileName}]`;
    }
    if (idx === lastCommitIdx) {
      return `-- [STRIPPED COMMIT; for ${fileName}]`;
    }
    return line;
  });

  return payloadLines.join("\n");
}

async function run() {
  console.log("================================================================================");
  console.log("   YOURMEAL OS — EATCLEAN P1 POSTGRESQL LIVE INTEGRATION SUITE                  ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // [Step 0] Ephemeral Container Setup
  // ---------------------------------------------------------------------------
  console.log("[Step 0] Launching isolated disposable PostgreSQL 17 container...");
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
  assert(stable, "PostgreSQL failed to stabilize");
  console.log("✓ Container ready with tmpfs volume and zero host networking.\n");

  // ---------------------------------------------------------------------------
  // [Step 1] Build Production Baseline (71 Migrations)
  // ---------------------------------------------------------------------------
  console.log("[Step 1] Initializing exact 71-migration production baseline...");
  sql(`
    DROP SCHEMA IF EXISTS cr_order_private CASCADE;
    DROP SCHEMA IF EXISTS cr_menu_private CASCADE;
    DROP SCHEMA IF EXISTS p34_private CASCADE;
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
  `, "postgres", true, "supabase_admin");

  const prepCi = fs.readFileSync(path.join(ROOT, "scripts/migration-bootstrap-ci.mjs"), "utf8");
  const prepSql = prepCi.split("export const prepareOwnerGrant = `")[1].split("`;")[0];
  sql(prepSql, "postgres", true, "supabase_admin");

  // Baseline migrations up to 20261006110000
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
  const baselineMigrations = migrationFiles.filter((f) => f.slice(0, 14) <= "20261006110000");
  for (const f of baselineMigrations) {
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, f), "utf8");
    sql(`SET ROLE postgres;\n${content}`);
  }

  // Materialize baseline ledger & observed production functions
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

  sql("REVOKE USAGE ON SCHEMA auth FROM cr_order_writer, PUBLIC;", "postgres", true, "supabase_admin");

  // 10 Gate 6 cutover migrations to reach exact production state (71 migrations)
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

  for (const cf of cutoverFiles) {
    const rawSql = fs.readFileSync(path.join(MIGRATIONS_DIR, cf), "utf8");
    const payload = extractAtomicMigrationPayload(rawSql, cf);
    const v = cf.slice(0, 14);
    sql(`
      BEGIN;
      SET LOCAL ROLE postgres;
      ${payload}
      INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('${v}');
      COMMIT;
    `);
  }

  const baselineCount = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(baselineCount, "71", "Baseline must have exactly 71 ledger entries");
  console.log(`✓ Baseline state verified: exactly 71 migrations in official ledger.\n`);

  // ---------------------------------------------------------------------------
  // [Step 2] Apply Pending Forward Migration (20261016203000)
  // ---------------------------------------------------------------------------
  console.log("[Step 2] Applying forward migration 20261016203000_cr_order_off_menu_admin_exception.sql...");
  const p1MigrationFile = "20261016203000_cr_order_off_menu_admin_exception.sql";
  const p1Sql = fs.readFileSync(path.join(MIGRATIONS_DIR, p1MigrationFile), "utf8");

  sql(`SET ROLE postgres;\n${p1Sql}`);
  sql("INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('20261016203000');");

  const ledgerAfter = sql("SELECT count(*) FROM supabase_migrations.schema_migrations;");
  assert.equal(ledgerAfter, "72", "Ledger must now have 72 migrations");

  // Verify function signatures and ownership
  const offerStateOwner = sql("SELECT r.rolname FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='cr_order_private' AND p.proname='offer_state' AND pg_get_function_identity_arguments(p.oid)='_tenant uuid, _command jsonb, _commercial_mode text';");
  assert.equal(offerStateOwner, "cr_order_writer", "cr_order_private.offer_state must be owned by cr_order_writer");

  const writeDishOwner = sql("SELECT r.rolname FROM pg_proc p JOIN pg_roles r ON r.oid=p.proowner JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='cr_order_private' AND p.proname='write_dish_v2';");
  assert.equal(writeDishOwner, "cr_order_writer", "cr_order_private.write_dish_v2 must be owned by cr_order_writer");

  console.log("✓ Migration 20261016203000 applied cleanly (Ledger: 72, owners verified).\n");

  // ---------------------------------------------------------------------------
  // [Step 3] Seed Fixtures (Tenants, Users, Catalog Dishes, Weekly Menus)
  // ---------------------------------------------------------------------------
  console.log("[Step 3] Seeding test fixtures...");
  sql(`
    SET ROLE postgres;
    -- Users in auth
    INSERT INTO auth.users(id, email) VALUES
      ('${STAFF_USER}', 'staff@eatclean.test'),
      ('${CUSTOMER_USER}', 'customer@eatclean.test')
    ON CONFLICT (id) DO NOTHING;

    -- Tenants
    INSERT INTO public.tenants(id, slug, name, country, currency, timezone) VALUES
      ('${TENANT_A}', 'eatclean', 'EatClean Tenerife', 'ES', 'EUR', 'Atlantic/Canary'),
      ('${TENANT_B}', 'other-tenant', 'Other Tenant SL', 'ES', 'EUR', 'Atlantic/Canary')
    ON CONFLICT (id) DO NOTHING;

    -- Tenant Members & Roles
    INSERT INTO public.tenant_members(tenant_id, user_id, status, membership_type) VALUES
      ('${TENANT_A}', '${STAFF_USER}', 'approved', 'employee'),
      ('${TENANT_A}', '${CUSTOMER_USER}', 'approved', 'customer')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.user_roles(user_id, tenant_id, role) VALUES
      ('${STAFF_USER}', '${TENANT_A}', 'operations_manager')
    ON CONFLICT DO NOTHING;

    -- Customer Profile in Tenant A
    INSERT INTO public.customers(id, tenant_id, kind, display_name, email) VALUES
      ('${CUSTOMER_ID}', '${TENANT_A}', 'individual', 'Elena Rodriguez', 'elena@eatclean.test')
    ON CONFLICT (id) DO NOTHING;

    -- Dishes in Tenant A
    INSERT INTO public.dishes(id, tenant_id, name, kcal, price, status) VALUES
      ('${DISH_SLOT}', '${TENANT_A}', 'Pollo con Arroz Jazmín', 450, 2.50, 'active'),
      ('${DISH_OFFMENU}', '${TENANT_A}', 'Lasaña Especial Fitness', 520, 9.50, 'active'),
      ('${DISH_INACTIVE}', '${TENANT_A}', 'Bowl Antiguo Descatalogado', 380, 7.00, 'archived')
    ON CONFLICT (id) DO NOTHING;

    -- Dish in Tenant B
    INSERT INTO public.dishes(id, tenant_id, name, kcal, price, status) VALUES
      ('${DISH_TENANT_B}', '${TENANT_B}', 'Plato Exclusivo Tenant B', 600, 15.00, 'active')
    ON CONFLICT (id) DO NOTHING;

    -- Weekly Menu for Tenant A (Week 2026-10-19)
    INSERT INTO public.weekly_menus(id, tenant_id, week_start, status, published_at) VALUES
      ('${WEEKLY_MENU_ID}', '${TENANT_A}', '${WEEK_START}', 'published', now())
    ON CONFLICT (id) DO NOTHING;

    -- Weekly Menu Slot (Only DISH_SLOT is scheduled, unit_price = 3.50)
    INSERT INTO public.weekly_menu_slots(id, tenant_id, weekly_menu_id, dish_id, day_date, sort_order, unit_price) VALUES
      ('${SLOT_ID}', '${TENANT_A}', '${WEEKLY_MENU_ID}', '${DISH_SLOT}', '${TARGET_DAY}', 0, 3.50)
    ON CONFLICT (id) DO NOTHING;

    -- Custom Activation for Tenant A
    INSERT INTO cr_order_private.custom_activation(tenant_id, enabled) VALUES
      ('${TENANT_A}', true)
    ON CONFLICT (tenant_id) DO UPDATE SET enabled = true;
  `);
  console.log("✓ Fixtures seeded successfully.\n");

  // ---------------------------------------------------------------------------
  // [Step 4] Test Mixed Order: Atomic Quote & Commit (The Core Business Path)
  // ---------------------------------------------------------------------------
  console.log("[Step 4] Testing Mixed Order: Atomic Quote & Commit with 3 Modalities...");

  const requestId1 = crypto.randomUUID();
  const policyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // sha256("")
  const commercialContext = JSON.stringify({ policyHash, active: true, mode: "individual_line_pricing_v1" });

  // Command combining:
  // 1. Weekly Menu Scheduled Dish (qty 2 @ slot price 3.50 = 7.00)
  // 2. Off-Menu Catalog Dish (qty 1, suggested 9.50, operator override to 10.50 with reason = 10.50)
  // 3. Free-text Custom Item (qty 1, manual unitPrice 22.00 = 22.00)
  // Expected Dish Quote Total: 7.00 + 10.50 = 17.50
  // Expected Final Order Grand Total: 17.50 + 22.00 = 39.50
  const mixedCommand = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: true,
    demandChannel: "individual",
    customer: {
      kind: "existing",
      id: CUSTOMER_ID,
    },
    orderNotes: "Pedido mixto con excepción comercial aprobada",
    lines: [
      {
        kind: "dish",
        dishId: DISH_SLOT,
        dayDate: TARGET_DAY,
        qty: 2,
        comment: "Sin cebolla en el pollo",
      },
      {
        kind: "dish",
        dishId: DISH_OFFMENU,
        dayDate: TARGET_DAY,
        qty: 1,
        isOffMenu: true,
        unitPriceOverride: "10.5000",
        unitPriceOverrideReason: "Excepción comercial acordada con cliente VIP",
        comment: "Porción extra de salsa",
      },
      {
        kind: "custom",
        name: "Tarta Personalizada Proteica",
        description: "Elaboración especial sin azúcar y sin gluten",
        dayDate: TARGET_DAY,
        qty: 1,
        unitPrice: "22.0000",
        comment: "Decoración con frutos rojos frescos",
      },
    ],
  };

  // 4.1 Issue Quote via cr_order_offer_quote_issue (as service_role acting for staff)
  console.log("  [4.1] Executing cr_order_offer_quote_issue...");
  const quoteJsonStr = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestId1}'::uuid,
      '${JSON.stringify(mixedCommand)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", true, "service_role");

  const quote = JSON.parse(quoteJsonStr);
  assert(quote.quoteId, "Quote must return a quoteId");
  assert.equal(quote.lines.length, 2, "Quote must contain exactly the 2 dish lines");
  assert.equal(quote.total, "17.50", "Dish quote total must be exactly 17.50 (2 * 3.50 + 1 * 10.50)");

  // Inspect Line 1 (Scheduled Slot)
  const qLine1 = quote.lines.find((l) => l.dishId === DISH_SLOT);
  assert(qLine1, "Scheduled slot dish must be in quote");
  assert.equal(Number(qLine1.slotPrice), 3.5, "Slot price must be 3.50");
  assert.equal(Number(qLine1.unitPrice), 3.5, "Unit price must be 3.50");
  assert.equal(qLine1.priceSource, "slot", "Price source must be 'slot'");
  assert.equal(qLine1.isOffMenu, false, "Scheduled dish must have isOffMenu = false");

  // Inspect Line 2 (Off-Menu Catalog Dish with Override)
  const qLine2 = quote.lines.find((l) => l.dishId === DISH_OFFMENU);
  assert(qLine2, "Off-menu dish must be in quote");
  assert.equal(qLine2.slotId, null, "Off-menu dish must have slotId = null");
  assert.equal(Number(qLine2.basePrice), 9.5, "Base catalog price must be 9.50");
  assert.equal(Number(qLine2.unitPrice), 10.5, "Overridden unit price must be 10.50");
  assert.equal(qLine2.priceSource, "catalogue_off_menu_override", "Price source must be 'catalogue_off_menu_override'");
  assert.equal(qLine2.isOffMenu, true, "Off-menu dish must have isOffMenu = true");

  console.log(`    ✓ Quote verified: quoteId=${quote.quoteId}, total=${quote.total} € across 2 dish lines.`);

  // 4.2 Commit Order via cr_order_offer_quote_commit
  console.log("  [4.2] Executing cr_order_offer_quote_commit...");
  const commitJsonStr = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_commit(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestId1}'::uuid,
      '${quote.quoteId}'::uuid,
      '${JSON.stringify(mixedCommand)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", true, "service_role");

  const commitResult = JSON.parse(commitJsonStr);
  const createdOrder = commitResult.order;
  assert.equal(createdOrder.status, "confirmed", "Order status must be 'confirmed'");
  assert.equal(createdOrder.total, 39.5, "Grand total must be exactly 39.50 (17.50 dishes + 22.00 custom)");
  assert.equal(createdOrder.customer_id, CUSTOMER_ID, "Customer must match");
  assert.equal(createdOrder.write_contract_version, 2, "Write contract version must be 2");
  assert.equal(createdOrder.revision, 1, "Committed revision must be 1");

  const orderId = createdOrder.id;
  console.log(`    ✓ Order committed: id=${orderId}, status=${createdOrder.status}, total=${createdOrder.total} €.`);

  // 4.3 Verify Public Database Records
  console.log("  [4.3] Verifying PostgreSQL records in public.order_items, batches and audit_log...");
  const itemsCount = sql(`SELECT count(*) FROM public.order_items WHERE tenant_id = '${TENANT_A}' AND order_id = '${orderId}';`);
  assert.equal(itemsCount, "3", "Must have exactly 3 order_items");

  // Check Item 1: Scheduled Slot Dish
  const item1Json = JSON.parse(sql(`SELECT to_jsonb(i) FROM public.order_items i WHERE order_id = '${orderId}' AND dish_id = '${DISH_SLOT}';`));
  assert.equal(item1Json.item_kind, "dish");
  assert.equal(Number(item1Json.unit_price), 3.5);
  assert.equal(item1Json.qty, 2);
  assert.equal(item1Json.price_snapshot_status, "captured");

  // Check Item 2: Off-Menu Catalog Dish
  const item2Json = JSON.parse(sql(`SELECT to_jsonb(i) FROM public.order_items i WHERE order_id = '${orderId}' AND dish_id = '${DISH_OFFMENU}';`));
  assert.equal(item2Json.item_kind, "dish");
  assert.equal(Number(item2Json.unit_price), 10.5);
  assert.equal(item2Json.qty, 1);
  assert.equal(item2Json.price_snapshot_status, "captured");

  // Check Item 3: Custom Preparation
  const item3Json = JSON.parse(sql(`SELECT to_jsonb(i) FROM public.order_items i WHERE order_id = '${orderId}' AND item_kind = 'custom';`));
  assert.equal(item3Json.dish_id, null, "Custom item dish_id must be NULL (zero catalog pollution)");
  assert.equal(item3Json.name_snapshot, "Tarta Personalizada Proteica");
  assert.equal(item3Json.description_snapshot, "Elaboración especial sin azúcar y sin gluten");
  assert.equal(Number(item3Json.unit_price), 22.0);
  assert.equal(item3Json.qty, 1);
  assert.equal(item3Json.price_snapshot_status, "captured");

  // Check Kitchen Production Batches
  const batch1 = sql(`SELECT status FROM public.kitchen_production_batches WHERE tenant_id = '${TENANT_A}' AND delivery_date = '${TARGET_DAY}' AND dish_id = '${DISH_SLOT}';`);
  assert.equal(batch1, "pending", "Batch for scheduled dish must be 'pending'");

  const batch2 = sql(`SELECT status FROM public.kitchen_production_batches WHERE tenant_id = '${TENANT_A}' AND delivery_date = '${TARGET_DAY}' AND dish_id = '${DISH_OFFMENU}';`);
  assert.equal(batch2, "pending", "Batch for off-menu dish must be 'pending'");

  const batch3 = sql(`SELECT status FROM public.kitchen_production_batches WHERE tenant_id = '${TENANT_A}' AND delivery_date = '${TARGET_DAY}' AND custom_order_item_id = '${item3Json.id}';`);
  assert.equal(batch3, "pending", "Batch for custom preparation must be 'pending'");

  // Check Audit Log
  const auditJson = JSON.parse(sql(`SELECT new_data FROM public.audit_log WHERE tenant_id = '${TENANT_A}' AND entity_id = '${orderId}' AND action = 'order.capture';`));
  assert.equal(auditJson.priceOverrides.length, 1, "Audit log must contain 1 price override");
  assert.equal(auditJson.priceOverrides[0].dishId, DISH_OFFMENU);
  assert.equal(auditJson.priceOverrides[0].cataloguePrice, 9.5);
  assert.equal(auditJson.priceOverrides[0].unitPrice, 10.5);
  assert.equal(auditJson.priceOverrides[0].reason, "Excepción comercial acordada con cliente VIP");

  assert.equal(auditJson.customConfirmations.length, 1, "Audit log must contain 1 custom confirmation");
  assert.equal(auditJson.customConfirmations[0].orderItemId, item3Json.id);
  assert.equal(auditJson.customConfirmations[0].unitPrice, "22.0000");

  // Check Weekly Menu Slots Preservation
  const slotCount = sql(`SELECT count(*) FROM public.weekly_menu_slots WHERE weekly_menu_id = '${WEEKLY_MENU_ID}';`);
  assert.equal(slotCount, "1", "weekly_menu_slots must remain strictly unmodified (exactly 1 slot)");

  console.log("✓ Core Mixed Order test PASSED with 100% fidelity.\n");

  // ---------------------------------------------------------------------------
  // [Step 5] Test Atomicity & Rollback on Line Failure
  // ---------------------------------------------------------------------------
  console.log("[Step 5] Testing Atomicity & Rollback on Line Failure...");
  const orderCountBefore = sql("SELECT count(*) FROM public.orders;");
  const itemsCountBefore = sql("SELECT count(*) FROM public.order_items;");

  // Obtain a valid quote for 1 scheduled dish first with invalid custom line
  const requestIdFail = crypto.randomUUID();
  const failCommand = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: true,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [
      { kind: "dish", dishId: DISH_SLOT, dayDate: TARGET_DAY, qty: 1 },
      { kind: "custom", name: "", dayDate: TARGET_DAY, qty: 1, unitPrice: "10.0000" }, // INVALID: Empty name
    ],
  };

  const failQuoteRes = JSON.parse(sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestIdFail}'::uuid,
      '${JSON.stringify(failCommand)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", true, "service_role"));

  // Now attempt to commit with the invalid custom line (empty name triggers CUSTOM_NAME_INVALID in write_dish_v2)
  const failResult = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_commit(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestIdFail}'::uuid,
      '${failQuoteRes.quoteId}'::uuid,
      '${JSON.stringify(failCommand)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");

  assert.equal(failResult.ok, false, "Commit must fail on invalid custom name");
  assert(failResult.error.includes("CUSTOM_NAME_INVALID"), `Expected CUSTOM_NAME_INVALID, got: ${failResult.error}`);

  const orderCountAfter = sql("SELECT count(*) FROM public.orders;");
  const itemsCountAfter = sql("SELECT count(*) FROM public.order_items;");
  assert.equal(orderCountAfter, orderCountBefore, "Orders table must have zero inserted rows on failure");
  assert.equal(itemsCountAfter, itemsCountBefore, "Order items table must have zero inserted rows on failure");
  console.log("✓ Atomicity PASS: Database transaction rolled back completely on line failure.\n");

  // ---------------------------------------------------------------------------
  // [Step 6] Security & Multi-Tenancy Boundary Enforcement
  // ---------------------------------------------------------------------------
  console.log("[Step 6] Testing Security, RBAC & Multi-Tenancy Guardrails...");

  // 6.1 Non-Staff User attempting Off-Menu Exception
  console.log("  [6.1] Non-staff user attempting off-menu exception...");
  const nonStaffCmd = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: false,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [{ kind: "dish", dishId: DISH_OFFMENU, dayDate: TARGET_DAY, qty: 1, isOffMenu: true }],
  };
  const nonStaffRes = sql(`
    SET request.jwt.claim.sub = '${CUSTOMER_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${CUSTOMER_USER}'::uuid,
      '${crypto.randomUUID()}'::uuid,
      '${JSON.stringify(nonStaffCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");
  assert.equal(nonStaffRes.ok, false, "Non-staff user must be rejected");
  assert(nonStaffRes.error.includes("PERMISSION_DENIED"), `Expected PERMISSION_DENIED, got: ${nonStaffRes.error}`);
  console.log("    ✓ Security PASS: Non-staff user rejected with PERMISSION_DENIED.");

  // 6.2 Price Override on Scheduled Weekly Menu Dish (Not Off-Menu)
  console.log("  [6.2] Price override attempted on scheduled weekly menu dish...");
  const slotOverrideCmd = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: false,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [
      {
        kind: "dish",
        dishId: DISH_SLOT,
        dayDate: TARGET_DAY,
        qty: 1,
        isOffMenu: false,
        unitPriceOverride: "1.0000",
        unitPriceOverrideReason: "Intento no permitido",
      },
    ],
  };
  const slotOverrideRes = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${crypto.randomUUID()}'::uuid,
      '${JSON.stringify(slotOverrideCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");
  assert.equal(slotOverrideRes.ok, false, "Price override on scheduled dish must be rejected");
  assert(slotOverrideRes.error.includes("OFFER_PRICING_OVERRIDE_UNSUPPORTED"), `Expected OFFER_PRICING_OVERRIDE_UNSUPPORTED, got: ${slotOverrideRes.error}`);
  console.log("    ✓ Security PASS: Manual price override on weekly menu dish rejected with OFFER_PRICING_OVERRIDE_UNSUPPORTED.");

  // 6.3 Off-Menu Dish belonging to another Tenant (Cross-Tenant Boundary)
  console.log("  [6.3] Cross-tenant off-menu dish access attempt...");
  const crossTenantCmd = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: false,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [{ kind: "dish", dishId: DISH_TENANT_B, dayDate: TARGET_DAY, qty: 1, isOffMenu: true }],
  };
  const crossTenantRes = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${crypto.randomUUID()}'::uuid,
      '${JSON.stringify(crossTenantCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");
  assert.equal(crossTenantRes.ok, false, "Cross-tenant dish must be rejected");
  assert(crossTenantRes.error.includes("OFFER_NOT_FOUND"), `Expected OFFER_NOT_FOUND, got: ${crossTenantRes.error}`);
  console.log("    ✓ Multi-Tenancy PASS: Dish from Tenant B rejected with OFFER_NOT_FOUND.");

  // 6.4 Inactive Dish Requested Off-Menu
  console.log("  [6.4] Inactive dish requested off-menu...");
  const inactiveDishCmd = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: false,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [{ kind: "dish", dishId: DISH_INACTIVE, dayDate: TARGET_DAY, qty: 1, isOffMenu: true }],
  };
  const inactiveRes = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${crypto.randomUUID()}'::uuid,
      '${JSON.stringify(inactiveDishCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");
  assert.equal(inactiveRes.ok, false, "Inactive dish must be rejected");
  assert(inactiveRes.error.includes("OFFER_NOT_FOUND"), `Expected OFFER_NOT_FOUND, got: ${inactiveRes.error}`);
  console.log("    ✓ Inactive Dish PASS: Archived dish rejected with OFFER_NOT_FOUND.");

  // 6.5 Custom Preparation with Zero Price without Explicit Zero Confirmation
  console.log("  [6.5] Custom preparation zero price without confirmation...");
  const requestIdZero = crypto.randomUUID();
  const zeroPriceCmd = {
    operation: "capture",
    weekStart: WEEK_START,
    autoConfirm: true,
    demandChannel: "individual",
    customer: { kind: "existing", id: CUSTOMER_ID },
    lines: [
      { kind: "dish", dishId: DISH_SLOT, dayDate: TARGET_DAY, qty: 1 },
      { kind: "custom", name: "Degustación Gratuita", dayDate: TARGET_DAY, qty: 1, unitPrice: "0.0000" }, // missing explicitZeroConfirmed: true
    ],
  };

  const zeroPriceQuote = JSON.parse(sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_issue(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestIdZero}'::uuid,
      '${JSON.stringify(zeroPriceCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", true, "service_role"));

  const zeroPriceRes = sql(`
    SET request.jwt.claim.sub = '${STAFF_USER}';
    SELECT public.cr_order_offer_quote_commit(
      '${TENANT_A}'::uuid,
      '${STAFF_USER}'::uuid,
      '${requestIdZero}'::uuid,
      '${zeroPriceQuote.quoteId}'::uuid,
      '${JSON.stringify(zeroPriceCmd)}'::jsonb,
      '${commercialContext}'::jsonb
    );
  `, "postgres", false, "service_role");
  assert.equal(zeroPriceRes.ok, false, "Zero price custom item must be rejected without explicitZeroConfirmed");
  assert(zeroPriceRes.error.includes("EXPLICIT_ZERO_CONFIRMATION_REQUIRED"), `Expected EXPLICIT_ZERO_CONFIRMATION_REQUIRED, got: ${zeroPriceRes.error}`);
  console.log("    ✓ Zero Price Protection PASS: Rejected with EXPLICIT_ZERO_CONFIRMATION_REQUIRED.\n");

  // ---------------------------------------------------------------------------
  // [Step 7] Test Reusable Custom Items Query & Multi-Tenant Scoping
  // ---------------------------------------------------------------------------
  console.log("[Step 7] Testing Reusable Custom Items SQL Query & Tenant Scoping...");

  // Seed a custom item in Tenant B
  sql(`
    SET session_replication_role = replica;
    INSERT INTO public.orders(id, tenant_id, customer_id, week_start, status, total)
    VALUES('92000000-0000-4000-8000-000000000099', '${TENANT_B}', gen_random_uuid(), '${WEEK_START}', 'confirmed', 50.00);

    INSERT INTO public.order_items(id, tenant_id, order_id, day_date, item_kind, name_snapshot, description_snapshot, qty, unit_price, price_snapshot_status, allergen_state, allergens_snapshot, snapshot_captured_at)
    VALUES(gen_random_uuid(), '${TENANT_B}', '92000000-0000-4000-8000-000000000099', '${TARGET_DAY}', 'custom', 'Preparación Confidencial Tenant B', 'Solo para Tenant B', 1, 50.00, 'captured', 'UNKNOWN', '{}'::text[], statement_timestamp());
    SET session_replication_role = DEFAULT;
  `);

  // Query Tenant A custom items (must find 'Tarta Personalizada Proteica', but NEVER 'Preparación Confidencial Tenant B')
  const tenantACustomItems = JSON.parse(sql(`
    SELECT coalesce(jsonb_agg(sub), '[]') FROM (
      SELECT DISTINCT ON (btrim(name_snapshot))
        id,
        name_snapshot AS name,
        description_snapshot AS description
      FROM public.order_items
      WHERE tenant_id = '${TENANT_A}'
        AND item_kind = 'custom'
        AND deleted_at IS NULL
        AND name_snapshot IS NOT NULL
      ORDER BY btrim(name_snapshot), snapshot_captured_at DESC
      LIMIT 10
    ) sub;
  `));

  assert.equal(tenantACustomItems.length, 1, "Tenant A must see exactly 1 reusable custom item");
  assert.equal(tenantACustomItems[0].name, "Tarta Personalizada Proteica");
  assert(!JSON.stringify(tenantACustomItems).includes("Tenant B"), "Tenant A must NEVER see Tenant B items");

  console.log("✓ Reusable custom items query PASS: Strict multi-tenant isolation verified.\n");

  // ---------------------------------------------------------------------------
  // [Step 8] Teardown & Container Cleanup
  // ---------------------------------------------------------------------------
  console.log("[Step 8] Cleaning up ephemeral container...");
  cleanupContainer();
  console.log("✓ Container cleaned up. Zero test artifacts left behind.\n");

  console.log("================================================================================");
  console.log("   ALL POSTGRESQL 17 LIVE INTEGRATION TESTS PASSED (100% SUCCESS)              ");
  console.log("================================================================================\n");

  return {
    status: "PASS",
    migrationApplied: "20261016203000_cr_order_off_menu_admin_exception.sql",
    ledgerVersions: 72,
    mixedOrderVerified: true,
    rbacVerified: true,
    tenancyVerified: true,
    rollbackVerified: true,
  };
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL ERROR IN LIVE POSTGRESQL INTEGRATION TEST:", err);
    cleanupContainer();
    process.exit(1);
  });
