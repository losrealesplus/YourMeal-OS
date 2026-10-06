/** Local PostgreSQL integration test for Offer Pricing M3 & OP08. */
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

const owned = await mkdtemp(join(tmpdir(), "offer-m3-owned-"));
const data = join(owned, "data");
const port = "55441";

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

const db = `offer_m3_test_${process.pid}`;
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
let request = 30;
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

const policyM3 = {
  active: true,
  mode: "individual_line_pricing_v1",
  policyHash: "a".repeat(64),
};

const policyWeekly = {
  active: true,
  mode: "weekly_plan",
  policyHash: "b".repeat(64),
};

const backend = (statement) =>
  `SET SESSION AUTHORIZATION service_role; SET ROLE service_role; BEGIN; ${statement}; COMMIT;`;

const issueStatement = (command, id, n = 1, context = policyM3, tid = tenant) =>
  `SELECT public.cr_order_offer_quote_issue('${tid}','${actor(n)}','${id}',${literal(command)},${literal(context)})`;

const issue = async (command, id = rid(), n = 1, context = policyM3, tid = tenant) =>
  JSON.parse((await sql(backend(issueStatement(command, id, n, context, tid)))).split("\n").at(-1));

const commit = async (command, id, quote, n = 1, context = policyM3, tid = tenant) =>
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

const expectFailure = (promise, code) => assert.rejects(promise, (e) => e.stderr && e.stderr.includes(code));

