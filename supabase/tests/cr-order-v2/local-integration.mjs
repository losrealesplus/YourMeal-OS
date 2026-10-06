/** Local PostgreSQL only: fixture + A1 + A3. No Supabase URL, token or provider CLI. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join, isAbsolute } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
const exec = promisify(execFile);
const bin = process.env.CR_ORDER_LOCAL_PG_BIN ?? "/tmp/offer-embedded/package/native/bin";
if (!isAbsolute(bin)) throw new Error("Native local PostgreSQL binary directory must be absolute");
const owned = await mkdtemp(join(tmpdir(), "cr-order-v2-owned-"));
const data = join(owned, "data");
const port = "55439";
await exec(join(bin, "initdb"), [
  "-D",
  data,
  "-U",
  userInfo().username,
  "--auth=trust",
  "--no-locale",
  "--encoding=UTF8",
]);
await exec(join(bin, "pg_ctl"), [
  "-D",
  data,
  "-l",
  join(owned, "postgres.log"),
  "-o",
  `-k '${owned}' -p ${port} -c listen_addresses=''`,
  "-w",
  "start",
]);
const db = `cr_order_a3_test_${process.pid}`;
const executor = `cr_order_migrator_${process.pid}`;
const base = [
  "-X",
  "-q",
  "-t",
  "-A",
  "-h",
  owned,
  "-p",
  port,
  "-U",
  userInfo().username,
  "-v",
  "ON_ERROR_STOP=1",
];
const psql = process.env.CR_ORDER_LOCAL_PSQL ?? "/opt/homebrew/bin/psql";
const sql = async (text, database = db) =>
  (await exec(psql, [...base, "-d", database, "-c", text], { maxBuffer: 8e6 })).stdout.trim();
const literal = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const tenant = "10000000-0000-4000-8000-000000000001";
const actor = (n) => `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const customer = "30000000-0000-4000-8000-000000000001";
const dish = "40000000-0000-4000-8000-000000000001";
let request = 20;
const rid = () => `70000000-0000-4000-8000-${String(request++).padStart(12, "0")}`;
const line = (extra = {}) => ({
  kind: "dish",
  dishId: dish,
  dayDate: "2026-10-05",
  qty: 2,
  ...extra,
});
const capture = (extra = {}) => ({
  operation: "capture",
  customer: { kind: "existing", id: customer },
  weekStart: "2026-10-05",
  lines: [line()],
  ...extra,
});
const session = (statement, n = 1, role = "authenticated") =>
  `SET SESSION AUTHORIZATION ${role}; BEGIN; SELECT set_config('request.jwt.claim.sub','${actor(n)}',true); ${statement}; COMMIT;`;
const statement = (command, id = rid(), tid = tenant) =>
  `SELECT public.cr_order_write_v2('${tid}','${id}',${literal(command)})`;
const rpc = async (command, id = rid(), n = 1, tid = tenant) =>
  JSON.parse((await sql(session(statement(command, id, tid), n))).split("\n").at(-1));
const fails = async (command, code, n = 1, id = rid(), tid = tenant) =>
  assert.rejects(rpc(command, id, n, tid), (e) => e.stderr.includes(code));
let order;
try {
  await test("A3 actual PostgreSQL transactions, RLS, ACLs and concurrent operations", async (t) => {
    await sql(
      `CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ${executor} NOLOGIN NOINHERIT CREATEROLE`,
      "postgres",
    );
    await sql(`CREATE DATABASE ${db} OWNER ${executor}`, "postgres");
    try {
      for (const path of [
        "supabase/tests/cr-order-v2/fixture.sql",
        "supabase/migrations/20261005113919_cr_order_expand_readers_foundation.sql",
        "supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
      ])
        await sql(
          `SET ROLE ${executor}; ` +
            (await readFile(new URL("../../../" + path, import.meta.url), "utf8")),
        );
      await t.test(
        "capture freezes identity/price/allergen knowledge, exact total and derivatives",
        async () => {
          order = await rpc(capture());
          assert.equal(order.order.total, 23.8);
          assert.equal(order.order.revision, 1);
          assert.equal(order.items[0].unit_price, 11.9);
          assert.equal(order.items[0].name_snapshot, "Captured soup");
          assert.equal(order.items[0].allergen_state, "UNKNOWN");
          assert.deepEqual(order.items[0].allergens_snapshot, []);
          const rows = JSON.parse(
            await sql(
              `SELECT jsonb_build_object('delivery',(SELECT to_jsonb(d) FROM delivery_services d WHERE order_id='${order.order.id}'),'audit',(SELECT count(*) FROM audit_log WHERE entity_id='${order.order.id}'),'ledger',(SELECT count(*) FROM order_write_requests WHERE order_id='${order.order.id}'))`,
            ),
          );
          assert.equal(rows.audit, 1);
          assert.equal(rows.ledger, 1);
          assert.equal(rows.delivery.customer_contact_snapshot.customerId, customer);
          assert.deepEqual(rows.delivery.delivery_address_snapshot, {
            unresolved: true,
            reason: "no_address_at_intake",
          });
        },
      );
      await t.test(
        "retry derives original identity from server hash, different input fails closed",
        async () => {
          const id = rid(),
            cmd = capture(),
            a = await rpc(cmd, id),
            b = await rpc(cmd, id);
          assert.equal(a.order.id, b.order.id);
          assert.equal(b.replayed, true);
          assert.match(b.inputHash, /^[a-f0-9]{64}$/);
          await fails(capture({ orderNotes: "Different" }), "IDEMPOTENCY_CONFLICT", 1, id);
        },
      );
      await t.test(
        "canonical staff roles, global admin and denied kitchen/customer/suspended/cross tenant",
        async () => {
          await rpc(capture(), rid(), 5);
          await rpc(capture(), rid(), 6);
          await fails(capture(), "PERMISSION_DENIED", 4);
          await fails(capture(), "PERMISSION_DENIED", 7);
          await fails(capture(), "COMMERCIAL_QUOTE_REQUIRED", 2);
          await fails(capture(), "COMMERCIAL_QUOTE_REQUIRED", 3);
          await fails(
            capture(),
            "PERMISSION_DENIED",
            1,
            rid(),
            "10000000-0000-4000-8000-000000000002",
          );
          await assert.rejects(sql(session(statement(capture()), 1, "anon")), (e) =>
            e.stderr.includes("permission denied"),
          );
        },
      );
      await t.test(
        "untrusted authority, native custom, client snapshots and B2B are denied",
        async () => {
          for (const cmd of [
            capture({ actorId: actor(6) }),
            capture({ unexpected: "x" }),
            capture({ customer: { kind: "existing", id: customer, authorId: actor(6) } }),
            capture({ lines: [line({ name_snapshot: "Client" })] }),
          ])
            await fails(cmd, "UNTRUSTED_AUTHORITY_FIELD");
          await fails(
            capture({ lines: [{ kind: "custom", name: "Soup", qty: 2, dayDate: "2026-10-05" }] }),
            "CUSTOM_NOT_ENABLED",
          );
          await fails(capture({ demandChannel: "company" }), "B2B_DELIVERY_UNSUPPORTED");
        },
      );
      await t.test("exact decimal override, explicit zero and malformed prices", async () => {
        const a = await rpc(
          capture({
            lines: [
              line({
                unitPriceOverride: "0.0000",
                unitPriceOverrideReason: "Staff goodwill",
                explicitZeroConfirmed: true,
              }),
            ],
          }),
        );
        assert.equal(a.order.total, 0);
        assert.equal(a.items[0].price_snapshot_status, "explicit_zero");
        await fails(
          capture({
            lines: [line({ unitPriceOverride: "0", unitPriceOverrideReason: "Staff goodwill" })],
          }),
          "EXPLICIT_ZERO_CONFIRMATION_REQUIRED",
        );
        for (const unitPriceOverride of ["NaN", "-1", "1.00001", "Infinity", "01.0", 1.5])
          await fails(
            capture({
              lines: [line({ unitPriceOverride, unitPriceOverrideReason: "Price test" })],
            }),
            "PRICE_INVALID",
          );
        const b = await rpc(
          capture({
            lines: [
              line({
                unitPriceOverride: "1.2345",
                unitPriceOverrideReason: "  Authorized discount  ",
                qty: 3,
              }),
            ],
          }),
        );
        assert.equal(b.order.total, 3.7);
        assert.equal(b.items[0].unit_price, 1.2345);
        for (const unitPriceOverrideReason of [undefined, "", "   "])
          await fails(
            capture({
              lines: [
                line({
                  unitPriceOverride: "2",
                  ...(unitPriceOverrideReason === undefined ? {} : { unitPriceOverrideReason }),
                }),
              ],
            }),
            "PRICE_OVERRIDE_REASON_REQUIRED",
          );
        const audit = JSON.parse(
          await sql(
            `SELECT new_data->'priceOverrides' FROM audit_log WHERE entity_id='${b.order.id}'`,
          ),
        );
        assert.deepEqual(audit, [
          {
            orderItemId: b.items[0].id,
            dishId: dish,
            cataloguePrice: 11.9,
            previousUnitPrice: null,
            unitPrice: 1.2345,
            reason: "Authorized discount",
          },
        ]);
      });
      await t.test(
        "modify retains captured name/price/allergens after catalogue drift, stale revision denied",
        async () => {
          await sql(
            `UPDATE dishes SET name='New catalogue',price=99,allergens=ARRAY['milk'] WHERE id='${dish}'`,
          );
          const cmd = {
            operation: "modify",
            orderId: order.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [line({ lineId: order.items[0].id, qty: 3 })],
          };
          const modified = await rpc(cmd);
          assert.equal(modified.order.total, 35.7);
          assert.equal(modified.order.revision, 2);
          assert.equal(modified.items[0].name_snapshot, "Captured soup");
          assert.equal(modified.items[0].allergen_state, "UNKNOWN");
          assert.equal(modified.items[0].unit_price, 11.9);
          await fails(cmd, "STALE_REVISION");
          order = modified;
          await sql(
            `UPDATE dishes SET name='Captured soup',price=11.9,allergens='{}' WHERE id='${dish}'`,
          );
        },
      );
      await t.test(
        "replay after later edit keeps original commit revision and returns current read",
        async () => {
          const id = rid(),
            cmd = capture(),
            a = await rpc(cmd, id);
          await rpc({
            operation: "modify",
            orderId: a.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [line({ lineId: a.items[0].id, qty: 3 })],
          });
          const retry = await rpc(cmd, id);
          assert.equal(retry.committedRevision, 1);
          assert.equal(retry.order.revision, 2);
          assert.equal(retry.items[0].qty, 3);
          assert.equal(retry.replayed, true);
        },
      );
      await t.test(
        "new delivery date preserves original captured address after default/address drift",
        async () => {
          const a = await rpc(
            capture({
              customer: {
                kind: "new",
                displayName: "Address baseline",
                phone: "123456789",
                street: "Captured street",
                city: "Madrid",
              },
            }),
          );
          await sql(
            `UPDATE customer_addresses SET street='Edited street',is_default=false,deleted_at=now() WHERE customer_id='${a.order.customer_id}'; INSERT INTO customer_addresses(tenant_id,customer_id,street,is_default) VALUES('${tenant}','${a.order.customer_id}','New default',true)`,
          );
          await rpc({
            operation: "modify",
            orderId: a.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [line({ lineId: a.items[0].id }), line({ dayDate: "2026-10-06" })],
          });
          const derivatives = JSON.parse(
            await sql(
              `SELECT jsonb_agg(to_jsonb(ds) ORDER BY delivery_date) FROM delivery_services ds WHERE order_id='${a.order.id}' AND deleted_at IS NULL`,
            ),
          );
          assert.equal(derivatives.length, 2);
          for (const ds of derivatives) {
            assert.equal(ds.delivery_address_id, a.order.delivery_address_id);
            assert.equal(ds.delivery_address_snapshot.street, "Captured street");
          }
        },
      );
      await t.test(
        "legacy definer and caller-owned RPC cannot mutate v2; historical replacement remains explicit",
        async () => {
          await sql(
            `CREATE FUNCTION public.legacy_modify(id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ UPDATE public.orders SET total=0 WHERE id=$1 $$`,
          );
          await assert.rejects(
            sql(session(`SELECT public.legacy_modify('${order.order.id}')`)),
            (e) => e.stderr.includes("V2_CANONICAL_WRITER_REQUIRED"),
          );
          await sql("DROP FUNCTION public.legacy_modify(uuid)");
          const oid = "90000000-0000-4000-8000-000000000001",
            iid = "90000000-0000-4000-8000-000000000002";
          await sql(
            `INSERT INTO orders(id,tenant_id,customer_id,total,week_start) VALUES('${oid}','${tenant}','${customer}',5,'2026-10-05'); INSERT INTO order_items(id,tenant_id,order_id,dish_id,day_date,qty,unit_price) VALUES('${iid}','${tenant}','${oid}','${dish}','2026-10-05',1,5)`,
          );
          await fails(
            {
              operation: "modify",
              orderId: oid,
              expectedRevision: 0,
              weekStart: "2026-10-05",
              lines: [line({ lineId: iid })],
            },
            "HISTORICAL_LINE_REQUIRES_REPLACEMENT",
          );
          const replaced = await rpc({
            operation: "modify",
            orderId: oid,
            expectedRevision: 0,
            weekStart: "2026-10-05",
            lines: [line()],
          });
          assert.equal(replaced.order.write_contract_version, 2);
          assert.notEqual(replaced.items[0].id, iid);
          assert.equal(
            await sql(`SELECT deleted_at IS NOT NULL FROM order_items WHERE id='${iid}'`),
            "t",
          );
        },
      );
      await t.test(
        "cross-tenant customer/dish, foreign address and explicit slot foundation denied",
        async () => {
          await fails(
            capture({ customer: { kind: "existing", id: "30000000-0000-4000-8000-000000000002" } }),
            "CUSTOMER_NOT_FOUND",
          );
          await fails(
            capture({ lines: [line({ dishId: "40000000-0000-4000-8000-000000000002" })] }),
            "DISH_NOT_FOUND",
          );
          await fails(
            capture({ deliveryAddressId: "80000000-0000-4000-8000-000000000001" }),
            "ADDRESS_NOT_FOUND",
          );
          await fails(
            capture({ lines: [line({ slotId: "80000000-0000-4000-8000-000000000002" })] }),
            "COMMERCIAL_QUOTE_REQUIRED",
          );
        },
      );
      await t.test(
        "no login, no bypass, no ownership, closed ledger and caller-forged GUC cannot authorize direct writes",
        async () => {
          assert.equal(
            await sql(
              "SELECT rolcanlogin OR rolbypassrls OR rolsuper OR rolinherit FROM pg_roles WHERE rolname='cr_order_writer'",
            ),
            "f",
          );
          assert.equal(
            await sql(
              "SELECT count(*) FROM pg_class WHERE relname IN('orders','order_items','order_write_requests') AND relowner='cr_order_writer'::regrole",
            ),
            "0",
          );
          assert.equal(
            await sql("SELECT has_schema_privilege('cr_order_writer','cr_order_private','CREATE')"),
            "f",
          );
          await assert.rejects(sql(session("SELECT * FROM order_write_requests")), (e) =>
            e.stderr.includes("permission denied"),
          );
          await assert.rejects(
            sql(
              session(
                `SELECT set_config('cr_order.verified_actor','${actor(6)}',true); UPDATE orders SET total=0 WHERE id='${order.order.id}'`,
              ),
            ),
            (e) => e.stderr.includes("V2_CANONICAL_WRITER_REQUIRED"),
          );
          await assert.rejects(
            sql(session(`UPDATE order_items SET qty=99 WHERE id='${order.items[0].id}'`)),
            (e) => e.stderr.includes("V2_CANONICAL_WRITER_REQUIRED"),
          );
          await assert.rejects(sql(session("SET LOCAL ROLE cr_order_writer")), (e) =>
            e.stderr.includes("permission denied"),
          );
          await assert.rejects(
            sql(
              session(
                `SELECT cr_order_private.write_dish_v2('${tenant}','${rid()}',${literal(capture())},'${actor(6)}',NULL)`,
              ),
            ),
            (e) => e.stderr.includes("PERMISSION_DENIED"),
          );
        },
      );
      await t.test("pre-existing writer membership fails migration closed", async () => {
        await sql("GRANT cr_order_writer TO authenticated");
        try {
          const migration = await readFile(
            new URL(
              "../../../supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
              import.meta.url,
            ),
            "utf8",
          );
          await assert.rejects(sql(`SET ROLE ${executor}; ${migration}`), (e) =>
            e.stderr.includes("CR_ORDER_WRITER_ROLE_UNSAFE"),
          );
        } finally {
          await sql("REVOKE cr_order_writer FROM authenticated");
        }
      });
      await t.test(
        "new customer telephone/address/profile and delivery overrides captured atomically",
        async () => {
          const a = await rpc(
            capture({
              customer: {
                kind: "new",
                displayName: "New customer",
                phone: "+34123456789",
                street: "Street 1",
                city: "Madrid",
                deliveryNotes: "At reception",
                dietaryProfile: { allergens: ["milk"] },
              },
            }),
          );
          const derivative = JSON.parse(
            await sql(`SELECT to_jsonb(d) FROM delivery_services d WHERE order_id='${a.order.id}'`),
          );
          assert.equal(derivative.customer_contact_snapshot.phone, "+34123456789");
          assert.equal(derivative.delivery_address_snapshot.street, "Street 1");
          assert.equal(derivative.delivery_instructions, "At reception");
          assert.deepEqual(a.order.dietary_snapshot.allergens, ["milk"]);
          assert.equal(a.order.dietary_snapshot.authorUserId, actor(1));
          const changed = await rpc({
            operation: "modify",
            orderId: a.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            deliveryAddressId: null,
            orderNotes: "New instructions",
            dietaryOverride: { allergens: [], overrideReason: "Authorized correction" },
            lines: [line({ lineId: a.items[0].id })],
          });
          const d = JSON.parse(
            await sql(`SELECT to_jsonb(d) FROM delivery_services d WHERE order_id='${a.order.id}'`),
          );
          assert.equal(changed.order.delivery_address_id, null);
          assert.deepEqual(d.delivery_address_snapshot, {
            unresolved: true,
            reason: "no_address_at_intake",
          });
          assert.deepEqual(d.dietary_snapshot.allergens, []);
          assert.equal(d.delivery_instructions, "New instructions");
        },
      );
      await t.test(
        "failure after every write stage rolls back customer/header/items/derivatives/audit/ledger",
        async () => {
          for (const table of [
            "customer_phones",
            "order_items",
            "delivery_services",
            "audit_log",
            "order_write_requests",
          ]) {
            await sql(
              `CREATE FUNCTION public.test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'TEST_INJECTED_FAILURE'; END $$; CREATE TRIGGER test_failure BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION public.test_fail()`,
            );
            const before = await sql(
              "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM delivery_services),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM order_write_requests))",
            );
            await fails(
              capture({ customer: { kind: "new", displayName: "Rollback", phone: "12345678" } }),
              "TEST_INJECTED_FAILURE",
            );
            assert.equal(
              await sql(
                "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM delivery_services),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM order_write_requests))",
              ),
              before,
            );
            await sql(`DROP TRIGGER test_failure ON ${table}; DROP FUNCTION public.test_fail()`);
          }
        },
      );
      await t.test(
        "concurrent same request commits once; concurrent conflicting hash fails",
        async () => {
          const id = rid(),
            cmd = capture(),
            a = statement(cmd, id);
          const results = await Promise.all([
            sql(session(a + "; SELECT pg_sleep(0.3)")),
            rpc(cmd, id),
          ]);
          assert.ok(results[0]);
          assert.equal(
            await sql(`SELECT count(*) FROM order_write_requests WHERE request_id='${id}'`),
            "1",
          );
          const conflict = rid();
          const results2 = await Promise.allSettled([
            sql(session(statement(cmd, conflict) + "; SELECT pg_sleep(0.3)")),
            rpc(capture({ orderNotes: "conflict" }), conflict),
          ]);
          assert.equal(results2.filter((r) => r.status === "rejected").length, 1);
          assert.match(
            results2.find((r) => r.status === "rejected").reason.stderr,
            /IDEMPOTENCY_CONFLICT/,
          );
        },
      );
      await t.test("concurrent edits with one optimistic revision commit only once", async () => {
        const a = await rpc(capture()),
          cmd = {
            operation: "modify",
            orderId: a.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [line({ lineId: a.items[0].id, qty: 4 })],
          };
        const results = await Promise.allSettled([
          sql(session(statement(cmd) + "; SELECT pg_sleep(0.3)")),
          rpc(cmd),
        ]);
        assert.equal(results.filter((r) => r.status === "rejected").length, 1);
        assert.match(results.find((r) => r.status === "rejected").reason.stderr, /STALE_REVISION/);
        assert.equal(await sql(`SELECT revision FROM orders WHERE id='${a.order.id}'`), "2");
      });
      await t.test(
        "absent batch creation serializes with writer and started production freezes edits",
        async () => {
          const a = await rpc(capture()),
            cmd = {
              operation: "modify",
              orderId: a.order.id,
              expectedRevision: 1,
              weekStart: "2026-10-05",
              lines: [line({ lineId: a.items[0].id, qty: 5 })],
            };
          // Start kitchen first, holding its advisory lock while no committed batch is visible.
          const kitchen = sql(
            `SET DateStyle='SQL, DMY'; BEGIN; INSERT INTO kitchen_production_batches(tenant_id,dish_id,delivery_date,status) VALUES('${tenant}','${dish}','2026-10-05','preparing'); SELECT pg_sleep(0.4); COMMIT`,
          );
          await new Promise((resolve) => setTimeout(resolve, 100));
          await fails(cmd, "ORDER_OPERATIONALLY_LOCKED");
          await kitchen;
          assert.equal(await sql(`SELECT qty FROM order_items WHERE id='${a.items[0].id}'`), "2");
          await sql("DELETE FROM kitchen_production_batches");
        },
      );
      await t.test("snapshot author FK deletion preserves captured knowledge", async () => {
        await sql(`DELETE FROM auth.users WHERE id='${actor(1)}'`);
        assert.equal(
          await sql(
            `SELECT snapshot_author_id IS NULL AND name_snapshot='Captured soup' AND allergen_state='UNKNOWN' FROM order_items WHERE id='${order.items[0].id}'`,
          ),
          "t",
        );
      });
    } finally {
      await sql(`DROP DATABASE ${db} WITH (FORCE)`, "postgres");
      await sql(`DROP ROLE ${executor}`, "postgres");
    }
  });
} finally {
  await exec(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "-w", "stop"]);
  await rm(owned, { recursive: true, force: true });
}
