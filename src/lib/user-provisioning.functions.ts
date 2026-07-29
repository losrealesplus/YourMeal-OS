/**
 * Tenant user provisioning — Identity → Membership → Role pipeline.
 * Capability: users.create (provision/invite) · employee.manage (approve/assign role).
 *
 * Create ≠ access: provisioning never writes user_roles.
 * @see docs/adr/0018-identity-membership-lifecycle.md
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { can } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth";
import {
  MEMBERSHIP_TYPES,
  assertCanTransitionMembership,
  assertCreateDoesNotGrantAccess,
  planProvision,
  type MembershipType,
} from "@/modules/user-provisioning";

const MEMBERSHIP_TYPE_ENUM = z.enum(MEMBERSHIP_TYPES);
const CHANNEL_ENUM = z.enum(["invitation", "provisioning", "self_registration"]);

const ASSIGNABLE_ROLES = [
  "kitchen",
  "delivery",
  "operations_manager",
  "company_admin",
  "logistics",
  "production",
  "purchasing",
  "inventory",
  "support",
  "accounting",
  "employee",
  "customer",
  "driver",
] as const satisfies readonly AppRole[];

export type ProvisionTenantUserInput = {
  tenantId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  membershipType: MembershipType;
  channel: "invitation" | "provisioning" | "self_registration";
  department?: string;
  position?: string;
  notes?: string;
  intendedRole?: (typeof ASSIGNABLE_ROLES)[number];
};

async function loadEffectiveRoles(ctx: {
  supabase: SupabaseClient<Database>;
  userId: string;
  tenantId: string;
}): Promise<AppRole[]> {
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
  return saas ? [...roles, "saas_admin"] : roles;
}

async function assertCapability(
  ctx: {
    supabase: SupabaseClient<Database>;
    userId: string;
    tenantId: string;
  },
  capability: "users.create" | "employee.manage",
) {
  const roles = await loadEffectiveRoles(ctx);
  if (!can(roles, capability)) {
    throw new Error(`Forbidden: ${capability} required`);
  }
  const { data: membership, error } = await ctx.supabase
    .from("tenant_members")
    .select("tenant_id, status")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", ctx.tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!membership) throw new Error("Forbidden: no membership in target tenant");
  const status = (membership as { status?: string }).status;
  if (status && status !== "approved") {
    throw new Error("Forbidden: actor membership is not approved");
  }
  return roles;
}

async function findUserIdByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = (data?.users ?? []).find(
    (u: { email?: string | null }) => u.email?.toLowerCase() === normalized,
  );
  return found?.id ?? null;
}

/** Core provisioning (no HTTP). Safe to call from other server handlers. */
export async function executeProvisionTenantUser(input: {
  actorId: string;
  data: ProvisionTenantUserInput;
}) {
  const { data, actorId } = input;
  const createGate = assertCreateDoesNotGrantAccess({
    assignsRoleInSameStep: false,
  });
  if (!createGate.ok) throw new Error(createGate.message);

  const { supabaseAdmin } = await import(
    "@/integrations/supabase/client.server"
  );

  const email = data.email.trim().toLowerCase();
  let userId = await findUserIdByEmail(supabaseAdmin, email);
  const emailExists = Boolean(userId);

  const { data: existingAny } = await supabaseAdmin
    .from("tenant_members")
    .select("tenant_id, status")
    .eq("user_id", userId ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  const { data: existingHere } = userId
    ? await supabaseAdmin
        .from("tenant_members")
        .select("tenant_id, status")
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId)
        .maybeSingle()
    : { data: null };

  const planned = planProvision({
    provision: {
      email,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      phone: data.phone,
      membershipType: data.membershipType,
      channel: data.channel,
      department: data.department,
      position: data.position,
      notes: data.notes,
      intendedRole: data.intendedRole,
    },
    emailExists,
    existingTenantId: existingAny?.tenant_id ?? null,
    targetTenantId: data.tenantId,
    hasMembershipInTenant: Boolean(existingHere),
    currentMembershipStatus: (existingHere as { status?: string } | null)
      ?.status as
      | "pending"
      | "approved"
      | "rejected"
      | "suspended"
      | "revoked"
      | undefined,
  });
  if (!planned.ok) throw new Error(planned.message);

  const createdIdentity = planned.plan.identityPath === "create_identity";
  let invitedAuth = false;

  try {
    if (!userId) {
      const { data: invited, error: invErr } =
        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: {
            full_name: planned.plan.fullName,
            first_name: data.firstName ?? null,
            last_name: data.lastName ?? null,
          },
        });
      if (invErr) throw new Error(invErr.message);
      userId = invited.user?.id ?? null;
      invitedAuth = true;
      if (!userId) throw new Error("Could not resolve user id after invite");
    }

    const profilePayload = {
      id: userId as string,
      full_name: planned.plan.fullName,
      ...(data.firstName ? { first_name: data.firstName } : {}),
      ...(data.lastName ? { last_name: data.lastName } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
    };

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload);
    if (profileErr) throw new Error(profileErr.message);

    const membershipRow = {
      user_id: userId,
      tenant_id: data.tenantId,
      membership_type: data.membershipType,
      status: "pending" as const,
      provisioning_channel: data.channel,
      notes: data.notes ?? null,
      invited_by: actorId,
      created_at: new Date().toISOString(),
    };

    if (existingHere) {
      const { error: memErr } = await supabaseAdmin
        .from("tenant_members")
        .update({
          membership_type: data.membershipType,
          status: "pending",
          provisioning_channel: data.channel,
          notes: data.notes ?? null,
          invited_by: actorId,
          approved_at: null,
          approved_by: null,
        })
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId);
      if (memErr) throw new Error(memErr.message);
    } else {
      const { error: memErr } = await supabaseAdmin
        .from("tenant_members")
        .insert(membershipRow);
      if (memErr) throw new Error(memErr.message);
    }

    if (planned.plan.writeEmployment) {
      const { error: empErr } = await supabaseAdmin
        .from("employee_profiles")
        .upsert(
          {
            tenant_id: data.tenantId,
            user_id: userId,
            department: data.department ?? null,
            position: data.position ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,user_id" },
        );
      if (empErr) throw new Error(empErr.message);
    }

    if (planned.plan.createInvitation) {
      const { error: inviteRowErr } = await supabaseAdmin
        .from("user_invitations")
        .insert({
          tenant_id: data.tenantId,
          email,
          membership_type: data.membershipType,
          intended_role: data.intendedRole ?? null,
          status: "pending",
          channel: data.channel,
          invited_by: actorId,
          user_id: userId,
          notes: data.notes ?? null,
        });
      if (inviteRowErr) throw new Error(inviteRowErr.message);
    }

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: actorId,
      entity_type: "membership",
      entity_id: userId,
      action: "USER_PROVISIONED",
      new_data: {
        email,
        membershipType: data.membershipType,
        channel: data.channel,
        identityPath: planned.plan.identityPath,
        intendedRole: data.intendedRole ?? null,
        assignRole: false,
      },
    });

    return {
      userId,
      tenantId: data.tenantId,
      membershipStatus: "pending" as const,
      identityPath: planned.plan.identityPath,
      invitationCreated: planned.plan.createInvitation,
      roleAssigned: false as const,
    };
  } catch (err) {
    if (userId) {
      await supabaseAdmin
        .from("user_invitations")
        .delete()
        .eq("tenant_id", data.tenantId)
        .eq("email", email)
        .eq("status", "pending");
      if (!existingHere) {
        await supabaseAdmin
          .from("tenant_members")
          .delete()
          .eq("user_id", userId)
          .eq("tenant_id", data.tenantId)
          .eq("status", "pending");
      }
      await supabaseAdmin
        .from("employee_profiles")
        .delete()
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId);
      if (createdIdentity && invitedAuth) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch {
          /* ignore */
        }
      }
    }
    throw err;
  }
}

