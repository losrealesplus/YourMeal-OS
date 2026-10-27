/**
 * Acceptance Test: EatClean 1A Kitchen FLOW-04 UI Verification
 *
 * Verifies:
 * 1. UI Integration in /admin/kitchen-execution with delivery date sync.
 * 2. T1 Human Action: Plan consumption from production without stock mutation.
 * 3. Session Recovery: Page reload recovers persisted plan without losing state.
 * 4. Insufficient Stock Warning & Protection: Rejects T2 if stock insufficient.
 * 5. T2 Human Action: Single Apply decrements stock exactly once with confirmation.
 * 6. FLOW04-I2 Idempotence: No double-decrement on subsequent calls/clicks.
 * 7. T3 Human Action: Seal consumption as terminal state without stock mutation.
 * 8. Direct Link to Kárdex: Navigates to /admin/inventory with movement records.
 * 9. RBAC: kitchen-only users get read-only notice; requires inventory.operate for actions.
 * 10. Multi-tenant Isolation: Switching tenants clears context immediately.
 * 11. Laboratory Safety: 100% synthetic UUID fixtures with strict teardown; sentinels preserved.
 */

import { chromium } from "playwright";
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import crypto from "node:crypto";

const SCREENSHOT_DIR =
  "/Users/alex/.gemini/antigravity/brain/a4aaca4a-b90c-4155-af68-d75937ee0731/screenshots";
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
      orderItemIds: new Set(),
      orderIds: new Set(),
      slotIds: new Set(),
      weeklyMenuIds: new Set(),
      dishIds: new Set(),
      customerIds: new Set(),
      consumptionIds: new Set(),
      consumptionLineIds: new Set(),
      tenantMembers: [], // Array<{ userId: string, tenantId: string }>
      userRoles: [], // Array<{ userId: string, tenantId: string, role: string }>
      tenantIds: new Set(),
      authUsers: new Set(),
    };
  }

  registerIngredient(id) {
    this.#validateUuid(id);
    this.registry.ingredientIds.add(id);
  }
  registerMovement(id) {
    this.#validateUuid(id);
    this.registry.stockMovementIds.add(id);
  }
  registerOrder(id) {
    this.#validateUuid(id);
    this.registry.orderIds.add(id);
  }
  registerOrderItem(id) {
    this.#validateUuid(id);
    this.registry.orderItemIds.add(id);
  }
  registerWeeklyMenu(id) {
    this.#validateUuid(id);
    this.registry.weeklyMenuIds.add(id);
  }
  registerWeeklyMenuSlot(id) {
    this.#validateUuid(id);
    this.registry.slotIds.add(id);
  }
  registerDish(id) {
    this.#validateUuid(id);
    this.registry.dishIds.add(id);
  }
  registerCustomer(id) {
    this.#validateUuid(id);
    this.registry.customerIds.add(id);
  }
  registerConsumption(id) {
    this.#validateUuid(id);
    this.registry.consumptionIds.add(id);
  }
  registerConsumptionLine(id) {
    this.#validateUuid(id);
    this.registry.consumptionLineIds.add(id);
  }
  registerTenantMember(userId, tenantId) {
    this.#validateUuid(userId);
    this.#validateUuid(tenantId);
    this.registry.tenantMembers.push({ userId, tenantId });
  }
  registerUserRole(userId, tenantId, role) {
    this.#validateUuid(userId);
    this.#validateUuid(tenantId);
    this.registry.userRoles.push({ userId, tenantId, role });
  }
  registerTenant(id) {
    this.#validateUuid(id);
    this.registry.tenantIds.add(id);
  }
  registerAuthUser(userId) {
    this.#validateUuid(userId);
    this.registry.authUsers.add(userId);
  }

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
    console.log(
      "  [FixtureTracker] Ejecutando purga quirúrgica estrictamente por IDs rastreados...",
    );

    const toPgArray = (setOrArray) => {
      const arr = Array.isArray(setOrArray) ? setOrArray : Array.from(setOrArray);
      if (arr.length === 0) return null;
      return `ARRAY[${arr.map((id) => `'${id}'::uuid`).join(",")}]`;
    };

    // Auto-discover any consumption and lines created during test
    if (this.registry.consumptionIds.size > 0) {
      const consArr = toPgArray(this.registry.consumptionIds);
      this.sqlRunner(`
        DELETE FROM public.inventory_consumption_lines WHERE consumption_id = ANY(${consArr});
        DELETE FROM public.inventory_consumptions WHERE id = ANY(${consArr});
      `);
      this.registry.consumptionIds.clear();
      this.registry.consumptionLineIds.clear();
    }

    // Auto-discover any stock_movements created by consumption or test
    if (this.registry.ingredientIds.size > 0) {
      const ingArr = toPgArray(this.registry.ingredientIds);
      this.sqlRunner(`
        DELETE FROM public.stock_movements WHERE ingredient_id = ANY(${ingArr});
      `);
      this.registry.stockMovementIds.clear();
    }

    if (this.registry.orderItemIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.order_items WHERE id = ANY(${toPgArray(this.registry.orderItemIds)});`,
      );
      this.registry.orderItemIds.clear();
    }

    if (this.registry.orderIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.orders WHERE id = ANY(${toPgArray(this.registry.orderIds)});`,
      );
      this.registry.orderIds.clear();
    }

    if (this.registry.slotIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.weekly_menu_slots WHERE id = ANY(${toPgArray(this.registry.slotIds)});`,
      );
      this.registry.slotIds.clear();
    }

    if (this.registry.weeklyMenuIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.weekly_menus WHERE id = ANY(${toPgArray(this.registry.weeklyMenuIds)});`,
      );
      this.registry.weeklyMenuIds.clear();
    }

    if (this.registry.dishIds.size > 0) {
      this.sqlRunner(`
        DELETE FROM public.dish_ingredients WHERE dish_id = ANY(${toPgArray(this.registry.dishIds)});
        DELETE FROM public.dishes WHERE id = ANY(${toPgArray(this.registry.dishIds)});
      `);
      this.registry.dishIds.clear();
    }

    if (this.registry.ingredientIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.ingredients WHERE id = ANY(${toPgArray(this.registry.ingredientIds)});`,
      );
      this.registry.ingredientIds.clear();
    }

    if (this.registry.customerIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.customers WHERE id = ANY(${toPgArray(this.registry.customerIds)});`,
      );
      this.registry.customerIds.clear();
    }

    if (this.registry.userRoles.length > 0) {
      for (const ur of this.registry.userRoles) {
        this.sqlRunner(
          `DELETE FROM public.user_roles WHERE user_id = '${ur.userId}' AND tenant_id = '${ur.tenantId}' AND role = '${ur.role}';`,
        );
      }
      this.registry.userRoles = [];
    }

    if (this.registry.tenantMembers.length > 0) {
      for (const tm of this.registry.tenantMembers) {
        this.sqlRunner(
          `DELETE FROM public.tenant_members WHERE user_id = '${tm.userId}' AND tenant_id = '${tm.tenantId}';`,
        );
      }
      this.registry.tenantMembers = [];
    }

    if (this.registry.tenantIds.size > 0) {
      this.sqlRunner(
        `DELETE FROM public.tenants WHERE id = ANY(${toPgArray(this.registry.tenantIds)});`,
      );
      this.registry.tenantIds.clear();
    }

    if (this.registry.authUsers.size > 0) {
      for (const uid of this.registry.authUsers) {
        try {
          execSync(
            `curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${uid}" \
              -H "apikey: ${SUPABASE_SERVICE_KEY}" \
              -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"`,
            { stdio: "ignore" },
          );
        } catch {
          // Fallback to direct auth.users delete
          this.sqlRunner(`DELETE FROM auth.users WHERE id = '${uid}';`);
        }
      }
      this.registry.authUsers.clear();
    }

    console.log("  [FixtureTracker] Purga completada.");
  }
}

