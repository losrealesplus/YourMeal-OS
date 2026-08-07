/**
 * Tenant Success Playbook — institutional integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("Tenant Success Playbook", () => {
  it("defines Era 2 · Operational Evidence Loop · Operational First identity", () => {
    const playbook = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_SUCCESS_PLAYBOOK.md"),
      "utf8",
    );
    expect(playbook).toContain("We do not start with software");
    expect(playbook).toContain("operational friction");
    expect(playbook).toContain("Operational Evidence Loop");
    expect(playbook).toContain("Observe");
    expect(playbook).toContain("Measure Again");
    expect(playbook).toContain("Discover Friction");
    expect(playbook).toContain("Operational First");
    expect(playbook).toContain("Operational SaaS");
    expect(playbook).toContain("systematically returns time");
    expect(playbook).toContain("ERA 2");
    expect(playbook).toContain("Return Time");
    expect(playbook).toContain("PRODUCT LAW 001");
    expect(playbook).toContain("Isabella");
    expect(playbook).toContain("Time saved is the product");
    expect(playbook).toContain("Tiempo recuperado esperado");
  });
});
