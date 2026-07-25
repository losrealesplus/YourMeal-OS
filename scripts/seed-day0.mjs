#!/usr/bin/env node
/**
 * OP-001.1 · Day-0 seed — first saas_admin without manual SQL.
 *
 * Creates (or reuses) an Auth user and assigns role saas_admin with tenant_id NULL.
 * Idempotent: if a saas_admin already exists, exits 0 unless --force-user.
 *
 * Required env:
 *   SUPABASE_URL (or VITE_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SEED_SAAS_ADMIN_EMAIL
 *   SEED_SAAS_ADMIN_PASSWORD   (min 8 chars; used only when creating the user)
 *
 * Optional:
 *   SEED_SAAS_ADMIN_NAME
 *
 * Usage:
 *   npm run seed
 *
 * Target install path:
 *   git clone → npm install → supabase db reset → npm run seed → login → operate
 */
import { createClient } from "@supabase/supabase-js";

function requireEnv(name, fallbacks = []) {
  const keys = [name, ...fallbacks];
  for (const k of keys) {
    if (process.env[k]) return process.env[k];
  }
  throw new Error(`Missing env: ${keys.join(" | ")}`);
}

async function main() {
  const url = requireEnv("SUPABASE_URL", ["VITE_SUPABASE_URL"]);
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const email = requireEnv("SEED_SAAS_ADMIN_EMAIL").trim().toLowerCase();
  const password = process.env.SEED_SAAS_ADMIN_PASSWORD;
  const fullName = process.env.SEED_SAAS_ADMIN_NAME?.trim() || "Platform Admin";

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { count: existingAdmins, error: countErr } = await admin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "saas_admin")
    .is("tenant_id", null);
  if (countErr) throw countErr;

  if ((existingAdmins ?? 0) > 0 && !process.argv.includes("--force-user")) {
    console.log(
      `Day-0 seed: saas_admin already present (count=${existingAdmins}). Nothing to do.`,
    );
    console.log("Login with that account → expected home: /saas");
    process.exit(0);
  }

  if (!password || password.length < 8) {
    throw new Error(
      "SEED_SAAS_ADMIN_PASSWORD required (min 8) when creating the first saas_admin",
    );
  }

  // Find or create auth user
  let userId = null;
  const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;
  const found = listed.users.find((u) => u.email?.toLowerCase() === email);
  if (found) {
    userId = found.id;
    console.log(`Reusing auth user ${email} (${userId})`);
  } else {
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
    if (createErr) throw createErr;
    userId = created.user?.id ?? null;
    if (!userId) throw new Error("createUser returned no id");
    console.log(`Created auth user ${email} (${userId})`);
  }

  await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
  });

  const { error: roleErr } = await admin.from("user_roles").upsert(
    {
      user_id: userId,
      tenant_id: null,
      role: "saas_admin",
    },
    { onConflict: "user_id,tenant_id,role" },
  );
  if (roleErr) throw roleErr;

  await admin.from("audit_log").insert({
    tenant_id: null,
    actor_id: userId,
    entity_type: "user_role",
    entity_id: userId,
    action: "DAY0_SAAS_ADMIN_SEEDED",
    new_data: { email, via: "npm run seed" },
  });

  console.log("Day-0 seed complete.");
  console.log(`  email: ${email}`);
  console.log("  role:  saas_admin (tenant_id NULL)");
  console.log("  next:  login → /saas → create tenant → invite company admin");
}

main().catch((e) => {
  console.error("seed-day0 failed:", e.message || e);
  process.exit(1);
});
