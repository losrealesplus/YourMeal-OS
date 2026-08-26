/**
 * OPERATIONAL-006 Phase 4 — Delivery Workspace Demo integrity.
 * Capability Demo. Screen must not import storage / repos / OrderFacade / KitchenFacade.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-006 Delivery Workspace Demo · Law 003 · 006 · 007", () => {
  it("demo route uses useDelivery and never imports Supabase/repos/Order/Kitchen facades", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.delivery-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('from "@/delivery/useDelivery"');
    expect(src).toContain("useDelivery()");
    expect(src).toContain("getDeliveryContextQuery");
    expect(src).toContain("getDeliveryAssignmentsQuery");
    expect(src).toContain("getDeliveryStopsQuery");
    expect(src).toContain("getCompletedDeliveriesQuery");
    expect(src).toContain("getDeliveryRoutesQuery");
    expect(src).toContain("confirmDeliveryCommand");
    expect(src).toContain("assignDeliveryCommand");
    expect(src).toContain("startDeliveryCommand");
    expect(src).toContain("reportDeliveryExceptionCommand");
    expect(src).toContain("closeDeliveryCommand");
    expect(src).toContain("DeliveryAssignment");
    expect(src).toContain("UNIMPLEMENTED");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\/types/);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
    expect(src).not.toMatch(/from ["']@\/order\//);
    expect(src).not.toMatch(/from ["']@\/order["']/);
    expect(src).not.toMatch(/from ["']@\/kitchen\//);
    expect(src).not.toMatch(/from ["']@\/kitchen["']/);
    expect(src).not.toMatch(
      /import\s*\{[^}]*\b(OrderFacade|KitchenExecutionFacade|useOrder|useKitchenExecution)\b/,
    );
    expect(src).not.toMatch(/from ["']@\/production\//);
  });

  it("demo route file exists and is registered in routes", () => {
    const routeFile = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.delivery-workspace.tsx"),
      "utf8",
    );
    expect(routeFile).toContain("createFileRoute");
  });

  it("ADR-0086 and DELIVERY_WORKSPACE document Capability Demo", () => {
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0086-delivery-workspace-demo.md"),
      "utf8",
    );
    expect(adr).toContain("Delivery Workspace Demo");
    expect(adr).toContain("useDelivery");
    expect(adr).toContain("/admin/delivery-workspace");

    const ws = readFileSync(
      resolve(ROOT, "docs/05-architecture/DELIVERY_WORKSPACE.md"),
      "utf8",
    );
    expect(ws).toContain("Capability Demo");
    expect(ws).toContain("useDelivery()");
    expect(ws).toContain("PRODUCT LAW 001");
  });
});
