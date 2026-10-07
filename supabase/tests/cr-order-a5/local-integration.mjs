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
const owned = await mkdtemp(join(tmpdir(), "cr-order-a5-owned-"));
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
const db = `a5_test_${process.pid}`;
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
  await test("A5 canonical lifecycle on isolated PostgreSQL", async (t) => {
    await sql(
      `CREATE ROLE postgres NOLOGIN BYPASSRLS; CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ${executor} NOLOGIN NOINHERIT CREATEROLE`,
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
    await sql(
      `SET ROLE ${executor}; CREATE TABLE public.company_employees(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid,company_id uuid,customer_id uuid,status text DEFAULT 'active',deleted_at timestamptz); GRANT SELECT ON public.company_employees TO service_role;`,
    );
    for (const path of [
      "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
      "supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql",
      "supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    await sql(
      `SET ROLE ${executor}; ALTER TYPE public.app_role ADD VALUE 'production'; ALTER TYPE public.app_role ADD VALUE 'logistics'; ALTER TYPE public.app_role ADD VALUE 'delivery'; ALTER TYPE public.app_role ADD VALUE 'driver'; ALTER TYPE public.order_status ADD VALUE 'ready_for_delivery'; ALTER TYPE public.order_status ADD VALUE 'out_for_delivery'; ALTER TYPE public.order_status ADD VALUE 'delivery_issue'; CREATE TYPE public.delivery_service_status AS ENUM('pending','in_production','prepared','ready_for_delivery','out_for_delivery','delivered','delivery_issue','cancelled'); ALTER TABLE delivery_services ALTER COLUMN status DROP DEFAULT,ALTER COLUMN status TYPE public.delivery_service_status USING status::public.delivery_service_status,ALTER COLUMN status SET DEFAULT 'pending',ADD COLUMN packed_at timestamptz,ADD COLUMN packed_by uuid,ADD COLUMN dispatched_at timestamptz,ADD COLUMN delivered_at timestamptz,ADD COLUMN delivered_by uuid; ALTER TABLE audit_log ALTER COLUMN entity_id TYPE uuid USING entity_id::uuid;`,
    );
    for (const path of [
      "supabase/migrations/20261007020208_cr_order_a5_lifecycle_ledger_expand.sql",
      "supabase/migrations/20261007020245_cr_order_a5_lifecycle_writer.sql",
      "supabase/migrations/20261007020849_cr_order_a5_audit_uuid_compatibility.sql",
    ])
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));

    await sql(
      "GRANT USAGE ON SCHEMA public TO postgres; GRANT SELECT,UPDATE ON public.orders TO postgres",
    );
    const create = async (cmd = capture()) => {
      const id = rid();
      const q = await issue(cmd, id);
      return commit(cmd, id, q.quoteId);
    };
    const lifecycle = async (order, action, extra = {}, n = 1, requestId = rid()) => {
      const command = {
        schemaVersion: 1,
        orderId: order.id,
        fromState: order.status,
        expectedRevision: order.revision,
        action,
        ...extra,
      };
      return JSON.parse(
        (
          await sql(
            legacySession(
              `SELECT public.cr_order_lifecycle_v2('${tenant}','${requestId}',${literal(command)})`,
              n,
            ),
          )
        )
          .split("\n")
          .at(-1),
      );
    };
    const read = async (id) =>
      JSON.parse(await sql(`SELECT to_jsonb(o) FROM orders o WHERE id='${id}'`));
    let fresh;
    await t.test("expand preserves capture and exact historical ledger bytes", async () => {
      fresh = await create();
      assert.equal(fresh.order.write_contract_version, 2);
      assert.equal(
        await sql(
          "SELECT bool_and(lifecycle_result IS NULL) FROM order_write_requests WHERE operation IN('capture','modify')",
        ),
        "t",
      );
    });
    await t.test("confirm, cancel and exact original replay after later revision", async () => {
      let o = fresh.order;
      const id = rid();
      const a = await lifecycle(o, "confirm", {}, 1, id);
      assert.equal(a.toState, "confirmed");
      assert.equal(a.committedRevision, o.revision + 1);
      let current = await read(o.id);
      const c = await lifecycle(current, "cancel", { reason: "Customer requested" });
      assert.equal(c.toState, "cancelled");
      assert.deepEqual(await lifecycle(o, "confirm", {}, 1, id), a);
      await expectFailure(
        lifecycle(o, "confirm", { reason: "different" }, 1, id),
        "REQUEST_ID_CONFLICT",
      );
      const count = await sql("SELECT count(*) FROM audit_log");
      const noOp = await lifecycle(await read(o.id), "cancel", { reason: "again" });
      assert.equal(noOp.outcome, "ALREADY_CANCELLED");
      assert.equal(await sql("SELECT count(*) FROM audit_log"), count);
      assert.equal((await read(o.id)).revision, c.committedRevision);
      assert.equal((await read(o.id)).total, o.total);
    });
    await t.test(
      "membership and staff authority, no customer or kitchen cancellation",
      async () => {
        const { order: o } = await create();
        await expectFailure(lifecycle(o, "cancel", { reason: "x" }, 2), "PERMISSION_DENIED");
        await expectFailure(lifecycle(o, "cancel", { reason: "x" }, 4), "PERMISSION_DENIED");
        await sql(`DELETE FROM tenant_members WHERE user_id='${actor(6)}'`);
        await expectFailure(lifecycle(o, "cancel", { reason: "x" }, 6), "PERMISSION_DENIED");
        await expectFailure(lifecycle(o, "cancel", { reason: "x" }, 7), "PERMISSION_DENIED");
        await assert.rejects(
          sql(
            backend(`SELECT public.cr_order_lifecycle_v2('${tenant}','${rid()}',${literal({})})`),
          ),
          /./,
        );
      },
    );
    await t.test("canonical operational evidence and cancellation fence", async () => {
      let { order: o } = await create();
      await lifecycle(o, "confirm");
      o = await read(o.id);
      await lifecycle(o, "start_production", {}, 4);
      o = await read(o.id);
      await expectFailure(lifecycle(o, "cancel", { reason: "x" }), "OPERATIONAL_WORK_STARTED");
      await lifecycle(o, "complete_production");
      o = await read(o.id);
      await lifecycle(o, "start_packing", {}, 4);
      o = await read(o.id);
      await expectFailure(lifecycle(o, "cancel", { reason: "x" }), "OPERATIONAL_WORK_STARTED");
      await lifecycle(o, "complete_packing", {}, 4);
      o = await read(o.id);
      await lifecycle(o, "assign_delivery", {}, 4);
      o = await read(o.id);
      assert.equal(o.status, "ready_for_delivery");
      const before = await sql(
        `SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i WHERE order_id='${o.id}'`,
      );
      await lifecycle(o, "cancel", { reason: "stop future work" });
      assert.equal(
        await sql(
          `SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i WHERE order_id='${o.id}'`,
        ),
        before,
      );
      assert.equal(
        await sql(
          `SELECT bool_and(status='cancelled') FROM delivery_services WHERE order_id='${o.id}'`,
        ),
        "t",
      );
      assert.equal(
        await sql(
          `SELECT packing_completed_at IS NOT NULL AND assigned_at IS NOT NULL FROM cr_order_private.operational_evidence WHERE order_id='${o.id}'`,
        ),
        "t",
      );
    });
    await t.test("concurrent cancel requests: one commit, one explicit no-op", async () => {
      const { order: o } = await create();
      const results = await Promise.all([
        lifecycle(o, "cancel", { reason: "a" }),
        lifecycle(o, "cancel", { reason: "b" }),
      ]);
      assert.deepEqual(results.map((r) => r.outcome).sort(), ["ALREADY_CANCELLED", "COMMITTED"]);
      assert.equal((await read(o.id)).revision, o.revision + 1);
    });
    await t.test("all 81 frozen parent state pairs with valid operational evidence", async () => {
      const states = [
        "draft",
        "confirmed",
        "in_production",
        "prepared",
        "ready_for_delivery",
        "out_for_delivery",
        "delivery_issue",
        "delivered",
        "cancelled",
      ];
      const allowed = new Set([
        "draft:confirmed",
        "confirmed:in_production",
        "in_production:prepared",
        "prepared:ready_for_delivery",
        "ready_for_delivery:out_for_delivery",
        "out_for_delivery:delivered",
        "out_for_delivery:delivery_issue",
        "delivery_issue:out_for_delivery",
        ...states.slice(0, 5).map((x) => `${x}:cancelled`),
        "cancelled:cancelled",
      ]);
      const targets = {
        confirmed: "confirm",
        in_production: "start_production",
        prepared: "complete_production",
        ready_for_delivery: "assign_delivery",
        delivered: "complete_delivery",
        delivery_issue: "delivery_issue",
        cancelled: "cancel",
      };
      let count = 0;
      for (const from of states)
        for (const to of states) {
          let { order: o } = await create();
          await sql(
            `BEGIN; SET LOCAL ROLE cr_order_writer; SELECT set_config('request.jwt.claim.sub','${actor(1)}',true); UPDATE orders SET status='${from}' WHERE id='${o.id}'; INSERT INTO cr_order_private.operational_evidence(tenant_id,order_id,production_started_at,production_completed_at,packing_started_at,packing_completed_at,assigned_at) VALUES('${tenant}','${o.id}',now(),now(),now(),now(),now()); ${to === "delivered" ? `UPDATE delivery_services SET status='delivered',delivered_at=now(),delivered_by='${actor(1)}' WHERE order_id='${o.id}';` : from === "ready_for_delivery" ? `UPDATE delivery_services SET status='ready_for_delivery' WHERE order_id='${o.id}';` : ""} COMMIT;`,
          );
          o = await read(o.id);
          const action =
            to === "out_for_delivery"
              ? from === "delivery_issue"
                ? "retry_delivery"
                : "dispatch"
              : (targets[to] ?? "forbidden");
          const promise = lifecycle(o, action, to === "cancelled" ? { reason: "matrix" } : {});
          if (allowed.has(`${from}:${to}`))
            assert.equal((await promise).toState, to, `${from}:${to}`);
          else await assert.rejects(promise, undefined, `${from}:${to}`);
          count++;
        }
      assert.equal(count, 81);
    });
    await t.test("audit failure rolls back parent, services, evidence and ledger", async () => {
      const { order: o } = await create();
      const counts = await sql(
        `SELECT jsonb_build_array((SELECT count(*) FROM order_write_requests),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM cr_order_private.operational_evidence))`,
      );
      await sql(
        `CREATE FUNCTION public.a5_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='order.v2.lifecycle' THEN RAISE EXCEPTION 'AUDIT_FAILURE'; END IF; RETURN NEW; END $$; CREATE TRIGGER a5_fail_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION public.a5_fail_audit();`,
      );
      await expectFailure(lifecycle(o, "cancel", { reason: "x" }), "AUDIT_FAILURE");
      assert.equal((await read(o.id)).status, "draft");
      assert.equal(
        await sql(
          `SELECT bool_and(status='pending') FROM delivery_services WHERE order_id='${o.id}'`,
        ),
        "t",
      );
      assert.equal(
        await sql(
          `SELECT jsonb_build_array((SELECT count(*) FROM order_write_requests),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM cr_order_private.operational_evidence))`,
        ),
        counts,
      );
      await sql("DROP TRIGGER a5_fail_audit ON audit_log; DROP FUNCTION public.a5_fail_audit()");
    });
    await t.test("dish, custom-only and mixed v2 share cancellation; gates unchanged", async () => {
      assert.equal(await sql("SELECT count(*) FROM cr_order_private.custom_activation"), "0");
      await sql(
        `INSERT INTO cr_order_private.custom_activation(tenant_id,enabled) VALUES('${tenant}',true)`,
      );
      const custom = {
        kind: "custom",
        name: "Custom",
        qty: 1,
        dayDate: "2026-10-05",
        unitPrice: "3.25",
      };
      for (const lines of [[custom], [line(), custom]]) {
        const cmd = capture({ lines }),
          id = rid();
        const created =
          lines.length === 1
            ? JSON.parse(
                await sql(
                  backend(
                    `SELECT public.cr_order_custom_commit('${tenant}','${actor(1)}','${id}',${literal(cmd)})`,
                  ),
                ),
              )
            : await commit(cmd, id, (await issue(cmd, id)).quoteId);
        const before = await sql(
          `SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i WHERE order_id='${created.order.id}'`,
        );
        await lifecycle(created.order, "cancel", { reason: "cancel custom contract" });
        assert.equal(
          await sql(
            `SELECT jsonb_agg(to_jsonb(i) ORDER BY id) FROM order_items i WHERE order_id='${created.order.id}'`,
          ),
          before,
        );
      }
      await sql("DELETE FROM cr_order_private.custom_activation");
      assert.equal(await sql("SELECT count(*) FROM cr_order_private.custom_activation"), "0");
    });
    await t.test("positive delivery proof: all delivered, mixed and all cancelled", async () => {
      for (const mode of ["all-delivered", "mixed", "all-cancelled"]) {
        let { order: o } = await create(
          capture({ lines: [line(), line({ dayDate: "2026-10-06" })] }),
        );
        for (const action of [
          "confirm",
          "start_production",
          "complete_production",
          "start_packing",
          "complete_packing",
          "assign_delivery",
          "dispatch",
        ]) {
          await lifecycle(o, action);
          o = await read(o.id);
        }
        const services = JSON.parse(
          await sql(
            `SELECT jsonb_agg(to_jsonb(s) ORDER BY id) FROM delivery_services s WHERE order_id='${o.id}'`,
          ),
        );
        if (mode !== "all-delivered")
          await sql(
            `BEGIN; SET LOCAL ROLE cr_order_writer; SELECT set_config('request.jwt.claim.sub','${actor(1)}',true); UPDATE delivery_services SET status='cancelled' WHERE ${mode === "all-cancelled" ? `order_id='${o.id}'` : `id='${services[1].id}'`}; COMMIT;`,
          );
        for (const service of mode === "all-delivered"
          ? services
          : mode === "mixed"
            ? services.slice(0, 1)
            : []) {
          await lifecycle(o, "service_deliver", { serviceId: service.id });
          o = await read(o.id);
        }
        assert.equal(o.status, mode === "all-delivered" ? "delivered" : "out_for_delivery");
        if (mode !== "all-delivered")
          await expectFailure(lifecycle(o, "complete_delivery"), "DELIVERY_RESOLUTION_REQUIRED");
      }
    });
    await t.test("dispatch vs cancel and retry vs cancel cannot resurrect a parent", async () => {
      let { order: o } = await create();
      for (const action of [
        "confirm",
        "start_production",
        "complete_production",
        "start_packing",
        "complete_packing",
        "assign_delivery",
      ]) {
        await lifecycle(o, action);
        o = await read(o.id);
      }
      const outcomes = await Promise.allSettled([
        lifecycle(o, "dispatch"),
        lifecycle(o, "cancel", { reason: "race" }),
      ]);
      assert.equal(outcomes.filter((x) => x.status === "fulfilled").length, 1);
      const actual = await read(o.id);
      assert.ok(["cancelled", "out_for_delivery"].includes(actual.status));
      if (actual.status === "cancelled")
        await expectFailure(lifecycle(actual, "retry_delivery"), "ORDER_CLOSED");
      else {
        await lifecycle(actual, "delivery_issue");
        const issue = await read(o.id);
        await expectFailure(lifecycle(issue, "cancel", { reason: "too late" }), "INVALID_STATE");
        await lifecycle(issue, "retry_delivery");
        assert.equal((await read(o.id)).status, "out_for_delivery");
      }
    });
    await t.test("immutable ledger/audit and malformed lifecycle results", async () => {
      const { order: o } = await create();
      const r = await lifecycle(o, "cancel", { reason: "immutable" });
      await expectFailure(
        sql(
          `UPDATE order_write_requests SET lifecycle_result='{}' WHERE request_id='${r.requestId}'`,
        ),
        "LIFECYCLE_HISTORY_IMMUTABLE",
      );
      await expectFailure(
        sql(`DELETE FROM audit_log WHERE new_data->>'requestId'='${r.requestId}'`),
        "LIFECYCLE_HISTORY_IMMUTABLE",
      );
      await expectFailure(
        sql(`UPDATE orders SET status='confirmed' WHERE id='${o.id}'`),
        "V2_CANONICAL_WRITER_REQUIRED",
      );
    });
    await t.test("edit vs cancel and competing transitions serialize", async () => {
      let { order: o, items } = await create();
      const cmd = {
        operation: "modify",
        orderId: o.id,
        expectedRevision: o.revision,
        weekStart: "2026-10-05",
        lines: [line({ lineId: items[0].id, qty: 3 })],
      };
      const id = rid(),
        q = await issue(cmd, id);
      const results = await Promise.allSettled([
        commit(cmd, id, q.quoteId),
        lifecycle(o, "cancel", { reason: "race with edit" }),
      ]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await read(o.id)).revision, o.revision + 1);
      ({ order: o } = await create());
      const transitions = await Promise.allSettled([
        lifecycle(o, "confirm"),
        lifecycle(o, "confirm"),
      ]);
      assert.equal(transitions.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await read(o.id)).revision, o.revision + 1);
    });
    await t.test("v1 remains compatible; kitchen does not acquire orders.write", async () => {
      const legacy = await sql(
        `INSERT INTO orders(tenant_id,customer_id,total,week_start) VALUES('${tenant}','${customer}',0,'2026-10-05') RETURNING id`,
      );
      await sql(legacySession(`UPDATE orders SET status='confirmed' WHERE id='${legacy}'`));
      assert.equal((await read(legacy)).status, "confirmed");
      assert.equal((await read(legacy)).write_contract_version, 1);
      const { order: o } = await create();
      await expectFailure(lifecycle(o, "confirm", {}, 4), "PERMISSION_DENIED");
      await expectFailure(
        sql(
          `BEGIN; SET LOCAL ROLE postgres; UPDATE orders SET status='confirmed' WHERE id='${o.id}'; COMMIT;`,
        ),
        "V2_CANONICAL_WRITER_REQUIRED",
      );
    });
    await t.test("cross-tenant, role escalation and forged GUC are denied", async () => {
      const { order: o } = await create();
      const command = {
        schemaVersion: 1,
        orderId: o.id,
        fromState: o.status,
        expectedRevision: o.revision,
        action: "cancel",
        reason: "x",
      };
      await expectFailure(
        sql(
          legacySession(
            `SELECT public.cr_order_lifecycle_v2('10000000-0000-4000-8000-000000000002','${rid()}',${literal(command)})`,
          ),
        ),
        "PERMISSION_DENIED",
      );
      await expectFailure(sql(legacySession("SET ROLE cr_order_writer")), "permission denied");
      await expectFailure(
        sql(
          legacySession(
            `SELECT set_config('cr_order.verified_actor','${actor(1)}',true); SELECT public.cr_order_lifecycle_v2('${tenant}','${rid()}',${literal(command)})`,
            2,
          ),
        ),
        "PERMISSION_DENIED",
      );
      const request = rid();
      await lifecycle(o, "cancel", { reason: "x" }, 1, request);
      await expectFailure(
        lifecycle(o, "cancel", { reason: "x" }, 5, request),
        "REQUEST_ID_CONFLICT",
      );
    });
    await t.test(
      "unsupported historical operational state fails closed rather than guessing stopped work",
      async () => {
        const { order: o } = await create();
        await sql(
          `BEGIN; SET LOCAL ROLE cr_order_writer; SELECT set_config('request.jwt.claim.sub','${actor(1)}',true); UPDATE orders SET status='prepared' WHERE id='${o.id}'; COMMIT;`,
        );
        await expectFailure(
          lifecycle(await read(o.id), "cancel", { reason: "unknown packing state" }),
          "OPERATIONAL_WORK_STARTED",
        );
      },
    );
    await t.test("stale revision and unsafe direct v2 writes fail", async () => {
      const { order: o } = await create();
      await lifecycle(o, "confirm");
      await expectFailure(lifecycle(o, "start_production"), "REVISION_CONFLICT");
      await expectFailure(
        sql(legacySession(`UPDATE orders SET status='cancelled' WHERE id='${o.id}'`)),
        "V2_CANONICAL_WRITER_REQUIRED",
      );
      await expectFailure(
        sql(backend(`UPDATE delivery_services SET status='delivered' WHERE order_id='${o.id}'`)),
        "V2_CANONICAL_WRITER_REQUIRED",
      );
    });
  });
} finally {
  await exec(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "-w", "stop"]);
  await rm(owned, { recursive: true, force: true });
}
