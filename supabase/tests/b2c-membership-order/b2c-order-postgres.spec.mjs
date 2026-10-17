import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";

const exec = promisify(execFile);

const DB_HOST = process.env.PGHOST || "127.0.0.1";
const DB_PORT = process.env.PGPORT || "54322";
const DB_USER = process.env.PGUSER || "postgres";
const DB_NAME = process.env.PGDATABASE || "postgres";
const DB_PASS = process.env.PGPASSWORD || "postgres";

async function query(sql) {
  const { stdout } = await exec(
    "psql",
    [
      "-h", DB_HOST,
      "-p", DB_PORT,
      "-U", DB_USER,
      "-d", DB_NAME,
      "-v", "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c", sql,
    ],
    {
      env: { ...process.env, PGPASSWORD: DB_PASS },
    }
  );
  return stdout.trim();
}

async function queryJson(sql) {
  let res = await query(sql);
  if (!res) return null;
  res = res.replace(/^SET\s+/g, "").trim();
  return JSON.parse(res);
}

test("PostgreSQL B2C Customer Order Authorization (PR #538 & ADR 0065)", async (t) => {
  const tenantId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const customerId = crypto.randomUUID();
  const dishMon = crypto.randomUUID();
  const dishWed = crypto.randomUUID();
  const dishFri = crypto.randomUUID();
  const menuId = crypto.randomUUID();
  const slotMon = crypto.randomUUID();
  const slotWed = crypto.randomUUID();
  const slotFri = crypto.randomUUID();
  const weekStart = "2026-10-19";

  // Setup test tenant, menu, slots, customer
  await query(`
    INSERT INTO public.tenants (id, slug, name) VALUES ('${tenantId}', 'b2c-${tenantId.slice(0, 8)}', 'B2C Tenant');
    INSERT INTO auth.users (id, email) VALUES ('${userId}', 'b2c-${userId.slice(0, 8)}@test.com');
    
    -- Approved membership of type 'customer', 0 rows in user_roles
    INSERT INTO public.tenant_members (tenant_id, user_id, status, membership_type, provisioning_channel)
    VALUES ('${tenantId}', '${userId}', 'approved', 'customer', 'self_registration');

    INSERT INTO public.customers (id, tenant_id, user_id, display_name, email)
    VALUES ('${customerId}', '${tenantId}', '${userId}', 'Cuenta A Customer', 'b2c.customer@test.com');

    INSERT INTO public.dishes (id, tenant_id, name, price, status)
    VALUES
      ('${dishMon}', '${tenantId}', 'Salmón Grill Lunes', 13.50, 'active'),
      ('${dishWed}', '${tenantId}', 'Pollo Asado Miércoles', 11.00, 'active'),
      ('${dishFri}', '${tenantId}', 'Bowl Quinoa Viernes', 9.50, 'active');

    INSERT INTO public.weekly_menus (id, tenant_id, week_start, status)
    VALUES ('${menuId}', '${tenantId}', '${weekStart}', 'published');

    INSERT INTO public.weekly_menu_slots (id, tenant_id, weekly_menu_id, dish_id, day_date, unit_price)
    VALUES
      ('${slotMon}', '${tenantId}', '${menuId}', '${dishMon}', '2026-10-19', 13.50),
      ('${slotWed}', '${tenantId}', '${menuId}', '${dishWed}', '2026-10-21', 11.00),
      ('${slotFri}', '${tenantId}', '${menuId}', '${dishFri}', '2026-10-23', 9.50);
  `);

  await t.test("TC-01: CUSTOMER_QUOTE_AUTH — B2C customer without user_roles issues canonical quote", async () => {
    const requestId = crypto.randomUUID();
    const command = {
      operation: "capture",
      customer: { kind: "existing", id: customerId },
      weekStart: weekStart,
      lines: [
        { kind: "dish", dishId: dishMon, slotId: slotMon, dayDate: "2026-10-19", qty: 2 },
      ],
    };
    const context = {
      active: true,
      mode: "individual_line_pricing_v1",
      policyHash: "a".repeat(64),
    };

    const sql = `
      SET ROLE service_role;
      SELECT public.cr_order_offer_quote_issue(
        '${tenantId}',
        '${userId}',
        '${requestId}',
        '${JSON.stringify(command)}'::jsonb,
        '${JSON.stringify(context)}'::jsonb
      );
    `;
    const res = await queryJson(sql);

    assert.ok(res.quoteId, "Quote ID must be returned");
    assert.strictEqual(res.total, "27.00", "Total must match 2 x 13.50");
    assert.strictEqual(res.lines.length, 1);
    assert.strictEqual(res.lines[0].unitPrice, "13.5000");
  });

  await t.test("TC-02: CUSTOMER_COMMIT_AUTH & ORDER_PERSISTENCE — B2C customer commits quote to draft order", async () => {
    const requestId = crypto.randomUUID();
    const command = {
      operation: "capture",
      customer: { kind: "existing", id: customerId },
      weekStart: weekStart,
      lines: [
        { kind: "dish", dishId: dishMon, slotId: slotMon, dayDate: "2026-10-19", qty: 2 },
      ],
    };
    const context = {
      active: true,
      mode: "individual_line_pricing_v1",
      policyHash: "a".repeat(64),
    };

    const quoteRes = await queryJson(`
      SET ROLE service_role;
      SELECT public.cr_order_offer_quote_issue(
        '${tenantId}',
        '${userId}',
        '${requestId}',
        '${JSON.stringify(command)}'::jsonb,
        '${JSON.stringify(context)}'::jsonb
      );
    `);

    const commitRes = await queryJson(`
      SET ROLE service_role;
      SELECT public.cr_order_offer_quote_commit(
        '${tenantId}',
        '${userId}',
        '${requestId}',
        '${quoteRes.quoteId}',
        '${JSON.stringify(command)}'::jsonb,
        '${JSON.stringify(context)}'::jsonb
      );
    `);

    assert.ok(commitRes.order, "Order object must be returned in commit");
    assert.strictEqual(commitRes.order.status, "draft", "Status must be draft");
    assert.strictEqual(commitRes.order.write_contract_version, 2, "Contract version must be 2");
    assert.strictEqual(commitRes.order.total, 27.00, "Total must be 27.00");
    assert.strictEqual(commitRes.order.customer_id, customerId, "Customer ID must match");

    // Verify raw table rows
    const persistedOrder = await queryJson(`
      SELECT row_to_json(o) FROM public.orders o WHERE id = '${commitRes.order.id}';
    `);
    assert.strictEqual(persistedOrder.total, 27.00);

    const persistedItems = await queryJson(`
      SELECT json_agg(i) FROM public.order_items i WHERE order_id = '${commitRes.order.id}';
    `);
    assert.strictEqual(persistedItems.length, 1);
    assert.strictEqual(persistedItems[0].dish_id, dishMon);
    assert.strictEqual(persistedItems[0].qty, 2);
    assert.strictEqual(persistedItems[0].unit_price, 13.5);
  });

  await t.test("TC-03: MULTIDAY_PERSISTENCE — Preserves multiple days, dates, quantities and prices", async () => {
    const requestId = crypto.randomUUID();
    // Mon: 2 x 13.50 = 27.00
    // Wed: 1 x 11.00 = 11.00
    // Fri: 3 x 9.50 = 28.50
    // Total = 66.50
    const command = {
      operation: "capture",
      customer: { kind: "existing", id: customerId },
      weekStart: weekStart,
      lines: [
        { kind: "dish", dishId: dishMon, slotId: slotMon, dayDate: "2026-10-19", qty: 2 },
        { kind: "dish", dishId: dishWed, slotId: slotWed, dayDate: "2026-10-21", qty: 1 },
        { kind: "dish", dishId: dishFri, slotId: slotFri, dayDate: "2026-10-23", qty: 3 },
      ],
    };
    const context = {
      active: true,
      mode: "individual_line_pricing_v1",
      policyHash: "b".repeat(64),
    };

    const quoteRes = await queryJson(`
      SET ROLE service_role;
      SELECT public.cr_order_offer_quote_issue(
        '${tenantId}',
        '${userId}',
        '${requestId}',
        '${JSON.stringify(command)}'::jsonb,
        '${JSON.stringify(context)}'::jsonb
      );
    `);
    assert.strictEqual(quoteRes.total, "66.50", "Multiday quote total must equal 66.50");
    assert.strictEqual(quoteRes.lines.length, 3, "3 distinct day lines must be quoted");

    const commitRes = await queryJson(`
      SET ROLE service_role;
      SELECT public.cr_order_offer_quote_commit(
        '${tenantId}',
        '${userId}',
        '${requestId}',
        '${quoteRes.quoteId}',
        '${JSON.stringify(command)}'::jsonb,
        '${JSON.stringify(context)}'::jsonb
      );
    `);

    assert.strictEqual(commitRes.order.total, 66.50);
    assert.strictEqual(commitRes.items.length, 3);

    const items = await queryJson(`
      SELECT json_agg(i ORDER BY i.day_date) FROM public.order_items i WHERE order_id = '${commitRes.order.id}';
    `);
    assert.strictEqual(items[0].day_date, "2026-10-19");
    assert.strictEqual(items[0].qty, 2);
    assert.strictEqual(items[0].unit_price, 13.5);

    assert.strictEqual(items[1].day_date, "2026-10-21");
    assert.strictEqual(items[1].qty, 1);
    assert.strictEqual(items[1].unit_price, 11.0);

    assert.strictEqual(items[2].day_date, "2026-10-23");
    assert.strictEqual(items[2].qty, 3);
    assert.strictEqual(items[2].unit_price, 9.5);
  });

  await t.test("TC-04: DEFENSE-IN-DEPTH — Pending membership fails with PERMISSION_DENIED", async () => {
    const pendingUser = crypto.randomUUID();
    const pendingCust = crypto.randomUUID();
    await query(`
      INSERT INTO auth.users (id, email) VALUES ('${pendingUser}', 'pending-${pendingUser.slice(0, 8)}@test.com');
      INSERT INTO public.tenant_members (tenant_id, user_id, status, membership_type)
      VALUES ('${tenantId}', '${pendingUser}', 'pending', 'customer');
      INSERT INTO public.customers (id, tenant_id, user_id, display_name)
      VALUES ('${pendingCust}', '${tenantId}', '${pendingUser}', 'Pending Customer');
    `);

    const command = {
      operation: "capture",
      customer: { kind: "existing", id: pendingCust },
      weekStart: weekStart,
      lines: [{ kind: "dish", dishId: dishMon, slotId: slotMon, dayDate: "2026-10-19", qty: 1 }],
    };

    await assert.rejects(
      async () => {
        await query(`
          SET ROLE service_role;
          SELECT public.cr_order_offer_quote_issue(
            '${tenantId}',
            '${pendingUser}',
            gen_random_uuid(),
            '${JSON.stringify(command)}'::jsonb,
            '{"active":true,"mode":"individual_line_pricing_v1","policyHash":"${"c".repeat(64)}"}'::jsonb
          );
        `);
      },
      (err) => err.message.includes("PERMISSION_DENIED"),
      "Pending membership must be rejected with PERMISSION_DENIED"
    );
  });

  await t.test("TC-05: DEFENSE-IN-DEPTH — Custom lines by customer strictly rejected", async () => {
    const command = {
      operation: "capture",
      customer: { kind: "existing", id: customerId },
      weekStart: weekStart,
      lines: [
        { kind: "custom", name: "Custom Dish", unitPrice: "20.00", dayDate: "2026-10-19", qty: 1 },
      ],
    };

    await assert.rejects(
      async () => {
        await query(`
          SET ROLE service_role;
          SELECT cr_order_private.check_offer_actor('${tenantId}', '${userId}', '${JSON.stringify(command)}'::jsonb);
        `);
      },
      (err) => err.message.includes("PERMISSION_DENIED"),
      "Custom line requested by customer must fail with PERMISSION_DENIED"
    );
  });

  await t.test("TC-06: DEFENSE-IN-DEPTH — Ordering for another customer rejected", async () => {
    const otherCust = crypto.randomUUID();
    const otherUser = crypto.randomUUID();
    await query(`
      INSERT INTO auth.users (id, email) VALUES ('${otherUser}', 'other-${otherUser.slice(0, 8)}@test.com');
      INSERT INTO public.customers (id, tenant_id, user_id, display_name)
      VALUES ('${otherCust}', '${tenantId}', '${otherUser}', 'Other Customer');
    `);

    const command = {
      operation: "capture",
      customer: { kind: "existing", id: otherCust },
      weekStart: weekStart,
      lines: [{ kind: "dish", dishId: dishMon, slotId: slotMon, dayDate: "2026-10-19", qty: 1 }],
    };

    await assert.rejects(
      async () => {
        await query(`
          SET ROLE service_role;
          SELECT cr_order_private.check_offer_actor('${tenantId}', '${userId}', '${JSON.stringify(command)}'::jsonb);
        `);
      },
      (err) => err.message.includes("PERMISSION_DENIED"),
      "Attempting to capture order for another customer must fail with PERMISSION_DENIED"
    );
  });
});
