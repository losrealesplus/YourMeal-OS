import { describe, expect, it } from "vitest";
import type { AppRole } from "@/hooks/use-auth";
import {
  decideOperationsCenterEntry,
  isSafeOperationsReturnPath,
  parseOperationsAuthSearch,
  resolvePostAdminLoginPath,
} from "@/lib/open-operations-center";

describe("open operations center entry", () => {
  it("rejects unsafe return paths", () => {
    expect(isSafeOperationsReturnPath("/admin")).toBe(true);
    expect(isSafeOperationsReturnPath("/admin/kitchen")).toBe(true);
    expect(isSafeOperationsReturnPath("/saas")).toBe(true);
    expect(isSafeOperationsReturnPath("/app")).toBe(false);
    expect(isSafeOperationsReturnPath("//evil.com")).toBe(false);
    expect(isSafeOperationsReturnPath("https://evil.com")).toBe(false);
  });

  it("sends anonymous users to admin auth with returnTo", () => {
    expect(
      decideOperationsCenterEntry({ sessionUserId: null, roles: [] }),
    ).toEqual({
      action: "auth",
      to: "/auth/admin",
      search: { returnTo: "/admin" },
    });
  });

  it("sends customer-only sessions to admin auth", () => {
    const roles: AppRole[] = ["customer"];
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles,
      }),
    ).toEqual({
      action: "auth",
      to: "/auth/admin",
      search: { returnTo: "/admin" },
    });
  });

  it("opens Ops Center for company admin", () => {
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["company_admin"],
      }),
    ).toEqual({ action: "navigate", to: "/admin" });
  });

  it("opens sole kitchen workspace directly", () => {
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["kitchen"],
      }),
    ).toEqual({ action: "navigate", to: "/admin/kitchen" });
  });

  it("opens sole support / accounting workspaces directly (WEP-001)", () => {
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["support"],
      }),
    ).toEqual({ action: "navigate", to: "/admin/support" });
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["accounting"],
      }),
    ).toEqual({ action: "navigate", to: "/admin/accounting" });
  });

  it("opens Platform Surface for pure saas_admin", () => {
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["saas_admin"],
      }),
    ).toEqual({ action: "navigate", to: "/saas" });
  });

  it("opens Tenant Surface for hybrid saas + company_admin (tenant-first)", () => {
    expect(
      decideOperationsCenterEntry({
        sessionUserId: "u1",
        roles: ["company_admin", "saas_admin"],
      }),
    ).toEqual({ action: "navigate", to: "/admin" });
  });

  it("honours safe returnTo after admin login", () => {
    expect(
      resolvePostAdminLoginPath(["company_admin"], "/admin/delivery"),
    ).toBe("/admin/delivery");
    expect(resolvePostAdminLoginPath(["kitchen"])).toBe("/admin/kitchen");
    expect(resolvePostAdminLoginPath(["support"])).toBe("/admin/support");
  });

  it("parses only safe returnTo from search", () => {
    expect(parseOperationsAuthSearch({ returnTo: "/admin/kitchen" })).toEqual({
      returnTo: "/admin/kitchen",
    });
    expect(parseOperationsAuthSearch({ returnTo: "/app" })).toEqual({});
  });
});
