/**
 * Customer Workspace & Directory Consolidation Unit Tests (A2-C).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route } from "./admin.customer-workspace";

const ROOT = process.cwd();

describe("A2-C Customer Workspace & Directory Routing", () => {
  it("validates search parameters correctly", () => {
    const validate = Route.options.validateSearch as (s: Record<string, unknown>) => {
      customerId?: string;
      tab?: string;
    };

    expect(validate({})).toEqual({
      customerId: undefined,
      tab: undefined,
    });

    expect(validate({ customerId: "cust-123", tab: "orders" })).toEqual({
      customerId: "cust-123",
      tab: "orders",
    });

    expect(validate({ customerId: "   cust-456   ", tab: "support" })).toEqual({
      customerId: "cust-456",
      tab: "support",
    });

    expect(validate({ customerId: "", tab: "invalid-tab" })).toEqual({
      customerId: undefined,
      tab: undefined,
    });
  });

  it("Customer Workspace has transitional lab KPI language removed from user view", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    expect(src).not.toContain("Phase 005 Growth");
    expect(src).not.toContain("TTO < 45 s");
    expect(src).not.toContain("TTE < 20 s");
    expect(src).not.toContain("Enrich profile");
    expect(src).not.toContain("Resume operation");
  });

  it("Customer Workspace redirects to unified Customer Hub", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('to: "/admin/customers"');
    expect(src).toContain("redirect({");
  });

  it("Customer Hub has integrated drawer with profile tab and order intake", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customers.tsx"),
      "utf8",
    );
    expect(src).toContain("openCustomerDrawer");
    expect(src).toContain('tab: CustomerDetailTab = "profile"');
    expect(src).toContain("UniversalOrderIntakeDrawer");
    expect(src).not.toContain("Phase 005 Growth");
  });

  it("Support page links to Customer Workspace or Directory with tab support", () => {
    const src = readFileSync(resolve(ROOT, "src/routes/_authenticated/admin.support.tsx"), "utf8");
    expect(src).toContain("tab: ");
  });
});
