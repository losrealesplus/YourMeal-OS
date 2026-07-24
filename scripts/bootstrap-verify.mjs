#!/usr/bin/env node
/**
 * OP-001.1 · Bootstrap integrity verifier
 *
 * Modes:
 *  1. Pure (default): runs precondition unit matrix — no network.
 *  2. Live (--live): queries Supabase with service role and prints tenant snapshot.
 *
 * Usage:
 *   npm run bootstrap:verify
 *   npm run bootstrap:verify -- --live [--tenant=<uuid|slug>]
 *
 * Env (live): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load compiled-free TS via dynamic import of the source through vitest-less path:
// re-implement the pure checks inline to keep the script dependency-free of Vite.
// Keep in sync with src/modules/bootstrap-integrity/domain/bootstrap-preconditions.ts

function canComposeWeeklyMenu(activeDishCount) {
  if (activeDishCount <= 0) {
    return { ok: false, code: "BOOTSTRAP_NO_DISHES", message: "no dishes" };
  }
  return { ok: true, code: "BOOTSTRAP_DISHES_READY" };
}
function canAcceptOrders(publishedMenuCount) {
  if (publishedMenuCount <= 0) {
    return { ok: false, code: "BOOTSTRAP_NO_PUBLISHED_MENU", message: "no menu" };
  }
  return { ok: true, code: "BOOTSTRAP_ORDERS_OPEN" };
}
function canOperateKitchen(n) {
  if (n <= 0) {
    return { ok: false, code: "BOOTSTRAP_NO_KITCHEN_DEMAND", message: "no kitchen demand" };
  }
  return { ok: true, code: "BOOTSTRAP_KITCHEN_READY" };
}
function canOperateDelivery(n) {
  if (n <= 0) {
    return { ok: false, code: "BOOTSTRAP_NO_DELIVERY_DEMAND", message: "no delivery demand" };
  }
  return { ok: true, code: "BOOTSTRAP_DELIVERY_READY" };
}
function canInviteOperationalStaff(companyAdminCount, role) {
  if (role !== "company_admin" && companyAdminCount <= 0) {
    return { ok: false, code: "BOOTSTRAP_NO_COMPANY_ADMIN", message: "no company admin" };
  }
  return { ok: true, code: "BOOTSTRAP_STAFF_INVITE_OK" };
}

function runPureMatrix() {
  const cases = [
    ["menu without dishes", canComposeWeeklyMenu(0).ok === false],
    ["menu with dishes", canComposeWeeklyMenu(1).ok === true],
    ["orders without menu", canAcceptOrders(0).ok === false],
    ["orders with menu", canAcceptOrders(1).ok === true],
    ["kitchen without orders", canOperateKitchen(0).ok === false],
    ["kitchen with orders", canOperateKitchen(2).ok === true],
    ["delivery without ready", canOperateDelivery(0).ok === false],
    ["delivery with ready", canOperateDelivery(1).ok === true],
    ["staff without admin", canInviteOperationalStaff(0, "kitchen").ok === false],
    ["staff with admin", canInviteOperationalStaff(1, "kitchen").ok === true],
    ["invite company_admin without admin", canInviteOperationalStaff(0, "company_admin").ok === true],
  ];
  let failed = 0;
  for (const [name, ok] of cases) {
    const mark = ok ? "PASS" : "FAIL";
    if (!ok) failed += 1;
    console.log(`  [${mark}] ${name}`);
  }
  return failed;
}

async function count(db, table, apply) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  q = apply(q);
  const { count: n, error } = await q;
  if (error) throw error;
  return n ?? 0;
}

async function runLive(tenantArg) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Live mode requires SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exit(2);
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let tenantId = tenantArg;
  if (!tenantId || !tenantId.includes("-")) {
    const slug = tenantArg || "eatclean-tenerife";
    const { data, error } = await db
      .from("tenants")
      .select("id, slug, name, status")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      console.error(`Tenant not found for slug=${slug}`);
      process.exit(2);
    }
    tenantId = data.id;
    console.log(`Tenant: ${data.name} (${data.slug}) [${data.status}]`);
  }

  const snapshot = {
    tenantCount: 1,
    companyAdminCount: await count(db, "user_roles", (q) =>
      q.eq("tenant_id", tenantId).eq("role", "company_admin"),
    ),
    staffCount: await count(db, "user_roles", (q) =>
      q
        .eq("tenant_id", tenantId)
        .in("role", ["kitchen", "delivery", "operations_manager", "logistics"]),
    ),
    activeDishCount: await count(db, "dishes", (q) =>
      q.eq("tenant_id", tenantId).eq("status", "active").is("deleted_at", null),
    ),
    publishedMenuCount: await count(db, "weekly_menus", (q) =>
      q.eq("tenant_id", tenantId).eq("status", "published").is("deleted_at", null),
    ),
    customerCount: await count(db, "customers", (q) => q.eq("tenant_id", tenantId)),
    confirmedOrderCount: await count(db, "orders", (q) =>
      q.eq("tenant_id", tenantId).eq("status", "confirmed"),
    ),
    kitchenQueueCount: await count(db, "orders", (q) =>
      q
        .eq("tenant_id", tenantId)
        .in("status", ["confirmed", "in_production", "prepared"]),
    ),
    readyForDeliveryCount: await count(db, "orders", (q) =>
      q.eq("tenant_id", tenantId).eq("status", "ready_for_delivery"),
    ),
    deliveredCount: await count(db, "orders", (q) =>
      q.eq("tenant_id", tenantId).eq("status", "delivered"),
    ),
  };

  console.log("\nSnapshot");
  for (const [k, v] of Object.entries(snapshot)) {
    console.log(`  ${k}: ${v}`);
  }

  const checks = [
    ["Dishes", canComposeWeeklyMenu(snapshot.activeDishCount)],
    ["Published menu", canAcceptOrders(snapshot.publishedMenuCount)],
    [
      "Kitchen demand",
      canOperateKitchen(
        snapshot.confirmedOrderCount + snapshot.kitchenQueueCount,
      ),
    ],
    ["Delivery demand", canOperateDelivery(snapshot.readyForDeliveryCount)],
    [
      "Company Admin",
      canInviteOperationalStaff(snapshot.companyAdminCount, "kitchen"),
    ],
  ];

  console.log("\nIntegrity");
  let blocked = 0;
  for (const [label, v] of checks) {
    console.log(`  [${v.ok ? "OPEN" : "BLOCK"}] ${label} · ${v.code}`);
    if (!v.ok) blocked += 1;
  }

  // SaaS admin presence (platform)
  const { count: saasCount, error: saasErr } = await db
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "saas_admin")
    .is("tenant_id", null);
  if (saasErr) throw saasErr;
  console.log(
    `\nPlatform saas_admin count: ${saasCount ?? 0}${
      (saasCount ?? 0) === 0 ? "  ← run npm run seed" : ""
    }`,
  );

  return blocked === 0 && (saasCount ?? 0) > 0 ? 0 : 1;
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const tenantArg = args
    .find((a) => a.startsWith("--tenant="))
    ?.slice("--tenant=".length);

  console.log("OP-001.1 · bootstrap:verify\n");
  console.log("Pure precondition matrix");
  const pureFails = runPureMatrix();
  if (pureFails > 0) {
    console.error(`\nFAIL · ${pureFails} pure case(s)`);
    process.exit(1);
  }
  console.log("\nPure matrix: PASS");

  if (!live) {
    console.log(
      "\nTip: npm run bootstrap:verify -- --live [--tenant=eatclean-tenerife]",
    );
    process.exit(0);
  }

  const code = await runLive(tenantArg);
  console.log(code === 0 ? "\nLIVE: OPERATIONAL READY" : "\nLIVE: NOT YET OPERATIONAL");
  process.exit(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
