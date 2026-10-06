/** Local PostgreSQL only: fixture + A1 + A3. No Supabase URL, token or provider CLI. */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir, userInfo } from "node:os";
import { join, isAbsolute } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
const exec = promisify(execFile);
const bin = process.env.CR_ORDER_LOCAL_PG_BIN ?? "/tmp/offer-embedded/package/native/bin";
if (!isAbsolute(bin)) throw new Error("Native local PostgreSQL binary directory must be absolute");
const owned = await mkdtemp(join(tmpdir(), "cr-order-a4a-owned-"));
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
const db = `a4a_test_${process.pid}`;
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
const legacySession = (statement, n = 1, role = "authenticated") =>
  `SET SESSION AUTHORIZATION ${role}; SET ROLE ${role}; BEGIN; SELECT set_config('request.jwt.claim.sub','${actor(n)}',true); ${statement}; COMMIT;`;
const statement = (command, id = rid(), tid = tenant) =>
  `SELECT public.cr_order_write_v2('${tid}','${id}',${literal(command)})`;
const legacyRpc = async (command, id = rid(), n = 1, tid = tenant) =>
  JSON.parse((await sql(legacySession(statement(command, id, tid), n))).split("\n").at(-1));
const legacyFails = async (command, code, n = 1, id = rid(), tid = tenant) =>
  assert.rejects(legacyRpc(command, id, n, tid), (e) => e.stderr.includes(code));
const policy = { active: false, policyHash: "a".repeat(64) };
const backend = (statement) =>
  `SET SESSION AUTHORIZATION service_role; SET ROLE service_role; BEGIN; ${statement}; COMMIT;`;
const issueStatement = (command, id, n = 1, context = policy, tid = tenant) =>
  `SELECT public.cr_order_offer_quote_issue('${tid}','${actor(n)}','${id}',${literal(command)},${literal(context)})`;
const issue = async (command, id = rid(), n = 1, context = policy, tid = tenant) =>
  JSON.parse((await sql(backend(issueStatement(command, id, n, context, tid)))).split("\n").at(-1));
const commit = async (command, id, quote, n = 1, context = policy, tid = tenant) =>
  JSON.parse(
    (
      await sql(
        backend(
          `SELECT public.cr_order_offer_quote_commit('${tid}','${actor(n)}','${id}','${quote}',${literal(command)},${literal(context)})`,
        ),
      )
    )
      .split("\n")
      .at(-1),
  );
