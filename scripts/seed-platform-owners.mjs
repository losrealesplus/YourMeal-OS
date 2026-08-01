#!/usr/bin/env node
/**
 * OP-002 · Platform Owners bootstrap from configuration (idempotent).
 *
 * Reads config/bootstrap/platform-owners.json (bootstrap config, not app logic),
 * syncs public.platform_owners, then for each active owner:
 *   - create or reuse Auth user
 *   - ensure profile + membership + saas_admin + company_admin
 *
 * Ownership changes: edit the JSON config and re-run this script.
 * Emails removed from config are deactivated and platform grants revoked.
 *
 * Required env:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   PLATFORM_OWNERS_PASSWORD   (min 8; used only when creating Auth users)
 *   PLATFORM_OWNERS_CONFIG     (path override)
 *
 * Usage:
 *   npm run seed:platform-owners
 *
 * Loads repository-root `.env` via dotenv (same pattern as PS-002-C scripts).
 * Node does not inject Vite/env files automatically.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import {
  DEFAULT_PLATFORM_OWNERS_CONFIG_PATH,
  loadPlatformOwnersConfig,
} from "./lib/platform-owners-config.mjs";

function requireEnv(name, fallbacks = []) {
  const keys = [name, ...fallbacks];
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  throw new Error(`Missing env: ${keys.join(" | ")}`);
}

async function findUserByEmail(admin, email) {
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

async function syncConfigTable(admin, config) {
  const activeEmails = config.owners.map((o) => o.email);

  for (const owner of config.owners) {
    const { error } = await admin.from("platform_owners").upsert(
      {
        email: owner.email,
        full_name: owner.fullName,
        tenant_slug: owner.tenantSlug,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
    if (error) throw error;
  }

  const { data: existing, error: listErr } = await admin
    .from("platform_owners")
    .select("email, active");
  if (listErr) throw listErr;

  const deactivated = [];
  for (const row of existing ?? []) {
    if (!activeEmails.includes(row.email)) {
      const { error } = await admin
        .from("platform_owners")
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq("email", row.email);
      if (error) throw error;

      const { data: revoked, error: revErr } = await admin.rpc(
        "revoke_platform_owner_for_email",
        { _email: row.email },
      );
      if (revErr) throw revErr;
      deactivated.push({ email: row.email, revoke: revoked });
    }
  }

  return { deactivated };
}

async function main() {
  const configPath = process.env.PLATFORM_OWNERS_CONFIG
    ? resolve(process.env.PLATFORM_OWNERS_CONFIG)
    : DEFAULT_PLATFORM_OWNERS_CONFIG_PATH;
  const config = loadPlatformOwnersConfig(configPath);

  const url = requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const password = process.env.PLATFORM_OWNERS_PASSWORD;

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("OP-002 · Platform Owners bootstrap (from config)");
  console.log(`  config: ${configPath}`);
  console.log(`  default tenant slug: ${config.defaultTenantSlug}`);
  console.log(`  owners in config: ${config.owners.length}`);

  for (const slug of new Set(config.owners.map((o) => o.tenantSlug))) {
    const { data: tenant, error } = await admin
      .from("tenants")
      .select("id, name, slug")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!tenant) {
      throw new Error(
        `Tenant slug "${slug}" missing — apply migrations / provision tenant before Platform Owner bootstrap`,
      );
    }
    console.log(`  tenant ok: ${tenant.name} (${tenant.slug})`);
  }

  const { deactivated } = await syncConfigTable(admin, config);
  if (deactivated.length) {
    console.log(`\n  deactivated / revoked (${deactivated.length}):`);
    for (const d of deactivated) {
      console.log(`    - ${d.email}`);
    }
  }

  const results = [];

  for (const owner of config.owners) {
    const auth = await ensureAuthUser(admin, owner, password);
    const { data: ensured, error: ensureErr } = await admin.rpc(
      "ensure_platform_owner_for_user",
      { _user_id: auth.userId },
    );
    if (ensureErr) throw ensureErr;

    const { data: tenant } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", owner.tenantSlug)
      .maybeSingle();

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
    console.log(`    tenant:        ${owner.tenantSlug}`);
    console.log(`    roles:         ${roleNames.join(", ") || "(none)"}`);
    console.log(`    saas_admin:    ${hasSaas ? "OK" : "MISSING"}`);
    console.log(`    company_admin: ${hasCompany ? "OK" : "MISSING"}`);
    console.log(`    membership:    ${membership ? "OK" : "MISSING"}`);
  }

  const failed = results.filter(
    (r) => !r.saas_admin || !r.company_admin || !r.membership,
  );
  if (failed.length) {
    console.error(
      "\nOP-002 FAILED — incomplete grants for:",
      failed.map((f) => f.email),
    );
    process.exit(1);
  }

  console.log("\nOP-002 complete — Platform Owners synced from config.");
  console.log(
    "Expected login path: Landing → /admin → Centro de Operaciones YourMeal OS → /saas",
  );
  console.log(
    "To change ownership later: edit config/bootstrap/platform-owners.json and re-run this script.",
  );
}

main().catch((e) => {
  console.error("seed-platform-owners failed:", e.message || e);
  process.exit(1);
});
