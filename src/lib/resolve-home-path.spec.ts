import { afterEach, describe, expect, it, vi } from "vitest";

const tryEnsure = vi.fn();
const from = vi.fn();

vi.mock("@/lib/ensure-platform-owner-session", () => ({
  tryEnsurePlatformOwnerSession: () => tryEnsure(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
  },
}));

function mockRolesQuery(roles: string[]) {
  from.mockReturnValue({
    select: () => ({
      eq: () =>
        Promise.resolve({
          data: roles.map((role) => ({ role })),
          error: null,
        }),
    }),
  });
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("resolveHomePath · BUGFIX-002 navigation decoupling", () => {
  it("returns /app for customer when Platform Owner RPC fails", async () => {
    tryEnsure.mockResolvedValue(null);
    mockRolesQuery(["customer"]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("customer-1")).resolves.toBe("/app");
    expect(tryEnsure).toHaveBeenCalledTimes(1);
  });

  it("returns /app for customer when ensure throws were converted to null", async () => {
    // Soft path must not reject — tryEnsure already absorbs throws.
    tryEnsure.mockResolvedValue(null);
    mockRolesQuery([]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("customer-2")).resolves.toBe("/app");
  });

  it("returns /admin for employee/staff when PO RPC fails", async () => {
    tryEnsure.mockResolvedValue(null);
    mockRolesQuery(["kitchen"]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("employee-1")).resolves.toBe("/admin/kitchen");
  });

  it("returns /admin for tenant company_admin when PO RPC fails", async () => {
    tryEnsure.mockResolvedValue(null);
    mockRolesQuery(["company_admin"]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("tenant-admin-1")).resolves.toBe("/admin");
  });

  it("returns /admin for Platform Owner after successful ensure grants", async () => {
    tryEnsure.mockResolvedValue({
      ok: true,
      applied: true,
      roles: ["saas_admin", "company_admin"],
    });
    mockRolesQuery(["saas_admin", "company_admin"]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("po-1")).resolves.toBe("/admin");
  });

  it("never invents privileges when ensure fails — empty roles → /app", async () => {
    tryEnsure.mockResolvedValue(null);
    mockRolesQuery([]);

    const { resolveHomePath } = await import("./resolve-home-path");
    await expect(resolveHomePath("unknown-1")).resolves.toBe("/app");
  });
});

describe("enterOperationsCenter remains strict for Platform Owner paths", () => {
  it("still propagates ensure failure (no SaaS/Ops bypass)", async () => {
    const { enterOperationsCenter } = await import("./admin-auth-bootstrap");
    await expect(
      enterOperationsCenter({
        userId: "po-1",
        ensurePlatformOwnerSession: async () => {
          throw new Error(
            "Platform owner bootstrap failed: Could not find the function public.ensure_platform_owner_session",
          );
        },
        loadRoles: async () => ["saas_admin", "company_admin"],
      }),
    ).rejects.toThrow(/Platform owner bootstrap failed/);
  });

  it("does not grant access when ensure fails even if loadRoles would return staff", async () => {
    const loadRoles = vi.fn().mockResolvedValue(["company_admin"]);
    const { enterOperationsCenter } = await import("./admin-auth-bootstrap");
    await expect(
      enterOperationsCenter({
        userId: "po-1",
        ensurePlatformOwnerSession: async () => {
          throw new Error("Failed to fetch");
        },
        loadRoles,
      }),
    ).rejects.toThrow("Failed to fetch");
    expect(loadRoles).not.toHaveBeenCalled();
  });
});