/**
 * Provision or invite a user into the caller's tenant.
 * Creates Identity (if needed) + Profile + Membership(pending) + Invitation.
 * Does NOT assign Role.
 */
export const provisionTenantUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        email: z.string().email(),
        firstName: z.string().min(1).max(80).optional(),
        lastName: z.string().min(1).max(80).optional(),
        fullName: z.string().min(2).max(120).optional(),
        phone: z.string().min(5).max(40).optional(),
        membershipType: MEMBERSHIP_TYPE_ENUM,
        channel: CHANNEL_ENUM.default("provisioning"),
        department: z.string().max(120).optional(),
        position: z.string().max(120).optional(),
        notes: z.string().max(500).optional(),
        intendedRole: z.enum(ASSIGNABLE_ROLES).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertCapability(
      {
        supabase: context.supabase,
        userId: context.userId,
        tenantId: data.tenantId,
      },
      "users.create",
    );
    return executeProvisionTenantUser({
      actorId: context.userId,
      data: data as ProvisionTenantUserInput,
    });
  });

/** Approve a pending membership. Role assignment remains optional and explicit. */
export const approveTenantMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        assignRole: z.enum(ASSIGNABLE_ROLES).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertCapability(
      {
        supabase: context.supabase,
        userId: context.userId,
        tenantId: data.tenantId,
      },
      "employee.manage",
    );

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: membership, error } = await supabaseAdmin
      .from("tenant_members")
      .select("status")
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!membership) throw new Error("Membership not found");

    const transition = assertCanTransitionMembership({
      current: (membership as { status: string }).status as
        | "pending"
        | "approved"
        | "rejected"
        | "suspended"
        | "revoked",
      action: "approve",
    });
    if (!transition.ok) throw new Error(transition.message);

    const { error: updErr } = await supabaseAdmin
      .from("tenant_members")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
      })
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId);
    if (updErr) throw new Error(updErr.message);

    let roleAssigned: string | null = null;
    if (data.assignRole) {
      const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
        {
          user_id: data.userId,
          tenant_id: data.tenantId,
          role: data.assignRole,
        },
        { onConflict: "user_id,tenant_id,role" },
      );
      if (roleErr) throw new Error(roleErr.message);
      roleAssigned = data.assignRole;
    }

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: context.userId,
      entity_type: "membership",
      entity_id: data.userId,
      action: "MEMBERSHIP_APPROVED",
      new_data: {
        status: "approved",
        roleAssigned,
      },
    });

    return {
      userId: data.userId,
      tenantId: data.tenantId,
      status: "approved" as const,
      roleAssigned,
    };
  });

/** Assign a Role to an Approved membership. Access = Membership Approved + Role. */
export const assignTenantRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(ASSIGNABLE_ROLES),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertCapability(
      {
        supabase: context.supabase,
        userId: context.userId,
        tenantId: data.tenantId,
      },
      "employee.manage",
    );

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: membership, error } = await supabaseAdmin
      .from("tenant_members")
      .select("status")
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!membership) throw new Error("Membership not found");
    if ((membership as { status: string }).status !== "approved") {
      throw new Error(
        "Cannot assign Role without Approved membership (Identity → Membership → Role)",
      );
    }

    const { error: roleErr } = await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: data.userId,
        tenant_id: data.tenantId,
        role: data.role,
      },
      { onConflict: "user_id,tenant_id,role" },
    );
    if (roleErr) throw new Error(roleErr.message);

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: context.userId,
      entity_type: "user_role",
      entity_id: data.userId,
      action: "ROLE_ASSIGNED",
      new_data: { role: data.role },
    });

    return { userId: data.userId, tenantId: data.tenantId, role: data.role };
  });

export { ASSIGNABLE_ROLES, MEMBERSHIP_TYPES };
