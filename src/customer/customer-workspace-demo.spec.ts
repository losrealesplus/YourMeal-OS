/**
 * OPERATIONAL-002.5 — Customer Workspace Demo integrity.
 * Screen must not import storage / repos / directory services.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-002.5 Customer Workspace Demo · Law 003", () => {
  it("demo route uses useCustomer and never imports Supabase/repos", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('from "@/customer/useCustomer"');
    expect(src).toContain("useCustomer()");
    expect(src).toContain("searchCustomersQuery");
    expect(src).toContain("archiveCustomerCommand");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\/types/);
    expect(src).not.toMatch(/from ["']@\/modules\/customer-directory/);
    expect(src).not.toMatch(/from ["']@\/modules\/company-account/);
  });

  it("FOUNDATION LAW 003 is documented", () => {
    const law = readFileSync(
      resolve(ROOT, "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    expect(law).toContain("FOUNDATION LAW 003");
    expect(law).toContain("A screen never owns business logic");
  });
});
