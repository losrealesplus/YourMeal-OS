import { describe, expect, it } from "vitest";
import {
  isValidTenantJoinCodeFormat,
  normalizeTenantJoinCode,
  parseResolvedTenantJoinPayload,
} from "./tenant-join-code";

describe("tenant_join_code domain", () => {
  it("accepts canonical TJ- codes", () => {
    expect(isValidTenantJoinCodeFormat("TJ-A1B2C3D4")).toBe(true);
    expect(isValidTenantJoinCodeFormat(" tj-abcdef12 ")).toBe(true);
  });

  it("rejects empty / malformed codes", () => {
    expect(isValidTenantJoinCodeFormat("")).toBe(false);
    expect(isValidTenantJoinCodeFormat("   ")).toBe(false);
    expect(isValidTenantJoinCodeFormat("TJ-")).toBe(false);
    expect(isValidTenantJoinCodeFormat("JOIN-123")).toBe(false);
    expect(isValidTenantJoinCodeFormat("A1B2C3D4")).toBe(false);
  });

  it("rejects company-code shaped credentials (semantic boundary)", () => {
    expect(isValidTenantJoinCodeFormat("EC-0431")).toBe(false);
    expect(isValidTenantJoinCodeFormat("ec-9999")).toBe(false);
  });

  it("normalizes to upper trim", () => {
    expect(normalizeTenantJoinCode(" tj-ab12cd34 ")).toBe("TJ-AB12CD34");
  });

  it("parses minimum resolver payload", () => {
    expect(
      parseResolvedTenantJoinPayload({
        tenant_id: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
        display_name: "EatClean Tenerife",
      }),
    ).toEqual({
      tenantId: "7823e85a-986f-401f-9bbe-e4e431ff3be1",
      displayName: "EatClean Tenerife",
    });
  });

  it("rejects oversized / unexpected payload shapes", () => {
    expect(() => parseResolvedTenantJoinPayload(null)).toThrow();
    expect(() =>
      parseResolvedTenantJoinPayload({ tenant_id: "x" }),
    ).toThrow();
    expect(() =>
      parseResolvedTenantJoinPayload({ display_name: "Only name" }),
    ).toThrow();
  });
});
