import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync, spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { InventoryService } from "@/modules/inventory/application/inventory-service";
import {
  __seedStock,
  __seedProductionPlanInput,
  __resetInventoryStoreForTests,
  createInventoryRepository,
} from "@/modules/inventory/infrastructure/inventory-repository";
import { __resetFlow04EvidenceForTests } from "@/modules/inventory/application/flow04-evidence";
import type { ServiceContext } from "@/services/types";

// Opt-in only: fixed disposable laboratory; never reads host DB credentials.
const enabled = process.env.RECEIPT553_LOCAL_LAB === "1";
const db = "receipt553-test-db";
const tenant = "11111111-aaaa-4444-aaaa-111111111111";
const other = "22222222-bbbb-4444-bbbb-222222222222";
const supplier = "33333333-cccc-4444-cccc-333333333333";
const secret = "p34-local-synthetic-signing-secret-not-for-production-2026";
const sql = (s: string) =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      db,
      "psql",
      "-XqAt",
      "-U",
      "supabase_admin",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
    ],
    { input: s, encoding: "utf8" },
  ).trim();
const scalar = (s: string) => JSON.parse(sql(s));
function jwt(role: string) {
  const a = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const b = Buffer.from(
    JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url");
  return `${a}.${b}.${createHmac("sha256", secret).update(`${a}.${b}`).digest("base64url")}`;
}
async function transport(
  url: string,
  token: string,
  body?: unknown,
  method = "POST",
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "exec",
        "-i",
        "receipt553-test-transport",
        "node",
        "-e",
        "let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',async()=>{const x=JSON.parse(s);const r=await fetch(x.url,x.options);console.log(JSON.stringify({status:r.status,body:await r.json().catch(()=>null)}))});",
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let out = "",
      err = "";
    child.stdout.on("data", (b) => (out += b));
    child.stderr.on("data", (b) => (err += b));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code) reject(new Error(err));
      else {
        try {
          resolve(JSON.parse(out));
        } catch (e) {
          reject(e);
        }
      }
    });
    child.stdin.end(
      JSON.stringify({
        url,
        options: {
          method,
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
      }),
    );
  });
}
const request = (path: string, token: string, body?: unknown, method = "POST") =>
  transport("http://receipt553-test-rest:3000/" + path, token, body, method);
let staff = "",
  customer = "",
  outsider = "",
  staffId = "";
async function user(name: string) {
  const password = "Synthetic-Receipt-553-Only!";
  const r = await transport("http://receipt553-test-auth:9999/admin/users", jwt("service_role"), {
    email: name + "@receipt553.test",
    password,
    email_confirm: true,
  });
  let u = r.body;
  if (r.status !== 200) {
    const existing = await transport(
      "http://receipt553-test-auth:9999/admin/users",
      jwt("service_role"),
      undefined,
      "GET",
    );
    u = existing.body.users.find((x: any) => x.email === name + "@receipt553.test");
  }
  expect(u?.id).toBeTruthy();
  const login = await transport("http://receipt553-test-auth:9999/token?grant_type=password", "", {
    email: name + "@receipt553.test",
    password,
  });
  expect(login.status, JSON.stringify(login.body)).toBe(200);
  return { id: u.id, token: login.body.access_token };
}
function fixture(
  cost = 5,
  qty = 10,
  ingredient = randomUUID(),
  status = "draft",
  nature = "INVENTORYABLE",
  unit = "kg",
) {
  const invoice = randomUUID(),
    line = randomUUID();
  sql(`INSERT INTO ingredients(id,tenant_id,name,unit,cost,stock) VALUES('${ingredient}','${tenant}','Synthetic','kg',0,0) ON CONFLICT DO NOTHING;
 INSERT INTO purchase_invoices(id,tenant_id,supplier_id,invoice_number,subtotal,total_amount,status) VALUES('${invoice}','${tenant}','${supplier}','${invoice}',50,50,'${status}');
 INSERT INTO purchase_invoice_items(id,tenant_id,purchase_invoice_id,item_id,item_name,quantity,unit,unit_price,effective_unit_cost,line_total,item_nature) VALUES('${line}','${tenant}','${invoice}','${ingredient}','Synthetic',${qty},'${unit}',${cost},${cost},50,'${nature}');`);
  return { invoice, line, ingredient };
}
const rpc = (
  f: ReturnType<typeof fixture>,
  receipt = randomUUID(),
  lines: unknown = null,
  token = staff,
  extra = {},
) =>
  request("rpc/receive_purchase_invoice_v1", token, {
    p_tenant_id: tenant,
    p_invoice_id: f.invoice,
    p_receipt_id: receipt,
    p_received_lines: lines,
    ...extra,
  });