const expectFailure = (promise, code) => assert.rejects(promise, (e) => e.stderr.includes(code));
try {
  await test("A4a actual PostgreSQL discriminated canonical writer", async (t) => {
    await sql(
      `CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ${executor} NOLOGIN NOINHERIT CREATEROLE`,
      "postgres",
    );
    await sql(`CREATE DATABASE ${db} OWNER ${executor}`, "postgres");
    for (const path of [
      "supabase/tests/cr-order-v2/fixture.sql",
      "supabase/migrations/20261005113919_cr_order_expand_readers_foundation.sql",
      "supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    await sql(
      `SET ROLE ${executor}; ALTER TABLE public.weekly_menus ADD COLUMN deleted_at timestamptz, ADD COLUMN published_at timestamptz; CREATE TYPE public.kitchen_batch_status AS ENUM('pending','preparing','plating','finished'); ALTER TABLE kitchen_production_batches ALTER COLUMN status DROP DEFAULT,ALTER COLUMN status TYPE public.kitchen_batch_status USING status::public.kitchen_batch_status,ALTER COLUMN status SET DEFAULT 'pending',ADD COLUMN started_at timestamptz,ADD COLUMN finished_at timestamptz,ADD COLUMN updated_by uuid; CREATE UNIQUE INDEX weekly_menus_tenant_week_start_ux ON public.weekly_menus(tenant_id,week_start) WHERE deleted_at IS NULL AND week_start IS NOT NULL; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role; GRANT SELECT ON auth.users TO service_role;`,
    );
    for (const path of [
      "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
      "supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    const custom = (x = {}) => ({
      kind: "custom",
      name: "Soup by request",
      qty: 2,
      dayDate: "2026-10-05",
      unitPrice: "3.25",
      ...x,
    });
    const cmd = (lines = [custom()], x = {}) => capture({ lines, ...x });
    const customStmt = (command, id = rid(), n = 1, tid = tenant) =>
      `SELECT public.cr_order_custom_commit('${tid}','${actor(n)}','${id}',${literal(command)})`;
    const customCommit = async (command, id = rid(), n = 1, tid = tenant) =>
      JSON.parse((await sql(backend(customStmt(command, id, n, tid)))).split("\n").at(-1));
    const counts = () =>
      sql(
        "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM delivery_services),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM order_write_requests))",
      );
    await t.test("ACL owner and default gate metadata are fail closed", async () => {
      assert.equal(await sql("SELECT count(*) FROM cr_order_private.custom_activation"), "0");
      assert.equal(
        await sql(
          "SELECT relrowsecurity::text FROM pg_class WHERE oid='cr_order_private.custom_activation'::regclass",
        ),
        "true",
      );
      for (const role of ["anon", "authenticated"]) {
        assert.equal(
          await sql(
            `SELECT has_function_privilege('${role}','public.cr_order_custom_commit(uuid,uuid,uuid,jsonb)','EXECUTE')::text`,
          ),
          "false",
        );
        assert.equal(
          await sql(
            `SELECT has_function_privilege('${role}','cr_order_private.write_dish_v2(uuid,uuid,jsonb,uuid,jsonb)','EXECUTE')::text`,
          ),
          "false",
        );
        assert.equal(
          await sql(`SELECT pg_has_role('${role}','cr_order_writer','MEMBER')::text`),
          "false",
        );
      }
      assert.equal(
        await sql(
          "SELECT has_function_privilege('service_role','public.cr_order_custom_batch_transition(uuid,uuid,date,text)','EXECUTE')::text",
        ),
        "false",
      );
      assert.equal(
        await sql(
          "SELECT has_function_privilege('authenticated','public.cr_order_custom_batch_transition(uuid,uuid,date,text)','EXECUTE')::text",
        ),
        "true",
      );
      assert.equal(
        await sql(
          "SELECT rolbypassrls OR rolsuper OR rolcanlogin FROM pg_roles WHERE rolname='cr_order_writer'",
        ),
        "f",
      );
    });
    await t.test("CLOSED without API ability to activate", async () => {
      await expectFailure(customCommit(cmd()), "CUSTOM_NOT_ENABLED");
      for (const role of ["authenticated", "service_role", "anon"])
        await expectFailure(
          sql(
            `SET SESSION AUTHORIZATION ${role}; INSERT INTO cr_order_private.custom_activation VALUES('${tenant}',true)`,
          ),
          "permission denied",
        );
    });
    await sql(
      `SET ROLE ${executor}; INSERT INTO cr_order_private.custom_activation VALUES('${tenant}',true)`,
    );
    await t.test("pure custom without menu and distinct UUID snapshots", async () => {
      await sql("UPDATE weekly_menus SET status='draft'");
      const result = await customCommit(cmd([custom(), custom()]));
      assert.equal(result.items.length, 2);
      assert.notEqual(result.items[0].id, result.items[1].id);
      assert.equal(result.order.total, 13);
      for (const i of result.items) {
        assert.equal(i.dish_id, null);
        assert.equal(i.allergen_state, "UNKNOWN");
        assert.deepEqual(i.allergens_snapshot, []);
        assert.equal(i.item_kind, "custom");
      }
      assert.equal(
        await sql(`SELECT count(*) FROM delivery_services WHERE order_id='${result.order.id}'`),
        "1",
      );
      await sql("UPDATE weekly_menus SET status='published'");
    });
    await t.test(
      "owner/client other client kitchen suspended and cross tenant denied",
      async () => {
        for (const n of [2, 3, 4, 7])
          await expectFailure(customCommit(cmd(), rid(), n), "PERMISSION_DENIED");
        await expectFailure(
          customCommit(cmd(), rid(), 1, "10000000-0000-4000-8000-000000000002"),
          "PERMISSION_DENIED",
        );
        for (const role of ["authenticated", "anon"])
          await expectFailure(sql(legacySession(customStmt(cmd()), 1, role)), "permission denied");
      },
    );
    await t.test("invalid custom full rollback matrix", async () => {
      for (const [change, code] of [
        [{ name: "" }, "CUSTOM_NAME_INVALID"],
        [{ qty: 0 }, "QTY_INVALID"],
        [{ qty: 1.1 }, "QTY_INVALID"],
        [{ unitPrice: "-1" }, "PRICE_INVALID"],
        [{ unitPrice: "NaN" }, "PRICE_INVALID"],
        [{ unitPrice: "Infinity" }, "PRICE_INVALID"],
        [{ unitPrice: null }, "PRICE_INVALID"],
        [{ unitPrice: "0" }, "EXPLICIT_ZERO_CONFIRMATION_REQUIRED"],
        [{ dishId: dish }, "UNTRUSTED_AUTHORITY_FIELD"],
        [{ name: "x".repeat(201) }, "CUSTOM_NAME_INVALID"],
        [{ dayDate: "2026-10-12" }, "DATE_OUTSIDE_WEEK"],
      ]) {
        const before = await counts();
        await expectFailure(
          customCommit(
            cmd([custom(change)], {
              customer: { kind: "new", displayName: "Rollback", phone: "12345678" },
            }),
          ),
          code,
        );
        assert.equal(await counts(), before);
      }
    });
    await t.test("explicit zero valid, absent price never implicit zero", async () => {
      const result = await customCommit(
        cmd([custom({ unitPrice: "0", explicitZeroConfirmed: true })]),
      );
      assert.equal(result.order.total, 0);
      assert.equal(result.items[0].price_snapshot_status, "explicit_zero");
      const i = custom();
      delete i.unitPrice;
      await expectFailure(customCommit(cmd([i])), "PRICE_INVALID");
    });
    let result, id, command;
    await t.test("same hash idempotency, conflict and concurrent retry", async () => {
      id = rid();
      command = cmd();
      const results = await Promise.all([customCommit(command, id), customCommit(command, id)]);
      assert.equal(results[0].order.id, results[1].order.id);
      assert.equal(results.filter((r) => r.replayed).length, 1);
      result = results[0];
      await expectFailure(
        customCommit(cmd([custom({ unitPrice: "4" })]), id),
        "IDEMPOTENCY_CONFLICT",
      );
    });
    await t.test("modify preserves UUID, soft archive and stale revision", async () => {
      const modify = {
        operation: "modify",
        orderId: result.order.id,
        expectedRevision: 1,
        weekStart: "2026-10-05",
        lines: [custom({ lineId: result.items[0].id, name: "Renamed", unitPrice: "4.50" })],
      };
      const changed = await customCommit(modify);
      assert.equal(changed.items[0].id, result.items[0].id);
      assert.equal(changed.items[0].name_snapshot, "Renamed");
      assert.equal(changed.order.total, 9);
      await expectFailure(customCommit(modify), "STALE_REVISION");
      const removed = await customCommit({ ...modify, expectedRevision: 2, lines: [custom()] });
      assert.notEqual(removed.items[0].id, result.items[0].id);
      assert.equal(
        await sql(
          `SELECT (deleted_at IS NOT NULL)::text FROM order_items WHERE id='${result.items[0].id}'`,
        ),
        "true",
      );
    });
    await t.test(
      "mixed canonical quote keeps dish authority and custom atomic snapshots",
      async () => {
        const command = cmd([line(), custom(), custom()], { autoConfirm: true });
        const id = rid();
        const quote = await issue(command, id);
        assert.equal(quote.lines.length, 1);
        assert.equal(Number(quote.total), 23.8);
        const result = await commit(command, id, quote.quoteId);
        assert.equal(result.order.total, 36.8);
        if (process.env.CR_ORDER_A4A_EXPORT_FIXTURE === "1") {
          const customerRow = JSON.parse(
            await sql(`SELECT to_jsonb(c) FROM customers c WHERE id='${customer}'`),
          );
          const deliveries = JSON.parse(
            await sql(
              `SELECT jsonb_agg(to_jsonb(d)) FROM delivery_services d WHERE order_id='${result.order.id}'`,
            ),
          );
          await writeFile(
            "supabase/tests/cr-order-a4a/written-fixture.json",
            JSON.stringify(
              {
                provenance: {
                  migration: "20261006072046_cr_order_a4a_custom_writer.sql",
                  fixture: "actual-role local canonical mixed commit",
                },
                customer: customerRow,
                order: result.order,
                items: result.items,
                deliveries,
              },
              null,
              2,
            ) + "\n",
          );
        }
        assert.equal(result.items.filter((i) => i.item_kind === "custom").length, 2);
        const invalid = cmd([line(), custom({ unitPrice: "-1" })]);
        const ridInvalid = rid();
        const q = await issue(invalid, ridInvalid);
        const before = await counts();
        await expectFailure(commit(invalid, ridInvalid, q.quoteId), "PRICE_INVALID");
        assert.equal(await counts(), before);
      },
    );
    await t.test("dish-only remains M2, commercial unsupported unchanged", async () => {
      const id = rid();
      const quote = await issue(capture(), id);
      const r = await commit(capture(), id, quote.quoteId);
      assert.equal(r.order.total, 23.8);
      await sql("UPDATE weekly_menu_slots SET unit_price=2.5");
      await expectFailure(
        issue(cmd([line(), custom()]), rid(), 1, { ...policy, active: true }),
        "OFFER_PRICING_COMMERCIAL_UNSUPPORTED",
      );
      await sql("UPDATE weekly_menu_slots SET unit_price=NULL");
    });
    await t.test("direct writes, legacy, GUC and UUID/kind substitution blocked", async () => {
      for (const statement of [
        `UPDATE order_items SET id=gen_random_uuid() WHERE id='${result.items[0].id}'`,
        `UPDATE order_items SET item_kind='dish',dish_id='${dish}' WHERE id='${result.items[0].id}'`,
        `DELETE FROM order_items WHERE id='${result.items[0].id}'`,
      ])
        await expectFailure(
          sql(backend(statement)),
          statement.startsWith("DELETE")
            ? "CUSTOM_HARD_DELETE_FORBIDDEN"
            : "ORDER_ITEM_IDENTITY_IMMUTABLE",
        );
      await expectFailure(legacyRpc(cmd()), "permission denied");
      await expectFailure(
        sql(
          legacySession(
            `SELECT set_config('cr_order.verified_actor','${actor(1)}',true); SELECT cr_order_private.write_dish_v2('${tenant}','${rid()}',${literal(cmd())},'${actor(1)}',NULL)`,
            4,
          ),
        ),
        "permission denied",
      );
    });
    await t.test(
      "repeat provenance requires full reconfirmation and valid tenant source",
      async () => {
        const source = await customCommit(cmd());
        const confirmation = {
          sourceOrderItemId: source.items[0].id,
          availabilityConfirmed: true,
          preparationConfirmed: true,
          priceConfirmed: true,
          confirmedName: "Soup by request",
          confirmedDescription: null,
          confirmedQuantity: 2,
          confirmedDayDate: "2026-10-05",
          confirmedUnitPrice: "3.25",
        };
        for (const key of ["availabilityConfirmed", "preparationConfirmed", "priceConfirmed"])
          await expectFailure(
            customCommit(cmd([custom({ repeatConfirmation: { ...confirmation, [key]: false } })])),
            "CUSTOM_REPEAT_CONFIRMATION_REQUIRED",
          );
        await expectFailure(
          customCommit(
            cmd([custom({ repeatConfirmation: { ...confirmation, sourceOrderItemId: dish } })]),
          ),
          "CUSTOM_REPEAT_SOURCE_INVALID",
        );
        const repeat = await customCommit(cmd([custom({ repeatConfirmation: confirmation })]));
        assert.notEqual(repeat.items[0].id, source.items[0].id);
        assert.equal(
          await sql(
            `SELECT new_data->'customConfirmations'->0->'repeatConfirmation'->>'sourceOrderItemId' FROM audit_log WHERE entity_id='${repeat.order.id}' AND action='order.v2.capture'`,
          ),
          source.items[0].id,
        );
      },
    );
    await t.test(
      "kitchen typed batch, identity immutable and preparation blocks modification",
      async () => {
        const captured = await customCommit(cmd([custom()], { autoConfirm: true }));
        const item = captured.items[0];
        await sql(
          legacySession(
            `SELECT public.cr_order_custom_batch_transition('${tenant}','${item.id}','2026-10-05','pending')`,
            4,
          ),
        );
        await expectFailure(
          sql(
            legacySession(
              `UPDATE kitchen_production_batches SET custom_order_item_id='${result.items[0].id}' WHERE custom_order_item_id='${item.id}'`,
              4,
            ),
          ),
          "BATCH_IDENTITY_IMMUTABLE",
        );
        await sql(
          legacySession(
            `SELECT public.cr_order_custom_batch_transition('${tenant}','${item.id}','2026-10-05','preparing')`,
            4,
          ),
        );
        await expectFailure(
          customCommit({
            operation: "modify",
            orderId: captured.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [custom({ lineId: item.id })],
          }),
          "ORDER_OPERATIONALLY_LOCKED",
        );
      },
    );
    await t.test("rollback after each customer/order/item/delivery write boundary", async () => {
      for (const table of ["customers", "orders", "order_items", "delivery_services"]) {
        await sql(
          `SET ROLE ${executor}; CREATE FUNCTION public.a4_boundary_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'BOUNDARY_TEST_FAILURE'; END $$; CREATE TRIGGER a4_boundary_failure AFTER INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION public.a4_boundary_failure()`,
        );
        const before = await counts();
        await expectFailure(
          customCommit(
            cmd([custom()], {
              customer: { kind: "new", displayName: "Boundary rollback", phone: "12345678" },
            }),
          ),
          "BOUNDARY_TEST_FAILURE",
        );
        assert.equal(await counts(), before);
        await sql(
          `SET ROLE ${executor}; DROP TRIGGER a4_boundary_failure ON ${table}; DROP FUNCTION public.a4_boundary_failure()`,
        );
      }
    });
    await t.test("direct custom insert and customer batch operations denied", async () => {
      for (const role of ["authenticated", "service_role"])
        await expectFailure(
          sql(
            (role === "service_role" ? backend : legacySession)(
              `INSERT INTO order_items(tenant_id,order_id,dish_id,item_kind,name_snapshot,day_date,qty,unit_price,price_snapshot_status,allergen_state,allergens_snapshot,snapshot_captured_at) VALUES('${tenant}','${result.order.id}',NULL,'custom','Injected','2026-10-05',1,5,'captured','UNKNOWN','{}',now())`,
            ),
          ),
          "V2_CANONICAL_WRITER_REQUIRED",
        );
      for (const n of [2, 3, 7])
        await expectFailure(
          sql(
            legacySession(
              `SELECT public.cr_order_custom_batch_transition('${tenant}','${result.items[0].id}','2026-10-05','pending')`,
              n,
            ),
          ),
          "PERMISSION_DENIED",
        );
    });
    await t.test("custom repeat confirmation bound to complete current intent", async () => {
      const source = await customCommit(cmd());
      const confirmed = {
        sourceOrderItemId: source.items[0].id,
        availabilityConfirmed: true,
        preparationConfirmed: true,
        priceConfirmed: true,
        confirmedName: "Soup by request",
        confirmedDescription: null,
        confirmedQuantity: 2,
        confirmedDayDate: "2026-10-05",
        confirmedUnitPrice: "3.25",
      };
      for (const change of [
        { name: "Changed" },
        { description: "Changed" },
        { qty: 3 },
        { dayDate: "2026-10-06" },
        { unitPrice: "5" },
      ])
        await expectFailure(
          customCommit(cmd([custom({ ...change, repeatConfirmation: confirmed })])),
          "CUSTOM_REPEAT_CONFIRMATION_REQUIRED",
        );
    });
    await t.test(
      "custom kitchen concurrency serializes identity without duplicate batches",
      async () => {
        const result = await customCommit(cmd([custom()], { autoConfirm: true }));
        const item = result.items[0];
        const statement = `SELECT public.cr_order_custom_batch_transition('${tenant}','${item.id}','2026-10-05','preparing')`;
        await Promise.all([sql(legacySession(statement, 4)), sql(legacySession(statement, 4))]);
        assert.equal(
          await sql(
            `SELECT count(*) FROM kitchen_production_batches WHERE custom_order_item_id='${item.id}'`,
          ),
          "1",
        );
        assert.equal(
          await sql(
            `SELECT status::text FROM kitchen_production_batches WHERE custom_order_item_id='${item.id}'`,
          ),
          "preparing",
        );
        assert.equal(
          await sql(
            `SELECT count(*) FROM audit_log WHERE entity_type='kitchen_batch' AND new_data->>'orderItemId'='${item.id}'`,
          ),
          "1",
        );
      },
    );
    await t.test(
      "custom-only edits cannot bypass gate by replacing all lines with dish",
      async () => {
        const result = await customCommit(cmd());
        await sql(
          `SET ROLE ${executor}; UPDATE cr_order_private.custom_activation SET enabled=false WHERE tenant_id='${tenant}'`,
        );
        const command = {
          operation: "modify",
          orderId: result.order.id,
          expectedRevision: 1,
          weekStart: "2026-10-05",
          lines: [line()],
        };
        const id = rid();
        const quote = await issue(command, id);
        await expectFailure(commit(command, id, quote.quoteId), "CUSTOM_NOT_ENABLED");
        await sql(
          `SET ROLE ${executor}; UPDATE cr_order_private.custom_activation SET enabled=true WHERE tenant_id='${tenant}'`,
        );
      },
    );
    await t.test("audit failure rolls back every derivative", async () => {
      await sql(
        `SET ROLE ${executor}; CREATE FUNCTION public.a4_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'AUDIT_TEST_FAILURE'; END $$; CREATE TRIGGER a4_fail_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION public.a4_fail_audit()`,
      );
      const before = await counts();
      await expectFailure(
        customCommit(
          cmd([custom()], {
            customer: { kind: "new", displayName: "Audit rollback", phone: "12345678" },
          }),
        ),
        "AUDIT_TEST_FAILURE",
      );
      assert.equal(await counts(), before);
      await sql(
        `SET ROLE ${executor}; DROP TRIGGER a4_fail_audit ON audit_log; DROP FUNCTION public.a4_fail_audit()`,
      );
    });
  });
} finally {
  await exec(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "-w", "stop"]);
  await rm(owned, { recursive: true, force: true });
}
