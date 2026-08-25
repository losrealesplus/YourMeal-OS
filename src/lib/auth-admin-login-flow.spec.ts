import { describe, it, expect, vi } from "vitest";
import { classifyCustomerAuthError } from "@/auth/customer-auth-errors";
import {
  classifyAdminAuthBootstrapError,
  enterOperationsCenter,
} from "@/lib/admin-auth-bootstrap";
import type { AppRole } from "@/hooks/use-auth-types";

describe("Admin Auth Login Flow & Error Feedback (B3.6.11B)", () => {
  const EATCLEAN_TENANT_ID = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const TEST_USER_ID = "0e770229-ef44-4f60-b6ff-14a606c242c0";

  it("1.1 Invalid credentials from Supabase Auth is classified as signInInvalidCredentials", () => {
    const error = {
      message: "Invalid login credentials",
      code: "invalid_credentials",
      status: 400,
    };
    const classified = classifyCustomerAuthError(error);
    expect(classified.kind).toBe("invalid_credentials");
    expect(classified.messageKey).toBe("signInInvalidCredentials");
  });

  it("1.2 Network failure is classified as signInNetwork", () => {
    const error = new Error("Failed to fetch");
    const classified = classifyCustomerAuthError(error);
    expect(classified.kind).toBe("network");
    expect(classified.messageKey).toBe("signInNetwork");
  });

  it("1.3 Bootstrap RPC error is classified as rpc_missing", () => {
    const error = new Error("Could not find the function ensure_platform_owner_session");
    const classified = classifyAdminAuthBootstrapError(error);
    expect(classified.kind).toBe("rpc_missing");
    expect(classified.messageKey).toBe("adminBootstrapRpcMissing");
  });

  it("2.1 enterOperationsCenter resolves path '/admin' for company_admin", async () => {
    const ensurePlatformOwnerSession = vi.fn().mockResolvedValue({ ok: true, applied: false, reason: "not_platform_owner" });
    const loadRoles = vi.fn().mockResolvedValue(["company_admin" as AppRole]);

    const result = await enterOperationsCenter({
      userId: TEST_USER_ID,
      returnTo: "/admin",
      ensurePlatformOwnerSession,
      loadRoles,
    });

    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.path).toBe("/admin");
    }
  });

  it("2.2 enterOperationsCenter rejects non-staff customer with not_staff status", async () => {
    const ensurePlatformOwnerSession = vi.fn().mockResolvedValue({ ok: true });
    const loadRoles = vi.fn().mockResolvedValue(["customer" as AppRole]);

    const result = await enterOperationsCenter({
      userId: TEST_USER_ID,
      returnTo: "/admin",
      ensurePlatformOwnerSession,
      loadRoles,
    });

    expect(result.status).toBe("not_staff");
  });
});
