import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { InventoryService } from "../application/inventory-service";
import {
  __resetInventoryStoreForTests,
  createInventoryRepository,
} from "./inventory-repository";
import { __resetFlow04EvidenceForTests } from "../application/flow04-evidence";
import type { ServiceContext } from "@/services/types";

const DB_CONTAINER = process.env.PG_CONTAINER || "supabase_db_djangucecsphnejplvic";
const SUPABASE_URL = process.env.SUPABASE_LOCAL_URL || "http://127.0.0.1:54321";
const JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";

function makeJwt(role: string, sub?: string) {
  const h = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(
    JSON.stringify({
      role,
      sub,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString("base64url");
  const s = createHmac("sha256", JWT_SECRET).update(`${h}.${p}`).digest("base64url");
  return `${h}.${p}.${s}`;
}

const sql = (query: string): string =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      DB_CONTAINER,
      "psql",
      "-XqAt",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: query, encoding: "utf8" },
  ).trim();

const scalar = <T = any>(query: string): T => JSON.parse(sql(query));

describe("FLOW-04 PostgreSQL Integration: Canonical Production → Atomic Inventory Bridge", () => {
  const tenantId = randomUUID();
  const foreignTenantId = randomUUID();
  const staffUserId = randomUUID();
  const foreignStaffId = randomUUID();
  const supplierId = randomUUID();
  const ingredientId = randomUUID();
  const ingredientId2 = randomUUID();
  const dishId = randomUUID();
  const deliveryDate = "2026-10-30";
  const weekStart = "2026-10-26";

  let serviceClient: any;
  let staffClient: any;
  let foreignStaffClient: any;

  function seedCanonicalOrder({
    orderId,
    customerId,
    date,
    qty,
    status = "confirmed",
  }: {
    orderId: string;
    customerId: string;
    date: string;
    qty: number;
    status?: string;
  }) {
    const orderItemId = randomUUID();
    const slotId = randomUUID();

    sql(`
      BEGIN;
      SELECT set_config('request.jwt.claim.sub', '${staffUserId}', false);
      SELECT set_config('request.jwt.claim.role', 'authenticated', false);

      -- 1. Ensure weekly menu slot exists for date and dish (exactly one slot per day/dish)
      INSERT INTO public.weekly_menu_slots (id, tenant_id, weekly_menu_id, day_date, dish_id, sort_order)
      SELECT '${slotId}', '${tenantId}', m.id, '${date}', '${dishId}', 1
      FROM public.weekly_menus m
      WHERE m.tenant_id = '${tenantId}' AND m.week_start = '${weekStart}' AND m.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM public.weekly_menu_slots s
          WHERE s.tenant_id = '${tenantId}'
            AND s.weekly_menu_id = m.id
            AND s.day_date = '${date}'
            AND s.dish_id = '${dishId}'
        );

      -- 2. Customer with NULL user_id (prevents p34_active_identity duplicate conflict)
      INSERT INTO public.customers (id, tenant_id, user_id, kind)
      VALUES ('${customerId}', '${tenantId}', NULL, 'individual');

      -- 3. Canonical order without disabling triggers
      INSERT INTO public.orders (id, tenant_id, customer_id, week_start, status, demand_channel)
      VALUES ('${orderId}', '${tenantId}', '${customerId}', '${weekStart}', '${status}', 'individual');

      -- 4. Order item for dish
      INSERT INTO public.order_items (
        id, order_id, tenant_id, dish_id, day_date, qty, item_kind, unit_price, price_snapshot_status, allergen_state
      ) VALUES (
        '${orderItemId}', '${orderId}', '${tenantId}', '${dishId}', '${date}', ${qty}, 'dish', 9.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );
      COMMIT;
    `);
  }

  beforeAll(() => {
    // 1. Seed auth users, tenants, roles and base entities
    sql(`
      -- Staff user
      INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, aud, role)
      VALUES
        ('${staffUserId}', 'staff-${staffUserId}@yourmeal.test', '{"provider":"email"}', '{}', 'authenticated', 'authenticated'),
        ('${foreignStaffId}', 'foreign-${foreignStaffId}@yourmeal.test', '{"provider":"email"}', '{}', 'authenticated', 'authenticated')
      ON CONFLICT DO NOTHING;

      -- Tenants
      INSERT INTO public.tenants (id, name, slug)
      VALUES
        ('${tenantId}', 'EatClean Primary', 'eatclean-${tenantId}'),
        ('${foreignTenantId}', 'EatClean Competitor', 'competitor-${foreignTenantId}')
      ON CONFLICT DO NOTHING;

      -- Staff memberships and roles
      INSERT INTO public.tenant_members (user_id, tenant_id, status, membership_type)
      VALUES
        ('${staffUserId}', '${tenantId}', 'approved', 'employee'),
        ('${foreignStaffId}', '${foreignTenantId}', 'approved', 'employee')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.user_roles (user_id, tenant_id, role)
      VALUES
        ('${staffUserId}', '${tenantId}', 'company_admin'),
        ('${foreignStaffId}', '${foreignTenantId}', 'company_admin')
      ON CONFLICT DO NOTHING;

      -- Supplier & Initial Ingredients (stock=0, cost=0)
      INSERT INTO public.suppliers (id, tenant_id, name)
      VALUES ('${supplierId}', '${tenantId}', 'Proveedor Central Frescos')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.ingredients (id, tenant_id, supplier_id, name, unit, cost, stock)
      VALUES
        ('${ingredientId}', '${tenantId}', '${supplierId}', 'Pechuga de Pollo Fresca', 'kg', 0, 0),
        ('${ingredientId2}', '${tenantId}', '${supplierId}', 'Arroz Integral', 'kg', 0, 0)
      ON CONFLICT DO NOTHING;

      -- Active Dish with retail price
      INSERT INTO public.dishes (id, tenant_id, name, status, price)
      VALUES ('${dishId}', '${tenantId}', 'Pollo al Limón con Arroz', 'active', 9.50)
      ON CONFLICT DO NOTHING;

      -- Dish recipe: 0.20 kg chicken per portion
      INSERT INTO public.dish_ingredients (dish_id, ingredient_id, tenant_id, qty, unit)
      VALUES ('${dishId}', '${ingredientId}', '${tenantId}', 0.200, 'kg')
      ON CONFLICT DO NOTHING;

      -- Published weekly menu for weekStart
      INSERT INTO public.weekly_menus (id, tenant_id, week_start, status)
      VALUES (gen_random_uuid(), '${tenantId}', '${weekStart}', 'published')
      ON CONFLICT (tenant_id, week_start) WHERE week_start IS NOT NULL AND deleted_at IS NULL
      DO UPDATE SET status = 'published';
    `);

    // 2. Setup clients
    serviceClient = createClient(SUPABASE_URL, makeJwt("service_role"));
    staffClient = createClient(SUPABASE_URL, makeJwt("authenticated", staffUserId));
    foreignStaffClient = createClient(SUPABASE_URL, makeJwt("authenticated", foreignStaffId));
  });

  afterAll(() => {
    __resetInventoryStoreForTests();
    __resetFlow04EvidenceForTests();

    // Clean up test fixtures
    try {
      sql(`
        DELETE FROM public.inventory_consumption_lines WHERE tenant_id = '${tenantId}';
        DELETE FROM public.inventory_consumptions WHERE tenant_id = '${tenantId}';
        DELETE FROM public.order_items WHERE tenant_id = '${tenantId}';
        DELETE FROM public.orders WHERE tenant_id = '${tenantId}';
        DELETE FROM public.weekly_menu_slots WHERE tenant_id = '${tenantId}';
        DELETE FROM public.weekly_menus WHERE tenant_id = '${tenantId}';
        DELETE FROM public.dish_ingredients WHERE tenant_id = '${tenantId}';
        DELETE FROM public.dishes WHERE tenant_id = '${tenantId}';
        DELETE FROM public.purchase_invoice_items WHERE tenant_id = '${tenantId}';
        DELETE FROM public.purchase_invoices WHERE tenant_id = '${tenantId}';
        DELETE FROM public.purchase_receipt_executions WHERE tenant_id = '${tenantId}';
        DELETE FROM public.stock_movements WHERE tenant_id = '${tenantId}';
        DELETE FROM public.ingredients WHERE tenant_id = '${tenantId}';
        DELETE FROM public.suppliers WHERE tenant_id = '${tenantId}';
        DELETE FROM public.user_roles WHERE tenant_id IN ('${tenantId}', '${foreignTenantId}');
        DELETE FROM public.tenant_members WHERE tenant_id IN ('${tenantId}', '${foreignTenantId}');
        DELETE FROM public.tenants WHERE id IN ('${tenantId}', '${foreignTenantId}');
        DELETE FROM auth.users WHERE id IN ('${staffUserId}', '${foreignStaffId}');
      `);
    } catch {
      // ignore cleanup errors
    }
  });

  it("Step 1 (Physical Receipt #553): receives goods atomically, increments stock and sets WAC", async () => {
    const invoiceId = randomUUID();
    const invoiceItemId = randomUUID();
    const receiptExecutionId = randomUUID();

    // Create purchase invoice: 100 kg at 4.50 €/kg
    sql(`
      INSERT INTO public.purchase_invoices (id, tenant_id, supplier_id, invoice_number, subtotal, total_amount, status)
      VALUES ('${invoiceId}', '${tenantId}', '${supplierId}', 'INV-FLOW04-001', 450.00, 450.00, 'draft');

      INSERT INTO public.purchase_invoice_items (
        id, tenant_id, purchase_invoice_id, item_id, item_name, quantity, unit, unit_price, effective_unit_cost, line_total, item_nature
      ) VALUES (
        '${invoiceItemId}', '${tenantId}', '${invoiceId}', '${ingredientId}', 'Pechuga de Pollo Fresca', 100, 'kg', 4.50, 4.50, 450.00, 'INVENTORYABLE'
      );
    `);

    // Call receive_purchase_invoice_v1 RPC as authenticated staff
    const { data, error } = await staffClient.rpc("receive_purchase_invoice_v1", {
      p_tenant_id: tenantId,
      p_invoice_id: invoiceId,
      p_receipt_id: receiptExecutionId,
      p_actor_id: staffUserId,
    });

    expect(error).toBeNull();
    expect((data as any)?.success).toBe(true);
    expect((data as any)?.status).toBe("received");

    // Verify ingredients table stock & WAC
    const ing = scalar<{ stock: number; cost: number }>(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(ing.stock)).toBe(100);
    expect(Number(ing.cost)).toBe(4.5);
  });

  it("Step 2 (Canonical Order Filtering): excludes draft and cancelled orders, including only confirmed operational statuses", async () => {
    const cust1 = randomUUID();
    const cust2 = randomUUID();
    const cust3 = randomUUID();
    const testDate = "2026-10-27";

    // Seed 1 draft order (10 portions) -> must be excluded
    seedCanonicalOrder({
      orderId: randomUUID(),
      customerId: cust1,
      date: testDate,
      qty: 10,
      status: "draft",
    });

    // Seed 1 cancelled order (20 portions) -> must be excluded
    seedCanonicalOrder({
      orderId: randomUUID(),
      customerId: cust2,
      date: testDate,
      qty: 20,
      status: "cancelled",
    });

    // Seed 1 confirmed order (15 portions) -> must be included!
    seedCanonicalOrder({
      orderId: randomUUID(),
      customerId: cust3,
      date: testDate,
      qty: 15,
      status: "confirmed",
    });

    const repo = createInventoryRepository(serviceClient, tenantId);
    const prodInput = await repo.loadProductionPlanInput(tenantId, testDate);

    expect(prodInput).not.toBeNull();
    // Only the confirmed order (15 portions) should be loaded!
    const dishEntry = prodInput!.dishes.find((d) => d.dishId === dishId);
    expect(dishEntry?.portions).toBe(15);
  });

  it("Step 3 (FLOW-04 T1 Plan): atomically creates consumption plan via RPC with validation, idempotency and no stock mutation", async () => {
    const customerId = randomUUID();
    const orderId = randomUUID();

    // Seed confirmed order: 50 portions = 10 kg chicken
    seedCanonicalOrder({
      orderId,
      customerId,
      date: deliveryDate,
      qty: 50,
      status: "confirmed",
    });

    const ctx: ServiceContext = {
      supabase: serviceClient as any,
      tenantId,
      userId: staffUserId,
      roles: ["inventory", "company_admin"],
      capabilities: new Set(["inventory.operate"]),
      localization: null,
      ip: null,
    };

    const plan = await InventoryService.planConsumptionFromProduction(ctx, { deliveryDate });

    expect(plan.status).toBe("planned");
    expect(plan.deliveryDate).toBe(deliveryDate);
    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0].qty).toBe(10);
    expect(plan.lines[0].ingredientId).toBe(ingredientId);

    // Verify persistence in PostgreSQL
    const consRow = scalar<{ status: string; lines_count: number }>(`
      SELECT json_build_object(
        'status', c.status,
        'lines_count', (SELECT count(*) FROM public.inventory_consumption_lines l WHERE l.consumption_id = c.id)
      )
      FROM public.inventory_consumptions c
      WHERE c.id = '${plan.id}' AND c.tenant_id = '${tenantId}'
    `);
    expect(consRow.status).toBe("planned");
    expect(Number(consRow.lines_count)).toBe(1);

    // Stock must NOT mutate in T1
    const stockAfterT1 = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockAfterT1)).toBe(100);

    // Idempotency: creating plan again for same tenant and deliveryDate returns existing plan
    const retryPlan = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: deliveryDate,
      p_lines: [{ ingredient_id: ingredientId, quantity: 10, unit: "kg" }],
      p_actor_id: staffUserId,
    });
    expect(retryPlan.error).toBeNull();
    expect((retryPlan.data as any)?.idempotent).toBe(true);
    expect((retryPlan.data as any)?.consumption_id).toBe(plan.id);

    // Atomic rejection: attempting to create plan with invalid line fails completely and leaves no orphan
    const invalidDate = "2026-11-20";
    const nonExistentIngredient = randomUUID();
    const badPlanResult = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: invalidDate,
      p_lines: [{ ingredient_id: nonExistentIngredient, quantity: 5, unit: "kg" }],
      p_actor_id: staffUserId,
    });
    expect(badPlanResult.error).not.toBeNull();
    const orphanCount = scalar<number>(`
      SELECT count(*) FROM public.inventory_consumptions
      WHERE tenant_id = '${tenantId}' AND delivery_date = '${invalidDate}'
    `);
    expect(Number(orphanCount)).toBe(0);
  });

  it("Step 4 (Direct Write Protection & Actor Security): rejects direct mutations and actor spoofing from authenticated client", async () => {
    // 1. Direct INSERT into inventory_consumptions must fail (REVOKE ALL + SELECT only)
    const directConsInsert = await staffClient
      .from("inventory_consumptions")
      .insert({
        tenant_id: tenantId,
        delivery_date: "2026-12-01",
        status: "planned",
      });
    expect(directConsInsert.error).not.toBeNull();
    expect(directConsInsert.error?.code).toBe("42501");

    // 2. Direct INSERT into inventory_consumption_lines must fail
    const directLineInsert = await staffClient
      .from("inventory_consumption_lines")
      .insert({
        tenant_id: tenantId,
        consumption_id: randomUUID(),
        ingredient_id: ingredientId,
        ingredient_name: "Tampering Test",
        quantity: 5,
        unit: "kg",
      });
    expect(directLineInsert.error).not.toBeNull();
    expect(directLineInsert.error?.code).toBe("42501");

    // 3. Direct UPDATE on inventory_consumptions must fail
    const directConsUpdate = await staffClient
      .from("inventory_consumptions")
      .update({ status: "applied" })
      .eq("tenant_id", tenantId);
    expect(directConsUpdate.error).not.toBeNull();
    expect(directConsUpdate.error?.code).toBe("42501");

    // 4. Actor Spoofing: authenticated staff passing different p_actor_id must be rejected
    const spoofedActorId = randomUUID();
    const spoofAttempt = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: "2026-12-02",
      p_lines: [{ ingredient_id: ingredientId, quantity: 5, unit: "kg" }],
      p_actor_id: spoofedActorId, // Mismatch with auth.uid()!
    });
    expect(spoofAttempt.error).not.toBeNull();
    expect(spoofAttempt.error?.message).toContain("actor mismatch");
    expect(spoofAttempt.error?.code).toBe("42501");
  });

  it("Step 5 (FLOW-04 T2 Apply): atomically decrements stock, records movement and preserves WAC", async () => {
    const repo = createInventoryRepository(serviceClient, tenantId);
    const existing = await repo.findBySource(tenantId, deliveryDate);
    expect(existing).not.toBeNull();
    const consumptionId = existing!.id;

    const ctx: ServiceContext = {
      supabase: serviceClient as any,
      tenantId,
      userId: staffUserId,
      roles: ["inventory", "company_admin"],
      capabilities: new Set(["inventory.operate"]),
      localization: null,
      ip: null,
    };

    const applied = await InventoryService.applyConsumption(ctx, consumptionId);
    expect(applied.status).toBe("applied");

    // Stock must be decremented: 100 - 10 = 90 kg
    const ingAfterT2 = scalar<{ stock: number; cost: number }>(`
      SELECT json_build_object('stock', stock, 'cost', cost)
      FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(ingAfterT2.stock)).toBe(90);
    // WAC must be strictly preserved at 4.50
    expect(Number(ingAfterT2.cost)).toBe(4.5);

    // Audit movement in stock_movements
    const movement = scalar<{
      movement_type: string;
      quantity: number;
      previous_stock: number;
      new_stock: number;
      unit_cost: number;
      reference_document_type: string;
      reference_document_id: string;
    }>(`
      SELECT json_build_object(
        'movement_type', movement_type,
        'quantity', quantity,
        'previous_stock', previous_stock,
        'new_stock', new_stock,
        'unit_cost', unit_cost,
        'reference_document_type', reference_document_type,
        'reference_document_id', reference_document_id
      )
      FROM public.stock_movements
      WHERE tenant_id = '${tenantId}'
        AND ingredient_id = '${ingredientId}'
        AND movement_type = 'PRODUCTION_CONSUMPTION'
      ORDER BY created_at DESC LIMIT 1
    `);

    expect(movement.movement_type).toBe("PRODUCTION_CONSUMPTION");
    expect(Number(movement.quantity)).toBe(10);
    expect(Number(movement.previous_stock)).toBe(100);
    expect(Number(movement.new_stock)).toBe(90);
    expect(Number(movement.unit_cost)).toBe(4.5);
    expect(movement.reference_document_type).toBe("PRODUCTION_ORDER");
    expect(movement.reference_document_id).toBe(consumptionId);
  });

  it("Step 6 (T2 Grouped Validation: Multiple Lines of Same Ingredient): validates aggregated demand preventing negative stock", async () => {
    const multiLineDate = "2026-11-05";
    // Set ingredient stock to exactly 10 kg
    sql(`
      UPDATE public.ingredients SET stock = 10 WHERE id = '${ingredientId}' AND tenant_id = '${tenantId}';
    `);

    // Plan with 2 lines for the SAME ingredient: line 1 = 6 kg, line 2 = 6 kg (Total = 12 kg > 10 kg available)
    const planResult = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: multiLineDate,
      p_lines: [
        { ingredient_id: ingredientId, ingredient_name: "Pechuga Línea 1", quantity: 6, unit: "kg" },
        { ingredient_id: ingredientId, ingredient_name: "Pechuga Línea 2", quantity: 6, unit: "kg" },
      ],
      p_actor_id: staffUserId,
    });
    expect(planResult.error).toBeNull();
    const multiPlanId = (planResult.data as any).consumption_id;

    // Apply must fail with insufficient_stock because 6 + 6 = 12 > 10
    const applyFail = await staffClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: multiPlanId,
      p_actor_id: staffUserId,
    });
    expect(applyFail.error).not.toBeNull();
    expect(applyFail.error?.message).toContain("insufficient_stock");

    // Stock must remain unchanged at 10 (no partial decrement!)
    const stockAfterFail = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockAfterFail)).toBe(10);

    // Now adjust ingredient stock to 20 kg
    sql(`
      UPDATE public.ingredients SET stock = 20 WHERE id = '${ingredientId}' AND tenant_id = '${tenantId}';
    `);

    // Apply should now succeed
    const applySuccess = await staffClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: multiPlanId,
      p_actor_id: staffUserId,
    });
    expect(applySuccess.error).toBeNull();
    expect((applySuccess.data as any).status).toBe("applied");

    // Stock must be decremented: 20 - 12 = 8 kg
    const stockAfterSuccess = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockAfterSuccess)).toBe(8);

    // Verify 2 stock_movements created with proper running stock
    const movements = scalar<Array<{ quantity: number; previous_stock: number; new_stock: number }>>(`
      SELECT json_agg(json_build_object(
        'quantity', quantity,
        'previous_stock', previous_stock,
        'new_stock', new_stock
      ) ORDER BY created_at ASC)
      FROM public.stock_movements
      WHERE reference_document_id = '${multiPlanId}'
    `);
    expect(movements).toHaveLength(2);
    // Line 1: 20 -> 14
    expect(Number(movements[0].previous_stock)).toBe(20);
    expect(Number(movements[0].new_stock)).toBe(14);
    // Line 2: 14 -> 8
    expect(Number(movements[1].previous_stock)).toBe(14);
    expect(Number(movements[1].new_stock)).toBe(8);
  });

  it("Step 7 (T2 Concurrency: Two Different Consumptions): serializes via row lock and prevents negative balance", async () => {
    const datePlanA = "2026-11-06";
    const datePlanB = "2026-11-07";

    // Set stock to 10 kg
    sql(`
      UPDATE public.ingredients SET stock = 10 WHERE id = '${ingredientId}' AND tenant_id = '${tenantId}';
    `);

    // Plan A needs 7 kg
    const planARes = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: datePlanA,
      p_lines: [{ ingredient_id: ingredientId, quantity: 7, unit: "kg" }],
      p_actor_id: staffUserId,
    });
    const planAId = (planARes.data as any).consumption_id;

    // Plan B needs 7 kg
    const planBRes = await staffClient.rpc("create_inventory_consumption_plan_v1", {
      p_tenant_id: tenantId,
      p_delivery_date: datePlanB,
      p_lines: [{ ingredient_id: ingredientId, quantity: 7, unit: "kg" }],
      p_actor_id: staffUserId,
    });
    const planBId = (planBRes.data as any).consumption_id;

    // Both attempt to apply concurrently
    const [resA, resB] = await Promise.all([
      staffClient.rpc("apply_inventory_consumption_v1", {
        p_tenant_id: tenantId,
        p_consumption_id: planAId,
        p_actor_id: staffUserId,
      }),
      staffClient.rpc("apply_inventory_consumption_v1", {
        p_tenant_id: tenantId,
        p_consumption_id: planBId,
        p_actor_id: staffUserId,
      }),
    ]);

    // Exactly one should succeed and one should fail with insufficient_stock
    const succeeded = (resA.error === null ? 1 : 0) + (resB.error === null ? 1 : 0);
    const failed = (resA.error !== null ? 1 : 0) + (resB.error !== null ? 1 : 0);

    expect(succeeded).toBe(1);
    expect(failed).toBe(1);

    const errorMsg = (resA.error || resB.error)?.message;
    expect(errorMsg).toContain("insufficient_stock");

    // Stock must be exactly 10 - 7 = 3 kg (NEVER -4 kg!)
    const stockFinal = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockFinal)).toBe(3);
  });

  it("Step 8 (FLOW-04 T3 Seal & Idempotency): transitions to sealed without stock mutation and acknowledges retries", async () => {
    const repo = createInventoryRepository(serviceClient, tenantId);
    const existing = await repo.findBySource(tenantId, deliveryDate);
    expect(existing).not.toBeNull();
    const consumptionId = existing!.id;

    const ctx: ServiceContext = {
      supabase: serviceClient as any,
      tenantId,
      userId: staffUserId,
      roles: ["inventory", "company_admin"],
      capabilities: new Set(["inventory.operate"]),
      localization: null,
      ip: null,
    };

    const movementsBeforeSeal = scalar<number>(`
      SELECT count(*) FROM public.stock_movements WHERE reference_document_id = '${consumptionId}'
    `);

    const sealed = await InventoryService.sealConsumption(ctx, consumptionId);
    expect(sealed.status).toBe("sealed");

    // No new stock movements in T3
    const movementsAfterSeal = scalar<number>(`
      SELECT count(*) FROM public.stock_movements WHERE reference_document_id = '${consumptionId}'
    `);
    expect(Number(movementsAfterSeal)).toBe(Number(movementsBeforeSeal));

    // Direct RPC call retry on sealed consumption returns idempotent acknowledgment
    const applyRetry = await staffClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
      p_actor_id: staffUserId,
    });
    expect((applyRetry.data as any)?.idempotent).toBe(true);

    const sealRetry = await staffClient.rpc("seal_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
      p_actor_id: staffUserId,
    });
    expect((sealRetry.data as any)?.idempotent).toBe(true);
  });

  it("Step 9 (RLS & Tenant Isolation): foreign tenant cannot access or execute other tenant's consumptions", async () => {
    const repo = createInventoryRepository(serviceClient, tenantId);
    const existing = await repo.findBySource(tenantId, deliveryDate);
    const consumptionId = existing!.id;

    // Foreign user attempting to execute RPC on tenant's consumption -> Rejected
    const { error: rpcErr } = await foreignStaffClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
      p_actor_id: foreignStaffId,
    });
    expect(rpcErr).not.toBeNull();
    expect(rpcErr?.message).toContain("permission denied");

    // Foreign user querying tenant's inventory_consumptions table directly via RLS returns empty
    const { data: foreignData } = await foreignStaffClient
      .from("inventory_consumptions")
      .select("*")
      .eq("id", consumptionId);
    expect(foreignData).toEqual([]);
  });
});
