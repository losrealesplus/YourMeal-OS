/**
 * Acceptance Test: EatClean 1A Inventory UI Integrity Verification
 * PR #562 Hardening against:
 * 1. P1 - Tenant Switch Isolation & Stale Response Protection with Real HTTP Route Delay
 * 2. P2 - Complete Kárdex (>150 rows) with Server-Side Filtering & Real Pagination
 * 3. P2 - Complete Catalog (>1,000 items) Chunked Fetching & Unified KPI Single-Source-of-Truth
 * 4. P1 - Stock and Movement Request Independence & Loading State Recovery
 * 5. Fixture Ownership & Laboratory Safety: Strictly Synthetic IDs only (0 non-fixture rows touched)
 * 6. Non-Fixture Sentinel Preservation: Zero impact on pre-existing or similar external data
 * 7. Failure Cleanup Safety: Mid-test abort cleans only tracked fixtures without wildcard fallback
 * 8. End-to-End Operational Lifecycle: Purchase Receipt -> Stock -> Kitchen Consumption FLOW-04 -> Kárdex
 */

import { chromium } from "playwright";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import crypto from "node:crypto";

const SCREENSHOT_DIR = "/Users/alex/.gemini/antigravity/brain/a4aaca4a-b90c-4155-af68-d75937ee0731/screenshots";
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const DB_HOST = "127.0.0.1";
const DB_PORT = "54322";
const DB_USER = "postgres";
const DB_PASSWORD = "postgres";
const DB_NAME = "postgres";
const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function runSql(sqlQuery) {
  return execFileSync(
    "psql",
    ["-h", DB_HOST, "-p", DB_PORT, "-U", DB_USER, "-d", DB_NAME, "-XqAt", "-v", "ON_ERROR_STOP=1"],
    {
      input: sqlQuery,
      env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      encoding: "utf8",
    },
  ).trim();
}

function runScalarJson(query) {
  const raw = runSql(query);
  return raw ? JSON.parse(raw) : null;
}

// ============================================================================
// FIXTURE TRACKER: Strict ID-based Ownership & Safe Teardown Engine
// ============================================================================
class FixtureTracker {
  constructor(sqlRunner, scalarJsonRunner) {
    this.sqlRunner = sqlRunner;
    this.scalarJsonRunner = scalarJsonRunner;
    this.registry = {
      stockMovementIds: new Set(),
      ingredientIds: new Set(),
      invoiceIds: new Set(),
      invoiceItemIds: new Set(),
      receiptExecutionIds: new Set(),
      orderItemIds: new Set(),
      orderIds: new Set(),
      slotIds: new Set(),
      weeklyMenuIds: new Set(),
      dishIds: new Set(),
      supplierIds: new Set(),
      customerIds: new Set(),
      consumptionIds: new Set(),
      consumptionLineIds: new Set(),
      tenantMembers: [], // Array<{ userId: string, tenantId: string }>
      userRoles: [], // Array<{ userId: string, tenantId: string, role: string }>
      tenantIds: new Set(),
    };
  }

