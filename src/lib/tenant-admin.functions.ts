/**
 * Tenant Admin server functions — staff invite within the caller's tenant.
 * Capability: users.create (provision) · employee.manage (legacy gate kept for bootstrap).
 *
 * Invite creates Identity/Profile/Membership(pending) + invitation with intended_role.
 * Does NOT assign Role — Approve + Assign Role is a separate step (create ≠ access).
 *
 * @see docs/adr/0018-identity-membership-lifecycle.md
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
import { executeProvisionTenantUser } from "@/lib/user-provisioning.functions";

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
  const { data: saas } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "saas_admin")
    .is("tenant_id", null)
    .maybeSingle();
  const effective: AppRole[] = saas ? [...roles, "saas_admin"] : roles;
  if (!can(effective, "users.create") && !can(effective, "employee.manage")) {
    throw new Error("Forbidden: users.create or employee.manage required");
  }
  return effective;
}

/**
 * Invite operational staff: provisions pending membership + stores intended_role
 * on the invitation. Role is NOT granted until Approve + Assign Role.
 */
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

    // Delegate to provisioning pipeline — create ≠ access
    const result = await executeProvisionTenantUser({
      actorId: context.userId,
      data: {
        tenantId: data.tenantId,
        email: data.email,
        fullName: data.fullName,
        membershipType: "employee",
        channel: "invitation",
        intendedRole: data.role,
      },
    });

    return {
      userId: result.userId,
      tenantId: result.tenantId,
      role: data.role,
      membershipStatus: result.membershipStatus,
      roleAssigned: false as const,
      intendedRole: data.role,
    };
  });

export { STAFF_INVITE_ROLES };