try {
  await test("M3 individual_line_pricing_v1 & OP08 published offer protection", async (t) => {
    // 1. Setup roles and base database
    await sql(
      `CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE ROLE ${executor} NOLOGIN NOINHERIT CREATEROLE`,
      "postgres",
    );
    await sql(`CREATE DATABASE ${db} OWNER ${executor}`, "postgres");

    // 2. Apply migration sequence: Fixture -> A1 -> A3 -> M2 -> A4a -> M3
    for (const path of [
      "supabase/tests/cr-order-v2/fixture.sql",
      "supabase/migrations/20261005113919_cr_order_expand_readers_foundation.sql",
      "supabase/migrations/20261005174218_cr_order_v2_dish_writer.sql",
    ]) {
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    }

    await sql(
      `SET ROLE ${executor}; ALTER TABLE public.weekly_menus ADD COLUMN IF NOT EXISTS deleted_at timestamptz, ADD COLUMN IF NOT EXISTS published_at timestamptz; CREATE UNIQUE INDEX IF NOT EXISTS weekly_menus_tenant_week_start_ux ON public.weekly_menus(tenant_id,week_start) WHERE deleted_at IS NULL AND week_start IS NOT NULL; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO service_role; GRANT SELECT ON auth.users TO service_role;`,
    );

    for (const path of [
      "supabase/migrations/20261005174256_offer_pricing_canonical_quote_capture.sql",
      "supabase/migrations/20261006072046_cr_order_a4a_custom_writer.sql",
      "supabase/migrations/20261006110000_cr_menu_offer_pricing_m3_individual_line.sql",
    ]) {
      await sql(`SET ROLE ${executor}; ` + (await readFile(path, "utf8")));
    }

    await t.test("individual_line_pricing_v1 issues and commits explicit slot pricing", async () => {
      // Set slot price to 2.5000 in DB
      await sql(`SET cr_menu.remediation_active = 'true'; UPDATE public.weekly_menu_slots SET unit_price = 2.5000 WHERE dish_id = '${dish}' AND day_date = '2026-10-05'; SET cr_menu.remediation_active = 'false';`);

      const cmd = capture();
      const reqId = rid();
      const issued = await issue(cmd, reqId, 1, policyM3);

      assert.equal(issued.lines.length, 1);
      assert.equal(issued.lines[0].unitPrice, "2.5000");
      assert.equal(issued.lines[0].priceSource, "slot");
      assert.equal(issued.total, "5.00");

      const committed = await commit(cmd, reqId, issued.quoteId, 1, policyM3);
      assert.equal(committed.items[0].unit_price, 2.5);
      assert.equal(committed.order.total, 5);

      // Verify order_item captured price
      const itemPrice = await sql(
        `SELECT unit_price::text FROM public.order_items WHERE order_id = '${committed.order.id}' AND dish_id = '${dish}';`,
      );
      assert.equal(itemPrice, "2.5000");
    });

    await t.test("individual_line_pricing_v1 falls back to catalogue when slot price is NULL", async () => {
      // Set slot price to NULL in DB (via privileged setting for test setup)
      await sql(`SET cr_menu.remediation_active = 'true'; UPDATE public.weekly_menu_slots SET unit_price = NULL WHERE dish_id = '${dish}' AND day_date = '2026-10-05'; SET cr_menu.remediation_active = 'false';`);

      const cmd = capture();
      const reqId = rid();
      const issued = await issue(cmd, reqId, 1, policyM3);

      assert.equal(issued.lines.length, 1);
      assert.equal(issued.lines[0].unitPrice, "11.9000");
      assert.equal(issued.lines[0].priceSource, "catalogue");
      assert.equal(issued.total, "23.80");
    });

    await t.test("unsupported commercial mode (weekly_plan) fails closed on explicit slot price", async () => {
      await sql(`SET cr_menu.remediation_active = 'true'; UPDATE public.weekly_menu_slots SET unit_price = 2.5000 WHERE dish_id = '${dish}' AND day_date = '2026-10-05'; SET cr_menu.remediation_active = 'false';`);

      const cmd = capture();
      const reqId = rid();

      await expectFailure(
        issue(cmd, reqId, 1, policyWeekly),
        "OFFER_PRICING_COMMERCIAL_UNSUPPORTED",
      );
    });

    await t.test("unsupported commercial mode (weekly_plan) fails closed on NULL slot price requiring legacy commercial resolver", async () => {
      await sql(`SET cr_menu.remediation_active = 'true'; UPDATE public.weekly_menu_slots SET unit_price = NULL WHERE dish_id = '${dish}' AND day_date = '2026-10-05'; SET cr_menu.remediation_active = 'false';`);

      const cmd = capture();
      const reqId = rid();

      await expectFailure(
        issue(cmd, reqId, 1, policyWeekly),
        "COMMERCIAL_QUOTE_REQUIRED",
      );
    });

    await t.test("OP08: direct UPDATE on published weekly_menu_slots unit_price is blocked", async () => {
      await expectFailure(
        sql(`UPDATE public.weekly_menu_slots SET unit_price = 3.5000 WHERE dish_id = '${dish}' AND day_date = '2026-10-05';`),
        "PUBLISHED_OFFER_PRICE_MODIFICATION_BLOCKED",
      );
    });

    await t.test("OP08: published_offer_price_remediation succeeds atomically with audit trail", async () => {
      const slotId = await sql(`SELECT id::text FROM public.weekly_menu_slots WHERE dish_id = '${dish}' AND day_date = '2026-10-05';`);
      const menuId = await sql(`SELECT weekly_menu_id::text FROM public.weekly_menu_slots WHERE id = '${slotId}';`);

      const manifest = {
        manifestVersion: "v1",
        tenantId: tenant,
        weekStart: "2026-10-05",
        reason: "OP08 15 extras published pricing fix",
        manifestHash: "c".repeat(64),
        items: [
          {
            slotId,
            menuId,
            dishId: dish,
            dayDate: "2026-10-05",
            expectedOldPrice: null,
            newPrice: "2.5000",
          },
        ],
      };

      const remediationReqId = rid();
      const remediationRes = JSON.parse(
        (
          await sql(
            backend(
              `SELECT public.cr_menu_published_offer_price_remediation('${tenant}','${actor(1)}','${remediationReqId}',${literal(manifest)})`,
            ),
          )
        )
          .split("\n")
          .at(-1),
      );

      assert.equal(remediationRes.success, true);
      assert.equal(remediationRes.remediatedCount, 1);

      // Verify slot updated
      const updatedPrice = await sql(`SELECT unit_price::text FROM public.weekly_menu_slots WHERE id = '${slotId}';`);
      assert.equal(updatedPrice, "2.5000");

      // Verify audit log entry
      const auditAction = await sql(
        `SELECT action FROM public.audit_log WHERE tenant_id = '${tenant}' AND action = 'published_offer_price_remediation' LIMIT 1;`,
      );
      assert.equal(auditAction, "published_offer_price_remediation");
    });

    await t.test("OP08: remediation with mismatched expectedOldPrice fails closed and rolls back", async () => {
      const slotId = await sql(`SELECT id::text FROM public.weekly_menu_slots WHERE dish_id = '${dish}' AND day_date = '2026-10-05';`);
      const menuId = await sql(`SELECT weekly_menu_id::text FROM public.weekly_menu_slots WHERE id = '${slotId}';`);

      const badManifest = {
        manifestVersion: "v1",
        tenantId: tenant,
        weekStart: "2026-10-05",
        reason: "Bad expected price test",
        manifestHash: "d".repeat(64),
        items: [
          {
            slotId,
            menuId,
            dishId: dish,
            dayDate: "2026-10-05",
            expectedOldPrice: "9.9900", // Wrong old price (actual is 2.5000)
            newPrice: "4.0000",
          },
        ],
      };

      await expectFailure(
        sql(
          backend(
            `SELECT public.cr_menu_published_offer_price_remediation('${tenant}','${actor(1)}','${rid()}',${literal(badManifest)})`,
          ),
        ),
        "REMEDIATION_EXPECTED_PRICE_MISMATCH",
      );

      // Verify price did not change
      const priceAfterFailure = await sql(`SELECT unit_price::text FROM public.weekly_menu_slots WHERE id = '${slotId}';`);
      assert.equal(priceAfterFailure, "2.5000");
    });
  });
} finally {
  try {
    await exec(join(bin, "pg_ctl"), ["-D", data, "-m", "immediate", "stop"]);
  } catch {}
  await rm(owned, { recursive: true, force: true });
}
