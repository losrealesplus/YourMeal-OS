/**
 * ACCELERATOR-001 · OCC Reserved — docs only, no implementation.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("ACCELERATOR-001 · Operational Command Center · Reserved", () => {
  it("reserves OCC as platform accelerator — no Experience / Capability / code", () => {
    const occ = readFileSync(
      resolve(
        ROOT,
        "docs/00-status/ACCELERATOR_001_OPERATIONAL_COMMAND_CENTER.md",
      ),
      "utf8",
    );
    const layer = readFileSync(
      resolve(ROOT, "docs/00-status/OPERATIONAL_ACCELERATORS.md"),
      "utf8",
    );
    const backlog = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_TIME_SAVINGS_BACKLOG.md"),
      "utf8",
    );
    const discovery = readFileSync(
      resolve(ROOT, "docs/00-status/ERA2_PRODUCT_DISCOVERY_001.md"),
      "utf8",
    );
    const cx002 = readFileSync(
      resolve(ROOT, "docs/00-status/CUSTOMER_EXPERIENCE_002.md"),
      "utf8",
    );

    expect(occ).toContain("ACCELERATOR-001");
    expect(occ).toContain("Operational Command Center");
    expect(occ).toContain("RESERVED");
    expect(occ).toContain("zero implementation");
    expect(occ).toContain("Do **not** write OCC application code");
    expect(occ).toContain("Ctrl+K");
    expect(occ).toContain("Quick Capture Mode");
    expect(occ).toContain("Do not reduce to Customer search");
    expect(occ).toContain("Do not open implementation");
    expect(occ).toContain("customer-only shortcut");

    expect(layer).toContain("Operational Accelerators");
    expect(layer).toContain("ACCELERATOR-001");
    expect(layer).toContain("Reserved");
    expect(layer).toContain("Experiences first");

    expect(backlog).toContain("Operational Command Center");
    expect(backlog).toContain("ACCELERATOR-001");
    expect(backlog).toContain("Reserved");

    expect(discovery).toContain("Operational Command Center");
    expect(discovery).toContain("ACCELERATOR-001");

    expect(cx002).toContain("ACCELERATOR-001");
    expect(cx002).toContain("Operational Command Center");
    expect(cx002).toContain("Reserved");
    expect(cx002).not.toContain("Universal Command Bar (CX006");
  });

  it("does not ship OCC shell wiring in the Experience surface", () => {
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.customer-workspace.tsx"),
      "utf8",
    );
    expect(ui).not.toMatch(/metaKey.*KeyK|ctrlKey.*KeyK|CommandPalette|OperationalCommandCenter/);
  });
});
