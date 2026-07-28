import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/bootstrap/flag", () => ({
  isBootstrapMode: () => true,
}));

vi.mock("@/bootstrap/profiles", () => ({
  getBootstrapProfileByUserId: (userId: string) => {
    const map: Record<string, { roles: string[] }> = {
      "company-admin": { roles: ["company_admin"] },
      "saas-pure": { roles: ["saas_admin"] },
      customer: { roles: ["customer"] },
      kitchen: { roles: ["kitchen"] },
    };
    return map[userId] ?? null;
  },
}));

vi.mock("@tanstack/react-router", () => ({
  redirect: (opts: { to: string }) => {
    const err = new Error(`REDIRECT:${opts.to}`);
    (err as Error & { to: string }).to = opts.to;
    throw err;
  },
}));

describe("route-guards · EP-OPS-002 negative surface cases", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("Company Admin denied Platform Surface → Tenant /admin", async () => {
    const { assertSaasRoute } = await import("./route-guards");
    await expect(assertSaasRoute("company-admin")).rejects.toMatchObject({
      message: "REDIRECT:/admin",
    });
  });

  it("Customer denied Platform Surface → Customer /app", async () => {
    const { assertSaasRoute } = await import("./route-guards");
    await expect(assertSaasRoute("customer")).rejects.toMatchObject({
      message: "REDIRECT:/app",
    });
  });

  it("pure saas_admin may enter Platform Surface", async () => {
    const { assertSaasRoute } = await import("./route-guards");
    await expect(assertSaasRoute("saas-pure")).resolves.toEqual(["saas_admin"]);
  });

  it("Customer denied Tenant Surface → /app", async () => {
    const { assertStaffRoute } = await import("./route-guards");
    await expect(assertStaffRoute("customer")).rejects.toMatchObject({
      message: "REDIRECT:/app",
    });
  });

  it("Kitchen may enter Tenant Surface", async () => {
    const { assertStaffRoute } = await import("./route-guards");
    await expect(assertStaffRoute("kitchen")).resolves.toEqual(["kitchen"]);
  });
});
