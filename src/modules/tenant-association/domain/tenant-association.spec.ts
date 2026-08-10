import { describe, expect, it } from "vitest";
import { parseTenantAssociationPayload } from "./tenant-association";

describe("tenant-association domain", () => {
  it("parses pending association payload", () => {
    expect(
      parseTenantAssociationPayload({
        tenant_id: "11111111-1111-1111-1111-111111111111",
        display_name: "EatClean",
        membership_id: "22222222-2222-2222-2222-222222222222",
        status: "pending",
        created: true,
      }),
    ).toEqual({
      tenantId: "11111111-1111-1111-1111-111111111111",
      displayName: "EatClean",
      membershipId: "22222222-2222-2222-2222-222222222222",
      status: "pending",
      created: true,
    });
  });

  it("rejects incomplete payloads", () => {
    expect(() => parseTenantAssociationPayload(null)).toThrow();
    expect(() =>
      parseTenantAssociationPayload({ tenant_id: "x", status: "pending" }),
    ).toThrow();
  });
});
