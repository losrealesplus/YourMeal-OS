import { describe, expect, it } from "vitest";
import { homePathForRoles } from "./home-path";

describe("homePathForRoles", () => {
  it("routes kitchen-only to cocina", () => {
    expect(homePathForRoles(["kitchen"])).toBe("/admin/kitchen");
  });

  it("routes delivery-only to reparto", () => {
    expect(homePathForRoles(["delivery"])).toBe("/admin/delivery");
    expect(homePathForRoles(["logistics"])).toBe("/admin/delivery");
  });

  it("routes support-only to atención al cliente", () => {
    expect(homePathForRoles(["support"])).toBe("/admin/support");
  });

  it("routes accounting-only to contabilidad", () => {
    expect(homePathForRoles(["accounting"])).toBe("/admin/accounting");
  });

  it("routes operations_manager to ops center", () => {
    expect(homePathForRoles(["operations_manager"])).toBe("/admin");
  });

  it("routes company_admin to ops center", () => {
    expect(homePathForRoles(["company_admin"])).toBe("/admin");
  });

  it("routes pure saas_admin to platform console", () => {
    expect(homePathForRoles(["saas_admin"])).toBe("/saas");
  });

  it("routes hybrid operations_manager + saas_admin to tenant ops", () => {
    expect(homePathForRoles(["operations_manager", "saas_admin"])).toBe(
      "/admin",
    );
  });

  it("routes hybrid company_admin + saas_admin to tenant ops", () => {
    expect(homePathForRoles(["company_admin", "saas_admin"])).toBe("/admin");
  });

  it("routes customer to consumer app", () => {
    expect(homePathForRoles(["customer"])).toBe("/app");
  });
});
