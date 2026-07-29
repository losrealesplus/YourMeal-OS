/**
 * Tenant user provisioning — Identity → Membership → Role pipeline.
 * Identity Hardening v1: identity_events, soft-archive, consistency, timeline.
 *
 * Create ≠ access. Prefer membership_id for operational refs (P1).
 * FUTURE: multi-membership / SSO / SCIM / impersonation — not implemented.
 *
 * @see docs/adr/0018-identity-membership-lifecycle.md
 * @see docs/adr/0019-identity-hardening-v1.md
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
  assertCreateDoesNotGrantAccess,
  assertAccessConsistency,
  assertCanTransitionMembershipHardened,
  assertInvitationHardened,
  canResendInvitation,
  membershipAuditPatch,
  softArchivePatch,
  planProvision,
  recordIdentityEvent,
  recordIdentityEvents,
  identityEventLabel,
  type MembershipType,
  type MembershipStatus,
  type IdentityEventType,
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
    .select("tenant_id, status, deleted_at")
    .eq("user_id", ctx.userId)
    .eq("tenant_id", ctx.tenantId)
    .is("deleted_at", null)
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

async function loadMembershipRow(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  tenantId: string,
  userId: string,
) {
  const { data, error } = await admin
    .from("tenant_members")
    .select(
      "id, status, deleted_at, membership_type, approved_at, approved_by",
    )
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as {
    id: string;
    status: MembershipStatus;
    deleted_at: string | null;
    membership_type: string;
    approved_at: string | null;
    approved_by: string | null;
  } | null;
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

  const { data: tenant, error: tenantErr } = await supabaseAdmin
    .from("tenants")
    .select("id, status")
    .eq("id", data.tenantId)
    .maybeSingle();
  if (tenantErr) throw new Error(tenantErr.message);
  if (!tenant) throw new Error("Tenant does not exist");
  if (tenant.status !== "active") {
    throw new Error("Tenant is not active");
  }

  const email = data.email.trim().toLowerCase();
  let userId = await findUserIdByEmail(supabaseAdmin, email);
  const emailExists = Boolean(userId);

  // P7: never create duplicate identity for same email
  const { data: existingAny } = await supabaseAdmin
    .from("tenant_members")
    .select("tenant_id, status, deleted_at")
    .eq("user_id", userId ?? "00000000-0000-0000-0000-000000000000")
    .is("deleted_at", null)
    .maybeSingle();

  const { data: existingHere } = userId
    ? await supabaseAdmin
        .from("tenant_members")
        .select("id, tenant_id, status, deleted_at")
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId)
        .maybeSingle()
    : { data: null };

  if (existingHere && !(existingHere as { deleted_at?: string | null }).deleted_at) {
    const status = (existingHere as { status?: string }).status;
    if (status !== "revoked" && status !== "rejected") {
      throw new Error("Membership already exists for this user in the tenant");
    }
  }

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
    hasMembershipInTenant: Boolean(
      existingHere && !(existingHere as { deleted_at?: string | null }).deleted_at,
    ),
    currentMembershipStatus: (existingHere as { status?: string } | null)
      ?.status as MembershipStatus | undefined,
  });
  if (!planned.ok) throw new Error(planned.message);

  const createdIdentity = planned.plan.identityPath === "create_identity";
  let invitedAuth = false;
  let membershipId: string | null =
    (existingHere as { id?: string } | null)?.id ?? null;

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
      deleted_at: null,
      deleted_by: null,
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
      deleted_at: null,
      deleted_by: null,
    };

    if (existingHere) {
      const { data: updated, error: memErr } = await supabaseAdmin
        .from("tenant_members")
        .update({
          membership_type: data.membershipType,
          status: "pending",
          provisioning_channel: data.channel,
          notes: data.notes ?? null,
          invited_by: actorId,
          approved_at: null,
          approved_by: null,
          deleted_at: null,
          deleted_by: null,
        })
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId)
        .select("id")
        .maybeSingle();
      if (memErr) throw new Error(memErr.message);
      membershipId = (updated as { id: string } | null)?.id ?? membershipId;
    } else {
      const { data: inserted, error: memErr } = await supabaseAdmin
        .from("tenant_members")
        .insert(membershipRow)
        .select("id")
        .maybeSingle();
      if (memErr) throw new Error(memErr.message);
      membershipId = (inserted as { id: string } | null)?.id ?? null;
    }

    if (!membershipId) {
      const row = await loadMembershipRow(supabaseAdmin, data.tenantId, userId);
      membershipId = row?.id ?? null;
    }

    if (planned.plan.writeEmployment) {
      const { error: empErr } = await supabaseAdmin
        .from("employee_profiles")
        .upsert(
          {
            tenant_id: data.tenantId,
            user_id: userId,
            membership_id: membershipId,
            department: data.department ?? null,
            position: data.position ?? null,
            updated_at: new Date().toISOString(),
            deleted_at: null,
            deleted_by: null,
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
          membership_id: membershipId,
          intended_role: data.intendedRole ?? null,
          status: "pending",
          channel: data.channel,
          invited_by: actorId,
          user_id: userId,
          notes: data.notes ?? null,
        });
      if (inviteRowErr) throw new Error(inviteRowErr.message);
    }

    const events = [];
    if (createdIdentity) {
      events.push({
        tenantId: data.tenantId,
        userId,
        membershipId,
        eventType: "USER_REGISTERED" as const,
        performedBy: actorId,
        metadata: { email, channel: data.channel },
      });
    }
    events.push(
      {
        tenantId: data.tenantId,
        userId,
        membershipId,
        eventType: "PROFILE_CREATED" as const,
        performedBy: actorId,
        metadata: { fullName: planned.plan.fullName },
      },
      {
        tenantId: data.tenantId,
        userId,
        membershipId,
        eventType: "MEMBERSHIP_CREATED" as const,
        performedBy: actorId,
        metadata: {
          membershipType: data.membershipType,
          status: "pending",
        },
      },
    );
    if (planned.plan.createInvitation) {
      events.push({
        tenantId: data.tenantId,
        userId,
        membershipId,
        eventType: "INVITATION_SENT" as const,
        performedBy: actorId,
        metadata: {
          email,
          intendedRole: data.intendedRole ?? null,
        },
      });
    }
    await recordIdentityEvents(supabaseAdmin, events);

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: actorId,
      entity_type: "membership",
      entity_id: membershipId ?? userId,
      action: "USER_PROVISIONED",
      new_data: {
        email,
        membershipId,
        membershipType: data.membershipType,
        channel: data.channel,
        identityPath: planned.plan.identityPath,
        intendedRole: data.intendedRole ?? null,
        assignRole: false,
      },
    });

    return {
      userId,
      membershipId,
      tenantId: data.tenantId,
      membershipStatus: "pending" as const,
      identityPath: planned.plan.identityPath,
      invitationCreated: planned.plan.createInvitation,
      roleAssigned: false as const,
    };
  } catch (err) {
    // Soft-archive partial rows — never hard-delete profiles/memberships/employment (P3)
    if (userId) {
      await supabaseAdmin
        .from("user_invitations")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: actorId,
        })
        .eq("tenant_id", data.tenantId)
        .eq("email", email)
        .eq("status", "pending");
      if (!existingHere) {
        await supabaseAdmin
          .from("tenant_members")
          .update(softArchivePatch(actorId))
          .eq("user_id", userId)
          .eq("tenant_id", data.tenantId)
          .eq("status", "pending");
      }
      await supabaseAdmin
        .from("employee_profiles")
        .update(softArchivePatch(actorId))
        .eq("user_id", userId)
        .eq("tenant_id", data.tenantId);
      // Auth identity only removed if we created it in this failed call (orphan prevention)
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

    const membership = await loadMembershipRow(
      supabaseAdmin,
      data.tenantId,
      data.userId,
    );
    if (!membership) throw new Error("Membership not found");

    const transition = assertCanTransitionMembershipHardened({
      current: membership.status,
      action: "approve",
      archived: Boolean(membership.deleted_at),
    });
    if (!transition.ok) throw new Error(transition.message);

    const patch = membershipAuditPatch("approve", context.userId);
    const { error: updErr } = await supabaseAdmin
      .from("tenant_members")
      .update(patch as never)
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
      await recordIdentityEvent(supabaseAdmin, {
        tenantId: data.tenantId,
        userId: data.userId,
        membershipId: membership.id,
        eventType: "ROLE_ASSIGNED",
        performedBy: context.userId,
        metadata: { role: data.assignRole },
      });
    }

    await recordIdentityEvent(supabaseAdmin, {
      tenantId: data.tenantId,
      userId: data.userId,
      membershipId: membership.id,
      eventType: "MEMBERSHIP_APPROVED",
      performedBy: context.userId,
      metadata: { roleAssigned },
    });

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: context.userId,
      entity_type: "membership",
      entity_id: membership.id,
      action: "MEMBERSHIP_APPROVED",
      new_data: { status: "approved", roleAssigned, membershipId: membership.id },
    });

    return {
      userId: data.userId,
      membershipId: membership.id,
      tenantId: data.tenantId,
      status: "approved" as const,
      roleAssigned,
    };
  });

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

    const membership = await loadMembershipRow(
      supabaseAdmin,
      data.tenantId,
      data.userId,
    );
    if (!membership) throw new Error("Membership not found");
    if (membership.deleted_at) {
      throw new Error("Cannot assign Role to archived membership");
    }
    if (membership.status !== "approved") {
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

    await recordIdentityEvent(supabaseAdmin, {
      tenantId: data.tenantId,
      userId: data.userId,
      membershipId: membership.id,
      eventType: "ROLE_ASSIGNED",
      performedBy: context.userId,
      metadata: { role: data.role },
    });

    await supabaseAdmin.from("audit_log").insert({
      tenant_id: data.tenantId,
      actor_id: context.userId,
      entity_type: "user_role",
      entity_id: membership.id,
      action: "ROLE_ASSIGNED",
      new_data: { role: data.role, membershipId: membership.id },
    });

    return {
      userId: data.userId,
      membershipId: membership.id,
      tenantId: data.tenantId,
      role: data.role,
    };
  });

/** P5 · suspend / revoke / reactivate / reject */
export const transitionTenantMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        action: z.enum(["reject", "suspend", "revoke", "reactivate"]),
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
    const membership = await loadMembershipRow(
      supabaseAdmin,
      data.tenantId,
      data.userId,
    );
    if (!membership) throw new Error("Membership not found");

    const transition = assertCanTransitionMembershipHardened({
      current: membership.status,
      action: data.action,
      archived: Boolean(membership.deleted_at),
    });
    if (!transition.ok) throw new Error(transition.message);

    const patch = membershipAuditPatch(data.action, context.userId);
    const { error } = await supabaseAdmin
      .from("tenant_members")
      .update(patch as never)
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    const eventMap = {
      reject: "MEMBERSHIP_REJECTED",
      suspend: "MEMBERSHIP_SUSPENDED",
      revoke: "MEMBERSHIP_REVOKED",
      reactivate: "MEMBERSHIP_REACTIVATED",
    } as const;

    await recordIdentityEvent(supabaseAdmin, {
      tenantId: data.tenantId,
      userId: data.userId,
      membershipId: membership.id,
      eventType: eventMap[data.action],
      performedBy: context.userId,
      metadata: { from: membership.status, to: patch.status },
    });

    return {
      userId: data.userId,
      membershipId: membership.id,
      status: patch.status,
    };
  });

