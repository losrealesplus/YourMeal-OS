import { describe, expect, it } from "vitest";
import { homePathForRoles } from "./home-path";

describe("homePathForRoles · LP-001 / EP-OPS-002", () => {
  it("routes kitchen-only to kitchen workspace", () => {
    expect(homePathForRoles(["kitchen"])).toBe("/admin/kitchen");
  });

  it("routes production-only to kitchen workspace", () => {
    expect(homePathForRoles(["production"])).toBe("/admin/kitchen");
  });

  it("routes delivery-only to delivery workspace", () => {
    expect(homePathForRoles(["delivery"])).toBe("/admin/delivery");
    expect(homePathForRoles(["logistics"])).toBe("/admin/delivery");
  });

  it("routes support-only to support workspace", () => {
    expect(homePathForRoles(["support"])).toBe("/admin/support");
  });

  it("routes accounting-only to accounting workspace", () => {
    expect(homePathForRoles(["accounting"])).toBe("/admin/accounting");
  });

  it("routes inventory-only to inventory workspace", () => {
    expect(homePathForRoles(["inventory"])).toBe("/admin/inventory");
  });

  it("routes operations_manager to ops center", () => {
    expect(homePathForRoles(["operations_manager"])).toBe("/admin");
  });

  it("routes company_admin to ops center", () => {
    expect(homePathForRoles(["company_admin"])).toBe("/admin");
  });

  it("routes pure saas_admin to platform surface", () => {
    expect(homePathForRoles(["saas_admin"])).toBe("/saas");
  });

  it("routes hybrid staff + saas_admin to tenant ops (tenant-first)", () => {
    expect(homePathForRoles(["operations_manager", "saas_admin"])).toBe(
      "/admin",
    );
    expect(homePathForRoles(["company_admin", "saas_admin"])).toBe("/admin");
  });

  it("routes customer to customer surface", () => {
    expect(homePathForRoles(["customer"])).toBe("/app");
  });

  it("is deterministic for the same role set", () => {
    const roles = ["support", "accounting"] as const;
    expect(homePathForRoles(roles)).toBe(homePathForRoles([...roles].reverse()));
  });
});
