/**
 * Engineering Validation — authenticated route context contract.
 *
 * Parent `/_authenticated` must merge `{ user }` into TanStack route context
 * so `/admin`, `/saas`, `/driver` beforeLoads can read `context.user`.
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

  it("admin / saas / driver consume context.user and throw Missing auth context", () => {
    for (const file of [
      "src/routes/_authenticated/admin.tsx",
      "src/routes/_authenticated/saas.tsx",
      "src/routes/_authenticated/driver.tsx",
    ]) {
      const src = read(file);
      expect(src).toMatch(/context\.user|context as \{ user/);
      expect(src).toContain('throw new Error("Missing auth context")');
    }
  });

  it("requireAuthenticatedUser returns { user }", async () => {
    const user = { id: "u-contract-1" };
    vi.doMock("@/auth/session", () => ({
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    }));
    const { requireAuthenticatedUser } = await import("@/auth/guards");
    await expect(requireAuthenticatedUser()).resolves.toEqual({ user });
  });
});