/** P3 · Archive membership (soft-delete). Never hard-delete. */
export const archiveTenantMembership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
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
    const membership = await loadMembershipRow(
      supabaseAdmin,
      data.tenantId,
      data.userId,
    );
    if (!membership) throw new Error("Membership not found");
    if (membership.deleted_at) throw new Error("Membership already archived");

    const { error } = await supabaseAdmin
      .from("tenant_members")
      .update(softArchivePatch(context.userId))
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    await supabaseAdmin
      .from("employee_profiles")
      .update(softArchivePatch(context.userId))
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId);

    await recordIdentityEvent(supabaseAdmin, {
      tenantId: data.tenantId,
      userId: data.userId,
      membershipId: membership.id,
      eventType: "MEMBERSHIP_ARCHIVED",
      performedBy: context.userId,
    });

    return { userId: data.userId, membershipId: membership.id, archived: true };
  });

/** P4 · Resend invitation */
export const resendTenantInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        invitationId: z.string().uuid(),
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const { data: invitation, error } = await supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("id", data.invitationId)
      .eq("tenant_id", data.tenantId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invitation) throw new Error("Invitation not found");

    const resendGate = canResendInvitation({
      status: (invitation as { status: string }).status as
        | "pending"
        | "accepted"
        | "expired"
        | "cancelled"
        | "revoked",
    });
    if (!resendGate.ok) throw new Error(resendGate.message);

    const email = (invitation as { email: string }).email;
    const { error: authErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
    );
    if (authErr) throw new Error(authErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "pending",
        expires_at: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        resent_at: new Date().toISOString(),
        resent_by: context.userId,
        resent_count:
          ((invitation as { resent_count?: number }).resent_count ?? 0) + 1,
        cancelled_at: null,
        cancelled_by: null,
      })
      .eq("id", data.invitationId);
    if (updErr) throw new Error(updErr.message);

    await recordIdentityEvent(supabaseAdmin, {
      tenantId: data.tenantId,
      userId: (invitation as { user_id?: string | null }).user_id ?? null,
      membershipId:
        (invitation as { membership_id?: string | null }).membership_id ?? null,
      eventType: "INVITATION_RESENT",
      performedBy: context.userId,
      metadata: { email, invitationId: data.invitationId },
    });

    return { invitationId: data.invitationId, resent: true };
  });

