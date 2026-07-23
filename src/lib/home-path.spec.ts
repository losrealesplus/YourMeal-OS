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

  it("routes operations_manager to ops center", () => {
    expect(homePathForRoles(["operations_manager"])).toBe("/admin");
  });
});
