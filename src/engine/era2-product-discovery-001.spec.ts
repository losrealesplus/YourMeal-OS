/**
 * Era 2 Product Discovery 001 — institutional integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Era 2 Product Discovery 001", () => {
  it("records PRODUCT LAW 002 · TEAM LAW 001 · Sprint 001 · Cursor prompt", () => {
    const discovery = readFileSync(
      resolve(ROOT, "docs/00-status/ERA2_PRODUCT_DISCOVERY_001.md"),
      "utf8",
    );
    const sprint = readFileSync(
      resolve(ROOT, "docs/00-status/SPRINT_001_TENANT_SUCCESS.md"),
      "utf8",
    );
    const prompt = readFileSync(
      resolve(ROOT, "docs/00-status/ERA2_CURSOR_PROMPT.md"),
      "utf8",
    );
    const law002 = readFileSync(
      resolve(ROOT, "docs/adr/0093-product-law-002.md"),
      "utf8",
    );
    const teamLaw = readFileSync(
      resolve(ROOT, "docs/adr/0094-team-law-001.md"),
      "utf8",
    );
    const direction = readFileSync(
      resolve(ROOT, "docs/00-status/PRODUCT_DIRECTION.md"),
      "utf8",
    );

    expect(discovery).toContain("PRODUCT LAW 002");
    expect(discovery).toContain("Operational Capture");
    expect(discovery).toContain("Operational Import Pipeline");
    expect(discovery).toContain("Order Templates");
    expect(discovery).toContain("Preparation Inventory");
    expect(discovery).toContain("Operational Accelerators");
    expect(discovery).toContain("adopts existing work");

    expect(sprint).toContain("Sprint 001");
    expect(sprint).toContain("Customer Experience");
    expect(sprint).toContain("Kitchen Experience");
    expect(sprint).toContain("The operator finishes earlier");
    expect(sprint).toContain("Foundation");
    expect(sprint).toContain("Operational Engine");

    expect(prompt).toContain("Strategic Freeze is active");
    expect(prompt).toContain("PRODUCT LAW 002");
    expect(prompt).toContain("TEAM LAW 001");
    expect(prompt).toContain("design better workdays");

    expect(law002).toContain("Accepted");
    expect(law002).toContain("Existing operational knowledge");
    expect(teamLaw).toContain("Engineering time is an investment");
    expect(direction).toContain("PRODUCT LAW 002");
    expect(direction).toContain("TEAM LAW 001");
  });
});
