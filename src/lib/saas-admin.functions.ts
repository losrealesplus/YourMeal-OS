/**
 * SaaS Governance server functions (WP-5 Tenant Provisioning).
 * Capability: saas.manage. Actor must be saas_admin.
 * @see docs/00-status/OPS_CENTER_DUAL_SURFACE.md
 * @see docs/05-architecture/TENANT_OPERATIONAL_AUTONOMY.md
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/hooks/use-auth";

const PROVISIONING_ENTITIES = [
  "tenant",
  "company_admin",
  "membership",
  "user_role",
] as const;

const ROLE_CATALOG = [
  "company_admin",
  "operations_manager",
  "kitchen",
  "delivery",
  "production",
  "purchasing",
  "inventory",
  "support",
  "accounting",
  "logistics",
  "driver",
  "employee",
  "customer",
] as const satisfies readonly AppRole[];


async function assertSaasAdmin(ctx: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "saas_admin")
    .is("tenant_id", null)
    .maybeSingle();
  if (error) throw new Error(`Auth check failed: ${error.message}`);
  if (!data) throw new Error("Forbidden: saas_admin role required");
}

async function writeAudit(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  input: {
    tenantId: string | null;
    actorId: string;
    entityType: (typeof PROVISIONING_ENTITIES)[number];
    entityId: string;
    action: string;
    oldData?: unknown;
    newData?: unknown;
  },
) {
  await admin.from("audit_log").insert({
    tenant_id: input.tenantId,
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
  });
}


// -------- Tenants --------

export const listTenants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select(
        "id, slug, name, status, locale_default, country, currency, brand_primary, brand_logo_path, brand_updated_at, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getTenant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tenantId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [tenantRes, memberRes, rolesRes] = await Promise.all([
      supabaseAdmin.from("tenants").select("*").eq("id", data.tenantId).maybeSingle(),
      supabaseAdmin
        .from("tenant_members")
        .select("user_id, joined_at")
        .eq("tenant_id", data.tenantId),
      supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .eq("tenant_id", data.tenantId),
    ]);
    if (tenantRes.error) throw new Error(tenantRes.error.message);
    if (!tenantRes.data) throw new Error("Tenant not found");

    const memberIds = (memberRes.data ?? []).map((m) => m.user_id);
    let profiles: Array<{ id: string; full_name: string | null }> = [];
    if (memberIds.length > 0) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", memberIds);
      profiles = p ?? [];
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
    const roleMap = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }
    return {
      tenant: tenantRes.data,
      members: (memberRes.data ?? []).map((m) => ({
        userId: m.user_id,
        fullName: profileMap.get(m.user_id) ?? null,
        roles: roleMap.get(m.user_id) ?? [],
        joinedAt: m.joined_at,
      })),
    };
  });

export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        name: z.string().min(2).max(120),
        slug: z
          .string()
          .min(2)
          .max(60)
          .regex(/^[a-z0-9-]+$/, "lowercase, digits and hyphens only"),
        localeDefault: z.string().min(2).max(5).default("es"),
        country: z.string().length(2).optional(),
        currency: z.string().length(3).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: created, error } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: data.name,
        slug: data.slug,
        locale_default: data.localeDefault,
        country: data.country ?? null,
        currency: data.currency ?? null,
        status: "trial",
      })
      .select("id, slug, name, status")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(supabaseAdmin, {
      tenantId: created.id,
      actorId: context.userId,
      entityType: "tenant",
      entityId: created.id,
      action: "TENANT_CREATED",
      newData: created,
    });
    return created;
  });

export const setTenantStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        status: z.enum(["active", "suspended", "trial"]),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data: prev } = await supabaseAdmin
      .from("tenants")
      .select("id, status")
      .eq("id", data.tenantId)
      .maybeSingle();
    if (!prev) throw new Error("Tenant not found");
    const { data: updated, error } = await supabaseAdmin
      .from("tenants")
      .update({ status: data.status })
      .eq("id", data.tenantId)
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "tenant",
      entityId: data.tenantId,
      action: data.status === "active" ? "TENANT_ACTIVATED" : "TENANT_STATUS_CHANGED",
      oldData: prev,
      newData: updated,
    });
    return updated;
  });

// -------- Company Admins --------

export const listCompanyAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [rolesRes, tenantsRes] = await Promise.all([
      supabaseAdmin
        .from("user_roles")
        .select("user_id, tenant_id, role, created_at")
        .eq("role", "company_admin"),
      supabaseAdmin.from("tenants").select("id, name, slug"),
    ]);
    if (rolesRes.error) throw new Error(rolesRes.error.message);
    if (tenantsRes.error) throw new Error(tenantsRes.error.message);
    const userIds = Array.from(
      new Set((rolesRes.data ?? []).map((r) => r.user_id)),
    );
    let profiles: Array<{ id: string; full_name: string | null }> = [];
    let emails = new Map<string, string | null>();
    if (userIds.length > 0) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles = p ?? [];
      // Batch email lookup via auth admin (best-effort).
      for (const id of userIds) {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(id);
          emails.set(id, data.user?.email ?? null);
        } catch {
          emails.set(id, null);
        }
      }
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
    const tenantMap = new Map(
      (tenantsRes.data ?? []).map((t) => [t.id, { name: t.name, slug: t.slug }]),
    );
    return (rolesRes.data ?? []).map((r) => ({
      userId: r.user_id,
      tenantId: r.tenant_id,
      tenantName: r.tenant_id ? tenantMap.get(r.tenant_id)?.name ?? null : null,
      fullName: profileMap.get(r.user_id) ?? null,
      email: emails.get(r.user_id) ?? null,
      createdAt: r.created_at,
    }));
  });

export const createCompanyAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        fullName: z.string().min(2).max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: tenant, error: tenantErr } = await supabaseAdmin
      .from("tenants")
      .select("id, status")
      .eq("id", data.tenantId)
      .maybeSingle();
    if (tenantErr) throw new Error(tenantErr.message);
    if (!tenant) throw new Error("Tenant not found");
    if (tenant.status !== "active") {
      throw new Error("Tenant must be active before inviting a Company Admin");
    }

    // Reuse existing user if present, otherwise invite.
    let userId: string | null = null;
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const found = existing.users.find(
      (u) => u.email?.toLowerCase() === data.email.toLowerCase(),
    );
    if (found) {
      userId = found.id;
    } else {
      const { data: invited, error: invErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, {
          data: { full_name: data.fullName ?? null },
        });
      if (invErr) throw new Error(invErr.message);
      userId = invited.user?.id ?? null;
    }
    if (!userId) throw new Error("Could not resolve user id");

    // RI-001 membership: 1 user → 1 tenant.
    const { data: existingMembership } = await supabaseAdmin
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingMembership && existingMembership.tenant_id !== data.tenantId) {
      throw new Error(
        "User already belongs to another tenant (RI-001: 1 user → 1 tenant)",
      );
    }

    await supabaseAdmin
      .from("tenant_members")
      .upsert({
        user_id: userId,
        tenant_id: data.tenantId,
        membership_type: "employee",
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
        provisioning_channel: "provisioning",
      });
    await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, tenant_id: data.tenantId, role: "company_admin" },
        { onConflict: "user_id,tenant_id,role" },
      );

    if (data.fullName) {
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, full_name: data.fullName });
    }

    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "company_admin",
      entityId: userId,
      action: "COMPANY_ADMIN_CREATED",
      newData: { email: data.email, tenantId: data.tenantId },
    });
    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "membership",
      entityId: userId,
      action: "MEMBERSHIP_ASSIGNED",
      newData: { tenantId: data.tenantId },
    });
    return { userId, tenantId: data.tenantId };
  });

export const disableCompanyAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ userId: z.string().uuid(), tenantId: z.string().uuid() })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("tenant_id", data.tenantId)
      .eq("role", "company_admin");
    if (error) throw new Error(error.message);
    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "user_role",
      entityId: data.userId,
      action: "ROLE_CHANGED",
      oldData: { role: "company_admin" },
      newData: { role: null },
    });
    return { ok: true };
  });

export const resetCompanyAdminInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      data.email,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Membership (RI-001) --------

export const listMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const [membersRes, rolesRes, tenantsRes] = await Promise.all([
      supabaseAdmin.from("tenant_members").select("user_id, tenant_id, joined_at"),
      supabaseAdmin.from("user_roles").select("user_id, tenant_id, role"),
      supabaseAdmin.from("tenants").select("id, name"),
    ]);
    if (membersRes.error) throw new Error(membersRes.error.message);
    const userIds = Array.from(
      new Set((membersRes.data ?? []).map((m) => m.user_id)),
    );
    let profiles: Array<{ id: string; full_name: string | null }> = [];
    if (userIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      profiles = data ?? [];
    }
    const tenantMap = new Map(
      (tenantsRes.data ?? []).map((t) => [t.id, t.name]),
    );
    const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]));
    const roleMap = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const key = `${r.user_id}::${r.tenant_id ?? "null"}`;
      const list = roleMap.get(key) ?? [];
      list.push(r.role);
      roleMap.set(key, list);
    }
    return (membersRes.data ?? []).map((m) => ({
      userId: m.user_id,
      tenantId: m.tenant_id,
      tenantName: tenantMap.get(m.tenant_id) ?? "—",
      fullName: profileMap.get(m.user_id) ?? null,
      roles: roleMap.get(`${m.user_id}::${m.tenant_id}`) ?? [],
      joinedAt: m.joined_at,
    }));
  });

// -------- Roles catalog + assignment --------

export const getRoleCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSaasAdmin(context);
    return ROLE_CATALOG;
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        tenantId: z.string().uuid(),
        role: z.enum(ROLE_CATALOG),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const role: AppRole = data.role;
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: data.userId, tenant_id: data.tenantId, role },
        { onConflict: "user_id,tenant_id,role" },
      );
    if (error) throw new Error(error.message);
    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "user_role",
      entityId: data.userId,
      action: "ROLE_CHANGED",
      newData: { role },
    });
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        tenantId: z.string().uuid(),
        role: z.enum(ROLE_CATALOG),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const role: AppRole = data.role;
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("tenant_id", data.tenantId)
      .eq("role", role);
    if (error) throw new Error(error.message);
    await writeAudit(supabaseAdmin, {
      tenantId: data.tenantId,
      actorId: context.userId,
      entityType: "user_role",
      entityId: data.userId,
      action: "ROLE_CHANGED",
      oldData: { role },
      newData: { role: null },
    });
    return { ok: true };
  });

// -------- Provisioning Audit --------

export const listProvisioningAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSaasAdmin(context);
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select(
        "id, tenant_id, actor_id, entity_type, entity_id, action, new_data, created_at",
      )
      .in("entity_type", [...PROVISIONING_ENTITIES])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export { ROLE_CATALOG };