// ============================================================================
// SENTINEL SUITE: Dynamic, Isolated Non-Fixture Verification & Preservation
// ============================================================================
class SentinelManager {
  constructor(sqlRunner, scalarJsonRunner) {
    this.sqlRunner = sqlRunner;
    this.scalarJsonRunner = scalarJsonRunner;
    this.state = null;
  }

  seed(tenantIdA) {
    console.log("\n--- Sembrando Registros Centinela Dinámicos ---");
    const ingId = crypto.randomUUID();
    const movId = crypto.randomUUID();
    const consId = crypto.randomUUID();
    const lineId = crypto.randomUUID();
    const tenantId = `ffffffff-${crypto.randomBytes(2).toString("hex")}-4444-ffff-${crypto.randomBytes(6).toString("hex")}`;
    const runToken = crypto.randomBytes(4).toString("hex");

    const sentinelEmail = `sentinel.audit.${runToken}@losrealesplus.com`;
    const sentinelPassword = `SentinelPass${crypto.randomBytes(4).toString("hex")}!`;
    const createRes = execSync(
      `curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"email":"${sentinelEmail}","password":"${sentinelPassword}","email_confirm":true}'`,
      { encoding: "utf8" },
    );
    const parsedUser = JSON.parse(createRes);
    const userId = parsedUser.id;

    this.state = {
      tenantIdA,
      ingId,
      movId,
      consId,
      lineId,
      tenantId,
      userId,
      expected: {
        ingredientName: "Ingrediente Centinela Inmutable #8888",
        unit: "kg",
        cost: 4.25,
        stock: 12.0,
        minStock: 2.0,
        wastePercentage: 0.0,
        movementNotes: "audit-sentinel-external-do-not-delete",
        movementQuantity: 3.0,
        previousStock: 9.0,
        newStock: 12.0,
        unitCost: 4.25,
        movementType: "MANUAL_ADJUSTMENT",
        consumptionDeliveryDate: "2026-11-20",
        consumptionStatus: "planned",
        lineQuantity: 2.0,
        lineUnit: "kg",
        tenantName: "Sentinel Foreign Tenant",
        tenantSlug: `sentinel-foreign-${runToken}`,
        roleEatclean: "accounting",
        roleForeign: "company_admin",
        memberStatus: "approved",
        memberType: "employee",
      },
    };

    this.sqlRunner(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
      VALUES ('${this.state.ingId}', '${tenantIdA}', '${this.state.expected.ingredientName}', '${this.state.expected.unit}', ${this.state.expected.cost}, ${this.state.expected.stock}, ${this.state.expected.minStock}, ${this.state.expected.wastePercentage});

      INSERT INTO public.stock_movements (
        id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
      ) VALUES (
        '${this.state.movId}',
        '${tenantIdA}',
        '${this.state.ingId}',
        '${this.state.expected.movementType}',
        ${this.state.expected.movementQuantity},
        ${this.state.expected.previousStock},
        ${this.state.expected.newStock},
        ${this.state.expected.unitCost},
        'ADJUSTMENT_NOTE',
        gen_random_uuid(),
        '${this.state.expected.movementNotes}',
        NOW()
      );

      INSERT INTO public.inventory_consumptions (id, tenant_id, delivery_date, status, created_by)
      VALUES ('${this.state.consId}', '${tenantIdA}', '${this.state.expected.consumptionDeliveryDate}', '${this.state.expected.consumptionStatus}', NULL);

      INSERT INTO public.inventory_consumption_lines (id, consumption_id, tenant_id, ingredient_id, ingredient_name, quantity, unit)
      VALUES ('${this.state.lineId}', '${this.state.consId}', '${tenantIdA}', '${this.state.ingId}', '${this.state.expected.ingredientName}', ${this.state.expected.lineQuantity}, '${this.state.expected.lineUnit}');

      INSERT INTO public.tenants (id, name, slug)
      VALUES ('${this.state.tenantId}', '${this.state.expected.tenantName}', '${this.state.expected.tenantSlug}');

      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES 
        ('${this.state.userId}', '${tenantIdA}', '${this.state.expected.memberStatus}', '${this.state.expected.memberType}'),
        ('${this.state.userId}', '${this.state.tenantId}', '${this.state.expected.memberStatus}', '${this.state.expected.memberType}');

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES 
        ('${this.state.userId}', '${tenantIdA}', '${this.state.expected.roleEatclean}'),
        ('${this.state.userId}', '${this.state.tenantId}', '${this.state.expected.roleForeign}');
    `);

    console.log("✓ Registros centinela sembrados con éxito.");
  }

  verifyPreserved() {
    if (!this.state) return;
    console.log("\n--- Verificación de Preservación Estricta de Centinelas ---");
    const check = this.scalarJsonRunner(`
      SELECT jsonb_build_object(
        'ingredient_stock', (SELECT stock FROM public.ingredients WHERE id = '${this.state.ingId}'),
        'movement_notes', (SELECT notes FROM public.stock_movements WHERE id = '${this.state.movId}'),
        'consumption_status', (SELECT status FROM public.inventory_consumptions WHERE id = '${this.state.consId}'),
        'line_qty', (SELECT quantity FROM public.inventory_consumption_lines WHERE id = '${this.state.lineId}')
      );
    `);

    if (Number(check.ingredient_stock) !== this.state.expected.stock) {
      throw new Error(
        `SENTINEL BREACH: Ingredient stock mutated! Expected ${this.state.expected.stock}, got ${check.ingredient_stock}`,
      );
    }
    if (check.movement_notes !== this.state.expected.movementNotes) {
      throw new Error(`SENTINEL BREACH: Movement mutated!`);
    }
    if (check.consumption_status !== this.state.expected.consumptionStatus) {
      throw new Error(
        `SENTINEL BREACH: Consumption mutated! Expected ${this.state.expected.consumptionStatus}, got ${check.consumption_status}`,
      );
    }
    if (Number(check.line_qty) !== this.state.expected.lineQuantity) {
      throw new Error(`SENTINEL BREACH: Consumption line mutated!`);
    }

    console.log("✓ Centinelas 100% preservados e inalterados.");
  }

  cleanup() {
    if (!this.state) return;
    this.sqlRunner(`
      DELETE FROM public.inventory_consumption_lines WHERE id = '${this.state.lineId}';
      DELETE FROM public.inventory_consumptions WHERE id = '${this.state.consId}';
      DELETE FROM public.stock_movements WHERE id = '${this.state.movId}';
      DELETE FROM public.ingredients WHERE id = '${this.state.ingId}';
      DELETE FROM public.user_roles WHERE user_id = '${this.state.userId}';
      DELETE FROM public.tenant_members WHERE user_id = '${this.state.userId}';
      DELETE FROM public.tenants WHERE id = '${this.state.tenantId}';
    `);
    try {
      execSync(
        `curl -s -X DELETE "${SUPABASE_URL}/auth/v1/admin/users/${this.state.userId}" \
          -H "apikey: ${SUPABASE_SERVICE_KEY}" \
          -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}"`,
        { stdio: "ignore" },
      );
    } catch {
      this.sqlRunner(`DELETE FROM auth.users WHERE id = '${this.state.userId}';`);
    }
    this.state = null;
  }
}