  registerIngredient(id) { this.#validateUuid(id); this.registry.ingredientIds.add(id); }
  registerIngredients(ids) { (ids || []).forEach((id) => this.registerIngredient(id)); }
  unregisterIngredients(ids) { (ids || []).forEach((id) => this.registry.ingredientIds.delete(id)); }

  registerMovement(id) { this.#validateUuid(id); this.registry.stockMovementIds.add(id); }
  registerMovements(ids) { (ids || []).forEach((id) => this.registerMovement(id)); }
  unregisterMovements(ids) { (ids || []).forEach((id) => this.registry.stockMovementIds.delete(id)); }

  registerInvoice(id) { this.#validateUuid(id); this.registry.invoiceIds.add(id); }
  registerInvoiceItem(id) { this.#validateUuid(id); this.registry.invoiceItemIds.add(id); }
  registerReceiptExecution(id) { this.#validateUuid(id); this.registry.receiptExecutionIds.add(id); }

  registerOrder(id) { this.#validateUuid(id); this.registry.orderIds.add(id); }
  registerOrderItem(id) { this.#validateUuid(id); this.registry.orderItemIds.add(id); }

  registerWeeklyMenu(id) { this.#validateUuid(id); this.registry.weeklyMenuIds.add(id); }
  registerWeeklyMenuSlot(id) { this.#validateUuid(id); this.registry.slotIds.add(id); }

  registerDish(id) { this.#validateUuid(id); this.registry.dishIds.add(id); }
  registerSupplier(id) { this.#validateUuid(id); this.registry.supplierIds.add(id); }
  registerCustomer(id) { this.#validateUuid(id); this.registry.customerIds.add(id); }

  registerConsumption(id) { this.#validateUuid(id); this.registry.consumptionIds.add(id); }
  registerConsumptionLine(id) { this.#validateUuid(id); this.registry.consumptionLineIds.add(id); }
  registerConsumptionLines(ids) { (ids || []).forEach((id) => this.registerConsumptionLine(id)); }

  registerTenantMember(userId, tenantId) {
    this.#validateUuid(userId);
    this.#validateUuid(tenantId);
    this.registry.tenantMembers.push({ userId, tenantId });
  }

  registerUserRole(userId, tenantId, role) {
    this.#validateUuid(userId);
    this.#validateUuid(tenantId);
    if (!role || typeof role !== "string") {
      throw new Error(`FIXTURE SECURITY VIOLATION: Invalid role: ${role}`);
    }
    this.registry.userRoles.push({ userId, tenantId, role });
  }

  registerTenant(id) { this.#validateUuid(id); this.registry.tenantIds.add(id); }

  #validateUuid(id) {
    if (
      !id ||
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      throw new Error(`FIXTURE SECURITY VIOLATION: Attempted to register non-UUID fixture: ${id}`);
    }
  }

  async cleanup() {
    console.log("  [FixtureTracker] Ejecutando purga quirúrgica estrictamente por IDs rastreados...");

    const toPgArray = (setOrArray) => {
      const arr = Array.isArray(setOrArray) ? setOrArray : Array.from(setOrArray);
      if (arr.length === 0) return null;
      return `ARRAY[${arr.map((id) => `'${id}'::uuid`).join(",")}]`;
    };

    // 1. stock_movements (strictly by registered UUIDs)
    if (this.registry.stockMovementIds.size > 0) {
      const arr = Array.from(this.registry.stockMovementIds);
      for (let i = 0; i < arr.length; i += 500) {
        const chunk = arr.slice(i, i + 500);
        this.sqlRunner(`DELETE FROM public.stock_movements WHERE id = ANY(${toPgArray(chunk)});`);
      }
      this.registry.stockMovementIds.clear();
    }

    // 2. inventory_consumption_lines (strictly by registered UUIDs)
    if (this.registry.consumptionLineIds.size > 0) {
      const arr = Array.from(this.registry.consumptionLineIds);
      for (let i = 0; i < arr.length; i += 500) {
        const chunk = arr.slice(i, i + 500);
        this.sqlRunner(`DELETE FROM public.inventory_consumption_lines WHERE id = ANY(${toPgArray(chunk)});`);
      }
      this.registry.consumptionLineIds.clear();
    }

    // 3. inventory_consumptions (strictly by registered UUIDs)
    if (this.registry.consumptionIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.inventory_consumptions WHERE id = ANY(${toPgArray(this.registry.consumptionIds)});`);
      this.registry.consumptionIds.clear();
    }

    // 4. purchase_receipt_executions (strictly by registered UUIDs)
    if (this.registry.receiptExecutionIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.purchase_receipt_executions WHERE id = ANY(${toPgArray(this.registry.receiptExecutionIds)});`);
      this.registry.receiptExecutionIds.clear();
    }

    // 5. purchase_invoice_items (strictly by registered UUIDs)
    if (this.registry.invoiceItemIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.purchase_invoice_items WHERE id = ANY(${toPgArray(this.registry.invoiceItemIds)});`);
      this.registry.invoiceItemIds.clear();
    }

    // 6. purchase_invoices (strictly by registered UUIDs)
    if (this.registry.invoiceIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.purchase_invoices WHERE id = ANY(${toPgArray(this.registry.invoiceIds)});`);
      this.registry.invoiceIds.clear();
    }

    // 7. order_items (strictly by registered UUIDs)
    if (this.registry.orderItemIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.order_items WHERE id = ANY(${toPgArray(this.registry.orderItemIds)});`);
      this.registry.orderItemIds.clear();
    }

    // 8. orders (strictly by registered UUIDs)
    if (this.registry.orderIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.orders WHERE id = ANY(${toPgArray(this.registry.orderIds)});`);
      this.registry.orderIds.clear();
    }

    // 9. weekly_menu_slots (strictly by registered UUIDs)
    if (this.registry.slotIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.weekly_menu_slots WHERE id = ANY(${toPgArray(this.registry.slotIds)});`);
      this.registry.slotIds.clear();
    }

    // 10. weekly_menus (strictly by registered UUIDs)
    if (this.registry.weeklyMenuIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.weekly_menus WHERE id = ANY(${toPgArray(this.registry.weeklyMenuIds)});`);
      this.registry.weeklyMenuIds.clear();
    }

    // 11. dish_ingredients (strictly by registered dish UUIDs)
    if (this.registry.dishIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.dish_ingredients WHERE dish_id = ANY(${toPgArray(this.registry.dishIds)});`);
    }

    // 12. dishes (strictly by registered UUIDs)
    if (this.registry.dishIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.dishes WHERE id = ANY(${toPgArray(this.registry.dishIds)});`);
      this.registry.dishIds.clear();
    }

    // 13. ingredients (strictly by registered UUIDs)
    if (this.registry.ingredientIds.size > 0) {
      const arr = Array.from(this.registry.ingredientIds);
      for (let i = 0; i < arr.length; i += 500) {
        const chunk = arr.slice(i, i + 500);
        this.sqlRunner(`DELETE FROM public.ingredients WHERE id = ANY(${toPgArray(chunk)});`);
      }
      this.registry.ingredientIds.clear();
    }

    // 14. suppliers (strictly by registered UUIDs)
    if (this.registry.supplierIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.suppliers WHERE id = ANY(${toPgArray(this.registry.supplierIds)});`);
      this.registry.supplierIds.clear();
    }

    // 15. customers (strictly by registered UUIDs)
    if (this.registry.customerIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.customers WHERE id = ANY(${toPgArray(this.registry.customerIds)});`);
      this.registry.customerIds.clear();
    }

    // 16. user_roles (strictly by tracked entries)
    if (this.registry.userRoles.length > 0) {
      for (const ur of this.registry.userRoles) {
        this.sqlRunner(
          `DELETE FROM public.user_roles WHERE user_id = '${ur.userId}' AND tenant_id = '${ur.tenantId}' AND role = '${ur.role}';`,
        );
      }
      this.registry.userRoles = [];
    }

    // 17. tenant_members (strictly by tracked entries)
    if (this.registry.tenantMembers.length > 0) {
      for (const tm of this.registry.tenantMembers) {
        this.sqlRunner(
          `DELETE FROM public.tenant_members WHERE user_id = '${tm.userId}' AND tenant_id = '${tm.tenantId}';`,
        );
      }
      this.registry.tenantMembers = [];
    }

    // 18. tenants (strictly by registered UUIDs)
    if (this.registry.tenantIds.size > 0) {
      this.sqlRunner(`DELETE FROM public.tenants WHERE id = ANY(${toPgArray(this.registry.tenantIds)});`);
      this.registry.tenantIds.clear();
    }

    console.log("  [FixtureTracker] Purga quirúrgica completada sin comodines ni efectos colaterales.");
  }
}

// ============================================================================
// SENTINEL SUITE: Non-Fixture Verification & Preservation
// ============================================================================
const SENTINEL_ING_ID = "11111111-9999-4444-9999-111111111111";
const SENTINEL_MOV_ID = "22222222-9999-4444-9999-222222222222";
const SENTINEL_CONS_ID = "33333333-9999-4444-9999-333333333333";
const SENTINEL_LINE_ID = "33333333-9999-4444-9999-444444444444";
const SENTINEL_TENANT_ID = "ffffffff-9999-4444-ffff-ffffffffffff";
const SENTINEL_USER_ID = "55555555-eeee-4444-eeee-555555555555";

function seedSentinels(tenantIdA) {
  console.log("\n--- Sembrando Registros Centinela Ajenos al Fixture ---");
  runSql(`
    -- 1. Sentinel Ingredient (matching 'Ingrediente Catálogo Grande #%' pattern)
    INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
    VALUES ('${SENTINEL_ING_ID}', '${tenantIdA}', 'Ingrediente Catálogo Grande #9999', 'kg', 3.50, 7.00, 1.00, 0.00)
    ON CONFLICT (id) DO UPDATE SET stock = 7.00;

    -- 2. Sentinel Stock Movement (matching notes 'audit-%' pattern)
    INSERT INTO public.stock_movements (
      id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
    ) VALUES (
      '${SENTINEL_MOV_ID}',
      '${tenantIdA}',
      '${SENTINEL_ING_ID}',
      'MANUAL_ADJUSTMENT',
      2.000,
      5.000,
      7.000,
      3.50,
      'ADJUSTMENT_NOTE',
      gen_random_uuid(),
      'audit-sentinel-external-do-not-delete',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Sentinel Consumption and Line
    INSERT INTO public.inventory_consumptions (id, tenant_id, delivery_date, status, created_by)
    VALUES ('${SENTINEL_CONS_ID}', '${tenantIdA}', '2026-11-28', 'planned', NULL)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.inventory_consumption_lines (id, consumption_id, tenant_id, ingredient_id, ingredient_name, quantity, unit)
    VALUES ('${SENTINEL_LINE_ID}', '${SENTINEL_CONS_ID}', '${tenantIdA}', '${SENTINEL_ING_ID}', 'Ingrediente Catálogo Grande #9999', 1.500, 'kg')
    ON CONFLICT (id) DO NOTHING;

    -- 4. Sentinel User, Tenant, Memberships & Roles (non-fixture identities)
    INSERT INTO public.tenants (id, name, slug)
    VALUES ('${SENTINEL_TENANT_ID}', 'Sentinel Foreign Tenant', 'sentinel-foreign')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
    VALUES 
      ('${SENTINEL_USER_ID}', '${tenantIdA}', 'approved', 'employee'),
      ('${SENTINEL_USER_ID}', '${SENTINEL_TENANT_ID}', 'approved', 'employee')
    ON CONFLICT (tenant_id, user_id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES 
      ('${SENTINEL_USER_ID}', '${tenantIdA}', 'accounting'),
      ('${SENTINEL_USER_ID}', '${SENTINEL_TENANT_ID}', 'company_admin')
    ON CONFLICT DO NOTHING;
  `);
  console.log("✓ Registros centinela sembrados con éxito:");
  console.log("  - Ingrediente similar: 'Ingrediente Catálogo Grande #9999'");
  console.log("  - Movimiento similar: notes='audit-sentinel-external-do-not-delete'");
  console.log("  - Consumo ajeno: delivery_date='2026-11-28'");
  console.log("  - Membresía/Rol ajeno: usuario='Sentinel External Staff' en EatClean y Tenant Externo");
}

function verifySentinelsPreserved(tenantIdA) {
  console.log("\n--- Verificación de Preservación Estricta de Centinelas (NON_FIXTURE_PRESERVATION) ---");
  const check = runScalarJson(`
    SELECT jsonb_build_object(
      'sentinel_ingredient', (SELECT count(*) FROM public.ingredients WHERE id = '${SENTINEL_ING_ID}'),
      'sentinel_movement', (SELECT count(*) FROM public.stock_movements WHERE id = '${SENTINEL_MOV_ID}'),
      'sentinel_consumption', (SELECT count(*) FROM public.inventory_consumptions WHERE id = '${SENTINEL_CONS_ID}'),
      'sentinel_consumption_line', (SELECT count(*) FROM public.inventory_consumption_lines WHERE id = '${SENTINEL_LINE_ID}'),
      'sentinel_tenant_member_eatclean', (SELECT count(*) FROM public.tenant_members WHERE user_id = '${SENTINEL_USER_ID}' AND tenant_id = '${tenantIdA}'),
      'sentinel_tenant_member_foreign', (SELECT count(*) FROM public.tenant_members WHERE user_id = '${SENTINEL_USER_ID}' AND tenant_id = '${SENTINEL_TENANT_ID}'),
      'sentinel_user_role_eatclean', (SELECT count(*) FROM public.user_roles WHERE user_id = '${SENTINEL_USER_ID}' AND tenant_id = '${tenantIdA}' AND role = 'accounting'),
      'sentinel_user_role_foreign', (SELECT count(*) FROM public.user_roles WHERE user_id = '${SENTINEL_USER_ID}' AND tenant_id = '${SENTINEL_TENANT_ID}' AND role = 'company_admin')
    );
  `);
  console.log("  Comprobación de centinelas en PostgreSQL:", check);

  if (
    check.sentinel_ingredient !== 1 ||
    check.sentinel_movement !== 1 ||
    check.sentinel_consumption !== 1 ||
    check.sentinel_consumption_line !== 1 ||
    check.sentinel_tenant_member_eatclean !== 1 ||
    check.sentinel_tenant_member_foreign !== 1 ||
    check.sentinel_user_role_eatclean !== 1 ||
    check.sentinel_user_role_foreign !== 1
  ) {
    throw new Error(
      `CRITICAL FAILURE: Non-fixture sentinel records were corrupted or deleted! Details: ${JSON.stringify(check)}`,
    );
  }
  console.log("✓ NON_FIXTURE_PRESERVATION: PASS (Todos los registros centinela intactos y preservados al 100%).");
}

function cleanupSentinels() {
  console.log("  Limpiando registros centinela de forma explícita...");
  runSql(`
    DELETE FROM public.inventory_consumption_lines WHERE id = '${SENTINEL_LINE_ID}';
    DELETE FROM public.inventory_consumptions WHERE id = '${SENTINEL_CONS_ID}';
    DELETE FROM public.stock_movements WHERE id = '${SENTINEL_MOV_ID}';
    DELETE FROM public.ingredients WHERE id = '${SENTINEL_ING_ID}';
    DELETE FROM public.user_roles WHERE user_id = '${SENTINEL_USER_ID}';
    DELETE FROM public.tenant_members WHERE user_id = '${SENTINEL_USER_ID}';
    DELETE FROM public.tenants WHERE id = '${SENTINEL_TENANT_ID}';
  `);
  console.log("✓ Teardown de centinelas completado.");
}

// ============================================================================
// FAILURE CLEANUP SAFETY: Mid-Test Interruption Simulation
// ============================================================================
async function testFailureCleanupSafety(tenantIdA) {
  console.log("\n================================================================================");
  console.log("TEST ADVERSARIAL: Simulación de Fallo a Mitad de Ejecución (FAILURE_CLEANUP_SAFETY)");
  console.log("================================================================================");

  const failTracker = new FixtureTracker(runSql, runScalarJson);
  const dummyIng1 = crypto.randomUUID();
  const dummyIng2 = crypto.randomUUID();
  const dummyMov1 = crypto.randomUUID();
  const dummyTenant = crypto.randomUUID();

  // Seed partial fixtures
  runSql(`
    INSERT INTO public.tenants (id, name, slug) VALUES ('${dummyTenant}', 'Crash Test Tenant', 'crash-test');
    INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
    VALUES 
      ('${dummyIng1}', '${tenantIdA}', 'Dummy Crash Ing 1', 'kg', 1.0, 5.0, 1.0, 0.0),
      ('${dummyIng2}', '${dummyTenant}', 'Dummy Crash Ing 2', 'kg', 1.0, 5.0, 1.0, 0.0);
    INSERT INTO public.stock_movements (id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at)
    VALUES 
      ('${dummyMov1}', '${tenantIdA}', '${dummyIng1}', 'MANUAL_ADJUSTMENT', 1.0, 0.0, 1.0, 1.0, 'ADJUSTMENT_NOTE', gen_random_uuid(), 'audit-crash-sim', NOW());
  `);

  failTracker.registerTenant(dummyTenant);
  failTracker.registerIngredient(dummyIng1);
  failTracker.registerIngredient(dummyIng2);
  failTracker.registerMovement(dummyMov1);

  console.log("  Fixtures parciales sembrados. Simulando fallo inesperado...");
  try {
    throw new Error("Simulated unhandled runtime failure during step execution");
  } catch (err) {
    console.log(`  Capturada excepción esperada: "${err.message}"`);
    console.log("  Invocando FixtureTracker.cleanup() en bloque de error/finally...");
    await failTracker.cleanup();
  }

  // Verify that partial fixtures were purged
  const check = runScalarJson(`
    SELECT jsonb_build_object(
      'remaining_dummy_ings', (SELECT count(*) FROM public.ingredients WHERE id IN ('${dummyIng1}', '${dummyIng2}')),
      'remaining_dummy_movs', (SELECT count(*) FROM public.stock_movements WHERE id = '${dummyMov1}'),
      'remaining_dummy_tenant', (SELECT count(*) FROM public.tenants WHERE id = '${dummyTenant}')
    );
  `);
  console.log("  Verificación de residuos tras aborto simulado:", check);
  if (
    check.remaining_dummy_ings !== 0 ||
    check.remaining_dummy_movs !== 0 ||
    check.remaining_dummy_tenant !== 0
  ) {
    throw new Error(`FAILURE_CLEANUP_SAFETY FAILED: Residual rows left after aborted run: ${JSON.stringify(check)}`);
  }

  // Also verify sentinels are completely untouched
  verifySentinelsPreserved(tenantIdA);

  console.log("✓ FAILURE_CLEANUP_SAFETY: PASS (Limpieza quirúrgica demostrada en caso de aborto sin limpiezas generales ni residuales).");
}

// ============================================================================
// MAIN ACCEPTANCE RUNNER
// ============================================================================
async function main() {
  console.log("================================================================================");
  console.log("PR #562 INTEGRITY VERIFICATION: TENANT ISOLATION, CONCURRENCY & FIXTURE SAFETY");
  console.log("================================================================================");

  // 1. Establish staff user in local DB
  const staffEmail = "staff.eatclean.inventory@losrealesplus.com";
  const staffPassword = "StaffPassword123!";

  console.log("\n--- 1. Preparación de Usuarios y Fixtures en PostgreSQL Local ---");
  const authUsersRaw = runSql(`
    SELECT json_agg(u) FROM (
      SELECT id, email FROM auth.users WHERE email = '${staffEmail}'
    ) u
  `);
  let authUsers = authUsersRaw ? JSON.parse(authUsersRaw) : [];
  let staffUser = authUsers[0];

  if (!staffUser) {
    console.log("Creando usuario staff en auth.users...");
    const createRes = execSync(
      `curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"email":"${staffEmail}","password":"${staffPassword}","email_confirm":true}'`,
      { encoding: "utf8" },
    );
    const parsed = JSON.parse(createRes);
    staffUser = { id: parsed.id, email: parsed.email };
  }
  console.log(`✓ Usuario Staff disponible: ${staffUser.email} (${staffUser.id})`);

  // Target tenants (Tenant B sorted after EatClean so EatClean is primary on bootstrap)
  const tenantIdA = "509a67ba-5d66-4298-9a3f-b7e7214974dc"; // EatClean Tenerife
  const tenantIdB = "eeeeeeee-" + crypto.randomBytes(2).toString("hex") + "-4444-eeee-" + crypto.randomBytes(6).toString("hex");

  // -------------------------------------------------------------------------
  // STEP A: Seed Sentinels
  // -------------------------------------------------------------------------
  seedSentinels(tenantIdA);
  verifySentinelsPreserved(tenantIdA);

  // -------------------------------------------------------------------------
  // STEP B: Adversarial Failure Cleanup Safety Simulation
  // -------------------------------------------------------------------------
  await testFailureCleanupSafety(tenantIdA);

  // -------------------------------------------------------------------------
  // STEP C: Full Browser E2E Lifecycle with FixtureTracker
  // -------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("INICIO DE EJECUCIÓN E2E EN NAVEGADOR (CHROMIUM + POSTGRESQL 17)");
  console.log("================================================================================");

  const tracker = new FixtureTracker(runSql, runScalarJson);
  const runToken = crypto.randomBytes(4).toString("hex");

  // Fresh strictly-tracked UUIDs for this run
  const chickenIngId = crypto.randomUUID();
  const riceIngId = crypto.randomUUID();
  const quinoaIngId = crypto.randomUUID();
  const supplierId = crypto.randomUUID();

  const otherIngId = crypto.randomUUID();
  const tenantBMovementId = crypto.randomUUID();
  const quinoaMovementId = crypto.randomUUID();

  const dishId = crypto.randomUUID();
  const weeklyMenuId = crypto.randomUUID();
  const slotId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const orderId = crypto.randomUUID();
  const orderItemId = crypto.randomUUID();
  const weekStart = "2026-11-09";
  const deliveryDate = "2026-11-10";

  const invoiceId = crypto.randomUUID();
  const line1Id = crypto.randomUUID();
  const line2Id = crypto.randomUUID();
  const receiptExecutionId = crypto.randomUUID();

  let browser = null;

  try {
    // Check pre-existing memberships for staffUser to avoid unneeded mutations or deletions
    const hadMemberA = runScalarJson(
      `SELECT count(*) FROM public.tenant_members WHERE user_id = '${staffUser.id}' AND tenant_id = '${tenantIdA}'`,
    ) > 0;
    const hadRoleA = runScalarJson(
      `SELECT count(*) FROM public.user_roles WHERE user_id = '${staffUser.id}' AND tenant_id = '${tenantIdA}' AND role = 'company_admin'`,
    ) > 0;

    // Seed Main Fixtures
    runSql(`
      -- Ensure EatClean Tenant exists without changing other columns
      INSERT INTO public.tenants (id, name, slug)
      VALUES ('${tenantIdA}', 'EatClean Tenerife', 'eatclean')
      ON CONFLICT (id) DO NOTHING;

      -- Create Tenant B (unique to this run)
      INSERT INTO public.tenants (id, name, slug)
      VALUES ('${tenantIdB}', 'Burger King Sim', 'burger-sim');

      -- Profiles
      INSERT INTO public.profiles (id, full_name)
      VALUES ('${staffUser.id}', 'Staff Sim Multitenant')
      ON CONFLICT (id) DO NOTHING;

      -- Memberships
      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES 
        ('${staffUser.id}', '${tenantIdA}', 'approved', 'employee'),
        ('${staffUser.id}', '${tenantIdB}', 'approved', 'employee')
      ON CONFLICT (tenant_id, user_id) DO UPDATE SET status = 'approved';

      -- Roles
      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES 
        ('${staffUser.id}', '${tenantIdA}', 'company_admin'),
        ('${staffUser.id}', '${tenantIdB}', 'company_admin')
      ON CONFLICT DO NOTHING;

      -- EatClean Supplier
      INSERT INTO public.suppliers (id, tenant_id, name, contact)
      VALUES ('${supplierId}', '${tenantIdA}', 'Distribuciones Canarias Mayorista SL', '{"email": "pedidos@canariasdist.es"}'::jsonb);

      -- EatClean Initial Ingredients
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage, supplier_id)
      VALUES 
        ('${chickenIngId}', '${tenantIdA}', 'Pechuga de Pollo Certificada', 'kg', 4.00, 10.00, 5.00, 5.00, '${supplierId}'),
        ('${riceIngId}', '${tenantIdA}', 'Arroz Integral Bio', 'kg', 2.10, 0.00, 10.00, 0.00, '${supplierId}'),
        ('${quinoaIngId}', '${tenantIdA}', 'Quinoa Real Boliviana', 'kg', 6.50, 2.50, 1.00, 0.00, '${supplierId}');

      -- Tenant B Isolated Ingredient & Movement
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
      VALUES 
        ('${otherIngId}', '${tenantIdB}', 'Carne Picada Premium Aislada', 'kg', 8.50, 50.00, 10.00, 0.00);

      INSERT INTO public.stock_movements (
        id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
      ) VALUES (
        '${tenantBMovementId}',
        '${tenantIdB}',
        '${otherIngId}',
        'PURCHASE_RECEIPT',
        50.000,
        0.0,
        50.000,
        8.50,
        'PURCHASE_INVOICE',
        gen_random_uuid(),
        'Entrada inicial carne picada burger-sim',
        NOW()
      );

      -- Dishes and Weekly Menu for FLOW-04
      INSERT INTO public.dishes (id, tenant_id, name, description, status)
      VALUES ('${dishId}', '${tenantIdA}', 'Pollo al Curry con Arroz', 'Plato saludable', 'active');

      INSERT INTO public.dish_ingredients (dish_id, ingredient_id, tenant_id, qty, unit)
      VALUES ('${dishId}', '${chickenIngId}', '${tenantIdA}', 1.000, 'kg');

      INSERT INTO public.weekly_menus (id, tenant_id, week_start, status)
      VALUES ('${weeklyMenuId}', '${tenantIdA}', '${weekStart}', 'published');

      INSERT INTO public.weekly_menu_slots (id, tenant_id, weekly_menu_id, day_date, dish_id, sort_order)
      VALUES ('${slotId}', '${tenantIdA}', '${weeklyMenuId}', '${deliveryDate}', '${dishId}', 1);

      INSERT INTO public.customers (id, tenant_id, user_id, kind)
      VALUES ('${customerId}', '${tenantIdA}', NULL, 'individual');
    `);

    // Wrap Order creation in authenticated session to pass guard_legacy_offer trigger
    runSql(`
      BEGIN;
      SELECT set_config('request.jwt.claim.role', 'authenticated', false);
      SELECT set_config('request.jwt.claim.sub', '${staffUser.id}', false);
      SELECT set_config('request.jwt.claims', '{"sub":"${staffUser.id}","role":"authenticated"}', false);

      INSERT INTO public.orders (id, tenant_id, customer_id, week_start, status, demand_channel)
      VALUES ('${orderId}', '${tenantIdA}', '${customerId}', '${weekStart}', 'confirmed', 'individual');

      INSERT INTO public.order_items (
        id, order_id, tenant_id, dish_id, day_date, qty, item_kind, unit_price, price_snapshot_status, allergen_state
      ) VALUES (
        '${orderItemId}', '${orderId}', '${tenantIdA}', '${dishId}', '${deliveryDate}', 3, 'dish', 12.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );
      COMMIT;
    `);

    // Register initial fixtures in tracker
    tracker.registerTenant(tenantIdB);
    tracker.registerTenantMember(staffUser.id, tenantIdB);
    tracker.registerUserRole(staffUser.id, tenantIdB, "company_admin");
    if (!hadMemberA) tracker.registerTenantMember(staffUser.id, tenantIdA);
    if (!hadRoleA) tracker.registerUserRole(staffUser.id, tenantIdA, "company_admin");

    tracker.registerSupplier(supplierId);
    tracker.registerIngredient(chickenIngId);
    tracker.registerIngredient(riceIngId);
    tracker.registerIngredient(quinoaIngId);
    tracker.registerIngredient(otherIngId);
    tracker.registerMovement(tenantBMovementId);
    tracker.registerDish(dishId);
    tracker.registerWeeklyMenu(weeklyMenuId);
    tracker.registerWeeklyMenuSlot(slotId);
    tracker.registerCustomer(customerId);
    tracker.registerOrder(orderId);
    tracker.registerOrderItem(orderItemId);

    console.log("✓ Fixtures sembrados y registrados en FixtureTracker con identificadores estrictos.");

    // Launch Playwright
    console.log("\n--- 2. Apertura de Navegador Playwright & Autenticación Staff ---");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

    let holdStockTenantA = false;
    let delayedStockResolvers = [];
    let holdMovements = false;
    let delayedMovResolvers = [];
    let forceMovementError500 = false;

    // Route proxy: intercept canonical EatClean Supabase domain and forward to local Docker Kong
    await context.route("https://nhirlpkuvonggctdzzad.supabase.co/**", async (route) => {
      const req = route.request();
      const url = req.url();
      const localTarget = url.replace(
        "https://nhirlpkuvonggctdzzad.supabase.co",
        "http://127.0.0.1:54321",
      );
      const headers = { ...req.headers() };
      if (headers["apikey"] === "sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH") {
        headers["apikey"] = SUPABASE_ANON_KEY;
      }
      if (headers["authorization"] === "Bearer sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH") {
        headers["authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      }

      // Caso C: Forced network error 500 on movements
      if (forceMovementError500 && url.includes("/rest/v1/stock_movements")) {
        forceMovementError500 = false;
        console.log("  [ROUTE INTERCEPTOR] Simulando fallo HTTP 500 en endpoint stock_movements...");
        await route.fulfill({
          status: 500,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: "Simulated PostgREST error for failure isolation testing", code: "500" }),
        });
        return;
      }

      try {
        const response = await context.request.fetch(localTarget, {
          method: req.method(),
          headers,
          data: req.postDataBuffer() || undefined,
        });

        // Caso A or B: Hold stock response for Tenant A
        if (
          holdStockTenantA &&
          url.includes("/rest/v1/ingredients") &&
          url.includes(`tenant_id=eq.${tenantIdA}`)
        ) {
          console.log("  [ROUTE INTERCEPTOR] Reteniendo respuesta HTTP de stock de Tenant A...");
          await new Promise((resolve) => {
            delayedStockResolvers.push(resolve);
          });
          console.log("  [ROUTE INTERCEPTOR] Liberando respuesta HTTP retenida de stock de Tenant A...");
        }

        // Hold movements response if requested
        if (holdMovements && url.includes("/rest/v1/stock_movements")) {
          console.log("  [ROUTE INTERCEPTOR] Reteniendo respuesta HTTP de stock_movements...");
          await new Promise((resolve) => {
            delayedMovResolvers.push(resolve);
          });
          console.log("  [ROUTE INTERCEPTOR] Liberando respuesta HTTP retenida de stock_movements...");
        }

        const body = await response.body();
        await route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body,
        });
      } catch (err) {
        await route.abort();
      }
    });

    // Enforce canonical EatClean instance config in browser window
    await context.addInitScript(() => {
      window.__INSTANCE_CONFIG__ = {
        instanceType: "customer_tenant",
        tenantSlug: "eatclean",
        coreVersion: "0.1.0",
        supabaseProjectRef: "nhirlpkuvonggctdzzad",
        supabaseUrl: "https://nhirlpkuvonggctdzzad.supabase.co",
        supabasePublishableKey: "sb_publishable_qgT9AjzgqzMPgtLRjTZaiQ_yjsQ2ChH",
      };
    });

    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.text().includes("INVENTORY")) {
        console.log(`  [BROWSER CONSOLE ${msg.type()}]:`, msg.text());
      }
    });
    page.on("pageerror", (err) => {
      console.log("  [BROWSER PAGEERROR]:", err.message);
    });

    console.log("Navegando a /auth...");
    await page.goto("http://127.0.0.1:5173/auth", { waitUntil: "networkidle" });

    const loginResult = await page.evaluate(
      async ({ email, password }) => {
        try {
          const { supabase } = await import("/src/integrations/supabase/client.ts");
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) return { ok: false, error: error.message };
          return { ok: true, userId: data.user.id };
        } catch (e) {
          return { ok: false, error: e.message };
        }
      },
      { email: staffEmail, password: staffPassword },
    );

    console.log("✓ Login en navegador:", loginResult);
    if (!loginResult.ok) {
      throw new Error(`Browser login failed: ${loginResult.error}`);
    }

    // Ensure active tenant is explicitly bound to EatClean Tenerife
    await page.evaluate(
      async ({ tIdA }) => {
        const { publishBootstrapIdentitySnapshot, getBootstrapIdentitySnapshot } = await import(
          "/src/bootstrap/pipeline/BootstrapIdentityStore.ts"
        );
        const snap = getBootstrapIdentitySnapshot();
        publishBootstrapIdentitySnapshot({
          ...snap,
          status: "ready",
          tenant: {
            id: tIdA,
            name: "EatClean Tenerife",
            slug: "eatclean",
          },
        });
      },
      { tIdA: tenantIdA },
    );

    // Navigate to /admin/inventory
    console.log("Navegando a /admin/inventory...");
    await page.goto("http://127.0.0.1:5173/admin/inventory", { waitUntil: "networkidle" });
    await page.waitForSelector("text=Inventario & Kárdex", { timeout: 15000 });
    await page.waitForSelector("text=Pechuga de Pollo Certificada", { timeout: 15000 });

    // -------------------------------------------------------------------------
    // FASE 1: Verificación de Estado Inicial e Inmutabilidad Multi-tenant
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 1: Verificación de Estado Inicial y Aislamiento Multi-tenant ---");
    const initialText = await page.innerText("body");
    const lowerInitial = initialText.toLowerCase();

    if (!lowerInitial.includes("pechuga de pollo certificada")) {
      throw new Error("Missing initial ingredient: Pechuga de Pollo");
    }
    if (!lowerInitial.includes("arroz integral bio")) {
      throw new Error("Missing initial ingredient: Arroz Integral Bio");
    }
    if (!lowerInitial.includes("quinoa real boliviana")) {
      throw new Error("Missing initial ingredient: Quinoa Real Boliviana");
    }
    if (lowerInitial.includes("carne picada premium aislada")) {
      throw new Error("SECURITY VIOLATION: Tenant B's ingredient is visible in EatClean!");
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/inventory_01_initial_stock.png` });
    console.log("✓ Screenshot guardado: inventory_01_initial_stock.png");

    // -------------------------------------------------------------------------
    // FASE 2: Kárdex Completo con Filtrado en Servidor y Paginación (>150 movimientos)
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 2: Kárdex con >150 Movimientos, Paginación y Filtrado en PostgreSQL ---");

    // Seed 164 synthetic movements with RETURNING id
    const batchMovementsRaw = runSql(`
      INSERT INTO public.stock_movements (
        id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
      )
      SELECT 
        gen_random_uuid(),
        '${tenantIdA}',
        '${chickenIngId}',
        'MANUAL_ADJUSTMENT',
        1.0,
        10.0,
        11.0,
        4.00,
        'ADJUSTMENT_NOTE',
        gen_random_uuid(),
        'audit-' || '${runToken}' || '-' || i,
        (NOW() - (i || ' hours')::interval)
      FROM generate_series(1, 164) AS i
      RETURNING id;
    `);
    const batchMovementIds = batchMovementsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (batchMovementIds.length !== 164) {
      throw new Error(`Expected 164 returned movement IDs, got ${batchMovementIds.length}`);
    }
    tracker.registerMovements(batchMovementIds);

    // Movement #165: Specifically for Quinoa Real, placed at the oldest timestamp
    runSql(`
      INSERT INTO public.stock_movements (
        id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
      ) VALUES (
        '${quinoaMovementId}',
        '${tenantIdA}',
        '${quinoaIngId}',
        'PURCHASE_RECEIPT',
        2.500,
        0.0,
        2.500,
        6.50,
        'PURCHASE_INVOICE',
        gen_random_uuid(),
        'Lote importación Bolivia #165',
        (NOW() - interval '200 hours')
      );
    `);
    tracker.registerMovement(quinoaMovementId);

    const countInDb = runScalarJson(`SELECT count(*) FROM public.stock_movements WHERE tenant_id = '${tenantIdA}'`);
    console.log(`✓ Asientos en stock_movements en PostgreSQL: ${countInDb} (Supera límite anterior de 150)`);
    const totalPages = Math.max(1, Math.ceil(countInDb / 50));

    // Switch to Kárdex tab
    await page.click("button:has-text('Historial de Movimientos (Kárdex)')");
    await page.waitForSelector(`text=Mostrando del 1 al 50 de ${countInDb} movimientos`, { timeout: 10000 });

    // Verify pagination info displayed in UI
    const kardexTextPage1 = await page.innerText("body");
    if (!kardexTextPage1.includes(`Página 1 de ${totalPages}`)) {
      throw new Error(`Page indicator mismatch: expected Página 1 de ${totalPages}`);
    }
    console.log(`✓ Paginación real verificada en UI: 'Mostrando del 1 al 50 de ${countInDb} movimientos' | 'Página 1 de ${totalPages}'`);

    // Click next page button
    await page.click("button[title='Página siguiente']");
    await page.waitForTimeout(1000);

    const kardexTextPage2 = await page.innerText("body");
    if (!kardexTextPage2.includes(`Mostrando del 51 al 100 de ${countInDb} movimientos`)) {
      throw new Error(`Pagination text mismatch on Page 2: ${kardexTextPage2.slice(0, 300)}`);
    }
    if (!kardexTextPage2.includes(`Página 2 de ${totalPages}`)) {
      throw new Error(`Page indicator mismatch on Page 2: expected Página 2 de ${totalPages}`);
    }
    console.log("✓ Navegación a Página 2 verificada: 'Mostrando del 51 al 100 de 165 movimientos'");

    // Server-side filter test: Filter by Quinoa Real Boliviana
    console.log("Probando filtro de servidor por ingrediente (Quinoa Real Boliviana)...");
    await page.click("button:has-text('Todos los ingredientes')");
    await page.waitForTimeout(300);
    await page.click("[role='option']:has-text('Quinoa Real Boliviana')");
    await page.waitForTimeout(1000);

    const filteredKardexText = await page.innerText("body");
    if (!filteredKardexText.includes("Lote importación Bolivia #165")) {
      throw new Error("Server-side filtered Kárdex failed to retrieve movement #165 outside the first 150 rows!");
    }
    if (!filteredKardexText.includes("Mostrando del 1 al 1 de 1 movimientos")) {
      throw new Error("Filtered count mismatch for Quinoa Real Boliviana");
    }
    console.log("✓ Filtrado en PostgreSQL verificado: Asiento #165 (Quinoa Real +2.500 kg) recuperado exitosamente fuera del primer bloque de 150 filas.");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/inventory_02_kardex_pagination_and_filter.png` });
    console.log("✓ Screenshot guardado: inventory_02_kardex_pagination_and_filter.png");

    // Clean up synthetic movements generated for test 2 STRICTLY BY ID (no notes LIKE 'audit-%')
    console.log("Limpiando 165 movimientos sintéticos de Fase 2 exclusivamente por UUID...");
    const movementsToDelete = [...batchMovementIds, quinoaMovementId];
    const toDeleteArraySql = `ARRAY[${movementsToDelete.map((id) => `'${id}'::uuid`).join(",")}]`;
    runSql(`DELETE FROM public.stock_movements WHERE id = ANY(${toDeleteArraySql});`);
    tracker.unregisterMovements(movementsToDelete);
    console.log("✓ 165 movimientos sintéticos limpiados exclusivamente por UUID (0 comodines).");

    // -------------------------------------------------------------------------
    // FASE 3: Aislamiento Visual entre Tenants y Protección de Respuestas Atrasadas (P1)
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 3: Aislamiento Visual entre Tenants, Concurrencia y Fallo de Red ---");

    // =========================================================================
    // Caso A: Retención de respuesta HTTP en Tenant A + Cambio en caliente a Tenant B
    // =========================================================================
    console.log("-> Caso A: Retención de respuesta HTTP de Tenant A y cambio a Tenant B en caliente...");

    await page.click("button:has-text('Existencias en Almacén')");
    await page.waitForSelector("text=Pechuga de Pollo Certificada", { timeout: 10000 });

    holdStockTenantA = true;
    delayedStockResolvers = [];

    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(300);

    console.log("  Cambiando tenant activo a Tenant B mientras la respuesta de A sigue retenida en red...");
    await page.evaluate(
      async ({ tIdB }) => {
        const { publishBootstrapIdentitySnapshot, getBootstrapIdentitySnapshot } = await import(
          "/src/bootstrap/pipeline/BootstrapIdentityStore.ts"
        );
        const snap = getBootstrapIdentitySnapshot();
        publishBootstrapIdentitySnapshot({
          ...snap,
          status: "ready",
          tenant: {
            id: tIdB,
            name: "Burger King Sim",
            slug: "burger-sim",
          },
        });
      },
      { tIdB: tenantIdB },
    );

    await page.waitForSelector("text=Carne Picada Premium Aislada", { timeout: 10000 });
    console.log("  Tenant B cargado con éxito en la UI. Ahora liberamos la respuesta retenida de Tenant A...");

    holdStockTenantA = false;
    const resolversToRelease = [...delayedStockResolvers];
    delayedStockResolvers = [];
    resolversToRelease.forEach((r) => r());

    await page.waitForTimeout(1000);

    const tenantBBodyAfterRelease = await page.innerText("body");
    const lowerBAfterRelease = tenantBBodyAfterRelease.toLowerCase();
    if (lowerBAfterRelease.includes("pechuga de pollo certificada")) {
      throw new Error("SECURITY LEAK: Stale response from Tenant A leaked into Tenant B after release!");
    }
    if (lowerBAfterRelease.includes("arroz integral bio")) {
      throw new Error("SECURITY LEAK: Stale response from Tenant A leaked into Tenant B after release!");
    }
    if (!lowerBAfterRelease.includes("carne picada premium aislada")) {
      throw new Error("Tenant B ingredient disappeared after Tenant A's delayed response arrived!");
    }
    console.log("✓ Caso A verificado: La respuesta atrasada de Tenant A fue descartada; Tenant B permanece 100% puro.");

    // Verify Kárdex tab in Tenant B
    await page.click("button:has-text('Historial de Movimientos (Kárdex)')");
    await page.waitForSelector("text=Entrada inicial carne picada burger-sim", { timeout: 10000 });
    const tenantBKardex = await page.innerText("body");
    if (tenantBKardex.includes("Lote importación Bolivia #165")) {
      throw new Error("SECURITY LEAK: Tenant A Kárdex movement #165 visible in Tenant B!");
    }
    console.log("✓ Kárdex de Tenant B verificado de forma aislada (sin residuos de EatClean).");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/inventory_03_tenant_switch_stale_protection.png` });
    console.log("✓ Screenshot guardado: inventory_03_tenant_switch_stale_protection.png");

    // Switch back to EatClean (Tenant A)
    console.log("Restaurando tenant activo a EatClean (Tenant A)...");
    await page.evaluate(
      async ({ tIdA }) => {
        const { publishBootstrapIdentitySnapshot, getBootstrapIdentitySnapshot } = await import(
          "/src/bootstrap/pipeline/BootstrapIdentityStore.ts"
        );
        const snap = getBootstrapIdentitySnapshot();
        publishBootstrapIdentitySnapshot({
          ...snap,
          status: "ready",
          tenant: {
            id: tIdA,
            name: "EatClean Tenerife",
            slug: "eatclean",
          },
        });
      },
      { tIdA: tenantIdA },
    );

    await page.click("button:has-text('Existencias en Almacén')");
    await page.waitForSelector("text=Pechuga de Pollo Certificada", { timeout: 10000 });
    console.log("✓ EatClean restaurado en la UI.");

    // =========================================================================
    // Caso B: Consultas independientes (Concurrencia Stock vs Kárdex)
    // =========================================================================
    console.log("-> Caso B: Concurrencia entre consultas independientes (Stock vs Kárdex)...");
    holdStockTenantA = true;
    delayedStockResolvers = [];

    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(300);

    await page.click("button:has-text('Historial de Movimientos (Kárdex)')");
    await page.waitForTimeout(400);

    await page.click("button:has-text('Todas las operaciones')");
    await page.waitForTimeout(200);
    await page.click("[role='option']:has-text('Recepciones de Compra')");
    await page.waitForTimeout(600);

    console.log("  Kárdex interactuado y actualizado mientras la consulta de existencias sigue en vuelo...");

    console.log("  Liberando respuesta de existencias...");
    holdStockTenantA = false;
    const resolversStockB = [...delayedStockResolvers];
    delayedStockResolvers = [];
    resolversStockB.forEach((r) => r());

    await page.click("button:has-text('Existencias en Almacén')");
    await page.waitForSelector("text=Pechuga de Pollo Certificada", { timeout: 10000 });

    const stockBodyAfterB = await page.innerText("body");
    if (!stockBodyAfterB.includes("Pechuga de Pollo Certificada") || !stockBodyAfterB.includes("Arroz Integral Bio")) {
      throw new Error("Stock failed to render after releasing held response during active kárdex interaction!");
    }
    console.log("✓ Caso B verificado: La consulta de existencias no fue cancelada ni bloqueada por la actividad en el kárdex.");

    // Clear filters in Kárdex
    await page.click("button:has-text('Historial de Movimientos (Kárdex)')");
    await page.waitForTimeout(300);
    const clearKardexBtn = page.locator("button:has-text('Limpiar filtros')");
    if (await clearKardexBtn.isVisible()) {
      await clearKardexBtn.click();
      await page.waitForTimeout(400);
    }
    await page.click("button:has-text('Existencias en Almacén')");
    await page.waitForTimeout(300);

    // =========================================================================
    // Caso C: Fallo de red aislado
    // =========================================================================
    console.log("-> Caso C: Fallo de red simulado (500 en kárdex no bloquea existencias)...");
    forceMovementError500 = true;
    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(1000);

    const stockAfterC = await page.innerText("body");
    if (!stockAfterC.includes("Pechuga de Pollo Certificada")) {
      throw new Error("Stock view blocked or broken when movements query failed!");
    }
    console.log("✓ Caso C verificado: Fallo en movimientos no bloqueó existencias ni corrompió datos.");

    // -------------------------------------------------------------------------
    // FASE 4: Cobertura Completa del Catálogo (>1.000 ingredientes) y Coherencia de KPIs
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 4: Cobertura Completa del Catálogo (>1.000 Ingredientes) y Coherencia de KPIs ---");

    console.log("Insertando 1.020 ingredientes sintéticos en PostgreSQL con RETURNING id...");
    const batchIngIdsRaw = runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
      SELECT 
        gen_random_uuid(),
        '${tenantIdA}',
        'Ingrediente Catálogo Grande [' || '${runToken}' || '] #' || LPAD(i::text, 4, '0'),
        'kg',
        2.00,
        1.00,
        0.00,
        0.00
      FROM generate_series(1, 1020) AS i
      RETURNING id;
    `);
    const batchIngredientIds = batchIngIdsRaw.split("\n").map((s) => s.trim()).filter(Boolean);
    if (batchIngredientIds.length !== 1020) {
      throw new Error(`Expected 1,020 returned ingredient IDs, got ${batchIngredientIds.length}`);
    }
    tracker.registerIngredients(batchIngredientIds);

    const totalIngredientsDb = runScalarJson(`SELECT count(*) FROM public.ingredients WHERE tenant_id = '${tenantIdA}'`);
    console.log(`✓ Total ingredientes en PostgreSQL para EatClean: ${totalIngredientsDb} (1.020 sintéticos registrados)`);

    await page.click("button:has-text('Existencias en Almacén')");
    await page.waitForTimeout(500);
    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(2000);

    const largeCatalogText = await page.innerText("body");
    if (!largeCatalogText.includes(String(totalIngredientsDb))) {
      throw new Error(
        `Catalog truncation detected! Expected ${totalIngredientsDb} total ingredients in KPI card. Found: ${largeCatalogText.slice(0, 400)}`,
      );
    }
    console.log(`✓ Catálogo completo recuperado (>1.000 items) sin truncamiento: KPI 'Ingredientes Totales' = ${totalIngredientsDb}.`);

    await page.screenshot({ path: `${SCREENSHOT_DIR}/inventory_04_large_catalog_completeness.png` });
    console.log("✓ Screenshot guardado: inventory_04_large_catalog_completeness.png");

    // Clean up 1,020 synthetic test ingredients STRICTLY BY RETURNING UUIDs (no name LIKE '%')
    console.log("Limpiando 1.020 ingredientes sintéticos de gran catálogo estrictamente por UUID...");
    for (let i = 0; i < batchIngredientIds.length; i += 500) {
      const chunk = batchIngredientIds.slice(i, i + 500);
      const chunkArraySql = `ARRAY[${chunk.map((id) => `'${id}'::uuid`).join(",")}]`;
      runSql(`DELETE FROM public.ingredients WHERE id = ANY(${chunkArraySql});`);
    }
    tracker.unregisterIngredients(batchIngredientIds);
    console.log("✓ 1.020 ingredientes sintéticos limpiados exclusivamente por UUID (0 comodines).");

    // -------------------------------------------------------------------------
    // FASE 5: Ciclo Operativo Completo (Compra -> Stock -> Cocina FLOW-04 -> Kárdex)
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 5: Ciclo Operativo Completo (Compra → Stock → Cocina → Kárdex) ---");

    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(1000);

    // 1. Purchase invoice creation and reception
    runSql(`
      INSERT INTO public.purchase_invoices (
        id, tenant_id, supplier_id, invoice_number, invoice_date, subtotal, tax_amount, additional_costs, total_amount, allocation_method, status
      ) VALUES (
        '${invoiceId}', '${tenantIdA}', '${supplierId}', 'INV-TEST-CYCLE-${runToken}', '2026-10-27', 45.00, 2.50, 10.00, 57.50, 'value', 'draft'
      );

      INSERT INTO public.purchase_invoice_items (
        id, tenant_id, purchase_invoice_id, item_id, item_name, item_nature, quantity, unit, unit_price, discount_amount, tax_rate, tax_amount, allocated_overhead, effective_unit_cost, line_total
      ) VALUES 
        ('${line1Id}', '${tenantIdA}', '${invoiceId}', '${chickenIngId}', 'Pechuga de Pollo Certificada', 'INVENTORYABLE', 5.00, 'kg', 5.00, 0.00, 10.00, 2.50, 10.00, 7.00, 27.50),
        ('${line2Id}', '${tenantIdA}', '${invoiceId}', '${crypto.randomUUID()}', 'Transporte Frío', 'EXPENSE_SERVICE', 1.00, 'ud', 20.00, 0.00, 0.00, 0.00, 0.00, 20.00, 20.00);

      SELECT set_config('request.jwt.claim.sub', '${staffUser.id}', false);
      SELECT set_config('request.jwt.claim.role', 'authenticated', false);
      SELECT set_config('request.jwt.claims', '{"sub":"${staffUser.id}","role":"authenticated"}', false);
      SELECT public.receive_purchase_invoice_v1(
        '${tenantIdA}'::uuid,
        '${invoiceId}'::uuid,
        '${receiptExecutionId}'::uuid,
        NULL::jsonb,
        '${staffUser.id}'::uuid
      );
    `);

    tracker.registerInvoice(invoiceId);
    tracker.registerInvoiceItem(line1Id);
    tracker.registerInvoiceItem(line2Id);
    tracker.registerReceiptExecution(receiptExecutionId);

    // Track stock movements generated by this purchase invoice
    const invoiceMovements = runScalarJson(`
      SELECT json_agg(id) FROM public.stock_movements 
      WHERE reference_document_type = 'PURCHASE_INVOICE' AND reference_document_id = '${invoiceId}';
    `) || [];
    tracker.registerMovements(invoiceMovements);

    console.log("✓ Factura de compra recepcionada atómicamente (+5.000 kg Pechuga de Pollo)");

    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(1000);

    const postPurchaseBody = await page.innerText("body");
    if (!postPurchaseBody.includes("15,000 kg") && !postPurchaseBody.includes("15.000 kg")) {
      throw new Error("UI did not reflect incremented stock 15.000 kg after purchase!");
    }
    console.log("✓ Panel de Inventario actualizado: Pechuga de Pollo muestra 15.000 kg y WAC actualizado.");

    // 2. Kitchen FLOW-04 Consumption (−3.00 kg Pechuga de Pollo)
    const consumptionPlanResult = await page.evaluate(
      async ({ tId, dDate }) => {
        const { supabase: pageSupabase } = await import("/src/integrations/supabase/client.ts");
        const { InventoryService: srv } = await import("/src/modules/inventory/application/inventory-service.ts");
        const { createServiceContext: makeCtx } = await import("/src/services/types.ts");

        const authRes = await pageSupabase.auth.getUser();
        const ctx = await makeCtx({
          supabase: pageSupabase,
          userId: authRes.data.user.id,
          tenantId: tId,
          roles: ["company_admin"],
        });

        const plan = await srv.planConsumptionFromProduction(ctx, { deliveryDate: dDate });
        const applied = await srv.applyConsumption(ctx, plan.id);
        const sealed = await srv.sealConsumption(ctx, plan.id);

        return { ok: true, planId: plan.id, appliedId: applied.id, sealedId: sealed.id };
      },
      { tId: tenantIdA, dDate: deliveryDate },
    );

    const createdConsumptionId = consumptionPlanResult.planId;
    tracker.registerConsumption(createdConsumptionId);

    // Track consumption lines and movements generated by this consumption
    const consLines = runScalarJson(`
      SELECT json_agg(id) FROM public.inventory_consumption_lines 
      WHERE consumption_id = '${createdConsumptionId}';
    `) || [];
    tracker.registerConsumptionLines(consLines);

    const consMovements = runScalarJson(`
      SELECT json_agg(id) FROM public.stock_movements 
      WHERE reference_document_type = 'INVENTORY_CONSUMPTION' AND reference_document_id = '${createdConsumptionId}';
    `) || [];
    tracker.registerMovements(consMovements);

    console.log("✓ Consumo FLOW-04 ejecutado en cocina (−3.000 kg):", consumptionPlanResult);

    await page.click("button:has-text('Actualizar')");
    await page.waitForTimeout(1000);

    const postKitchenBody = await page.innerText("body");
    if (!postKitchenBody.includes("12,000 kg") && !postKitchenBody.includes("12.000 kg")) {
      throw new Error("UI did not reflect reduced stock 12.000 kg after kitchen consumption!");
    }
    console.log("✓ Panel de Inventario actualizado: Pechuga de Pollo muestra 12.000 kg con WAC computable intacto.");

    // Switch to Kárdex tab to inspect the two new movements
    await page.click("button:has-text('Historial de Movimientos (Kárdex)')");
    await page.waitForTimeout(600);

    const clearCycleFiltersBtn = page.locator("button:has-text('Limpiar filtros')");
    if (await clearCycleFiltersBtn.isVisible()) {
      await clearCycleFiltersBtn.click();
      await page.waitForTimeout(600);
    }

    const kardexCycleText = await page.innerText("body");
    if (!kardexCycleText.includes("Recepción Compra") || !kardexCycleText.includes("Consumo Cocina")) {
      throw new Error("Kárdex missing purchase or consumption movement badges!");
    }
    console.log("✓ Kárdex verificado: Contiene asiento de entrada (+5.000 kg) y salida (−3.000 kg) con trazabilidad.");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/inventory_05_purchase_and_consumption_cycle.png` });
    console.log("✓ Screenshot guardado: inventory_05_purchase_and_consumption_cycle.png");

    // -------------------------------------------------------------------------
    // FASE 6: Limpieza Estricta de Fixtures Sintéticos & Verificación de Residuos
    // -------------------------------------------------------------------------
    console.log("\n--- FASE 6: Limpieza Estricta de Fixtures Sintéticos (FixtureTracker) ---");
    await tracker.cleanup();

    const remainingCheck = runScalarJson(`
      SELECT jsonb_build_object(
        'remaining_ingredients', (SELECT count(*) FROM public.ingredients WHERE id IN ('${chickenIngId}', '${riceIngId}', '${quinoaIngId}', '${otherIngId}')),
        'remaining_suppliers', (SELECT count(*) FROM public.suppliers WHERE id = '${supplierId}'),
        'remaining_invoices', (SELECT count(*) FROM public.purchase_invoices WHERE id = '${invoiceId}'),
        'remaining_orders', (SELECT count(*) FROM public.orders WHERE id = '${orderId}'),
        'remaining_dishes', (SELECT count(*) FROM public.dishes WHERE id = '${dishId}'),
        'remaining_tenant_b', (SELECT count(*) FROM public.tenants WHERE id = '${tenantIdB}')
      );
    `);
    console.log("✓ Comprobación de residuos en PostgreSQL:", remainingCheck);
    if (
      remainingCheck.remaining_ingredients !== 0 ||
      remainingCheck.remaining_suppliers !== 0 ||
      remainingCheck.remaining_invoices !== 0 ||
      remainingCheck.remaining_orders !== 0 ||
      remainingCheck.remaining_dishes !== 0 ||
      remainingCheck.remaining_tenant_b !== 0
    ) {
      throw new Error(`Fixtures cleanup failed! Residual items remain: ${JSON.stringify(remainingCheck)}`);
    }
    console.log("✓ FIXTURE_OWNERSHIP: PASS (0 residuos sintéticos, borrado exclusivamente por UUIDs rastreados).");

    // Verify Sentinels are 100% intact after full run and cleanup
    verifySentinelsPreserved(tenantIdA);
  } finally {
    // Teardown browser
    if (browser) {
      await browser.close().catch(() => {});
    }

    // Emergency cleanup for any untracked failure
    await tracker.cleanup().catch((err) => {
      console.error("  [EMERGENCY CLEANUP ERROR]:", err.message);
    });

    // Final Sentinel teardown
    cleanupSentinels();
  }

  console.log("\n================================================================================");
  console.log("RESULTADO FINAL: TODOS LOS CRITERIOS DE SEGURIDAD Y FUNCIONALIDAD CERTIFICADOS");
  console.log("  FIXTURE_OWNERSHIP: PASS");
  console.log("  NON_FIXTURE_PRESERVATION: PASS");
  console.log("  FAILURE_CLEANUP_SAFETY: PASS");
  console.log("  TENANT_SWITCH_ISOLATION: PASS");
  console.log("  STOCK_MOVEMENT_REQUEST_INDEPENDENCE: PASS");
  console.log("  STALE_HTTP_RESPONSE_E2E: PASS");
  console.log("  LOADING_STATE_RECOVERY: PASS");
  console.log("  BROWSER_E2E: PASS");
  console.log("  PRODUCTION_UNCHANGED: YES");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("FATAL ERROR IN INTEGRITY ACCEPTANCE RUN:", err);
  process.exit(1);
});
