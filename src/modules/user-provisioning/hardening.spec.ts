import { describe, expect, it } from "vitest";
import {
  assertAccessConsistency,
  assertInvitationHardened,
  canResendInvitation,
  assertCanTransitionMembershipHardened,
  membershipAuditPatch,
  softArchivePatch,
  isArchived,
  identityEventLabel,
  validateBulkInviteDraft,
  operationalActorRef,
} from "./index";

describe("identity hardening · consistency (P6)", () => {
  it("requires Approved + Role + active tenant", () => {
    const ok = assertAccessConsistency({
      hasIdentity: true,
      hasProfile: true,
      hasMembership: true,
      membershipStatus: "approved",
      membershipArchived: false,
      roleCount: 1,
      tenantExists: true,
      tenantActive: true,
    });
    expect(ok.ok).toBe(true);
  });

  it("denies archived membership", () => {
    expect(
      assertAccessConsistency({
        hasIdentity: true,
        hasProfile: true,
        hasMembership: true,
        membershipStatus: "approved",
        membershipArchived: true,
        roleCount: 1,
        tenantExists: true,
        tenantActive: true,
      }).code,
    ).toBe("MEMBERSHIP_ARCHIVED");
  });

  it("denies role without approved membership", () => {
    expect(
      assertAccessConsistency({
        hasIdentity: true,
        hasProfile: true,
        hasMembership: true,
        membershipStatus: "pending",
        membershipArchived: false,
        roleCount: 2,
        tenantExists: true,
        tenantActive: true,
      }).code,
    ).toBe("MEMBERSHIP_NOT_APPROVED");
  });
});

describe("identity hardening · invitations (P4)", () => {
  it("blocks cancelled invitations", () => {
    expect(
      assertInvitationHardened({
        status: "cancelled",
        expiresAt: "2099-01-01T00:00:00.000Z",
      }).code,
    ).toBe("INVITATION_CANCELLED");
  });

  it("allows resend for expired", () => {
    expect(canResendInvitation({ status: "expired" }).ok).toBe(true);
  });

  it("blocks resend for accepted", () => {
    expect(canResendInvitation({ status: "accepted" }).ok).toBe(false);
  });
});

describe("identity hardening · lifecycle stamps (P5)", () => {
  it("suspends approved → suspended", () => {
    const v = assertCanTransitionMembershipHardened({
      current: "approved",
      action: "suspend",
    });
    expect(v.ok).toBe(true);
    expect(v.message).toBe("suspended");
  });

  it("reactivates suspended → approved", () => {
    const patch = membershipAuditPatch(
      "reactivate",
      "actor-1",
      new Date("2026-07-29T12:00:00.000Z"),
    );
    expect(patch.status).toBe("approved");
    expect(patch.reactivated_by).toBe("actor-1");
  });

  it("blocks transition on archived", () => {
    expect(
      assertCanTransitionMembershipHardened({
        current: "approved",
        action: "suspend",
        archived: true,
      }).ok,
    ).toBe(false);
  });
});

describe("identity hardening · soft archive + bulk stubs + membership_id", () => {
  it("soft archive patch", () => {
    const p = softArchivePatch("actor");
    expect(isArchived(p)).toBe(true);
    expect(p.deleted_by).toBe("actor");
  });

  it("validates bulk invite drafts without executing", () => {
    expect(
      validateBulkInviteDraft({
        emails: ["a@x.com"],
        membershipType: "employee",
        channel: "invitation",
      }).ok,
    ).toBe(true);
    expect(
      validateBulkInviteDraft({
        emails: Array.from({ length: 60 }, (_, i) => `u${i}@x.com`),
        membershipType: "employee",
        channel: "invitation",
      }),
    ).toMatchObject({ ok: false, code: "BULK_TOO_LARGE" });
  });

  it("prefers membership_id operational ref", () => {
    const ref = operationalActorRef({
      membershipId: "m1",
      userId: "u1",
    });
    expect(ref.membershipId).toBe("m1");
    expect(identityEventLabel("MEMBERSHIP_APPROVED")).toContain("aprobado");
  });
});
