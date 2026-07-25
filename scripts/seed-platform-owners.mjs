#!/usr/bin/env node
/**
 * OP-002 · Permanent Platform Owners bootstrap (idempotent).
 *
 * Creates or reuses Auth users for the permanent Platform Owner emails and
 * assigns official roles via ensure_platform_owner_for_user:
 *   - saas_admin (tenant_id NULL) — platform
 *   - company_admin on EatClean Tenerife — tenant
 *
 * Not a temporary seed. Safe to re-run. Never duplicates profiles / memberships / roles.
 *
 * Required env:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional (used only when creating a missing Auth user):
 *   PLATFORM_OWNERS_PASSWORD   (min 8; shared for both, if creating with password)
 *   If password is omitted, invites the user by email instead.
 *
 * Usage:
 *   npm run seed:platform-owners
 */
import { createClient } from "@supabase/supabase-js";

const PLATFORM_OWNERS = [
  { email: "alex1409h@gmail.com", fullName: "Alex Hernandez" },
  { email: "alexhdezmtinez@gmail.com", fullName: "Alex Hdez Martinez" },
];

function requireEnv(name, fallbacks = []) {
  const keys = [name, ...fallbacks];
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  throw new Error(`Missing env: ${keys.join(" | ")}`);
}

async function findUserByEmail(admin, email) {
  // Paginate — owner emails may not be on page 1 in larger projects.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const users = data?.users ?? [];
    const found = users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (users.length < 200) break;
  }
  return null;
}

async function ensureAuthUser(admin, { email, fullName }, password) {
  const existing = await findUserByEmail(admin, email);
  if (existing) {
    return { userId: existing.id, created: false, invited: false };
  }

  if (password && password.length >= 8) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error) throw error;
    const userId = data.user?.id;
    if (!userId) throw new Error(`createUser returned no id for ${email}`);
    return { userId, created: true, invited: false };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });
  if (error) throw error;
  const userId = data.user?.id;
  if (!userId) throw new Error(`inviteUserByEmail returned no id for ${email}`);
  return { userId, created: true, invited: true };
}

async function main() {
  const url = requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const password = process.env.PLATFORM_OWNERS_PASSWORD;

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .select("id, name, slug")
    .eq("slug", "eatclean-tenerife")
    .maybeSingle();
  if (tenantErr) throw tenantErr;
  if (!tenant) {
    throw new Error(
      "Tenant eatclean-tenerife missing — apply migrations before seeding Platform Owners",
    );
  }

  console.log("OP-002 · Platform Owners bootstrap");
  console.log(`  tenant: ${tenant.name} (${tenant.slug})`);

  const results = [];

  for (const owner of PLATFORM_OWNERS) {
    const auth = await ensureAuthUser(admin, owner, password);
    const { data: ensured, error: ensureErr } = await admin.rpc(
      "ensure_platform_owner_for_user",
      { _user_id: auth.userId },
    );
    if (ensureErr) throw ensureErr;

    // Verify final state (no duplicates assumed by unique constraints / NOT EXISTS).
    const [{ data: roles, error: rolesErr }, { data: membership, error: memErr }] =
      await Promise.all([
        admin
          .from("user_roles")
          .select("role, tenant_id")
          .eq("user_id", auth.userId),
        admin
          .from("tenant_members")
          .select("tenant_id")
          .eq("user_id", auth.userId)
          .eq("tenant_id", tenant.id)
          .maybeSingle(),
      ]);
    if (rolesErr) throw rolesErr;
    if (memErr) throw memErr;

    const roleNames = (roles ?? []).map((r) => r.role).sort();
    const hasSaas = (roles ?? []).some(
      (r) => r.role === "saas_admin" && r.tenant_id == null,
    );
    const hasCompany = (roles ?? []).some(
      (r) => r.role === "company_admin" && r.tenant_id === tenant.id,
    );

    const row = {
      email: owner.email,
      userId: auth.userId,
      auth: auth.created
        ? auth.invited
          ? "invited"
          : "created"
        : "reused",
      roles: roleNames,
      saas_admin: hasSaas,
      company_admin: hasCompany,
      membership: Boolean(membership),
      ensure: ensured,
    };
    results.push(row);

    console.log(`\n  ${owner.email}`);
    console.log(`    auth:          ${row.auth} (${row.userId})`);
    console.log(`    roles:         ${roleNames.join(", ") || "(none)"}`);
    console.log(`    saas_admin:    ${hasSaas ? "OK" : "MISSING"}`);
    console.log(`    company_admin: ${hasCompany ? "OK" : "MISSING"}`);
    console.log(`    membership:    ${membership ? "OK" : "MISSING"}`);
  }

  const failed = results.filter(
    (r) => !r.saas_admin || !r.company_admin || !r.membership,
  );
  if (failed.length) {
    console.error("\nOP-002 FAILED — incomplete grants for:", failed.map((f) => f.email));
    process.exit(1);
  }

  console.log("\nOP-002 complete — both Platform Owners ready.");
  console.log("Expected login path: Landing → /admin → Centro de Operaciones YourMeal OS → /saas");
}

main().catch((e) => {
  console.error("seed-platform-owners failed:", e.message || e);
  process.exit(1);
});
