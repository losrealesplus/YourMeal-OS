/**
 * Tenant Admin server functions — staff invite within the caller's tenant.
 * Capability: employee.manage. Actor must be company_admin or operations_manager
 * (or saas_admin acting with tenant membership).
 *
 * Uses service-role only after RBAC checks — mirrors saas-admin.functions.ts.
 * @see docs/00-status/OP_001_OPERATIONAL_BOOTSTRAP.md
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { can } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth";
import { canInviteOperationalStaff } from "@/modules/bootstrap-integrity";

const STAFF_INVITE_ROLES = [
  "kitchen",
  "delivery",
  "operations_manager",
  "company_admin",
  "logistics",
  "production",
] as const satisfies readonly AppRole[];

async function assertEmployeeManager(ctx: {
  supabase: SupabaseClient<Database>;
  userId: string;
  tenantId: string;
}) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(`Auth check failed: ${error.message}`);
  const roles: AppRole[] = (data ?? []).map((r) => r.role);
  // Pure saas_admin may also manage when listed on the tenant.
  const { data: saas } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "saas_admin")
    .is("tenant_id", null)
    .maybeSingle();
  const effective: AppRole[] = saas
    ? [...roles, "saas_admin"]
    : roles;
  if (!can(effective, "employee.manage")) {
    throw new Error("Forbidden: employee.manage required");
  }
  return effective;
}

export const inviteTenantStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(STAFF_INVITE_ROLES),
        fullName: z.string().min(2).max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertEmployeeManager({
      supabase: context.supabase,
      userId: context.userId,
      tenantId: data.tenantId,
    });

    // Membership check — actor must belong to the tenant (RI-001).
    const { data: membership, error: memErr } = await context.supabase
      .from("tenant_members")
      .select("tenant_id")
      .eq("user_id", context.userId)
      .eq("tenant_id", data.tenantId)
      .maybeSingle();
    if (memErr) throw new Error(memErr.message);
    if (!membership) {
      throw new Error("Forbidden: no membership in target tenant");
    }

    const { count: companyAdminCount, error: adminCountErr } =
      await context.supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", data.tenantId)
        .eq("role", "company_admin");
    if (adminCountErr) throw new Error(adminCountErr.message);

    const staffGate = canInviteOperationalStaff({
      companyAdminCount: companyAdminCount ?? 0,
      role: data.role,
    });
    if (!staffGate.ok) {
      throw new Error(staffGate.message);
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

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

    const role: AppRole = data.role;

    await supabaseAdmin
      .from("tenant_members")
      .upsert({ user_id: userId, tenant_id: data.tenantId });
    await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: userId,
        tenant_id: data.tenantId,
        role,
      },
      { onConflict: "user_id,tenant_id,role" },
    );

    if (data.fullName) {
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, full_name: data.fullName });
    }

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: context.userId,
      entity_type: "user_role",
      entity_id: userId,
      action: "STAFF_INVITED",
      new_data: {
        email: data.email,
        role,
        tenantId: data.tenantId,
      },
    });

    return { userId, tenantId: data.tenantId, role };
  });

export { STAFF_INVITE_ROLES };
