import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const cfg = Object.fromEntries(
  (await readFile("instances/yourmeal-eatclean/staging.local.runtime.env.example", "utf8"))
    .split("\n")
    .filter((x) => x && !x.startsWith("#"))
    .map((x) => [x.slice(0, x.indexOf("=")), x.slice(x.indexOf("=") + 1)]),
);
const base = cfg.SUPABASE_URL;
const users = [];
for (const name of ["customer", "outsider", "staff"]) {
  const list = await fetch(base + "/auth/v1/admin/users", {
    headers: { Authorization: "Bearer " + cfg.SUPABASE_SERVICE_ROLE_KEY },
  });
  const found = (await list.json()).users?.find((u) => u.email === name + "@e2e.example.test");
  if (found) {
    users.push(found.id);
    continue;
  }
  const r = await fetch(base + "/auth/v1/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + cfg.SUPABASE_SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email: name + "@e2e.example.test",
      password: "E2E-synthetic-Only-2026!",
      email_confirm: true,
      user_metadata: { full_name: "Synthetic " + name },
    }),
  });
  const x = await r.json();
  if (!r.ok) throw new Error("SYNTHETIC_USER_CREATE_FAILED " + r.status + " " + x.code);
  users.push(x.id);
}
const tenant = "10000000-0000-4000-8000-000000000001",
  other = "10000000-0000-4000-8000-000000000002";
const start = new Date();
const monday = new Date(
  Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate() - ((start.getUTCDay() + 6) % 7),
  ),
);
monday.setUTCDate(monday.getUTCDate() + 7);
const week = monday.toISOString().slice(0, 10);
const sql = `BEGIN; INSERT INTO public.tenants(id,slug,name,country,currency,timezone) VALUES('${tenant}','eatclean','Synthetic EatClean','ES','EUR','Atlantic/Canary'),('${other}','synthetic-other','Synthetic Other','ES','EUR','UTC') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.tenant_members(tenant_id,user_id,status,membership_type) VALUES('${tenant}','${users[0]}','approved','customer'),('${other}','${users[1]}','approved','customer'),('${tenant}','${users[2]}','approved','employee') ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,tenant_id,role) VALUES('${users[0]}','${tenant}','customer'),('${users[1]}','${other}','customer'),('${users[2]}','${tenant}','operations_manager') ON CONFLICT DO NOTHING;
INSERT INTO public.dishes(id,tenant_id,name,description,kcal,price,status) VALUES('30000000-0000-4000-8000-000000000001','${tenant}','Plato sintético E2E','Fixture de laboratorio',450,8.5,'active') ON CONFLICT(id) DO NOTHING;
INSERT INTO public.weekly_menus(id,tenant_id,week_start,status,published_at) VALUES('40000000-0000-4000-8000-000000000001','${tenant}','${week}','published',now());
INSERT INTO public.weekly_menu_slots(weekly_menu_id,tenant_id,day_date,dish_id,unit_price) VALUES('40000000-0000-4000-8000-000000000001','${tenant}','${week}','30000000-0000-4000-8000-000000000001',NULL);
INSERT INTO public.feature_flags(tenant_id,key,enabled) VALUES('${tenant}','order_programming',true) ON CONFLICT(tenant_id,key) WHERE tenant_id IS NOT NULL DO UPDATE SET enabled=EXCLUDED.enabled;
INSERT INTO public.tenant_deployments(tenant_id,platform,identifier,is_primary,status) VALUES('${tenant}','android','com.yourmealos.eatclean',true,'active') ON CONFLICT(platform,identifier) DO NOTHING; COMMIT;`;
const p = spawnSync("python3", ["scripts/staging-e2e-lab.py", "sql"], {
  input: sql,
  encoding: "utf8",
});
if (p.status) throw new Error("SYNTHETIC_SEED_SQL_FAILED " + p.stderr);
await writeFile(
  "/private/tmp/yourmeal-e2e-public-fixture.json",
  JSON.stringify({ tenant, other, users, week }),
);
console.log("SYNTHETIC_USERS_AND_CATALOG_READY");
