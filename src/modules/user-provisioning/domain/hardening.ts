/**
 * Identity Hardening v1 — architectural guarantees (domain-pure).
 * @see docs/05-architecture/IDENTITY_LIFECYCLE.md
 * @see docs/adr/0019-identity-hardening-v1.md
 *
 * FUTURE (not implemented): multi-membership, SSO, SCIM, impersonation, tenant switch.
 */

import type {
  MembershipStatus,
  InvitationStatus,
  ProvisioningVerdict,
} from "./lifecycle";

export const IDENTITY_EVENT_TYPES = [
  "USER_REGISTERED",
  "PROFILE_CREATED",
  "PROFILE_UPDATED",
  "INVITATION_SENT",
  "INVITATION_RESENT",
  "INVITATION_ACCEPTED",
  "INVITATION_EXPIRED",
  "INVITATION_CANCELLED",
  "INVITATION_REVOKED",
  "MEMBERSHIP_CREATED",
  "MEMBERSHIP_APPROVED",
  "MEMBERSHIP_REJECTED",
  "MEMBERSHIP_SUSPENDED",
  "MEMBERSHIP_REVOKED",
  "MEMBERSHIP_REACTIVATED",
  "MEMBERSHIP_ARCHIVED",
  "ROLE_ASSIGNED",
  "ROLE_REMOVED",
  "USER_LAST_LOGIN",
  "PASSWORD_RESET",
  "EMAIL_CHANGED",
  "PHONE_CHANGED",
  "ACCESS_DENIED_INCONSISTENT",
] as const;

export type IdentityEventType = (typeof IDENTITY_EVENT_TYPES)[number];

export const HARDENED_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "cancelled",
  "revoked",
] as const;

export type HardenedInvitationStatus =
  (typeof HARDENED_INVITATION_STATUSES)[number];

function fail(code: string, message: string): ProvisioningVerdict {
  return { ok: false, code, message };
}

function pass(code: string, message = "ok"): ProvisioningVerdict {
  return { ok: true, code, message };
}

/** P6 · Consistency check before granting effective access. */
export function assertAccessConsistency(input: {
  hasIdentity: boolean;
  hasProfile: boolean;
  hasMembership: boolean;
  membershipStatus: MembershipStatus | null;
  membershipArchived: boolean;
  roleCount: number;
  tenantActive: boolean;
  tenantExists: boolean;
}): ProvisioningVerdict {
  if (!input.tenantExists) {
    return fail("TENANT_MISSING", "Tenant does not exist");
  }
  if (!input.tenantActive) {
    return fail("TENANT_SUSPENDED", "Tenant is not active");
  }
  if (!input.hasIdentity) {
    return fail("IDENTITY_MISSING", "Identity (auth.users) missing");
  }
  if (!input.hasProfile) {
    return fail("PROFILE_MISSING", "Profile missing for identity");
  }
  if (input.hasProfile && !input.hasMembership) {
    return fail("PROFILE_WITHOUT_MEMBERSHIP", "Profile without Membership");
  }
  if (!input.hasMembership || !input.membershipStatus) {
    return fail("MEMBERSHIP_MISSING", "Membership missing");
  }
  if (input.membershipArchived) {
    return fail("MEMBERSHIP_ARCHIVED", "Membership is archived (soft-deleted)");
  }
  if (input.membershipStatus !== "approved") {
    return fail(
      "MEMBERSHIP_NOT_APPROVED",
      `Membership status is ${input.membershipStatus}; Approved required`,
    );
  }
  if (input.roleCount <= 0) {
    return fail(
      "ROLE_MISSING",
      "Approved Membership without Role — access denied",
    );
  }
  return pass("ACCESS_CONSISTENT");
}

/** Soft-delete means Archived — never destroy. */
export function softArchivePatch(actorId: string, at: Date = new Date()) {
  return {
    deleted_at: at.toISOString(),
    deleted_by: actorId,
  };
}

export function isArchived(row: {
  deleted_at?: string | null;
}): boolean {
  return row.deleted_at != null;
}

export function assertNotArchived(input: {
  deletedAt?: string | null;
  entity: string;
}): ProvisioningVerdict {
  if (input.deletedAt) {
    return fail(
      "ENTITY_ARCHIVED",
      `${input.entity} is archived and cannot be used`,
    );
  }
  return pass("ENTITY_ACTIVE");
}

/** P4 · invitation usability including cancelled. */
export function assertInvitationHardened(input: {
  status: HardenedInvitationStatus | InvitationStatus;
  expiresAt: string | Date;
  now?: Date;
}): ProvisioningVerdict {
  const now = input.now ?? new Date();
  const expires =
    typeof input.expiresAt === "string"
      ? new Date(input.expiresAt)
      : input.expiresAt;

  if (input.status === "accepted") {
    return fail("INVITATION_ALREADY_ACCEPTED", "Invitation already accepted");
  }
  if (input.status === "revoked") {
    return fail("INVITATION_REVOKED", "Invitation was revoked");
  }
  if (input.status === "cancelled") {
    return fail("INVITATION_CANCELLED", "Invitation was cancelled");
  }
  if (input.status === "expired" || expires.getTime() < now.getTime()) {
    return fail("INVITATION_EXPIRED", "Invitation expired");
  }
  if (input.status !== "pending") {
    return fail("INVITATION_INVALID", "Invitation is not pending");
  }
  return pass("INVITATION_USABLE");
}

