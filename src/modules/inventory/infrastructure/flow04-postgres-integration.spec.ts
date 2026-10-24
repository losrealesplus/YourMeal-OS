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

describe("FLOW-04 PostgreSQL Integration: Goods Receipt → Inventory → Kitchen Consumption Bridge", () => {
  const tenantId = randomUUID();
  const foreignTenantId = randomUUID();
  const staffUserId = randomUUID();
  const foreignStaffId = randomUUID();
  const supplierId = randomUUID();
  const ingredientId = randomUUID();
  const dishId = randomUUID();
  const deliveryDate = "2026-10-30";

  let serviceClient: any;
  let staffClient: any;
  let foreignStaffClient: any;

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

      -- Supplier & Initial Ingredient (stock=0, cost=0)
      INSERT INTO public.suppliers (id, tenant_id, name)
      VALUES ('${supplierId}', '${tenantId}', 'Proveedor Central Frescos')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.ingredients (id, tenant_id, supplier_id, name, unit, cost, stock)
      VALUES ('${ingredientId}', '${tenantId}', '${supplierId}', 'Pechuga de Pollo Fresca', 'kg', 0, 0)
      ON CONFLICT DO NOTHING;

      -- Dish & Recipe definition
      INSERT INTO public.dishes (id, tenant_id, name, status)
      VALUES ('${dishId}', '${tenantId}', 'Pollo al Limón con Arroz', 'active')
      ON CONFLICT DO NOTHING;

      -- Dish recipe: 0.20 kg of chicken per portion
      INSERT INTO public.dish_ingredients (dish_id, ingredient_id, tenant_id, qty, unit)
      VALUES ('${dishId}', '${ingredientId}', '${tenantId}', 0.200, 'kg')
      ON CONFLICT DO NOTHING;
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

    // Verify stock_movements entry
    const movementsCount = scalar<number>(`
      SELECT count(*) FROM public.stock_movements
      WHERE tenant_id = '${tenantId}'
        AND ingredient_id = '${ingredientId}'
        AND movement_type = 'PURCHASE_RECEIPT'
        AND reference_document_type = 'PURCHASE_INVOICE'
        AND reference_document_id = '${invoiceId}'
    `);
    expect(Number(movementsCount)).toBe(1);
  });

  it("Step 2 (FLOW-04 T1 Plan): loads production source and persists plan to PostgreSQL without mutating stock", async () => {
    const customerId = randomUUID();
    const orderId = randomUUID();
    const orderItemId = randomUUID();

    // Create customer and confirmed order with 50 portions for deliveryDate
    sql(`
      BEGIN;
      ALTER TABLE public.orders DISABLE TRIGGER USER;
      ALTER TABLE public.order_items DISABLE TRIGGER USER;

      INSERT INTO public.customers (id, tenant_id, kind)
      VALUES ('${customerId}', '${tenantId}', 'individual');

      INSERT INTO public.orders (id, tenant_id, customer_id, week_start, status, demand_channel)
      VALUES ('${orderId}', '${tenantId}', '${customerId}', '2026-10-26', 'confirmed', 'individual');

      INSERT INTO public.order_items (
        id, order_id, tenant_id, dish_id, day_date, qty, item_kind, unit_price, price_snapshot_status, allergen_state
      ) VALUES (
        '${orderItemId}', '${orderId}', '${tenantId}', '${dishId}', '${deliveryDate}', 50, 'dish', 9.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );

      ALTER TABLE public.orders ENABLE TRIGGER USER;
      ALTER TABLE public.order_items ENABLE TRIGGER USER;
      COMMIT;
    `);

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
    // 50 portions * 0.20 kg = 10.000 kg
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
  });

  it("Step 3 (FLOW-04 T2 Apply): atomically decrements stock, records PRODUCTION_CONSUMPTION movement, and preserves WAC", async () => {
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

  it("Step 4 (FLOW-04 T3 Seal): transitions to sealed without mutating stock or recording new movements", async () => {
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
      SELECT count(*) FROM public.stock_movements WHERE tenant_id = '${tenantId}'
    `);

    const sealed = await InventoryService.sealConsumption(ctx, consumptionId);

    expect(sealed.status).toBe("sealed");

    // Stock remains 90
    const stockAfterSeal = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockAfterSeal)).toBe(90);

    // No new stock movements in T3
    const movementsAfterSeal = scalar<number>(`
      SELECT count(*) FROM public.stock_movements WHERE tenant_id = '${tenantId}'
    `);
    expect(Number(movementsAfterSeal)).toBe(Number(movementsBeforeSeal));
  });

  it("Step 5 (FLOW04-I2 Idempotency): repeated apply or seal returns idempotent acknowledgment without double-decrement", async () => {
    const repo = createInventoryRepository(serviceClient, tenantId);
    const existing = await repo.findBySource(tenantId, deliveryDate);
    expect(existing).not.toBeNull();
    const consumptionId = existing!.id;

    // Direct RPC call on sealed consumption
    const applyRetry = await serviceClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
      p_actor_id: staffUserId,
    });
    expect((applyRetry.data as any)?.idempotent).toBe(true);

    const sealRetry = await serviceClient.rpc("seal_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
      p_actor_id: staffUserId,
    });
    expect((sealRetry.data as any)?.idempotent).toBe(true);

    // Stock is still 90
    const stockCheck = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockCheck)).toBe(90);
  });

  it("Step 6 (FLOW04-I3 Insufficient Stock): fails atomically when stock is insufficient and rolls back completely", async () => {
    const secondDate = "2026-10-31";
    const customerId = randomUUID();
    const orderId = randomUUID();
    const orderItemId = randomUUID();

    // Create 1000 portions needing 200 kg (available stock is only 90 kg)
    sql(`
      BEGIN;
      ALTER TABLE public.orders DISABLE TRIGGER USER;
      ALTER TABLE public.order_items DISABLE TRIGGER USER;

      INSERT INTO public.customers (id, tenant_id, kind)
      VALUES ('${customerId}', '${tenantId}', 'individual');

      INSERT INTO public.orders (id, tenant_id, customer_id, week_start, status, demand_channel)
      VALUES ('${orderId}', '${tenantId}', '${customerId}', '2026-10-26', 'confirmed', 'individual');

      INSERT INTO public.order_items (
        id, order_id, tenant_id, dish_id, day_date, qty, item_kind, unit_price, price_snapshot_status, allergen_state
      ) VALUES (
        '${orderItemId}', '${orderId}', '${tenantId}', '${dishId}', '${secondDate}', 1000, 'dish', 9.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );

      ALTER TABLE public.orders ENABLE TRIGGER USER;
      ALTER TABLE public.order_items ENABLE TRIGGER USER;
      COMMIT;
    `);

    const ctx: ServiceContext = {
      supabase: serviceClient as any,
      tenantId,
      userId: staffUserId,
      roles: ["inventory", "company_admin"],
      capabilities: new Set(["inventory.operate"]),
      localization: null,
      ip: null,
    };

    const plan = await InventoryService.planConsumptionFromProduction(ctx, { deliveryDate: secondDate });
    expect(plan.lines[0].qty).toBe(200);

    // Attempt apply -> must throw insufficient_stock
    await expect(InventoryService.applyConsumption(ctx, plan.id)).rejects.toThrow();

    // Verify atomic rollback in DB:
    // 1. Stock remains 90
    const stockCheck = scalar<number>(`
      SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'
    `);
    expect(Number(stockCheck)).toBe(90);

    // 2. Consumption status remains 'planned'
    const statusCheck = sql(`
      SELECT status FROM public.inventory_consumptions WHERE id = '${plan.id}'
    `);
    expect(statusCheck).toBe("planned");

    // 3. No stock movement inserted for plan
    const movementsCheck = scalar<number>(`
      SELECT count(*) FROM public.stock_movements WHERE reference_document_id = '${plan.id}'
    `);
    expect(Number(movementsCheck)).toBe(0);
  });

  it("Step 7 (RLS & Tenant Isolation): foreign tenant cannot access or apply consumptions", async () => {
    const repo = createInventoryRepository(serviceClient, tenantId);
    const existing = await repo.findBySource(tenantId, deliveryDate);
    const consumptionId = existing!.id;

    // Foreign user attempting to execute RPC on tenant's consumption
    const { error: rpcErr } = await foreignStaffClient.rpc("apply_inventory_consumption_v1", {
      p_tenant_id: tenantId,
      p_consumption_id: consumptionId,
    });
    expect(rpcErr).not.toBeNull();
    expect(rpcErr?.message).toContain("permission denied");

    // Foreign user querying tenant's inventory_consumptions table directly via RLS
    const { data: foreignData } = await foreignStaffClient
      .from("inventory_consumptions")
      .select("*")
      .eq("id", consumptionId);
    expect(foreignData).toEqual([]);
  });

  it("Step 8 (Concurrency & Row Locking): simultaneous apply requests serialize safely with row lock (no double-decrement)", async () => {
    const concurrentDate = "2026-11-01";
    const customerId = randomUUID();
    const orderId = randomUUID();
    const orderItemId = randomUUID();

    // Create 10 portions needing 2 kg
    sql(`
      BEGIN;
      ALTER TABLE public.orders DISABLE TRIGGER USER;
      ALTER TABLE public.order_items DISABLE TRIGGER USER;

      INSERT INTO public.customers (id, tenant_id, kind)
      VALUES ('${customerId}', '${tenantId}', 'individual');

      INSERT INTO public.orders (id, tenant_id, customer_id, week_start, status, demand_channel)
      VALUES ('${orderId}', '${tenantId}', '${customerId}', '2026-10-26', 'confirmed', 'individual');

      INSERT INTO public.order_items (
        id, order_id, tenant_id, dish_id, day_date, qty, item_kind, unit_price, price_snapshot_status, allergen_state
      ) VALUES (
        '${orderItemId}', '${orderId}', '${tenantId}', '${dishId}', '${concurrentDate}', 10, 'dish', 9.50, 'captured', 'HISTORICAL_UNAVAILABLE'
      );

      ALTER TABLE public.orders ENABLE TRIGGER USER;
      ALTER TABLE public.order_items ENABLE TRIGGER USER;
      COMMIT;
    `);

    const ctx: ServiceContext = {
      supabase: serviceClient as any,
      tenantId,
      userId: staffUserId,
      roles: ["inventory", "company_admin"],
      capabilities: new Set(["inventory.operate"]),
      localization: null,
      ip: null,
    };

    const plan = await InventoryService.planConsumptionFromProduction(ctx, { deliveryDate: concurrentDate });
    const stockBefore = Number(scalar<number>(`SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'`));

    // Two parallel RPC calls racing to apply the same consumption
    const [resA, resB] = await Promise.all([
      serviceClient.rpc("apply_inventory_consumption_v1", {
        p_tenant_id: tenantId,
        p_consumption_id: plan.id,
        p_actor_id: staffUserId,
      }),
      serviceClient.rpc("apply_inventory_consumption_v1", {
        p_tenant_id: tenantId,
        p_consumption_id: plan.id,
        p_actor_id: staffUserId,
      }),
    ]);

    expect(resA.error).toBeNull();
    expect(resB.error).toBeNull();

    // One applied, one idempotent
    const idempotentCount =
      ((resA.data as any)?.idempotent ? 1 : 0) +
      ((resB.data as any)?.idempotent ? 1 : 0);
    expect(idempotentCount).toBe(1);

    // Stock must have decremented by exactly 2 kg, NOT 4 kg
    const stockAfter = Number(scalar<number>(`SELECT stock FROM public.ingredients WHERE id = '${ingredientId}'`));
    expect(stockAfter).toBe(stockBefore - 2);

    // Only one stock_movement created
    const countMovements = scalar<number>(`
      SELECT count(*) FROM public.stock_movements WHERE reference_document_id = '${plan.id}'
    `);
    expect(Number(countMovements)).toBe(1);
  });
});
