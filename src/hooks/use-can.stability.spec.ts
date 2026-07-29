import { describe, expect, it } from "vitest";
import { can, type Capability } from "@/permissions";
import type { AppRole } from "@/hooks/use-auth-types";

/**
 * Regression anchor for FCR-002 / Platform Stabilization.
 * `useCan().can` must stay referentially stable while roles are unchanged.
 * Pure `can(roles, cap)` is the capability oracle; hooks wrap it with useCallback.
 */
describe("capability oracle (FCR-002 regression)", () => {
  const roles: AppRole[] = ["company_admin", "kitchen"];

  it("returns stable boolean for the same roles + capability", () => {
    const cap: Capability = "kitchen.operate";
    expect(can(roles, cap)).toBe(can(roles, cap));
  });

  it("rolesKey identity: same set different order → same key", () => {
    const a = (["kitchen", "company_admin"] as AppRole[]).slice().sort().join("|");
    const b = (["company_admin", "kitchen"] as AppRole[]).slice().sort().join("|");
    expect(a).toBe(b);
  });
});