const stock = (id: string) =>
  scalar(`SELECT json_build_object('stock',stock,'cost',cost) FROM ingredients WHERE id='${id}'`);

describe.skipIf(!enabled)("CR-COST-1A · isolated PostgreSQL + GoTrue + PostgREST", () => {
  beforeAll(async () => {
    const a = await user("staff"),
      b = await user("customer"),
      c = await user("outsider");
    staff = a.token;
    customer = b.token;
    outsider = c.token;
    staffId = a.id;
    sql(`INSERT INTO tenants(id,name,slug) VALUES('${tenant}','Synthetic A','receipt553-a'),('${other}','Synthetic B','receipt553-b') ON CONFLICT DO NOTHING;
  INSERT INTO suppliers(id,tenant_id,name) VALUES('${supplier}','${tenant}','Synthetic supplier');
  INSERT INTO tenant_members(user_id,tenant_id,status,membership_type) VALUES('${a.id}','${tenant}','approved','employee'),('${b.id}','${tenant}','approved','customer'),('${c.id}','${other}','approved','employee');
  INSERT INTO user_roles(user_id,tenant_id,role) VALUES('${a.id}','${tenant}','company_admin'),('${b.id}','${tenant}','customer'),('${c.id}','${other}','company_admin');
  GRANT USAGE ON SCHEMA public TO authenticated,anon;`);
  }, 30000);
  afterAll(() => {
    __resetInventoryStoreForTests();
    __resetFlow04EvidenceForTests();
  });
  it("receives atomically with WAC, authenticated actor and immutable evidence", async () => {
    const f = fixture();
    const r = await rpc(f);
    expect(r.status).toBe(200);
    expect(stock(f.ingredient)).toEqual({ stock: 10, cost: 5 });
    expect(
      sql(`SELECT created_by FROM stock_movements WHERE reference_document_id='${f.invoice}'`),
    ).toBe(staffId);
    expect(
      sql(`SELECT count(*) FROM item_cost_history WHERE source_invoice_item_id='${f.line}'`),
    ).toBe("1");
  });
  it("exact retry is idempotent; other invoice or quantities with same key are rejected", async () => {
    const f = fixture(),
      g = fixture(),
      key = randomUUID();
    const lines = [{ line_id: f.line, quantity: 2 }];
    expect((await rpc(f, key, lines)).status).toBe(200);
    expect((await rpc(f, key, lines)).body.idempotent).toBe(true);
    expect((await rpc(f, key, [{ line_id: f.line, quantity: 3 }])).status).toBe(400);
    expect((await rpc(g, key)).status).toBe(400);
    expect(stock(f.ingredient).stock).toBe(2);
  });
  it.each(
    [
      {},
      null,
      "bad",
      42,
      [],
      [{}],
      [{ line_id: "bad", quantity: 1 }],
      [{ quantity: 1 }],
      [{ line_id: randomUUID(), quantity: 1 }],
    ].map((x) => [x]),
  )("rejects malformed/unknown lines %j without stock changes", async (lines) => {
    const f = fixture(); // JSON null must be tested as literal jsonb via authenticated DB session below.
    if (lines === null) {
      expect(() =>
        sql(
          `SET ROLE authenticated; SELECT set_config('request.jwt.claims','{"sub":"${staffId}","role":"authenticated"}',false); SELECT receive_purchase_invoice_v1('${tenant}','${f.invoice}',gen_random_uuid(),'null'::jsonb);`,
        ),
      ).toThrow();
    } else expect((await rpc(f, randomUUID(), lines)).status).toBeGreaterThanOrEqual(400);
    expect(stock(f.ingredient).stock).toBe(0);
  });
  it.each([-1, 0, 11, 0.0001, "1", null])("rejects invalid quantity %j", async (quantity) => {
    const f = fixture();
    expect((await rpc(f, randomUUID(), [{ line_id: f.line, quantity }])).status).toBe(400);
    expect(stock(f.ingredient).stock).toBe(0);
  });
  it("rejects duplicate lines and foreign invoice lines", async () => {
    const f = fixture(),
      g = fixture();
    const l = { line_id: f.line, quantity: 1 };
    expect((await rpc(f, randomUUID(), [l, l])).status).toBe(400);
    expect((await rpc(f, randomUUID(), [{ line_id: g.line, quantity: 1 }])).status).toBe(400);
  });
  it.each(["received", "posted", "cancelled"])(
    "does not receive historical/status %s invoices",
    async (status) => {
      const f = fixture(5, 10, randomUUID(), status);
      expect((await rpc(f)).status).toBe(400);
      expect(stock(f.ingredient).stock).toBe(0);
    },
  );
  it("denies customer, other tenant, anonymous and forged actor", async () => {
    const f = fixture();
    for (const token of [customer, outsider, jwt("anon")])
      expect((await rpc(f, randomUUID(), null, token)).status).toBeGreaterThanOrEqual(400);
    expect((await rpc(f, randomUUID(), null, staff, { p_actor_id: randomUUID() })).status).toBe(
      403,
    );
    expect(stock(f.ingredient).stock).toBe(0);
  });
  it("audit INSERT/UPDATE/DELETE denied; SELECT tenant isolated", async () => {
    const f = fixture();
    await rpc(f);
    for (const table of ["stock_movements", "purchase_receipt_executions"]) {
      for (const method of ["POST", "PATCH", "DELETE"]) {
        const path = method === "POST" ? table : table + "?tenant_id=eq." + tenant;
        expect(
          (
            await request(
              path,
              staff,
              method === "DELETE" ? undefined : { tenant_id: tenant },
              method,
            )
          ).status,
        ).toBe(403);
      }
      expect((await request(table, outsider, undefined, "GET")).body).toEqual([]);
      expect((await request(table, staff, undefined, "GET")).body.length).toBeGreaterThan(0);
    }
  });
  it("simultaneous independent requests serialize ingredient locks and preserve WAC", async () => {
    const f = fixture(5),
      g = fixture(7, 10, f.ingredient);
    // Hold the ingredient lock on a third independent connection. Both RPCs must wait.
    const blocker = spawn(
      "docker",
      ["exec", "-i", db, "psql", "-XqAt", "-U", "supabase_admin", "-d", "postgres"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    blocker.stdin.end(
      `BEGIN; SELECT id FROM ingredients WHERE id='${f.ingredient}' FOR UPDATE; SELECT pg_sleep(2); COMMIT;`,
    );
    await new Promise<void>((resolve) => blocker.stdout.once("data", () => resolve()));
    const pending = Promise.all([rpc(f), rpc(g)]);
    await new Promise((r) => setTimeout(r, 150));
    expect(
      Number(
        sql(
          "SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%receive_purchase_invoice_v1%'",
        ),
      ),
    ).toBeGreaterThanOrEqual(2);
    const result = await pending;
    expect(result.map((x) => x.status)).toEqual([200, 200]);
    expect(stock(f.ingredient)).toEqual({ stock: 20, cost: 6 });
    expect(sql(`SELECT count(*) FROM stock_movements WHERE ingredient_id='${f.ingredient}'`)).toBe(
      "2",
    );
  }, 15000);
  it("simultaneous identical keys commit once; conflicting keys reject without duplicates", async () => {
    const f = fixture(),
      key = randomUUID();
    const r = await Promise.all([rpc(f, key), rpc(f, key)]);
    expect(r.map((x) => x.status)).toEqual([200, 200]);
    expect(r.filter((x) => x.body.idempotent)).toHaveLength(1);
    expect(stock(f.ingredient).stock).toBe(10);
    const g = fixture(),
      h = fixture(),
      same = randomUUID();
    const clash = await Promise.all([rpc(g, same), rpc(h, same)]);
    expect(clash.map((x) => x.status).sort()).toEqual([200, 400]);
  });
  it("partial receipt and expense/CAPEX do not corrupt inventory", async () => {
    const f = fixture();
    expect((await rpc(f, randomUUID(), [{ line_id: f.line, quantity: 2 }])).body.status).toBe(
      "partially_received",
    );
    expect((await rpc(f)).body.status).toBe("received");
    expect(stock(f.ingredient).stock).toBe(10);
    for (const nature of ["EXPENSE_SERVICE", "CAPEX_ASSET"]) {
      const g = fixture(5, 10, randomUUID(), "draft", nature);
      expect((await rpc(g)).status).toBe(200);
      expect(stock(g.ingredient).stock).toBe(0);
    }
  });
  it("failure after an earlier line rolls back stock, ledger, history and document", async () => {
    const f = fixture(),
      bad = randomUUID();
    sql(
      `INSERT INTO purchase_invoice_items(id,tenant_id,purchase_invoice_id,item_id,item_name,quantity,unit,unit_price,effective_unit_cost,line_total) VALUES('${bad}','${tenant}','${f.invoice}','${f.ingredient}','bad unit',1,'invalid',1,1,1);`,
    );
    expect((await rpc(f)).status).toBe(400);
    expect(stock(f.ingredient).stock).toBe(0);
    expect(
      sql(`SELECT count(*) FROM stock_movements WHERE reference_document_id='${f.invoice}'`),
    ).toBe("0");
    expect(
      sql(`SELECT count(*) FROM purchase_receipt_executions WHERE invoice_id='${f.invoice}'`),
    ).toBe("0");
    expect(sql(`SELECT status FROM purchase_invoices WHERE id='${f.invoice}'`)).toBe("draft");
  });
  it("normalizes purchase g to stock kg and preserves WAC", async () => {
    const f = fixture(0.005, 10000, randomUUID(), "draft", "INVENTORYABLE", "g");
    expect((await rpc(f)).status).toBe(200);
    expect(stock(f.ingredient)).toEqual({ stock: 10, cost: 5 });
  });
  it("rejects conversions that would silently round stock to zero", async () => {
    const f = fixture(1, 0.001, randomUUID(), "draft", "INVENTORYABLE", "g");
    expect((await rpc(f)).status).toBe(400);
    expect(stock(f.ingredient).stock).toBe(0);
  });
  it("rejects quantities above remaining pending stock and inactive ingredients", async () => {
    const f = fixture();
    await rpc(f, randomUUID(), [{ line_id: f.line, quantity: 9 }]);
    expect((await rpc(f, randomUUID(), [{ line_id: f.line, quantity: 2 }])).status).toBe(400);
    expect(stock(f.ingredient).stock).toBe(9);
    const g = fixture();
    sql(`UPDATE ingredients SET deleted_at=now() WHERE id='${g.ingredient}'`);
    expect((await rpc(g)).status).toBe(400);
    expect(stock(g.ingredient).stock).toBe(0);
  });
  it("concurrent different receipt keys cannot overreceive a single invoice", async () => {
    const f = fixture();
    const r = await Promise.all([rpc(f), rpc(f)]);
    expect(r.map((x) => x.status).sort()).toEqual([200, 400]);
    expect(stock(f.ingredient).stock).toBe(10);
  });
  it("ledger failure after mutations rolls back stock and every audit write", async () => {
    const f = fixture();
    sql(`CREATE FUNCTION public.receipt553_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic ledger failure'; END $$;
    CREATE TRIGGER receipt553_fail BEFORE INSERT ON purchase_receipt_executions FOR EACH ROW EXECUTE FUNCTION public.receipt553_fail();`);
    try {
      expect((await rpc(f)).status).toBeGreaterThanOrEqual(400);
      expect(stock(f.ingredient).stock).toBe(0);
      expect(
        sql(`SELECT count(*) FROM item_cost_history WHERE source_invoice_item_id='${f.line}'`),
      ).toBe("0");
      expect(
        sql(`SELECT count(*) FROM stock_movements WHERE reference_document_id='${f.invoice}'`),
      ).toBe("0");
      expect(sql(`SELECT received_quantity FROM purchase_invoice_items WHERE id='${f.line}'`)).toBe(
        "0.000",
      );
    } finally {
      sql(
        "DROP TRIGGER receipt553_fail ON purchase_receipt_executions; DROP FUNCTION public.receipt553_fail();",
      );
    }
  });
  it("cannot erase receipt evidence by deleting the invoice or ingredient", async () => {
    const f = fixture();
    await rpc(f);
    expect(() => sql(`DELETE FROM purchase_invoices WHERE id='${f.invoice}'`)).toThrow();
    expect(() => sql(`DELETE FROM ingredients WHERE id='${f.ingredient}'`)).toThrow();
    expect(
      sql(`SELECT count(*) FROM purchase_receipt_executions WHERE invoice_id='${f.invoice}'`),
    ).toBe("1");
  });
  it("executes actual FLOW04 T1/T2/T3 with received quantity; exposes existing memory-only boundary", async () => {
    const f = fixture();
    expect((await rpc(f)).status).toBe(200);
    __resetInventoryStoreForTests();
    __resetFlow04EvidenceForTests();
    __seedStock(tenant, f.ingredient, stock(f.ingredient).stock);
    __seedProductionPlanInput(tenant, {
      deliveryDate: "2026-10-24",
      dishes: [{ dishId: "synthetic", portions: 7 }],
      recipes: [
        {
          dishId: "synthetic",
          ingredientId: f.ingredient,
          ingredientName: "Synthetic",
          qty: 0.5,
          unit: "kg",
        },
      ],
    });
    const ctx = {
      supabase: {} as ServiceContext["supabase"],
      tenantId: tenant,
      userId: staffId,
      capabilities: new Set(["inventory.operate"]),
      roles: [],
      localization: null,
      ip: null,
    } as ServiceContext;
    const plan = await InventoryService.planConsumptionFromProduction(ctx, {
      deliveryDate: "2026-10-24",
    });
    const applied = await InventoryService.applyConsumption(ctx, plan.id);
    expect(applied.status).toBe("applied");
    await InventoryService.applyConsumption(ctx, plan.id);
    expect(await createInventoryRepository({}, tenant).getStock(tenant, f.ingredient)).toBe(6.5);
    expect((await InventoryService.sealConsumption(ctx, plan.id)).status).toBe("sealed");
    // Explicit limitation: current production repository is an in-memory certification adapter.
    expect(stock(f.ingredient).stock).toBe(10);
  });
});
