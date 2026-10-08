import { describe, it, expect } from "vitest";
import { customerRequestSchema } from "./domain/customer-self-profile";
import {
  customerOnboardingPrefill,
  isApplePrivateRelay,
  resolveCustomerOnboarding,
} from "./application/customer-onboarding-service";
const id = "10000000-0000-4000-8000-000000000001";
const request = (command: unknown) => ({ tenantId: id, requestId: id, command });
describe("P34 input boundary", () => {
  it("permits only explicit revision-conflict closure with an exact request", () => {
    const command = {
      operation: "close_conflicted_link",
      linkRequestId: id,
      reason: "REVISION_CONFLICT",
    };
    expect(customerRequestSchema.parse(request(command)).command).toEqual(command);
    for (const patch of [
      { reason: "OTHER" },
      { actorId: id },
      { verified: true },
      { linkRequestId: "missing" },
    ]) {
      expect(() => customerRequestSchema.parse(request({ ...command, ...patch }))).toThrow();
    }
  });
  it("requires exact revision and request for profile", () => {
    expect(
      customerRequestSchema.parse(
        request({
          operation: "profile",
          customerId: id,
          expectedRevision: 1,
          patch: { displayName: " Ana " },
        }),
      ).command,
    ).toMatchObject({ patch: { displayName: "Ana" } });
  });
  it.each([
    {},
    { expectedRevision: 0 },
    { expectedRevision: -1 },
    { expectedRevision: 1.5 },
    { expectedRevision: "1" },
  ])("rejects invalid revision %j", (patch) => {
    expect(() =>
      customerRequestSchema.parse(
        request({ operation: "profile", customerId: id, patch: { displayName: "Ana" }, ...patch }),
      ),
    ).toThrow();
  });
  it.each(["userId", "tenantId", "kind", "role", "customerId", "authEmail", "isVerified"])(
    "rejects protected field %s",
    (key) => {
      expect(() =>
        customerRequestSchema.parse(
          request({
            operation: "profile",
            customerId: id,
            expectedRevision: 1,
            patch: { [key]: id },
          }),
        ),
      ).toThrow();
    },
  );
  it.each(["", " ", "x".repeat(201)])("requires bounded confirmed name", (displayName) => {
    expect(() =>
      customerRequestSchema.parse(
        request({ operation: "onboard", declaration: "new", displayName }),
      ),
    ).toThrow();
  });
  it("does not infer existing/new from email", () => {
    expect(() =>
      customerRequestSchema.parse(
        request({ operation: "onboard", displayName: "Ana", email: "same@example.com" }),
      ),
    ).toThrow();
  });
  it("requires exact human confirmations", () => {
    for (const operation of ["approve_link", "confirm_link"]) {
      expect(() =>
        customerRequestSchema.parse(
          request({ operation, customerId: id, expectedRevision: 1, linkRequestId: id }),
        ),
      ).toThrow();
    }
  });
  it("requires street on address creation", () => {
    expect(() =>
      customerRequestSchema.parse(
        request({
          operation: "address_create",
          customerId: id,
          expectedRevision: 1,
          patch: { city: "City" },
        }),
      ),
    ).toThrow();
  });
  it("forbids reparenting address", () => {
    expect(() =>
      customerRequestSchema.parse(
        request({
          operation: "address_edit",
          customerId: id,
          expectedRevision: 1,
          addressId: id,
          patch: { customerId: id },
        }),
      ),
    ).toThrow();
  });
  it.each([null, "", {}, []])("rejects non-command %j", (command) =>
    expect(() => customerRequestSchema.parse(request(command))).toThrow(),
  );
  it("rejects unscoped requests and forged actor", () => {
    expect(() =>
      customerRequestSchema.parse({ ...request({ operation: "request_link" }), actorId: id }),
    ).toThrow();
  });
});
describe("P34 OAuth preparation", () => {
  it("prefills only name, never role/email ownership", () => {
    expect(
      customerOnboardingPrefill({
        full_name: " Ana ",
        role: "company_admin",
        email: "same@example.com",
        tenant_id: id,
      }),
    ).toEqual({ displayName: "Ana" });
  });
  it("Apple without a name asks for confirmation", () => {
    expect(customerOnboardingPrefill({ email: "private@privaterelay.appleid.com" })).toEqual({
      displayName: "",
    });
  });
  it("does not truncate a legacy overlong name", () =>
    expect(customerOnboardingPrefill({ full_name: "x".repeat(201) }).displayName).toBe(""));
  it("recognizes relay without claiming real email", () => {
    expect(isApplePrivateRelay("opaque@privaterelay.appleid.com")).toBe(true);
    expect(isApplePrivateRelay("opaque@privaterelay.appleid.com.evil.test")).toBe(false);
  });
  it.each([
    [
      { membershipApproved: false, staff: false, customerId: null, pendingLink: false },
      "membership_required",
    ],
    [
      { membershipApproved: true, staff: true, customerId: null, pendingLink: false },
      "staff_no_automatic_customer",
    ],
    [
      { membershipApproved: true, staff: false, customerId: null, pendingLink: true },
      "assisted_link_pending",
    ],
    [
      { membershipApproved: true, staff: false, customerId: null, pendingLink: false },
      "explicit_choice_required",
    ],
    [{ membershipApproved: true, staff: false, customerId: id, pendingLink: false }, "ready"],
  ] as const)("preserves membership/CRM separation", (input, state) =>
    expect(resolveCustomerOnboarding(input)).toBe(state),
  );
});
