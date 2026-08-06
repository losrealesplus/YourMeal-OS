/**
 * OPERATIONAL-005 Phase 4 — Kitchen Workspace Demo integrity.
 * Final isolated Capability Demo. Screen must not import storage / repos / ProductionFacade.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-005 Kitchen Workspace Demo · Law 003–006-A", () => {
  it("demo route uses useKitchenExecution and never imports Supabase/repos/ProductionFacade", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.kitchen-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('from "@/kitchen/useKitchenExecution"');
    expect(src).toContain("useKitchenExecution()");
    expect(src).toContain("getExecutionQueueQuery");
    expect(src).toContain("getExecutionUnitsQuery");
    expect(src).toContain("getExecutionProgressQuery");
    expect(src).toContain("markExecutionReadyCommand");
    expect(src).toContain("completeExecutionCommand");
    expect(src).toContain("startExecutionCommand");
    expect(src).toContain("ExecutionUnit");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\/types/);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
    expect(src).not.toMatch(/from ["']@\/production\//);
    expect(src).not.toMatch(/from ["']@\/production["']/);
    expect(src).not.toMatch(/import\s*\{[^}]*\b(useProduction|ProductionFacade)\b/);
    expect(src).not.toMatch(
      /import\s*\{[^}]*\bKitchenExecutionService\b|from ["'][^"']*kitchen-execution/,
    );
    expect(src).not.toMatch(/from ["']@\/order/);
  });

  it("FOUNDATION LAW 003–007 are documented", () => {
    const law = readFileSync(
      resolve(ROOT, "docs/05-architecture/FOUNDATION_LOCK.md"),
      "utf8",
    );
    expect(law).toContain("FOUNDATION LAW 003");
    expect(law).toContain("A screen never owns business logic");
    expect(law).toContain("FOUNDATION LAW 004");
    expect(law).toContain("Operational Experience");
    expect(law).toContain("FOUNDATION LAW 005");
    expect(law).toContain("FOUNDATION LAW 006");
    expect(law).toContain("006-A");
    expect(law).toContain("FOUNDATION LAW 007");
    expect(law).toContain("Operational Flows");
    expect(law).toContain("never bypass Capabilities");
  });

  it("nav exposes Kitchen Workspace under Más", () => {
    const shell = readFileSync(
      resolve(ROOT, "src/components/admin-shell.tsx"),
      "utf8",
    );
    expect(shell).toContain("/admin/kitchen-workspace");
    expect(shell).toContain("ops.nav.kitchenWorkspace");
  });
});
