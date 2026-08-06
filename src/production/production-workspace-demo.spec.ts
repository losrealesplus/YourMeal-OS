/**
 * OPERATIONAL-004.5 — Production Workspace Demo integrity.
 * Screen must not import storage / repos / operations services.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-004.5 Production Workspace Demo · Law 003 · 004", () => {
  it("demo route uses useProduction and never imports Supabase/repos/services", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.production-workspace.tsx"),
      "utf8",
    );
    expect(src).toContain('from "@/production/useProduction"');
    expect(src).toContain("useProduction()");
    expect(src).toContain("generateProductionPlanCommand");
    expect(src).toContain("getProductionQueueQuery");
    expect(src).toContain("markBatchReadyCommand");
    expect(src).toContain("closeBatchCommand");
    expect(src).toContain("generateProductionBatchCommand");
    expect(src).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(src).not.toMatch(/from ["']@\/services\/types/);
    expect(src).not.toMatch(/from ["']@\/modules\/operations/);
    expect(src).not.toMatch(/ProductionReportService/);
    expect(src).not.toMatch(/KitchenExecutionService/);
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
