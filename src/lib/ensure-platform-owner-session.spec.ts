import { afterEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const rpc = vi.fn();

vi.mock("@/auth", () => ({
  getUser: () => getUser(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

vi.mock("@/integrations/supabase/types", () => ({
  Constants: {
    public: {
      Enums: {
        app_role: [
          "saas_admin",
          "company_admin",
          "customer",
          "employee",
          "kitchen",
        ],
      },
    },
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("ensurePlatformOwnerSession", () => {
  it("throws on RPC failure when required (default / Ops entry)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "po-1" } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Could not find the function public.ensure_platform_owner_session" },
    });

    const { ensurePlatformOwnerSession } = await import(
      "./ensure-platform-owner-session"
    );
    await expect(ensurePlatformOwnerSession()).rejects.toThrow(
      /Platform owner bootstrap failed/,
    );
  });

  it("throws on getUser failure when required", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("Auth session missing"),
    });

    const { ensurePlatformOwnerSession } = await import(
      "./ensure-platform-owner-session"
    );
    await expect(ensurePlatformOwnerSession({ required: true })).rejects.toThrow(
      "Auth session missing",
    );
  });

  it("returns null on RPC failure when required:false (global nav)", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "customer-1" } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Could not find the function public.ensure_platform_owner_session" },
    });

    const { ensurePlatformOwnerSession } = await import(
      "./ensure-platform-owner-session"
    );
    await expect(
      ensurePlatformOwnerSession({ required: false }),
    ).resolves.toBeNull();
  });

  it("returns parsed result when RPC succeeds", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "po-1" } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: {
        ok: true,
        applied: true,
        roles: ["saas_admin", "company_admin"],
        email: "alex1409h@gmail.com",
      },
      error: null,
    });

    const { ensurePlatformOwnerSession } = await import(
      "./ensure-platform-owner-session"
    );
    const result = await ensurePlatformOwnerSession();
    expect(result).toMatchObject({
      ok: true,
      applied: true,
      email: "alex1409h@gmail.com",
    });
    expect(result?.roles).toEqual(["saas_admin", "company_admin"]);
  });

  it("tryEnsurePlatformOwnerSession never throws on infra failure", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null,
    });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "Failed to fetch" },
    });

    const { tryEnsurePlatformOwnerSession } = await import(
      "./ensure-platform-owner-session"
    );
    await expect(tryEnsurePlatformOwnerSession()).resolves.toBeNull();
  });
});
