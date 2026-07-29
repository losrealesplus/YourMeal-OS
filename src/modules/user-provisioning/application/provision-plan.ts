/**
 * Application orchestration helpers for user provisioning.
 * Side-effect free planning — I/O lives in server functions.
 */
import {
  assertCreateDoesNotGrantAccess,
  assertNoDuplicateMembership,
  assertSingleTenantMembership,
  composeFullName,
  employmentRequired,
  resolveIdentityPath,
  validateProvisionInput,
  type MembershipStatus,
  type MembershipType,
  type ProvisioningChannel,
  type ProvisionUserInput,
} from "../domain";

export type ProvisionPlan = {
  identityPath: "create_identity" | "reuse_identity";
  membershipStatus: "pending";
  membershipType: MembershipType;
  channel: ProvisioningChannel;
  fullName: string | null;
  writeEmployment: boolean;
  createInvitation: boolean;
  /** Always false at provision time — Role is a later step. */
  assignRole: false;
};

export function planProvision(input: {
  provision: ProvisionUserInput;
  emailExists: boolean;
  existingTenantId: string | null;
  targetTenantId: string;
  hasMembershipInTenant: boolean;
  currentMembershipStatus?: MembershipStatus | null;
}): { ok: true; plan: ProvisionPlan } | { ok: false; code: string; message: string } {
  const vInput = validateProvisionInput(input.provision);
  if (!vInput.ok) return { ok: false, code: vInput.code, message: vInput.message };

  const createGate = assertCreateDoesNotGrantAccess({
    assignsRoleInSameStep: false,
  });
  if (!createGate.ok) {
    return { ok: false, code: createGate.code, message: createGate.message };
  }

  const tenantGate = assertSingleTenantMembership({
    existingTenantId: input.existingTenantId,
    targetTenantId: input.targetTenantId,
  });
  if (!tenantGate.ok) {
    return { ok: false, code: tenantGate.code, message: tenantGate.message };
  }

  const dupGate = assertNoDuplicateMembership({
    hasMembershipInTenant: input.hasMembershipInTenant,
    currentStatus: input.currentMembershipStatus,
  });
  if (!dupGate.ok) {
    return { ok: false, code: dupGate.code, message: dupGate.message };
  }

  const identityPath = resolveIdentityPath({ emailExists: input.emailExists });
  const channel = input.provision.channel;

  return {
    ok: true,
    plan: {
      identityPath,
      membershipStatus: "pending",
      membershipType: input.provision.membershipType,
      channel,
      fullName: composeFullName(input.provision),
      writeEmployment: employmentRequired(input.provision.membershipType),
      createInvitation:
        channel === "invitation" ||
        channel === "provisioning" ||
        identityPath === "create_identity",
      assignRole: false,
    },
  };
}

export { canAccessTenant } from "../domain";
