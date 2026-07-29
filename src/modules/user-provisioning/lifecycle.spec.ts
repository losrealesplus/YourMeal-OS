import { describe, expect, it } from "vitest";
import {
  assertCreateDoesNotGrantAccess,
  canAccessTenant,
  assertSingleTenantMembership,
  assertNoDuplicateMembership,
  assertInvitationUsable,
  assertCanTransitionMembership,
  composeFullName,
  resolveIdentityPath,
  planProvision,
} from "./index";

describe("user-provisioning · create ≠ access", () => {
  it("rejects create+role in the same step", () => {
    const v = assertCreateDoesNotGrantAccess({ assignsRoleInSameStep: true });
    expect(v.ok).toBe(false);
    expect(v.code).toBe("PROVISION_CREATE_EQUALS_ACCESS");
  });

  it("allows create without role", () => {
    expect(assertCreateDoesNotGrantAccess({ assignsRoleInSameStep: false }).ok).toBe(
      true,
    );
  });
});

describe("user-provisioning · access pipeline", () => {
  it("denies pending membership even with roles present", () => {
    const v = canAccessTenant({ membershipStatus: "pending", roleCount: 2 });
    expect(v.ok).toBe(false);
    expect(v.code).toBe("ACCESS_MEMBERSHIP_PENDING");
  });

  it("denies approved membership without role", () => {
    const v = canAccessTenant({ membershipStatus: "approved", roleCount: 0 });
    expect(v.ok).toBe(false);
    expect(v.code).toBe("ACCESS_NO_ROLE");
  });

  it("grants only when Approved + Role", () => {
    const v = canAccessTenant({ membershipStatus: "approved", roleCount: 1 });
    expect(v.ok).toBe(true);
  });
});

describe("user-provisioning · RI-001 + duplicates", () => {
  it("blocks other-tenant membership", () => {
    const v = assertSingleTenantMembership({
      existingTenantId: "t1",
      targetTenantId: "t2",
    });
    expect(v.ok).toBe(false);
  });

  it("blocks duplicate active membership", () => {
    expect(
      assertNoDuplicateMembership({
        hasMembershipInTenant: true,
        currentStatus: "approved",
      }).ok,
    ).toBe(false);
  });

  it("allows reopen after revoked", () => {
    expect(
      assertNoDuplicateMembership({
        hasMembershipInTenant: true,
        currentStatus: "revoked",
      }).ok,
    ).toBe(true);
  });
});

describe("user-provisioning · invitations", () => {
  it("rejects expired invitations", () => {
    const v = assertInvitationUsable({
      status: "pending",
      expiresAt: "2020-01-01T00:00:00.000Z",
      now: new Date("2026-07-29T00:00:00.000Z"),
    });
    expect(v.ok).toBe(false);
    expect(v.code).toBe("INVITATION_EXPIRED");
  });

  it("rejects already accepted", () => {
    expect(
      assertInvitationUsable({
        status: "accepted",
        expiresAt: "2099-01-01T00:00:00.000Z",
      }).code,
    ).toBe("INVITATION_ALREADY_ACCEPTED");
  });
});

describe("user-provisioning · transitions + plan", () => {
  it("approves pending", () => {
    const v = assertCanTransitionMembership({
      current: "pending",
      action: "approve",
    });
    expect(v.ok).toBe(true);
    expect(v.message).toBe("approved");
  });

  it("plans provisioning without assigning role", () => {
    const planned = planProvision({
      provision: {
        email: "chef@eatclean.test",
        firstName: "Ana",
        lastName: "Ruiz",
        membershipType: "employee",
        channel: "provisioning",
        intendedRole: "kitchen",
      },
      emailExists: false,
      existingTenantId: null,
      targetTenantId: "11111111-1111-1111-1111-111111111111",
      hasMembershipInTenant: false,
    });
    expect(planned.ok).toBe(true);
    if (!planned.ok) return;
    expect(planned.plan.assignRole).toBe(false);
    expect(planned.plan.membershipStatus).toBe("pending");
    expect(planned.plan.identityPath).toBe("create_identity");
    expect(planned.plan.fullName).toBe("Ana Ruiz");
    expect(planned.plan.writeEmployment).toBe(true);
  });

  it("reuses identity when email exists", () => {
    expect(resolveIdentityPath({ emailExists: true })).toBe("reuse_identity");
    expect(composeFullName({ firstName: "A", lastName: "B" })).toBe("A B");
  });
});
