import { describe, expect, it, vi } from "vitest";
import {
  classifyAdminAuthBootstrapError,
  enterOperationsCenter,
} from "./admin-auth-bootstrap";

describe("classifyAdminAuthBootstrapError", () => {
  it("classifies network failures", () => {
    expect(classifyAdminAuthBootstrapError(new TypeError("Failed to fetch")).kind).toBe(
      "network",
    );
    expect(classifyAdminAuthBootstrapError(new Error("Timeout waiting")).kind).toBe(
      "network",
    );
  });

  it("classifies missing RPC / migration not applied", () => {
    expect(
      classifyAdminAuthBootstrapError(
        new Error("Could not find the function public.ensure_platform_owner_session"),
      ).kind,
    ).toBe("rpc_missing");
    expect(
      classifyAdminAuthBootstrapError(
        new Error("Platform owner bootstrap failed: migration not applied"),
      ).kind,
    ).toBe("rpc_missing");
  });

  it("classifies auth failures", () => {
    expect(
      classifyAdminAuthBootstrapError(new Error("Auth session missing")).kind,
    ).toBe("session");
    expect(
      classifyAdminAuthBootstrapError(
        new Error("Platform owner bootstrap failed: Not authenticated"),
      ).kind,
    ).toBe("auth");
  });

  it("classifies forbidden", () => {
    expect(
      classifyAdminAuthBootstrapError(new Error("permission denied for function")).kind,
    ).toBe("forbidden");
  });

  it("defaults to unexpected", () => {
    expect(classifyAdminAuthBootstrapError(new Error("boom")).kind).toBe(
      "unexpected",
    );
  });
});

describe("enterOperationsCenter", () => {
  it("returns ok when ensure succeeds and user is staff", async () => {
    const result = await enterOperationsCenter({
      userId: "u1",
      ensurePlatformOwnerSession: vi.fn().mockResolvedValue({ ok: true }),
      loadRoles: vi.fn().mockResolvedValue(["company_admin"]),
    });
    expect(result).toEqual({ status: "ok", path: expect.any(String) });
    if (result.status === "ok") {
      expect(result.path.startsWith("/admin")).toBe(true);
    }
  });

  it("returns not_staff when ensure succeeds but roles empty", async () => {
    const result = await enterOperationsCenter({
      userId: "u1",
      ensurePlatformOwnerSession: vi.fn().mockResolvedValue({ ok: true }),
      loadRoles: vi.fn().mockResolvedValue([]),
    });
    expect(result).toEqual({ status: "not_staff" });
  });

  it("propagates ensurePlatformOwnerSession exceptions (no bypass)", async () => {
    const err = new Error(
      "Platform owner bootstrap failed: Could not find the function public.ensure_platform_owner_session",
    );
    await expect(
      enterOperationsCenter({
        userId: "u1",
        ensurePlatformOwnerSession: vi.fn().mockRejectedValue(err),
        loadRoles: vi.fn(),
      }),
    ).rejects.toThrow(/ensure_platform_owner_session|Platform owner bootstrap/);
  });

  it("propagates auth.getUser-style failures from ensure", async () => {
    await expect(
      enterOperationsCenter({
        userId: "u1",
        ensurePlatformOwnerSession: vi
          .fn()
          .mockRejectedValue(new Error("Auth session missing")),
        loadRoles: vi.fn(),
      }),
    ).rejects.toThrow("Auth session missing");
  });

  it("propagates timeout errors", async () => {
    await expect(
      enterOperationsCenter({
        userId: "u1",
        ensurePlatformOwnerSession: vi
          .fn()
          .mockRejectedValue(new Error("Timeout")),
        loadRoles: vi.fn(),
      }),
    ).rejects.toThrow("Timeout");
  });
});

/**
 * Consumer contract: after any settle path, loading must clear.
 * Mirrors BUGFIX-001 finally { setCheckingSession(false) }.
 */
describe("admin auth loading contract", () => {
  async function runCheck(ensure: () => Promise<unknown>) {
    let checkingSession = true;
    let bootstrapFailed = false;
    try {
      await enterOperationsCenter({
        userId: "u1",
        ensurePlatformOwnerSession: ensure,
        loadRoles: async () => ["company_admin"],
      });
    } catch {
      bootstrapFailed = true;
    } finally {
      checkingSession = false;
    }
    return { checkingSession, bootstrapFailed };
  }

  it("clears loading when RPC OK", async () => {
    const r = await runCheck(async () => ({ ok: true }));
    expect(r.checkingSession).toBe(false);
    expect(r.bootstrapFailed).toBe(false);
  });

  it("clears loading when RPC throws", async () => {
    const r = await runCheck(async () => {
      throw new Error("Could not find the function public.ensure_platform_owner_session");
    });
    expect(r.checkingSession).toBe(false);
    expect(r.bootstrapFailed).toBe(true);
  });

  it("clears loading when auth.getUser fails", async () => {
    const r = await runCheck(async () => {
      throw new Error("Auth session missing");
    });
    expect(r.checkingSession).toBe(false);
    expect(r.bootstrapFailed).toBe(true);
  });

  it("clears loading on timeout", async () => {
    const r = await runCheck(async () => {
      throw new Error("Timeout");
    });
    expect(r.checkingSession).toBe(false);
    expect(r.bootstrapFailed).toBe(true);
  });

  it("clears loading when user has no staff permissions", async () => {
    let checkingSession = true;
    try {
      const result = await enterOperationsCenter({
        userId: "u1",
        ensurePlatformOwnerSession: async () => ({ ok: true }),
        loadRoles: async () => [],
      });
      expect(result.status).toBe("not_staff");
    } finally {
      checkingSession = false;
    }
    expect(checkingSession).toBe(false);
  });

  it("clears loading when migration not applied", async () => {
    const r = await runCheck(async () => {
      throw new Error("Platform owner bootstrap failed: migration not applied");
    });
    expect(r.checkingSession).toBe(false);
    expect(r.bootstrapFailed).toBe(true);
    expect(
      classifyAdminAuthBootstrapError(
        new Error("Platform owner bootstrap failed: migration not applied"),
      ).kind,
    ).toBe("rpc_missing");
  });
});