// ============================================================================
// MAIN VERIFICATION PROCEDURE
// ============================================================================
async function run() {
  console.log("======================================================================");
  console.log("  YOURMEAL OS — CERTIFICACIÓN E2E DE COCINA Y CONSUMO FLOW-04 (UI V1) ");
  console.log("======================================================================\n");

  const tracker = new FixtureTracker(runSql, runScalarJson);
  const sentinels = new SentinelManager(runSql, runScalarJson);
  let browser = null;

  try {
    // 1. Identify primary tenant (EatClean)
    const tenantIdA = runSql("SELECT id FROM public.tenants WHERE slug = 'eatclean' LIMIT 1;");
    if (!tenantIdA) throw new Error("Tenant 'eatclean' not found in database");
    console.log(`Tenant EatClean A: ${tenantIdA}`);

    // Seed sentinels
    sentinels.seed(tenantIdA);

    // 2. Create Foreign Tenant B for isolation test
    const runToken = crypto.randomBytes(4).toString("hex");
    const tenantIdB = crypto.randomUUID();
    runSql(`
      INSERT INTO public.tenants (id, name, slug)
      VALUES ('${tenantIdB}', 'Foreign Tenant B', 'foreign-b-${runToken}');
    `);
    tracker.registerTenant(tenantIdB);

    // 3. Create Staff User with kitchen.operate + inventory.operate
    const staffEmail = `staff.kitchen.flow04.${runToken}@losrealesplus.com`;
    const staffPassword = `KitchenPass${crypto.randomBytes(4).toString("hex")}!`;
    const staffUserRes = execSync(
      `curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"email":"${staffEmail}","password":"${staffPassword}","email_confirm":true}'`,
      { encoding: "utf8" },
    );
    const staffUser = JSON.parse(staffUserRes);
    tracker.registerAuthUser(staffUser.id);

    // Assign roles to staff user in Tenant A
    runSql(`
      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES ('${staffUser.id}', '${tenantIdA}', 'approved', 'employee');

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES 
        ('${staffUser.id}', '${tenantIdA}', 'kitchen'),
        ('${staffUser.id}', '${tenantIdA}', 'inventory'),
        ('${staffUser.id}', '${tenantIdA}', 'company_admin');
    `);
    tracker.registerTenantMember(staffUser.id, tenantIdA);
    tracker.registerUserRole(staffUser.id, tenantIdA, "kitchen");
    tracker.registerUserRole(staffUser.id, tenantIdA, "inventory");
    tracker.registerUserRole(staffUser.id, tenantIdA, "company_admin");

    // Also give membership in Tenant B for isolation testing
    runSql(`
      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES ('${staffUser.id}', '${tenantIdB}', 'approved', 'employee');

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES 
        ('${staffUser.id}', '${tenantIdB}', 'kitchen'),
        ('${staffUser.id}', '${tenantIdB}', 'inventory');
    `);
    tracker.registerTenantMember(staffUser.id, tenantIdB);
    tracker.registerUserRole(staffUser.id, tenantIdB, "kitchen");
    tracker.registerUserRole(staffUser.id, tenantIdB, "inventory");

    // 4. Create Unauthorized Kitchen-Only User (lacks inventory.operate)
    const kitchenOnlyEmail = `kitchen.only.${runToken}@losrealesplus.com`;
    const kitchenOnlyPassword = `KitchenOnlyPass${crypto.randomBytes(4).toString("hex")}!`;
    const kitchenOnlyUserRes = execSync(
      `curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"email":"${kitchenOnlyEmail}","password":"${kitchenOnlyPassword}","email_confirm":true}'`,
      { encoding: "utf8" },
    );
    const kitchenOnlyUser = JSON.parse(kitchenOnlyUserRes);
    tracker.registerAuthUser(kitchenOnlyUser.id);

    runSql(`
      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES ('${kitchenOnlyUser.id}', '${tenantIdA}', 'approved', 'employee');

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES ('${kitchenOnlyUser.id}', '${tenantIdA}', 'kitchen');
    `);
    tracker.registerTenantMember(kitchenOnlyUser.id, tenantIdA);
    tracker.registerUserRole(kitchenOnlyUser.id, tenantIdA, "kitchen");

    // 5. Seed Dish, Ingredients, and Production Orders for deliveryDate
    const deliveryDate = "2026-11-15";
    const weekStart = "2026-11-09";
    const chickenIngId = crypto.randomUUID();
    const riceIngId = crypto.randomUUID();
    const dishId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const weeklyMenuId = crypto.randomUUID();
    const slotId = crypto.randomUUID();
    const orderId = crypto.randomUUID();
    const orderItemId = crypto.randomUUID();

    console.log("\n--- Sembrando Producción y Recetas (FLOW-04) ---");
    // Initial Stock: Chicken = 10.00 kg (sufficient), Rice = 0.50 kg (insufficient! needed 1.00 kg)
    runSql(`
      INSERT INTO public.ingredients (id, tenant_id, name, unit, cost, stock, min_stock, waste_percentage)
      VALUES 
        ('${chickenIngId}', '${tenantIdA}', 'Pechuga Pollo Certificada Flow04', 'kg', 5.00, 10.00, 1.00, 0.0),
        ('${riceIngId}', '${tenantIdA}', 'Arroz Integral Bio Flow04', 'kg', 2.00, 0.50, 0.50, 0.0);

      INSERT INTO public.dishes (id, tenant_id, name, description, status)
      VALUES ('${dishId}', '${tenantIdA}', 'Plato Fit Pollo y Arroz FLOW04', 'Rico en proteína', 'active');

      -- Recipe: 0.20 kg Chicken and 0.10 kg Rice per portion
      INSERT INTO public.dish_ingredients (dish_id, ingredient_id, tenant_id, qty, unit)
      VALUES 
        ('${dishId}', '${chickenIngId}', '${tenantIdA}', 0.200, 'kg'),
        ('${dishId}', '${riceIngId}', '${tenantIdA}', 0.100, 'kg');

      INSERT INTO public.weekly_menus (id, tenant_id, week_start, status)
      VALUES ('${weeklyMenuId}', '${tenantIdA}', '${weekStart}', 'published');

      INSERT INTO public.weekly_menu_slots (id, tenant_id, weekly_menu_id, day_date, dish_id, sort_order)
      VALUES ('${slotId}', '${tenantIdA}', '${weeklyMenuId}', '${deliveryDate}', '${dishId}', 1);

      INSERT INTO public.customers (id, tenant_id, user_id, kind)
      VALUES ('${customerId}', '${tenantIdA}', NULL, 'individual');
    `);

    // Insert Order with 10 portions for deliveryDate (10 * 0.2 = 2.00 kg Chicken; 10 * 0.1 = 1.00 kg Rice)
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
        '${orderItemId}', '${orderId}', '${tenantIdA}', '${dishId}', '${deliveryDate}', 10, 'dish', 9.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );
      COMMIT;
    `);

    tracker.registerIngredient(chickenIngId);
    tracker.registerIngredient(riceIngId);
    tracker.registerDish(dishId);
    tracker.registerWeeklyMenu(weeklyMenuId);
    tracker.registerWeeklyMenuSlot(slotId);
    tracker.registerCustomer(customerId);
    tracker.registerOrder(orderId);
    tracker.registerOrderItem(orderItemId);

    console.log("✓ Ingredientes, plato y pedido sembrados con éxito:");
    console.log(
      "  - Pechuga de Pollo: stock inicial = 10.00 kg (necesario: 2.00 kg -> suficiente)",
    );
    console.log(
      "  - Arroz Integral: stock inicial = 0.50 kg (necesario: 1.00 kg -> DÉFICIT de 0.50 kg)",
    );

    // 6. Launch Browser & Authenticate
    console.log("\n--- Lanzando Navegador Chromium e Iniciando Sesión ---");
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    // Intercept remote Supabase requests and forward to local Docker Kong (127.0.0.1:54321)
    await context.route("**/*supabase.co/**", async (route) => {
      const req = route.request();
      const url = req.url();
      const localTarget = url.replace(/https:\/\/[^/]+\.supabase\.co/, "http://127.0.0.1:54321");
      const headers = { ...req.headers() };
      headers["apikey"] = SUPABASE_ANON_KEY;
      if (
        !headers["authorization"] ||
        headers["authorization"].startsWith("Bearer sb_publishable")
      ) {
        headers["authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      }

      try {
        const response = await context.request.fetch(localTarget, {
          method: req.method(),
          headers,
          data: req.postDataBuffer() || undefined,
        });
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
      if (
        msg.type() === "error" ||
        msg.text().includes("FLOW-04") ||
        msg.text().includes("KITCHEN")
      ) {
        console.log(`  [BROWSER ${msg.type()}]:`, msg.text());
      }
    });

    // Navigate to /auth and authenticate with staff user
    await page.goto("http://127.0.0.1:5173/auth", { waitUntil: "networkidle" });
    const loginRes = await page.evaluate(
      async ({ email, password }) => {
        try {
          const { supabase } = await import("/src/integrations/supabase/client.ts");
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { ok: false, error: error.message };
          return { ok: true, session: data.session };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },
      { email: staffEmail, password: staffPassword },
    );

    if (!loginRes.ok) {
      throw new Error(`Login failed for staff user: ${loginRes.error}`);
    }
    console.log("✓ Sesión iniciada con éxito para usuario Staff (kitchen + inventory).");

    // Publish active tenant
    await page.evaluate(
      async ({ tIdA }) => {
        const { publishBootstrapIdentitySnapshot, getBootstrapIdentitySnapshot } =
          await import("/src/bootstrap/pipeline/BootstrapIdentityStore.ts");
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

    // =========================================================================
    // FASE 1: Estado Inicial Pendiente de Planificar (Workspace de Cocina)
    // =========================================================================
    console.log(
      "\n--- FASE 1: Verificación de Estado Inicial No Planificado en /admin/kitchen-execution ---",
    );
    await page.goto(`http://127.0.0.1:5173/admin/kitchen-execution?date=${deliveryDate}`, {
      waitUntil: "networkidle",
    });

    await page.waitForSelector('[data-testid="kitchen-consumption-section"]', { timeout: 15000 });
    const sectionText = await page.innerText('[data-testid="kitchen-consumption-section"]');
    if (!sectionText.includes("Consumo de Ingredientes (FLOW-04)")) {
      throw new Error("Sección FLOW-04 no encontrada en la página");
    }
    if (!sectionText.includes("Pendiente de planificar")) {
      throw new Error(`Estado esperado 'Pendiente de planificar', obtenido: ${sectionText}`);
    }

    const planBtn = await page.$('[data-testid="plan-consumption-button"]');
    if (!planBtn) throw new Error("Botón 'Planificar consumo (T1)' no visible");

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_01_unplanned.png` });
    console.log("✓ Fase 1 superada: Sección FLOW-04 visible en estado 'Pendiente de planificar'.");

    // =========================================================================
    // FASE 2: Acción T1 — Planificar Consumo y Alerta de Stock Insuficiente
    // =========================================================================
    console.log("\n--- FASE 2: Ejecución de T1 (Planificar consumo) y Detección de Déficit ---");
    await planBtn.click();

    // Wait for plan to load
    await page.waitForSelector('[data-testid="kpi-consumption-status"]', { timeout: 15000 });
    const kpiStatus = await page.innerText('[data-testid="kpi-consumption-status"]');
    if (kpiStatus.trim().toLowerCase() !== "planned") {
      throw new Error(`Estado esperado 'planned', obtenido: ${kpiStatus}`);
    }

    // Verify lines table
    await page.waitForSelector('[data-testid="consumption-lines-table"]', { timeout: 10000 });
    const tableText = await page.innerText('[data-testid="consumption-lines-table"]');
    if (
      !tableText.includes("Pechuga Pollo Certificada Flow04") ||
      !tableText.includes("Arroz Integral Bio Flow04")
    ) {
      throw new Error("Los ingredientes planificados no aparecen en la tabla");
    }

    // Verify warning for insufficient stock is shown
    await page.waitForSelector('[data-testid="insufficient-stock-alert"]', { timeout: 5000 });
    console.log("✓ Alerta de stock insuficiente detectada correctamente para Arroz Integral Bio.");

    // Verify DB stock remains strictly UNCHANGED after T1
    const stockAfterT1 = runScalarJson(`
      SELECT jsonb_build_object(
        'chicken', (SELECT stock FROM public.ingredients WHERE id = '${chickenIngId}'),
        'rice', (SELECT stock FROM public.ingredients WHERE id = '${riceIngId}')
      );
    `);
    if (Number(stockAfterT1.chicken) !== 10.0 || Number(stockAfterT1.rice) !== 0.5) {
      throw new Error(
        `VIOLACIÓN FLOW-04: El stock no debe mutar en T1. Actual: ${JSON.stringify(stockAfterT1)}`,
      );
    }
    console.log(
      "✓ Invariante T1 preservado: Stock en PostgreSQL permanece inalterado (10.00 kg y 0.50 kg).",
    );

    // Track generated consumption ID
    const consRow = runScalarJson(`
      SELECT jsonb_build_object('id', id)
      FROM public.inventory_consumptions
      WHERE tenant_id = '${tenantIdA}' AND delivery_date = '${deliveryDate}';
    `);
    if (consRow?.id) tracker.registerConsumption(consRow.id);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/kitchen_02_planned_with_insufficient_warning.png`,
    });
    console.log(
      "✓ Fase 2 superada: Plan generado, advertencia de stock mostrada, existencias intactas.",
    );

    // =========================================================================
    // FASE 3: Recuperación de Sesión tras Recarga del Navegador (Reload)
    // =========================================================================
    console.log("\n--- FASE 3: Recarga Completa del Navegador y Recuperación de Estado ---");
    await page.reload({ waitUntil: "networkidle" });

    await page.waitForSelector('[data-testid="kitchen-consumption-section"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="kpi-consumption-status"]', { timeout: 10000 });
    const recoveredStatus = await page.innerText('[data-testid="kpi-consumption-status"]');
    if (recoveredStatus.trim().toLowerCase() !== "planned") {
      throw new Error(
        `Tras recarga, el estado esperado era 'planned', obtenido: ${recoveredStatus}`,
      );
    }
    const linesAfterReload = await page.innerText('[data-testid="consumption-lines-table"]');
    if (!linesAfterReload.includes("Pechuga Pollo Certificada Flow04")) {
      throw new Error("Líneas de consumo no recuperadas tras reload");
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_03_recovered_after_reload.png` });
    console.log(
      "✓ Fase 3 superada: Estado recuperado de forma transparente desde PostgreSQL tras recarga.",
    );

    // =========================================================================
    // FASE 4: Intento de T2 con Stock Insuficiente -> Bloqueado Seguramente
    // =========================================================================
    console.log("\n--- FASE 4: Intento de T2 con Déficit de Stock y Confirmación Humana ---");
    const applyBtn = await page.$('[data-testid="apply-consumption-button"]');
    if (!applyBtn) throw new Error("Botón 'Aplicar consumo (T2)' no visible");
    await applyBtn.click();

    // Verify Confirmation Dialog
    await page.waitForSelector('[data-testid="confirm-apply-dialog"]', { timeout: 5000 });
    const dialogAction = await page.$('[data-testid="confirm-apply-dialog-action"]');
    if (!dialogAction) throw new Error("Acción de confirmación en diálogo no encontrada");

    // Click confirm to apply
    await dialogAction.click();

    // Wait for toast error or status verification
    await page.waitForTimeout(1500);

    // Verify consumption remains in 'planned' status because DB rejected insufficient stock
    const dbStatusAfterFailedApply = runSql(`
      SELECT status FROM public.inventory_consumptions
      WHERE tenant_id = '${tenantIdA}' AND delivery_date = '${deliveryDate}';
    `);
    if (dbStatusAfterFailedApply !== "planned") {
      throw new Error(
        `Consumo cambió indebidamente a ${dbStatusAfterFailedApply} pese a déficit de stock`,
      );
    }

    const stockAfterFailedApply = runScalarJson(`
      SELECT jsonb_build_object(
        'chicken', (SELECT stock FROM public.ingredients WHERE id = '${chickenIngId}'),
        'rice', (SELECT stock FROM public.ingredients WHERE id = '${riceIngId}')
      );
    `);
    if (
      Number(stockAfterFailedApply.chicken) !== 10.0 ||
      Number(stockAfterFailedApply.rice) !== 0.5
    ) {
      throw new Error(
        `Stock mutó indebidamente durante rechazo de T2: ${JSON.stringify(stockAfterFailedApply)}`,
      );
    }

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/kitchen_04_insufficient_stock_prevented.png`,
    });
    console.log("✓ Fase 4 superada: Aplicación rechazada con aviso por existencias insuficientes.");

    // =========================================================================
    // FASE 5: Reposición de Stock, Refresco y Aplicación Exitosa (T2)
    // =========================================================================
    console.log("\n--- FASE 5: Reposición de Almacén y Aplicación Exitosa de T2 ---");
    // Replenish Rice: add 5.00 kg (now 5.50 kg, which satisfies 1.00 kg requirement)
    const replenishmentMovId = crypto.randomUUID();
    runSql(`
      INSERT INTO public.stock_movements (
        id, tenant_id, ingredient_id, movement_type, quantity, previous_stock, new_stock, unit_cost, reference_document_type, reference_document_id, notes, created_at
      ) VALUES (
        '${replenishmentMovId}',
        '${tenantIdA}',
        '${riceIngId}',
        'PURCHASE_RECEIPT',
        5.000,
        0.500,
        5.500,
        2.00,
        'PURCHASE_INVOICE',
        gen_random_uuid(),
        'Reposición de arroz para permitir producción',
        NOW()
      );
      UPDATE public.ingredients SET stock = 5.500 WHERE id = '${riceIngId}';
    `);
    tracker.registerMovement(replenishmentMovId);

    // Click "Actualizar" on page
    await page.click("text=Actualizar");
    await page.waitForTimeout(1000);

    // Deficit warning should now disappear
    const deficitAlert = await page.$('[data-testid="insufficient-stock-alert"]');
    if (deficitAlert) {
      const isVisible = await deficitAlert.isVisible();
      if (isVisible)
        throw new Error("La advertencia de déficit sigue visible tras reponer existencias");
    }
    console.log("✓ Advertencia de déficit retirada tras reposición de existencias.");

    // Apply consumption via modal
    await page.click('[data-testid="apply-consumption-button"]');
    await page.waitForSelector('[data-testid="confirm-apply-dialog"]', { timeout: 5000 });
    await page.click('[data-testid="confirm-apply-dialog-action"]');

    // Wait for transition to applied
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="kpi-consumption-status"]');
        return el && el.textContent.trim().toLowerCase() === "applied";
      },
      { timeout: 15000 },
    );

    // Verify stock decremented in PostgreSQL:
    // Chicken: 10.00 - 2.00 = 8.00 kg
    // Rice: 5.50 - 1.00 = 4.50 kg
    const stockAfterApply = runScalarJson(`
      SELECT jsonb_build_object(
        'chicken', (SELECT stock FROM public.ingredients WHERE id = '${chickenIngId}'),
        'rice', (SELECT stock FROM public.ingredients WHERE id = '${riceIngId}')
      );
    `);
    if (Number(stockAfterApply.chicken) !== 8.0 || Number(stockAfterApply.rice) !== 4.5) {
      throw new Error(
        `Stock tras T2 incorrecto. Esperado 8.00 y 4.50, obtenido: ${JSON.stringify(stockAfterApply)}`,
      );
    }
    console.log(
      `✓ Stock descontado en PostgreSQL con éxito: Pollo = ${stockAfterApply.chicken} kg, Arroz = ${stockAfterApply.rice} kg.`,
    );

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_05_applied_stock_decremented.png` });
    console.log("✓ Fase 5 superada: Consumo aplicado en existencias con descuento exacto.");

    // =========================================================================
    // FASE 6: Idempotencia FLOW04-I2 (Single Apply)
    // =========================================================================
    console.log("\n--- FASE 6: Verificación de Invariante FLOW04-I2 (No doble descuento) ---");
    // 1. Verify that "Aplicar consumo (T2)" button is no longer present in UI (double-click protection)
    const applyBtnAfter = await page.$('[data-testid="apply-consumption-button"]');
    if (applyBtnAfter && (await applyBtnAfter.isVisible())) {
      throw new Error("El botón Aplicar (T2) no debe ser visible tras haberse aplicado");
    }

    // 2. Real second execution via InventoryService in browser evaluate context
    console.log(
      "  Ejecutando re-aplicación explícita mediante InventoryService.applyConsumption...",
    );
    const reapplyServiceRes = await page.evaluate(
      async ({ tId, cId, uId }) => {
        try {
          const { InventoryService } =
            await import("/src/modules/inventory/application/inventory-service.ts");
          const { createServiceContext } = await import("/src/services/types.ts");
          const { supabase } = await import("/src/integrations/supabase/client.ts");
          const ctx = await createServiceContext({
            supabase,
            userId: uId,
            tenantId: tId,
            roles: ["kitchen", "inventory"],
          });
          const res = await InventoryService.applyConsumption(ctx, cId, { sessionRecovery: true });
          return { ok: true, status: res.status, id: res.id };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      },
      { tId: tenantIdA, cId: consRow.id, uId: staffUser.id },
    );
    if (!reapplyServiceRes.ok || reapplyServiceRes.status !== "applied") {
      throw new Error(
        `Re-aplicación vía servicio falló o alteró el estado: ${JSON.stringify(reapplyServiceRes)}`,
      );
    }

    // 3. Real second execution via direct PostgreSQL transactional RPC (authenticated via Supabase client)
    console.log(
      "  Ejecutando re-aplicación explícita mediante apply_inventory_consumption_v1 RPC...",
    );
    const rpcReapply = await page.evaluate(
      async ({ tId, cId, uId }) => {
        try {
          const { supabase } = await import("/src/integrations/supabase/client.ts");
          const { data, error } = await supabase.rpc("apply_inventory_consumption_v1", {
            p_tenant_id: tId,
            p_consumption_id: cId,
            p_actor_id: uId,
          });
          if (error) return { ok: false, error: error.message };
          return { ok: true, data };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : String(e) };
        }
      },
      { tId: tenantIdA, cId: consRow.id, uId: staffUser.id },
    );
    if (
      !rpcReapply.ok ||
      rpcReapply.data?.idempotent !== true ||
      rpcReapply.data?.status !== "applied"
    ) {
      throw new Error(
        `RPC PostgreSQL no devolvió respuesta idempotente: ${JSON.stringify(rpcReapply)}`,
      );
    }

    // 4. Assert stock in PostgreSQL remains strictly identical (Chicken: 8.00, Rice: 4.50)
    const stockCheckReapply = runScalarJson(`
      SELECT jsonb_build_object(
        'chicken', (SELECT stock FROM public.ingredients WHERE id = '${chickenIngId}'),
        'rice', (SELECT stock FROM public.ingredients WHERE id = '${riceIngId}')
      );
    `);
    if (Number(stockCheckReapply.chicken) !== 8.0 || Number(stockCheckReapply.rice) !== 4.5) {
      throw new Error(
        `Doble descuento detectado en existencias: ${JSON.stringify(stockCheckReapply)}`,
      );
    }

    // 5. Assert exactly 2 movements in stock_movements for this consumption (no duplicate rows)
    const movementCount = runSql(`
      SELECT count(*) FROM public.stock_movements
      WHERE tenant_id = '${tenantIdA}' AND reference_document_id = '${consRow.id}';
    `);
    if (Number(movementCount.trim()) !== 2) {
      throw new Error(`Esperado exactamente 2 movimientos en kárdex, encontrado: ${movementCount}`);
    }
    console.log(
      "✓ Invariante FLOW04-I2 preservado: Re-aplicación real probada sin doble descuento ni duplicación de asientos.",
    );

    // =========================================================================
    // FASE 7: Acción T3 — Sellar Consumo (Terminal, Sin Mutación de Stock)
    // =========================================================================
    console.log("\n--- FASE 7: Acción T3 (Sellar consumo) y Estado Terminal Definitivo ---");
    const sealBtn = await page.$('[data-testid="seal-consumption-button"]');
    if (!sealBtn) throw new Error("Botón 'Sellar consumo (T3)' no visible");
    await sealBtn.click();

    await page.waitForSelector('[data-testid="confirm-seal-dialog"]', { timeout: 5000 });
    await page.click('[data-testid="confirm-seal-dialog-action"]');

    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="kpi-consumption-status"]');
        return el && el.textContent.trim().toLowerCase() === "sealed";
      },
      { timeout: 15000 },
    );

    // Verify stock in DB is strictly unchanged vs T2
    const stockAfterSeal = runScalarJson(`
      SELECT jsonb_build_object(
        'chicken', (SELECT stock FROM public.ingredients WHERE id = '${chickenIngId}'),
        'rice', (SELECT stock FROM public.ingredients WHERE id = '${riceIngId}')
      );
    `);
    if (Number(stockAfterSeal.chicken) !== 8.0 || Number(stockAfterSeal.rice) !== 4.5) {
      throw new Error(
        `VIOLACIÓN FLOW-04: El stock no debe mutar en T3. Actual: ${JSON.stringify(stockAfterSeal)}`,
      );
    }
    console.log(
      "✓ Invariante T3 preservado: Estado 'sealed' terminal sin alteración de existencias.",
    );

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_06_sealed_terminal.png` });
    console.log("✓ Fase 7 superada: Consumo sellado correctamente.");

    // =========================================================================
    // FASE 8: Enlace Directo a Kárdex y Comprobación Estricta de Movimientos
    // =========================================================================
    console.log("\n--- FASE 8: Enlace Directo a Inventario y Verificación Estricta en Kárdex ---");

    // 1. Verify movement records exist in PostgreSQL for this consumption
    const kardexDbMovements = runScalarJson(`
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'ingredient_id', ingredient_id,
        'movement_type', movement_type,
        'quantity', quantity,
        'previous_stock', previous_stock,
        'new_stock', new_stock,
        'reference_document_id', reference_document_id
      ))
      FROM public.stock_movements
      WHERE tenant_id = '${tenantIdA}' AND reference_document_id = '${consRow.id}';
    `);

    if (!Array.isArray(kardexDbMovements) || kardexDbMovements.length !== 2) {
      throw new Error(
        `Fallo Kárdex DB: Se esperaban 2 movimientos para el consumo ${consRow.id}, encontrados: ${JSON.stringify(kardexDbMovements)}`,
      );
    }

    for (const mov of kardexDbMovements) {
      tracker.registerMovement(mov.id);
      if (mov.movement_type !== "PRODUCTION_CONSUMPTION") {
        throw new Error(`Tipo de movimiento inesperado en BD: ${mov.movement_type}`);
      }
      if (mov.reference_document_id !== consRow.id) {
        throw new Error(`Referencia de documento incorrecta en BD: ${mov.reference_document_id}`);
      }
      if (mov.ingredient_id === chickenIngId) {
        if (
          Number(mov.quantity) !== 2.0 ||
          Number(mov.previous_stock) !== 10.0 ||
          Number(mov.new_stock) !== 8.0
        ) {
          throw new Error(
            `Valores de movimiento de pollo incorrectos en BD: ${JSON.stringify(mov)}`,
          );
        }
      } else if (mov.ingredient_id === riceIngId) {
        if (
          Number(mov.quantity) !== 1.0 ||
          Number(mov.previous_stock) !== 5.5 ||
          Number(mov.new_stock) !== 4.5
        ) {
          throw new Error(
            `Valores de movimiento de arroz incorrectos en BD: ${JSON.stringify(mov)}`,
          );
        }
      } else {
        throw new Error(`Ingrediente desconocido en movimiento de consumo: ${mov.ingredient_id}`);
      }
    }
    console.log(
      "✓ PostgreSQL Kárdex verificado: 2 movimientos PRODUCTION_CONSUMPTION conformes con trazabilidad exacta.",
    );

    // 2. Navigate to Inventory & Kárdex UI
    await page.click('[data-testid="goto-inventory-button"]');
    await page.waitForURL("**/admin/inventory", { timeout: 10000 });
    await page.waitForSelector("text=Inventario & Kárdex", { timeout: 15000 });

    // Click on Kárdex tab
    await page.click('button[value="movements"], [role="tab"]:has-text("Kárdex")');
    await page.waitForTimeout(1500);

    // Wait for the movements table to be populated
    await page.waitForSelector("table", { timeout: 10000 });
    const kardexDomText = await page.innerText("table");

    // Strict assertions in UI DOM (fail if missing)
    if (!kardexDomText.includes("Pechuga Pollo Certificada Flow04")) {
      throw new Error(
        "KÁRDEX UI FAIL: 'Pechuga Pollo Certificada Flow04' no aparece en la tabla de movimientos",
      );
    }
    if (!kardexDomText.includes("Arroz Integral Bio Flow04")) {
      throw new Error(
        "KÁRDEX UI FAIL: 'Arroz Integral Bio Flow04' no aparece en la tabla de movimientos",
      );
    }
    if (
      !kardexDomText.includes("Consumo Cocina") &&
      !kardexDomText.includes("PRODUCTION_CONSUMPTION")
    ) {
      throw new Error(
        "KÁRDEX UI FAIL: Etiqueta de 'Consumo Cocina' no encontrada en la tabla de movimientos",
      );
    }

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_07_kardex_verified.png` });
    console.log(
      "✓ Fase 8 superada: Movimientos comprobados estrictamente en PostgreSQL y renderizados en la UI de Kárdex.",
    );

    // =========================================================================
    // FASE 9: RBAC (Usuario sin inventory.operate) y Aislamiento Multi-tenant
    // =========================================================================
    console.log("\n--- FASE 9: Verificación de RBAC (Kitchen-only) y Aislamiento por Tenant ---");
    // Sign out and sign in as kitchen-only user
    await page.goto("http://127.0.0.1:5173/auth", { waitUntil: "networkidle" });
    const kitchenOnlyLoginRes = await page.evaluate(
      async ({ email, password }) => {
        try {
          const { supabase } = await import("/src/integrations/supabase/client.ts");
          await supabase.auth.signOut();
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) return { ok: false, error: error.message };
          return { ok: true, session: data.session };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      },
      { email: kitchenOnlyEmail, password: kitchenOnlyPassword },
    );
    if (!kitchenOnlyLoginRes.ok) throw new Error("Login failed for kitchen-only user");

    await page.goto(`http://127.0.0.1:5173/admin/kitchen-execution?date=${deliveryDate}`, {
      waitUntil: "networkidle",
    });
    await page.waitForSelector('[data-testid="kitchen-consumption-section"]', { timeout: 15000 });

    // Verify RBAC notice is shown
    const rbacNotice = await page.$('[data-testid="consumption-rbac-notice"]');
    if (!rbacNotice || !(await rbacNotice.isVisible())) {
      throw new Error("Aviso de RBAC no mostrado a usuario sin inventory.operate");
    }
    console.log("✓ Aviso de permisos (solo lectura) mostrado a usuario sin 'inventory.operate'.");

    // Verify action buttons are not accessible
    const unauthorizedApply = await page.$('[data-testid="apply-consumption-button"]');
    const unauthorizedSeal = await page.$('[data-testid="seal-consumption-button"]');
    const unauthorizedPlan = await page.$('[data-testid="plan-consumption-button"]');
    if (unauthorizedApply || unauthorizedSeal || unauthorizedPlan) {
      throw new Error("Botones de acción expuestos a usuario no autorizado");
    }

    // Switch to Tenant B to verify tenant isolation
    await page.evaluate(
      async ({ tIdB }) => {
        const { publishBootstrapIdentitySnapshot, getBootstrapIdentitySnapshot } =
          await import("/src/bootstrap/pipeline/BootstrapIdentityStore.ts");
        const snap = getBootstrapIdentitySnapshot();
        publishBootstrapIdentitySnapshot({
          ...snap,
          status: "ready",
          tenant: {
            id: tIdB,
            name: "Foreign Tenant B",
            slug: "foreign-b",
          },
        });
      },
      { tIdB: tenantIdB },
    );

    await page.goto(`http://127.0.0.1:5173/admin/kitchen-execution?date=${deliveryDate}`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1000);
    const tenantBText = await page.innerText('[data-testid="kitchen-consumption-section"]');
    if (
      tenantBText.includes("Plato Fit Pollo y Arroz FLOW04") ||
      tenantBText.includes("Pechuga Pollo Certificada Flow04")
    ) {
      throw new Error("FUGA ENTRE TENANTS: Datos de Tenant A visibles en Tenant B");
    }
    console.log(
      "✓ Aislamiento multitenant estricto verificado: Tenant B no tiene acceso a consumos de Tenant A.",
    );

    await page.screenshot({ path: `${SCREENSHOT_DIR}/kitchen_08_rbac_and_tenant_isolation.png` });
    console.log("✓ Fase 9 superada: RBAC y aislamiento multi-tenant comprobados.");

    // =========================================================================
    // FASE 10: Verificación de Centinelas Inmutables y Limpieza Quirúrgica
    // =========================================================================
    console.log("\n--- FASE 10: Comprobación de Integridad de Centinelas ---");
    sentinels.verifyPreserved();

    console.log("\n======================================================================");
    console.log("  TODAS LAS VERIFICACIONES (10/10) COMPLETADAS CON ÉXITO — GO TÉCNICO ");
    console.log("======================================================================\n");
  } finally {
    if (browser) await browser.close();
    sentinels.cleanup();
    await tracker.cleanup();
  }
}

run().catch((err) => {
  console.error("\n❌ ERROR EN LA VERIFICACIÓN:", err);
  process.exit(1);
});
