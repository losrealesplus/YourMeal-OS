/**
 * OPERATIONAL-ENGINE-001 — institutional declaration integrity (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OPERATIONAL-ENGINE-001 · Operational Engine v1.0 Declaration", () => {
  it("OPERATIONAL_ENGINE_V1 declares Construction COMPLETE and Tenant Success focus", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/OPERATIONAL_ENGINE_V1.md"),
      "utf8",
    );
    expect(doc).toContain("Operational Engine v1.0");
    expect(doc).toContain("Construction Phase");
    expect(doc).toContain("COMPLETE");
    expect(doc).toContain("CERTIFIED");
    expect(doc).toContain("FROZEN");
    expect(doc).toContain("Tenant Success");
    expect(doc).toContain("Time saved is the product");
    expect(doc).toContain("The Operational Engine is no longer our competitive advantage");
    expect(doc).toContain("operational-engine-v1.0");
    expect(doc).toContain("PRODUCT LAW 001");
  });

  it("ADR-0090 is institutional only — no behaviour change", () => {
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0090-operational-engine-v1-declaration.md"),
      "utf8",
    );
    expect(adr).toContain("OPERATIONAL-ENGINE-001");
    expect(adr).toContain("no introduce software");
    expect(adr).toContain("Tenant Success");
    expect(adr).toContain("PRODUCT LAW 001");
  });

  it("Capability Registry still shows Engine Capability Completion 100%", () => {
    const registry = readFileSync(
      resolve(ROOT, "docs/00-status/CAPABILITY_REGISTRY.md"),
      "utf8",
    );
    expect(registry).toContain("Capability Completion");
    expect(registry).toContain("100%");
    expect(registry).toContain("Billing");
    expect(registry).toContain("Engineering Certified");
  });
});
