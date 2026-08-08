/**
 * Engineering Validation — authenticated route context contract.
 *
 * Parent `/_authenticated` must merge `{ user }` into TanStack route context
 * so `/admin`, `/saas`, `/driver` beforeLoads can read `context.user`.
 *
 * Capacitor SPA cold-start may omit parent context.user even when the parent
 * returned it — children must re-resolve via requireAuthenticatedUser()
 * (same auth gate, never anonymous).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const ROOT = process.cwd();

function read(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

describe("Authenticated route context contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("/_authenticated beforeLoad returns { user } from requireAuthenticatedUser", () => {
    const src = read("src/routes/_authenticated/route.tsx");
    expect(src).toContain("requireAuthenticatedUser");
    expect(src).toMatch(
      /const\s*\{\s*user\s*\}\s*=\s*await\s+requireAuthenticatedUser\(\)/,
    );
    expect(src).toMatch(/return\s*\{\s*user\s*\}/);
    // Regression: awaiting without capturing/returning discards context.
    expect(src).not.toMatch(
      /beforeLoad:\s*async\s*\(\)\s*=>\s*\{\s*await\s+requireAuthenticatedUser\(\)\s*;/,
    );
  });

  it("admin / saas / driver resolve user via resolveAuthenticatedRouteUser", () => {
    for (const file of [
      "src/routes/_authenticated/admin.tsx",
      "src/routes/_authenticated/saas.tsx",
      "src/routes/_authenticated/driver.tsx",
    ]) {
      const src = read(file);
      expect(src).toContain("resolveAuthenticatedRouteUser");
      expect(src).not.toMatch(
        /if\s*\(\s*!user\?\.id\s*\)\s*throw\s+new\s+Error\(\s*["']Missing auth context["']\s*\)/,
      );
    }
  });

  it("resolveAuthenticatedRouteUser prefers parent context.user", async () => {
    const { resolveAuthenticatedRouteUser } = await import(
      "./resolve-authenticated-route-user"
    );
    const user = await resolveAuthenticatedRouteUser(
      { user: { id: "u-from-parent" } },
      "/admin",
    );
    expect(user).toEqual({ id: "u-from-parent" });
  });

  it("resolveAuthenticatedRouteUser falls back to requireAuthenticatedUser", async () => {
    const user = { id: "u-from-guard" };
    vi.resetModules();
    vi.doMock("@/auth/session", () => ({
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    }));
    const { resolveAuthenticatedRouteUser } = await import(
      "./resolve-authenticated-route-user"
    );
    const resolved = await resolveAuthenticatedRouteUser({}, "/admin");
    expect(resolved).toEqual(user);
  });

  it("requireAuthenticatedUser returns { user }", async () => {
    const user = { id: "u-contract-1" };
    vi.resetModules();
    vi.doMock("@/auth/session", () => ({
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    }));
    const { requireAuthenticatedUser } = await import("./guards");
    await expect(requireAuthenticatedUser()).resolves.toEqual({ user });
  });
});
