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
const owned = await mkdtemp(join(tmpdir(), "offer-m2-owned-"));
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
const db = `offer_m2_test_${process.pid}`;
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
  `SET SESSION AUTHORIZATION ${role}; BEGIN; SELECT set_config('request.jwt.claim.sub','${actor(n)}',true); ${statement}; COMMIT;`;
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
  await test("M2 trusted offer capture and actual role boundaries", async (t) => {
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
      `SET ROLE ${executor}; ALTER TABLE public.weekly_menus ADD COLUMN deleted_at timestamptz, ADD COLUMN published_at timestamptz; CREATE UNIQUE INDEX weekly_menus_tenant_week_start_ux ON public.weekly_menus(tenant_id,week_start) WHERE deleted_at IS NULL AND week_start IS NOT NULL; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role; GRANT SELECT ON auth.users TO service_role;`,
    );
    await sql(
      `SET ROLE ${executor}; ` +
        (await readFile(
          "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
          "utf8",
        )),
    );
    await t.test(
      "authenticated and anonymous cannot issue/redeem quote or call bare writer",
      async () => {
        for (const role of ["authenticated", "anon"]) {
          await expectFailure(
            sql(legacySession(issueStatement(capture(), rid()), 1, role)),
            "permission denied",
          );
          await expectFailure(
            sql(legacySession(statement(capture()), 1, role)),
            "permission denied",
          );
          await expectFailure(
            sql(legacySession("SELECT * FROM cr_order_private.offer_quotes", 1, role)),
            "permission denied",
          );
        }
      },
    );
    await t.test(
      "verified actor staff/owner allowed, other customer/kitchen/suspended/cross-tenant denied",
      async () => {
        await issue(capture(), rid(), 1);
        await issue(capture(), rid(), 2);
        await issue(capture(), rid(), 5);
        for (const n of [3, 4, 7])
          await expectFailure(issue(capture(), rid(), n), "PERMISSION_DENIED");
        await expectFailure(
          issue(capture(), rid(), 1, policy, "10000000-0000-4000-8000-000000000002"),
          "PERMISSION_DENIED",
        );
        await expectFailure(
          issue(
            capture({ customer: { kind: "new", displayName: "new", phone: "12345678" } }),
            rid(),
            2,
          ),
          "PERMISSION_DENIED",
        );
      },
    );
    await t.test("NULL active flag fails closed", async () => {
      for (const context of [
        { policyHash: policy.policyHash },
        { ...policy, active: null },
        { active: false, policyHash: null },
      ])
        await expectFailure(issue(capture(), rid(), 1, context), "INPUT_INVALID");
    });
    let captured, id, q;
    await t.test("slot 2.50 captures financial snapshot and provenance atomically", async () => {
      await sql("UPDATE public.weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'");
      id = rid();
      q = await issue(capture(), id);
      captured = await commit(capture(), id, q.quoteId);
      assert.equal(captured.items[0].unit_price, 2.5);
      assert.equal(captured.order.total, 5);
      assert.equal(captured.items[0].name_snapshot, "Captured soup");
      assert.equal(
        await sql(
          `SELECT count(*) FROM public.audit_log WHERE entity_id='${captured.order.id}' AND action='order.offer.capture'`,
        ),
        "1",
      );
    });
    await t.test(
      "committed retry survives catalogue/slot/policy change and preserves snapshot",
      async () => {
        await sql(
          "UPDATE public.dishes SET price=99,name='Changed' WHERE id='" +
            dish +
            "'; UPDATE public.weekly_menu_slots SET unit_price=8 WHERE day_date='2026-10-05'",
        );
        const replay = await commit(capture(), id, q.quoteId, 1, {
          active: true,
          policyHash: "b".repeat(64),
        });
        assert.equal(replay.replayed, true);
        assert.equal(replay.items[0].unit_price, 2.5);
        assert.equal(
          await sql(
            `SELECT count(*) FROM public.audit_log WHERE entity_id='${captured.order.id}' AND action='order.offer.capture'`,
          ),
          "1",
        );
        await sql(
          "UPDATE public.dishes SET price=11.9,name='Captured soup' WHERE id='" +
            dish +
            "'; UPDATE public.weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'",
        );
      },
    );
    await t.test("price drift rejects without order/customer/ledger mutations", async () => {
      const command = capture({
          customer: { kind: "new", displayName: "Must rollback", phone: "12345678" },
        }),
        request = rid(),
        quote = await issue(command, request);
      const before = await sql(
        "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM order_write_requests))",
      );
      await sql("UPDATE weekly_menu_slots SET unit_price=3 WHERE day_date='2026-10-05'");
      await expectFailure(commit(command, request, quote.quoteId), "PRICE_CHANGED");
      assert.equal(
        await sql(
          "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM order_write_requests))",
        ),
        before,
      );
      await sql("UPDATE weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'");
    });
    await t.test(
      "commercial explicit price fails; NULL commercial stays legacy boundary",
      async () => {
        await expectFailure(
          issue(capture(), rid(), 1, { ...policy, active: true }),
          "OFFER_PRICING_COMMERCIAL_UNSUPPORTED",
        );
        await sql("UPDATE weekly_menu_slots SET unit_price=NULL WHERE day_date='2026-10-05'");
        await expectFailure(
          issue(capture(), rid(), 1, { ...policy, active: true }),
          "COMMERCIAL_QUOTE_REQUIRED",
        );
        const request = rid(),
          quote = await issue(capture(), request);
        const result = await commit(capture(), request, quote.quoteId);
        assert.equal(result.items[0].unit_price, 11.9);
      },
    );
    await t.test("explicit zero confirmation and immutable quote", async () => {
      await sql("UPDATE weekly_menu_slots SET unit_price=0 WHERE day_date='2026-10-05'");
      await expectFailure(issue(capture()), "EXPLICIT_ZERO_CONFIRMATION_REQUIRED");
      const command = capture({ lines: [line({ explicitZeroConfirmed: true })] }),
        request = rid(),
        quote = await issue(command, request);
      const result = await commit(command, request, quote.quoteId);
      assert.equal(result.order.total, 0);
      assert.equal(result.items[0].price_snapshot_status, "explicit_zero");
      await expectFailure(
        sql(
          backend(
            `UPDATE cr_order_private.offer_quotes SET policy_hash='${"b".repeat(64)}' WHERE id='${quote.quoteId}'`,
          ),
        ),
        "QUOTE_IMMUTABLE",
      );
      await sql("UPDATE weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'");
    });
    await t.test("duplicate comments may share unanimous financial authority", async () => {
      const command = capture({ lines: [line({ comment: "one" }), line({ comment: "two" })] }),
        request = rid(),
        quote = await issue(command, request),
        result = await commit(command, request, quote.quoteId);
      assert.equal(result.items.length, 2);
      assert.equal(result.order.total, 10);
    });
    await t.test(
      "captured line modification keeps original price after catalogue and slot changes",
      async () => {
        await sql(
          "UPDATE weekly_menu_slots SET unit_price=7 WHERE day_date='2026-10-05'; UPDATE dishes SET price=22 WHERE id='" +
            dish +
            "'",
        );
        const command = {
            operation: "modify",
            orderId: captured.order.id,
            expectedRevision: 1,
            weekStart: "2026-10-05",
            lines: [line({ lineId: captured.items[0].id, qty: 3 })],
          },
          request = rid(),
          quote = await issue(command, request),
          result = await commit(command, request, quote.quoteId);
        assert.equal(result.items[0].unit_price, 2.5);
        assert.equal(result.order.total, 7.5);
        assert.equal(result.items[0].name_snapshot, "Captured soup");
        await sql(
          "UPDATE weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'; UPDATE dishes SET price=11.9 WHERE id='" +
            dish +
            "'",
        );
      },
    );
    await t.test("quote binds full command, actor and request", async () => {
      const command = capture(),
        request = rid(),
        quote = await issue(command, request);
      await expectFailure(
        commit(capture({ orderNotes: "changed" }), request, quote.quoteId),
        "QUOTE_INPUT_MISMATCH",
      );
      await expectFailure(commit(command, rid(), quote.quoteId), "QUOTE_INPUT_MISMATCH");
      await expectFailure(commit(command, request, quote.quoteId, 5), "QUOTE_INPUT_MISMATCH");
      await expectFailure(
        commit(command, request, quote.quoteId, 1, { ...policy, active: null }),
        "INPUT_INVALID",
      );
      await expectFailure(
        commit(command, request, quote.quoteId, 1, { ...policy, policyHash: "b".repeat(64) }),
        "PRICE_CHANGED",
      );
    });
    await t.test(
      "tenant/dish/date/slot context and ambiguous legacy references fail closed",
      async () => {
        await expectFailure(
          issue(capture({ lines: [line({ dishId: "40000000-0000-4000-8000-000000000002" })] })),
          "OFFER_NOT_FOUND",
        );
        await expectFailure(
          issue(capture({ lines: [line({ dayDate: "2026-10-12" })] })),
          "INPUT_INVALID",
        );
        await expectFailure(
          issue(capture({ lines: [line({ slotId: "90000000-0000-4000-8000-000000000001" })] })),
          "OFFER_NOT_FOUND",
        );
        await sql(
          "INSERT INTO weekly_menu_slots(tenant_id,weekly_menu_id,dish_id,day_date,unit_price) VALUES('" +
            tenant +
            "','60000000-0000-4000-8000-000000000001','" +
            dish +
            "','2026-10-05',4)",
        );
        await expectFailure(issue(capture()), "OFFER_AMBIGUOUS");
        const slot = await sql(
          "SELECT id FROM weekly_menu_slots WHERE day_date='2026-10-05' AND unit_price=2.5",
        );
        const quote = await issue(capture({ lines: [line({ slotId: slot })] }));
        assert.equal(quote.lines[0].unitPrice, "2.5000");
        await sql("DELETE FROM weekly_menu_slots WHERE unit_price=4");
      },
    );
    await t.test("non-finite and invalid catalogue rejected even with explicit price", async () => {
      for (const price of ["NULL", "'NaN'::numeric", "-1"]) {
        await sql("UPDATE dishes SET price=" + price + " WHERE id='" + dish + "'");
        await expectFailure(issue(capture()), "PRICE_UNAVAILABLE");
        await expectFailure(
          issue(capture(), rid(), 1, { ...policy, active: true }),
          "OFFER_PRICING_COMMERCIAL_UNSUPPORTED",
        );
      }
      await sql("UPDATE dishes SET price=11.9 WHERE id='" + dish + "'");
    });
    await t.test("catalogue metadata and publication state drift rejects commit", async () => {
      const command = capture(),
        request = rid(),
        quote = await issue(command, request);
      await sql("UPDATE dishes SET name='different',allergens='{milk}' WHERE id='" + dish + "'");
      await expectFailure(commit(command, request, quote.quoteId), "PRICE_CHANGED");
      await sql(
        "UPDATE dishes SET name='Captured soup',allergens='{}' WHERE id='" +
          dish +
          "'; UPDATE weekly_menus SET status='draft'",
      );
      await expectFailure(commit(command, request, quote.quoteId), "PRICE_CHANGED");
      await sql("UPDATE weekly_menus SET status='published'");
    });
    await t.test(
      "legacy NULL capture stays compatible; new non-NULL and ambiguity cannot bypass SQL guard",
      async () => {
        await sql("UPDATE weekly_menu_slots SET unit_price=NULL WHERE day_date='2026-10-05'");
        const oid = "80000000-0000-4000-8000-000000000001",
          iid = "80000000-0000-4000-8000-000000000002";
        await sql(
          legacySession(
            "INSERT INTO orders(id,tenant_id,customer_id,total,week_start) VALUES('" +
              oid +
              "','" +
              tenant +
              "','" +
              customer +
              "',11.9,'2026-10-05'); INSERT INTO order_items(id,tenant_id,order_id,dish_id,day_date,qty,unit_price) VALUES('" +
              iid +
              "','" +
              tenant +
              "','" +
              oid +
              "','" +
              dish +
              "','2026-10-05',1,11.9)",
          ),
        );
        await sql(
          "UPDATE weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'; UPDATE dishes SET price=30 WHERE id='" +
            dish +
            "'",
        );
        await sql(
          legacySession(
            "UPDATE orders SET status='confirmed' WHERE id='" +
              oid +
              "'; UPDATE order_items SET comment='keep snapshot' WHERE id='" +
              iid +
              "'",
          ),
        );
        assert.equal(
          await sql("SELECT unit_price FROM order_items WHERE id='" + iid + "'"),
          "11.9000",
        );
        await expectFailure(
          sql(
            legacySession(
              "INSERT INTO order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price) VALUES('" +
                tenant +
                "','" +
                oid +
                "','" +
                dish +
                "','2026-10-05',1,11.9)",
            ),
          ),
          "OFFER_PRICING_QUOTE_REQUIRED",
        );
        await sql("UPDATE dishes SET price=11.9 WHERE id='" + dish + "'");
      },
    );
    await t.test("legacy real roles and forged actor cannot bypass provenance", async () => {
      const oid = "80000000-0000-4000-8000-000000000001";
      const insert =
        "INSERT INTO order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price) VALUES('" +
        tenant +
        "','" +
        oid +
        "','" +
        dish +
        "','2026-10-05',1,11.9)";
      await sql("UPDATE weekly_menu_slots SET unit_price=NULL WHERE day_date='2026-10-05'");
      await sql(legacySession(insert, 2));
      for (const n of [3, 4, 7])
        await expectFailure(sql(legacySession(insert, n)), "PERMISSION_DENIED");
      await expectFailure(
        sql(
          "SET SESSION AUTHORIZATION authenticated; BEGIN; SELECT set_config('cr_order.verified_actor','" +
            actor(1) +
            "',true); " +
            insert +
            ";COMMIT",
        ),
        "PERMISSION_DENIED",
      );
      await expectFailure(
        sql(
          legacySession("UPDATE order_items SET qty=99 WHERE order_id='" + captured.order.id + "'"),
        ),
        "V2_CANONICAL_WRITER_REQUIRED",
      );
    });
    await t.test(
      "legacy racing NULL-to-explicit slot update waits then fails without partial insert",
      async () => {
        const oid = "80000000-0000-4000-8000-000000000001",
          before = await sql("SELECT count(*) FROM order_items WHERE order_id='" + oid + "'");
        const mutation = sql(
          "BEGIN; UPDATE weekly_menu_slots SET unit_price=2.5 WHERE day_date='2026-10-05'; SELECT pg_sleep(0.3); COMMIT;",
        );
        let locked = false;
        for (let n = 0; n < 40; n++) {
          if (
            (await sql(
              "SELECT count(*) FROM (SELECT id FROM weekly_menu_slots WHERE day_date='2026-10-05' FOR UPDATE SKIP LOCKED)s",
            )) === "0"
          ) {
            locked = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        assert.equal(locked, true);
        await expectFailure(
          sql(
            legacySession(
              "INSERT INTO order_items(tenant_id,order_id,dish_id,day_date,qty,unit_price) VALUES('" +
                tenant +
                "','" +
                oid +
                "','" +
                dish +
                "','2026-10-05',1,11.9)",
            ),
          ),
          "OFFER_PRICING_QUOTE_REQUIRED",
        );
        await mutation;
        assert.equal(
          await sql("SELECT count(*) FROM order_items WHERE order_id='" + oid + "'"),
          before,
        );
      },
    );
    await t.test("legacy restore/status cannot skip explicit offer guard", async () => {
      const iid = "80000000-0000-4000-8000-000000000002";
      await sql(legacySession("UPDATE order_items SET deleted_at=now() WHERE id='" + iid + "'"));
      await expectFailure(
        sql(legacySession("UPDATE order_items SET deleted_at=NULL WHERE id='" + iid + "'")),
        "OFFER_PRICING_QUOTE_REQUIRED",
      );
      await expectFailure(
        sql(
          legacySession(
            "UPDATE order_items SET price_snapshot_status='explicit_zero' WHERE id='" + iid + "'",
          ),
        ),
        "OFFER_PRICING_QUOTE_REQUIRED",
      );
    });
    await t.test(
      "audit failure rolls back new customer/header/items/ledger and derivatives",
      async () => {
        const command = capture({
            customer: { kind: "new", displayName: "Must rollback audit", phone: "12345678" },
          }),
          request = rid(),
          quote = await issue(command, request);
        const counts =
            "SELECT jsonb_build_array((SELECT count(*) FROM customers),(SELECT count(*) FROM customer_phones),(SELECT count(*) FROM orders),(SELECT count(*) FROM order_items),(SELECT count(*) FROM order_write_requests),(SELECT count(*) FROM audit_log),(SELECT count(*) FROM delivery_services))",
          before = await sql(counts);
        await sql(
          "CREATE FUNCTION public.m2_fixture_audit_fail() RETURNS trigger LANGUAGE plpgsql AS $test$ BEGIN IF NEW.action='order.offer.capture' THEN RAISE EXCEPTION 'AUDIT_TEST_FAILURE'; END IF; RETURN NEW; END $test$; CREATE TRIGGER m2_fixture_audit_fail BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION public.m2_fixture_audit_fail()",
        );
        await expectFailure(commit(command, request, quote.quoteId), "AUDIT_TEST_FAILURE");
        assert.equal(await sql(counts), before);
        await sql(
          "DROP TRIGGER m2_fixture_audit_fail ON audit_log; DROP FUNCTION public.m2_fixture_audit_fail()",
        );
      },
    );
    await t.test("expired uncommitted quote fails closed", async () => {
      const command = capture(),
        request = rid(),
        quote = await issue(command, request),
        expired = "90000000-0000-4000-8000-000000000099";
      await sql(
        backend(
          "INSERT INTO cr_order_private.offer_quotes(id,tenant_id,actor_id,request_id,command_hash,policy_hash,lines,state,expires_at) SELECT '" +
            expired +
            "',tenant_id,actor_id,request_id,command_hash,policy_hash,lines,state,now()-interval '1 second' FROM cr_order_private.offer_quotes WHERE id='" +
            quote.quoteId +
            "'",
        ),
      );
      await expectFailure(commit(command, request, expired), "PRICE_CHANGED");
    });
    await t.test("same request concurrent retry creates exactly one write", async () => {
      const command = capture(),
        request = rid(),
        quote = await issue(command, request);
      const result = await Promise.all([
        commit(command, request, quote.quoteId),
        commit(command, request, quote.quoteId),
      ]);
      assert.equal(result.filter((r) => r.replayed).length, 1);
      assert.equal(result[0].order.id, result[1].order.id);
    });
  });
} finally {
  await exec(join(bin, "pg_ctl"), ["-D", data, "-m", "fast", "stop"]);
  await rm(owned, { recursive: true, force: true });
}