/** P6 · Consistency check for a user in a tenant */
export const checkUserAccessConsistency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
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

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("id, status")
      .eq("id", data.tenantId)
      .maybeSingle();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, deleted_at")
      .eq("id", data.userId)
      .maybeSingle();

    const membership = await loadMembershipRow(
      supabaseAdmin,
      data.tenantId,
      data.userId,
    );

    const { count: roleCount } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId);

    const verdict = assertAccessConsistency({
      hasIdentity: true,
      hasProfile: Boolean(profile) && !(profile as { deleted_at?: string | null })?.deleted_at,
      hasMembership: Boolean(membership),
      membershipStatus: membership?.status ?? null,
      membershipArchived: Boolean(membership?.deleted_at),
      roleCount: roleCount ?? 0,
      tenantExists: Boolean(tenant),
      tenantActive: tenant?.status === "active",
    });

    if (!verdict.ok) {
      await recordIdentityEvent(supabaseAdmin, {
        tenantId: data.tenantId,
        userId: data.userId,
        membershipId: membership?.id ?? null,
        eventType: "ACCESS_DENIED_INCONSISTENT",
        performedBy: context.userId,
        metadata: { code: verdict.code, message: verdict.message },
      });
    }

    return {
      ok: verdict.ok,
      code: verdict.code,
      message: verdict.message,
      membershipId: membership?.id ?? null,
    };
  });

/** P8 · Activity Timeline for Tenant Admin */
export const listUserIdentityTimeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        limit: z.number().int().min(1).max(200).optional(),
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

    // identity_events is business audit (Identity Hardening v1)
    const { data: events, error } = await (supabaseAdmin as any)
      .from("identity_events")
      .select(
        "id, event_type, performed_by, performed_at, membership_id, metadata",
      )
      .eq("tenant_id", data.tenantId)
      .eq("user_id", data.userId)
      .order("performed_at", { ascending: false })
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);

    const rows = (events ?? []) as Array<{
      id: string;
      event_type: IdentityEventType;
      performed_by: string | null;
      performed_at: string;
      membership_id: string | null;
      metadata: Record<string, string | number | boolean | null> | null;
    }>;

    return rows.map((e) => ({
      id: e.id,
      eventType: e.event_type,
      label: identityEventLabel(e.event_type),
      performedBy: e.performed_by,
      performedAt: e.performed_at,
      membershipId: e.membership_id,
      metadata: e.metadata ?? {},
    }));
  });

export { ASSIGNABLE_ROLES, MEMBERSHIP_TYPES };
