/**
 * TENANT-SUCCESS-001 — Operational Observation Framework (docs only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("TENANT-SUCCESS-001 Observation Framework", () => {
  it("publishes framework · template · friction catalog · time score", () => {
    const framework = readFileSync(
      resolve(ROOT, "docs/tenant-success/OBSERVATION_FRAMEWORK.md"),
      "utf8",
    );
    const template = readFileSync(
      resolve(ROOT, "docs/tenant-success/TENANT_OBSERVATION_TEMPLATE.md"),
      "utf8",
    );
    const catalog = readFileSync(
      resolve(ROOT, "docs/tenant-success/FRICTION_CATALOG.md"),
      "utf8",
    );
    const score = readFileSync(
      resolve(ROOT, "docs/tenant-success/TIME_SAVINGS_SCORE.md"),
      "utf8",
    );
    const adr = readFileSync(
      resolve(ROOT, "docs/adr/0095-tenant-success-001-observation-framework.md"),
      "utf8",
    );
    const playbook = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_SUCCESS_PLAYBOOK.md"),
      "utf8",
    );
    const sprint = readFileSync(
      resolve(ROOT, "docs/00-status/SPRINT_001_TENANT_SUCCESS.md"),
      "utf8",
    );

    expect(framework).toContain("TENANT-SUCCESS-001");
    expect(framework).toContain("Observe without influencing");
    expect(framework).toContain("Never teach");
    expect(framework).toContain("Where does the tenant lose operational time?");

    expect(template).toContain("Number of clicks");
    expect(template).toContain("External tools used");
    expect(template).toContain("Excel");

    expect(catalog).toContain("Repeated typing");
    expect(catalog).toContain("External Excel");
    expect(catalog).toContain("Knowledge in people's heads");

    expect(score).toContain("Operational frequency");
    expect(score).toContain("Estimated time saved");
    expect(score).toContain("Beta 1");
    expect(score).toContain("Golden Master");

    expect(adr).toContain("Accepted");
    expect(adr).toContain("OBSERVATION_FRAMEWORK");

    expect(playbook).toContain("OBSERVATION_FRAMEWORK");
    expect(sprint).toContain("Epic 0");
    expect(sprint).toContain("hybrid");
  });
});