export function canResendInvitation(input: {
  status: HardenedInvitationStatus | InvitationStatus;
}): ProvisioningVerdict {
  if (input.status === "accepted") {
    return fail("INVITATION_ALREADY_ACCEPTED", "Cannot resend accepted invitation");
  }
  if (input.status === "revoked") {
    return fail("INVITATION_REVOKED", "Cannot resend revoked invitation");
  }
  // pending / expired / cancelled → allow resend (creates fresh pending window)
  return pass("INVITATION_RESEND_OK");
}

export function nextMembershipStatusHardened(
  current: MembershipStatus,
  action:
    | "approve"
    | "reject"
    | "suspend"
    | "revoke"
    | "reopen"
    | "reactivate",
): MembershipStatus | null {
  switch (action) {
    case "approve":
      return current === "pending" || current === "rejected" ? "approved" : null;
    case "reject":
      return current === "pending" ? "rejected" : null;
    case "suspend":
      return current === "approved" ? "suspended" : null;
    case "revoke":
      return current === "approved" || current === "suspended" ? "revoked" : null;
    case "reopen":
      return current === "rejected" || current === "revoked" ? "pending" : null;
    case "reactivate":
      return current === "suspended" ? "approved" : null;
    default:
      return null;
  }
}

export function assertCanTransitionMembershipHardened(input: {
  current: MembershipStatus;
  action:
    | "approve"
    | "reject"
    | "suspend"
    | "revoke"
    | "reopen"
    | "reactivate";
  archived?: boolean;
}): ProvisioningVerdict {
  if (input.archived) {
    return fail("MEMBERSHIP_ARCHIVED", "Cannot transition archived membership");
  }
  const next = nextMembershipStatusHardened(input.current, input.action);
  if (!next) {
    return fail(
      "MEMBERSHIP_INVALID_TRANSITION",
      `Cannot ${input.action} membership in status ${input.current}`,
    );
  }
  return pass("MEMBERSHIP_TRANSITION_OK", next);
}

/** P5 · audit stamp patches for membership lifecycle. */
export function membershipAuditPatch(
  action:
    | "approve"
    | "reject"
    | "suspend"
    | "revoke"
    | "reactivate",
  actorId: string,
  at: Date = new Date(),
): Record<string, string | null> {
  const iso = at.toISOString();
  switch (action) {
    case "approve":
      return {
        status: "approved",
        approved_at: iso,
        approved_by: actorId,
      };
    case "reject":
      return {
        status: "rejected",
        rejected_at: iso,
        rejected_by: actorId,
      };
    case "suspend":
      return {
        status: "suspended",
        suspended_at: iso,
        suspended_by: actorId,
      };
    case "revoke":
      return {
        status: "revoked",
        revoked_at: iso,
        revoked_by: actorId,
      };
    case "reactivate":
      return {
        status: "approved",
        reactivated_at: iso,
        reactivated_by: actorId,
        suspended_at: null,
        suspended_by: null,
      };
  }
}

/**
 * P1 · Prefer membership_id for operational references.
 * Keep user_id for Identity/Auth lookups only.
 */
export type OperationalActorRef = {
  membershipId: string;
  /** @deprecated Prefer membershipId for operational writes (orders, support, kitchen). */
  userId: string;
};

export function operationalActorRef(input: {
  membershipId: string;
  userId: string;
}): OperationalActorRef {
  return {
    membershipId: input.membershipId,
    userId: input.userId,
  };
}

/** Human labels for Activity Timeline (Tenant Admin). */
export function identityEventLabel(eventType: IdentityEventType): string {
  const labels: Record<IdentityEventType, string> = {
    USER_REGISTERED: "Cuenta creada",
    PROFILE_CREATED: "Perfil creado",
    PROFILE_UPDATED: "Perfil actualizado",
    INVITATION_SENT: "Invitación enviada",
    INVITATION_RESENT: "Invitación reenviada",
    INVITATION_ACCEPTED: "Invitación aceptada",
    INVITATION_EXPIRED: "Invitación expirada",
    INVITATION_CANCELLED: "Invitación cancelada",
    INVITATION_REVOKED: "Invitación revocada",
    MEMBERSHIP_CREATED: "Membership creado",
    MEMBERSHIP_APPROVED: "Membership aprobado",
    MEMBERSHIP_REJECTED: "Membership rechazado",
    MEMBERSHIP_SUSPENDED: "Membership suspendido",
    MEMBERSHIP_REVOKED: "Membership revocado",
    MEMBERSHIP_REACTIVATED: "Membership reactivado",
    MEMBERSHIP_ARCHIVED: "Membership archivado",
    ROLE_ASSIGNED: "Role asignado",
    ROLE_REMOVED: "Role eliminado",
    USER_LAST_LOGIN: "Último acceso",
    PASSWORD_RESET: "Restablecimiento de contraseña",
    EMAIL_CHANGED: "Email cambiado",
    PHONE_CHANGED: "Teléfono cambiado",
    ACCESS_DENIED_INCONSISTENT: "Acceso denegado (inconsistencia)",
  };
  return labels[eventType] ?? eventType;
}
