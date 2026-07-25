#!/usr/bin/env node
/**
 * OP-001.2 · Bootstrap integrity verifier
 *
 * Modes:
 *   (default)     Pure precondition matrix — no network. Exit 0/1.
 *   --live        Query Supabase: counts + relationship chain.
 *   --ci          Deterministic CI mode (implies pure; --live if env present).
 *   --json=path   Write bootstrap-report.json (for evidence pack).
 *
 * Exit codes (--ci / always for live/config):
 *   0  PASS
 *   1  FAIL — data / integrity / pure matrix
 *   2  FAIL — configuration (missing env)
 *   3  FAIL — permissions / auth / query forbidden
 *
 * Usage:
 *   npm run bootstrap:verify
 *   npm run bootstrap:verify -- --ci
 *   npm run bootstrap:verify -- --live --tenant=eatclean-tenerife --json=docs/10-validation/evidence/op001/bootstrap-report.json
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const EXIT = { PASS: 0, DATA: 1, CONFIG: 2, PERMS: 3 };

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

function auditRelations(snap) {
  return [
    {
      id: "tenant_to_company_admin",
      from: "Tenant",
      to: "CompanyAdmin",
      ok: snap.tenantCount > 0 && snap.companyAdminCount > 0,
    },
    {
      id: "company_admin_to_roles",
      from: "CompanyAdmin",
      to: "Roles",
      ok: snap.companyAdminCount > 0 && snap.staffCount > 0,
    },
    {
      id: "roles_to_dishes",
      from: "Roles",
      to: "DishLibrary",
      ok: snap.companyAdminCount > 0 && snap.activeDishCount > 0,
    },
    {
      id: "dishes_to_published_menu",
      from: "DishLibrary",
      to: "PublishedMenu",
      ok: snap.activeDishCount > 0 && snap.publishedMenuCount > 0,
    },
    {
      id: "menu_to_customers",
      from: "PublishedMenu",
      to: "Customers",
      ok: snap.publishedMenuCount > 0 && snap.customerCount > 0,
    },
    {
      id: "customers_to_orders",
      from: "Customers",
      to: "Orders",
      ok:
        snap.publishedMenuCount > 0 &&
        snap.confirmedOrderCount + snap.kitchenQueueCount > 0,
    },
    {
      id: "orders_to_kitchen",
      from: "Orders",
      to: "KitchenQueue",
      ok:
        snap.kitchenQueueCount > 0 ||
        snap.readyForDeliveryCount > 0 ||
        snap.deliveredCount > 0,
    },
    {
      id: "kitchen_to_delivery",
      from: "KitchenQueue",
      to: "Delivery",
      ok: snap.readyForDeliveryCount > 0 || snap.deliveredCount > 0,
    },
    {
      id: "delivery_to_routes",
      from: "Delivery",
      to: "Routes",
      ok:
        (snap.routeCount ?? 0) > 0 ||
        snap.readyForDeliveryCount > 0 ||
        snap.deliveredCount > 0,
      soft: true,
    },
  ];
}

function runPureMatrix() {
  const cases = [
    ["cannotPublishMenuWithoutDishes", canComposeWeeklyMenu(0).ok === false],
    ["cannotCreateOrderWithoutPublishedMenu", canAcceptOrders(0).ok === false],
    ["cannotStartKitchenWithoutOrders", canOperateKitchen(0).ok === false],
    ["cannotDispatchWithoutReadyProduction", canOperateDelivery(0).ok === false],
    [
      "cannotInviteStaffWithoutCompanyAdmin",
      canInviteOperationalStaff(0, "kitchen").ok === false,
    ],
    ["menu with dishes allowed", canComposeWeeklyMenu(1).ok === true],
    ["orders with menu allowed", canAcceptOrders(1).ok === true],
    ["kitchen with demand allowed", canOperateKitchen(1).ok === true],
    ["delivery with ready allowed", canOperateDelivery(1).ok === true],
    ["staff with admin allowed", canInviteOperationalStaff(1, "kitchen").ok === true],
  ];
  let failed = 0;
  for (const [name, ok] of cases) {
    console.log(`  [${ok ? "PASS" : "FAIL"}] ${name}`);
    if (!ok) failed += 1;
  }
  return failed;
}

async function count(db, table, apply) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  q = apply(q);
  const { count: n, error } = await q;
  if (error) {
    const err = new Error(error.message);
    err.code = error.code;
    err.status = error.code === "42501" || /permission|jwt|rls/i.test(error.message)
      ? EXIT.PERMS
      : EXIT.DATA;
    throw err;
  }
  return n ?? 0;
}

async function runLive(tenantArg) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error(
      "Live/CI live mode requires SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
    );
    err.status = EXIT.CONFIG;
    throw err;
  }

  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let tenantId = tenantArg;
  let tenantMeta = null;
  const looksUuid =
    tenantArg &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tenantArg,
    );
  if (!looksUuid) {
    const slug = tenantArg || "eatclean-tenerife";
    const { data, error } = await db
      .from("tenants")
      .select("id, slug, name, status")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      const err = new Error(error.message);
      err.status = /permission|jwt/i.test(error.message) ? EXIT.PERMS : EXIT.DATA;
      throw err;
    }
    if (!data) {
      const err = new Error(`Tenant not found for slug=${slug}`);
      err.status = EXIT.DATA;
      throw err;
    }
    tenantId = data.id;
    tenantMeta = data;
    console.log(`Tenant: ${data.name} (${data.slug}) [${data.status}]`);
  } else {
    console.log(`Tenant id: ${tenantId}`);
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
    routeCount: await count(db, "routes", (q) => q.eq("tenant_id", tenantId)).catch(
      () => 0,
    ),
  };

  console.log("\nSnapshot");
  for (const [k, v] of Object.entries(snapshot)) {
    console.log(`  ${k}: ${v}`);
  }

  const gates = [
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

  console.log("\nIntegrity gates");
  let blocked = 0;
  for (const [label, v] of gates) {
    console.log(`  [${v.ok ? "OPEN" : "BLOCK"}] ${label} · ${v.code}`);
    if (!v.ok) blocked += 1;
  }

  const relations = auditRelations(snapshot);
  console.log("\nRelationship chain");
  let relBlocked = 0;
  for (const link of relations) {
    const soft = link.soft ? " (soft)" : "";
    console.log(
      `  [${link.ok ? "LINK" : "GAP "}] ${link.from} → ${link.to}${soft}`,
    );
    if (!link.ok && !link.soft) relBlocked += 1;
  }

  const { count: saasCount, error: saasErr } = await db
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "saas_admin")
    .is("tenant_id", null);
  if (saasErr) {
    const err = new Error(saasErr.message);
    err.status = EXIT.PERMS;
    throw err;
  }
  console.log(
    `\nPlatform saas_admin count: ${saasCount ?? 0}${
      (saasCount ?? 0) === 0 ? "  ← run npm run seed" : ""
    }`,
  );

  const report = {
    generatedAt: new Date().toISOString(),
    mode: "live",
    tenant: tenantMeta ?? { id: tenantId },
    snapshot,
    gates: gates.map(([label, v]) => ({ label, ...v })),
    relations,
    saasAdminCount: saasCount ?? 0,
    verdict:
      blocked === 0 && relBlocked === 0 && (saasCount ?? 0) > 0
        ? "PASS"
        : "NOT_YET_OPERATIONAL",
  };

  return {
    code:
      report.verdict === "PASS"
        ? EXIT.PASS
        : (saasCount ?? 0) === 0
          ? EXIT.DATA
          : EXIT.DATA,
    report,
  };
}

function writeJson(jsonPath, report) {
  const abs = path.resolve(jsonPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nWrote ${abs}`);
}

async function main() {
  const args = process.argv.slice(2);
  const ci = args.includes("--ci");
  const live = args.includes("--live") || (ci && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantArg = args
    .find((a) => a.startsWith("--tenant="))
    ?.slice("--tenant=".length);
  const jsonArg = args
    .find((a) => a.startsWith("--json="))
    ?.slice("--json=".length);

  console.log(`OP-001.2 · bootstrap:verify${ci ? " [--ci]" : ""}\n`);
  console.log("Pure precondition matrix (negative cases)");
  const pureFails = runPureMatrix();

  const pureReport = {
    generatedAt: new Date().toISOString(),
    mode: ci ? "ci-pure" : "pure",
    pureFails,
    verdict: pureFails === 0 ? "PASS" : "FAIL",
  };

  if (pureFails > 0) {
    console.error(`\nFAIL · ${pureFails} pure case(s) [exit ${EXIT.DATA}]`);
    if (jsonArg) writeJson(jsonArg, pureReport);
    process.exit(EXIT.DATA);
  }
  console.log("\nPure matrix: PASS");

  if (!live) {
    if (ci) {
      console.log("\nCI pure-only PASS (no SUPABASE_SERVICE_ROLE_KEY for live).");
      if (jsonArg) writeJson(jsonArg, pureReport);
      process.exit(EXIT.PASS);
    }
    console.log(
      "\nTip: npm run bootstrap:verify -- --ci | --live [--tenant=slug] [--json=path]",
    );
    if (jsonArg) writeJson(jsonArg, pureReport);
    process.exit(EXIT.PASS);
  }

  try {
    const { code, report } = await runLive(tenantArg);
    const merged = { ...report, pure: pureReport };
    if (jsonArg) writeJson(jsonArg, merged);
    console.log(
      code === EXIT.PASS
        ? "\nLIVE: OPERATIONAL READY [exit 0]"
        : `\nLIVE: NOT YET OPERATIONAL [exit ${code}]`,
    );
    process.exit(code);
  } catch (e) {
    const status = e.status ?? EXIT.DATA;
    console.error(`\nERROR [${status}]:`, e.message || e);
    if (jsonArg) {
      writeJson(jsonArg, {
        generatedAt: new Date().toISOString(),
        mode: "live-error",
        error: String(e.message || e),
        exitCode: status,
        verdict: "FAIL",
      });
    }
    process.exit(status);
  }
}

main();
