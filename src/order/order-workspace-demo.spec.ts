/**
 * OPERATIONAL-003.5 — Order Workspace Demo integrity.
 * Screen must not import storage / repos / order services.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-003.5 Order Workspace Demo · Law 003 · 004", () => {
  it("demo route uses useOrder and never imports Supabase/repos/services", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.order-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('from "@/order/useOrder"');
    expect(src).toContain("useOrder()");
    expect(src).toContain("planWeeklyOrderCommand");
    expect(src).toContain("confirmOrderCommand");
    expect(src).toContain("getOrdersByWeekQuery");
    expect(src).toContain("closeOrderCommand");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\/types/);
    expect(src).not.toMatch(/from ["']@\/modules\/order-intake/);
    expect(src).not.toMatch(/from ["']@\/modules\/orders/);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
  });

  it("FOUNDATION LAW 003 and 004 are documented", () => {
    const law = readFileSync(
      resolve(ROOT, "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    expect(law).toContain("FOUNDATION LAW 003");
    expect(law).toContain("A screen never owns business logic");
    expect(law).toContain("FOUNDATION LAW 004");
    expect(law).toContain("Operational Experience");
    expect(law).toContain("consumes Capabilities");
  });
});
