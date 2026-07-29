/**
 * User provisioning domain — Identity ≠ Profile ≠ Membership ≠ Role ≠ Employment.
 * Create / invite / provision NEVER grants access by itself.
 *
 * Access pipeline: Identity → Profile → Membership(Approved) → Role → Workspace
 *
 * @see docs/adr/0018-identity-membership-lifecycle.md
 */

export const MEMBERSHIP_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "revoked",
] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const MEMBERSHIP_TYPES = [
  "customer",
  "employee",
  "supplier",
  "company",
  "company_employee",
] as const;

export type MembershipType = (typeof MEMBERSHIP_TYPES)[number];

export const PROVISIONING_CHANNELS = [
  "self_registration",
  "invitation",
  "provisioning",
] as const;

export type ProvisioningChannel = (typeof PROVISIONING_CHANNELS)[number];

export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "expired",
  "revoked",
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export type ProvisioningVerdict = {
  ok: boolean;
  code: string;
  message: string;
};

function fail(code: string, message: string): ProvisioningVerdict {
  return { ok: false, code, message };
}

function pass(code: string, message = "ok"): ProvisioningVerdict {
  return { ok: true, code, message };
}

/** Creating a user / membership must not imply Role assignment. */
export function assertCreateDoesNotGrantAccess(input: {
  assignsRoleInSameStep: boolean;
}): ProvisioningVerdict {
  if (input.assignsRoleInSameStep) {
    return fail(
      "PROVISION_CREATE_EQUALS_ACCESS",
      "Creating a user must not assign a Role in the same step — use Membership → Approve → Role",
    );
  }
  return pass("PROVISION_CREATE_ISOLATED");
}

/** Effective tenant access requires Approved membership AND at least one role. */
export function canAccessTenant(input: {
  membershipStatus: MembershipStatus | null;
  roleCount: number;
}): ProvisioningVerdict {
  if (!input.membershipStatus) {
    return fail("ACCESS_NO_MEMBERSHIP", "Access denied: no membership for tenant");
  }
  if (input.membershipStatus === "pending") {
    return fail("ACCESS_MEMBERSHIP_PENDING", "Access denied: membership pending approval");
  }
  if (input.membershipStatus === "rejected") {
    return fail("ACCESS_MEMBERSHIP_REJECTED", "Access denied: membership rejected");
  }
  if (input.membershipStatus === "suspended") {
    return fail("ACCESS_MEMBERSHIP_SUSPENDED", "Access denied: membership suspended");
  }
  if (input.membershipStatus === "revoked") {
    return fail("ACCESS_MEMBERSHIP_REVOKED", "Access denied: membership revoked");
  }
  if (input.membershipStatus !== "approved") {
    return fail("ACCESS_MEMBERSHIP_INVALID", "Access denied: invalid membership status");
  }
  if (input.roleCount <= 0) {
    return fail("ACCESS_NO_ROLE", "Access denied: Approved membership without Role");
  }
  return pass("ACCESS_GRANTED");
}

/** RI-001: one user → one tenant (multi-membership across tenants deferred). */
export function assertSingleTenantMembership(input: {
  existingTenantId: string | null;
  targetTenantId: string;
}): ProvisioningVerdict {
  if (
    input.existingTenantId &&
    input.existingTenantId !== input.targetTenantId
  ) {
    return fail(
      "MEMBERSHIP_OTHER_TENANT",
      "User already belongs to another tenant (RI-001: 1 user → 1 tenant)",
    );
  }
  return pass("MEMBERSHIP_TENANT_OK");
}

export function assertNoDuplicateMembership(input: {
  hasMembershipInTenant: boolean;
  currentStatus?: MembershipStatus | null;
}): ProvisioningVerdict {
  if (!input.hasMembershipInTenant) return pass("MEMBERSHIP_NEW");
  const status = input.currentStatus;
  if (status === "revoked" || status === "rejected") {
    return pass("MEMBERSHIP_REOPENABLE");
  }
  return fail(
    "MEMBERSHIP_DUPLICATE",
    "Membership already exists for this user in the tenant",
  );
}

export function assertInvitationUsable(input: {
  status: InvitationStatus;
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
  if (input.status === "expired" || expires.getTime() < now.getTime()) {
    return fail("INVITATION_EXPIRED", "Invitation expired");
  }
  if (input.status !== "pending") {
    return fail("INVITATION_INVALID", "Invitation is not pending");
  }
  return pass("INVITATION_USABLE");
}

export function nextMembershipStatus(
  current: MembershipStatus,
  action: "approve" | "reject" | "suspend" | "revoke" | "reopen",
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
    default:
      return null;
  }
}

export function assertCanTransitionMembership(input: {
  current: MembershipStatus;
  action: "approve" | "reject" | "suspend" | "revoke" | "reopen";
}): ProvisioningVerdict {
  const next = nextMembershipStatus(input.current, input.action);
  if (!next) {
    return fail(
      "MEMBERSHIP_INVALID_TRANSITION",
      `Cannot ${input.action} membership in status ${input.current}`,
    );
  }
  return pass("MEMBERSHIP_TRANSITION_OK", next);
}

export function composeFullName(input: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
}): string | null {
  const fromParts = [input.firstName, input.lastName]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");
  if (fromParts) return fromParts;
  const full = (input.fullName ?? "").trim();
  return full || null;
}

export function employmentRequired(membershipType: MembershipType): boolean {
  return membershipType === "employee" || membershipType === "company_employee";
}

export type ProvisionUserInput = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  membershipType: MembershipType;
  channel: ProvisioningChannel;
  department?: string | null;
  position?: string | null;
  notes?: string | null;
  /** Intended role stored on invitation only — never applied at create time. */
  intendedRole?: string | null;
};

export function validateProvisionInput(
  input: ProvisionUserInput,
): ProvisioningVerdict {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return fail("EMAIL_INVALID", "Valid email is required");
  }
  if (!MEMBERSHIP_TYPES.includes(input.membershipType)) {
    return fail("MEMBERSHIP_TYPE_INVALID", "Invalid membership type");
  }
  if (!PROVISIONING_CHANNELS.includes(input.channel)) {
    return fail("CHANNEL_INVALID", "Invalid provisioning channel");
  }
  if (employmentRequired(input.membershipType) && input.channel === "self_registration") {
    // Self-reg employees still allowed; employment fields optional at request time
  }
  return pass("PROVISION_INPUT_OK");
}

/**
 * Resolves which identity path to take without creating duplicates.
 * Never creates a second identity for an existing email.
 */
export function resolveIdentityPath(input: {
  emailExists: boolean;
}): "create_identity" | "reuse_identity" {
  return input.emailExists ? "reuse_identity" : "create_identity";
}
