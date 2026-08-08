/**
 * Tenant Success Playbook — institutional integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Tenant Success Playbook", () => {
  it("defines observation, measurement, friction, and Beta gates under PRODUCT LAW 001", () => {
    const playbook = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_SUCCESS_PLAYBOOK.md"),
      "utf8",
    );
    expect(playbook).toContain("Tenant Success Playbook");
    expect(playbook).toContain("PRODUCT LAW 001");
    expect(playbook).toContain("How to observe an operator");
    expect(playbook).toContain("How to measure real task time");
    expect(playbook).toContain("operational friction");
    expect(playbook).toContain("Beta / GM decision gate");
    expect(playbook).toContain("Isabella");
    expect(playbook).toContain("Time saved is the product");
    expect(playbook).toContain("Operational Evidence");
  });
});
