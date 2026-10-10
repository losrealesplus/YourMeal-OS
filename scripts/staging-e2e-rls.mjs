// Synthetic local backend only. Tokens stay in memory; output contains assertions only.
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
const env = Object.fromEntries(
  (await readFile("instances/yourmeal-eatclean/staging.local.runtime.env.example", "utf8"))
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const base = env.SUPABASE_URL;
if (base !== "http://127.0.0.1:54331") throw Error("LOCAL_BINDING_REQUIRED");
const { orderId } = JSON.parse(
  await readFile("/private/tmp/yourmeal-e2e-order-public.json", "utf8"),
);
const checks = [];
function check(name, ok) {
  checks.push({ name, result: ok ? "PASS" : "FAIL" });
  if (!ok) throw Error(name);
}
async function login(name) {
  const r = await fetch(base + "/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: name + "@e2e.example.test",
      password: "E2E-synthetic-Only-2026!",
    }),
  });
  const j = await r.json();
  check(name + "_GOTRUE_LOGIN", r.ok && !!j.access_token);
  return j.access_token;
}
async function query(token, path, method = "GET", body) {
  const r = await fetch(base + "/rest/v1/" + path, {
    method,
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => null);
  return { ok: r.ok, status: r.status, j };
}
try {
  const created = await fetch(base + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "peer@e2e.example.test",
      password: "E2E-synthetic-Only-2026!",
      email_confirm: true,
    }),
  });
  const peerUser = await created.json();
  check("PEER_SYNTHETIC_CREATE", created.ok && !!peerUser.id);
  const seed = spawnSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
    input: `INSERT INTO tenant_members(tenant_id,user_id,status,membership_type) VALUES('10000000-0000-4000-8000-000000000001','${peerUser.id}','approved','customer'); INSERT INTO user_roles(user_id,tenant_id,role) VALUES('${peerUser.id}','10000000-0000-4000-8000-000000000001','customer');`,
    encoding: "utf8",
  });
  check("PEER_SYNTHETIC_MEMBERSHIP", seed.status === 0);
  const own = await login("customer"),
    other = await login("outsider"),
    peer = await login("peer");
  let r = await query(own, "orders?id=eq." + orderId + "&select=id,tenant_id,customer_id,total");
  check("OWN_ORDER_READ", r.ok && r.j.length === 1);
  const customer = r.j[0].customer_id;
  r = await query(
    own,
    "order_items?order_id=eq." + orderId + "&select=qty,unit_price,price_snapshot_status",
  );
  check(
    "OWN_ITEM_PRICE_SNAPSHOT",
    r.ok &&
      r.j.length === 1 &&
      Number(r.j[0].unit_price) === 8.5 &&
      r.j[0].price_snapshot_status === "captured",
  );
  for (const [name, path] of [
    ["ORDER", "orders?id=eq." + orderId],
    ["ITEMS", "order_items?order_id=eq." + orderId],
    ["CUSTOMER", "customers?id=eq." + customer],
  ]) {
    r = await query(other, path);
    check("OTHER_TENANT_" + name + "_HIDDEN", !r.ok || r.j.length === 0);
    r = await query(peer, path);
    check("SAME_TENANT_OTHER_CUSTOMER_" + name + "_HIDDEN", !r.ok || r.j.length === 0);
    r = await query(env.SUPABASE_ANON_KEY, path);
    check("ANON_" + name + "_HIDDEN", !r.ok || r.j.length === 0);
  }
  r = await query(own, "customers?id=eq." + customer, "PATCH", {
    deleted_at: new Date().toISOString(),
  });
  check("CUSTOMER_DIRECT_CRM_WRITE_DENIED", !r.ok);
  r = await query(other, "orders?id=eq." + orderId, "PATCH", { notes: "UNAUTHORIZED_SYNTHETIC" });
  check("OTHER_TENANT_ORDER_WRITE_BLOCKED", !r.ok || r.j.length === 0);
  console.log(JSON.stringify({ status: "LOCAL_RLS_PASS", checks, productionConnection: false }));
} catch (e) {
  console.log(JSON.stringify({ status: "LOCAL_RLS_BLOCKED", failedCheck: e.message, checks }));
  process.exitCode = 1;
}
