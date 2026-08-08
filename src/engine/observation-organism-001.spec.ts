/**
 * OBSERVATION-ORGANISM-001 · docs only (no Experience · no Engine · no Facade).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("OBSERVATION-ORGANISM-001", () => {
  it("instruments Organism Review · forbids build · defines work-transfer observation", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/tenant-success/ORGANISM_REVIEW.md"),
      "utf8",
    );
    const template = readFileSync(
      resolve(ROOT, "docs/tenant-success/ORGANISM_OBSERVATION_TEMPLATE.md"),
      "utf8",
    );
    const friction = readFileSync(
      resolve(ROOT, "docs/tenant-success/FRICTION_CATALOG.md"),
      "utf8",
    );
    const framework = readFileSync(
      resolve(ROOT, "docs/tenant-success/OBSERVATION_FRAMEWORK.md"),
      "utf8",
    );
    const playbook = readFileSync(
      resolve(ROOT, "docs/00-status/TENANT_SUCCESS_PLAYBOOK.md"),
      "utf8",
    );
    const journeys = readFileSync(
      resolve(ROOT, "docs/00-status/JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    const missions = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MISSIONS.md"),
      "utf8",
    );

    expect(review).toContain("OBSERVATION-ORGANISM-001");
    expect(review).toContain("INSTRUMENTED");
    expect(review).toContain("Do NOT build another Experience");
    expect(review).toContain("Do NOT open a new Capability");
    expect(review).toContain("Do NOT create an Accelerator");
    expect(review).toContain("Do NOT modify the Engine");
    expect(review).toContain("work transfer");
    expect(review).toContain("Customer");
    expect(review).toContain("Order");
    expect(review).toContain("Menu");
    expect(review).toContain("Production");
    expect(review).toContain("Kitchen");
    expect(review).toContain("Delivery");
    expect(review).toContain("Outcome");
    expect(review).toContain("Customer → Order");
    expect(review).toContain("Order → Menu");
    expect(review).toContain("Menu → Production");
    expect(review).toContain("Production → Kitchen");
    expect(review).toContain("Kitchen → Delivery");
    expect(review).toContain("Delivery → Outcome");
    expect(review).toContain("Information continuity");
    expect(review).toContain("Responsibility continuity");
    expect(review).toContain("Context continuity");
    expect(review).toContain("Execution continuity");
    expect(review).toContain("PASS");
    expect(review).toContain("FRICTION");
    expect(review).toContain("BREAK");
    expect(review).toContain("UNKNOWN");
    expect(review).toContain("TENANT SUCCESS LAW 001");
    expect(review).toContain("PRODUCT LAW 001");
    expect(review).toContain("PRODUCT LAW 002");
    expect(review).toContain("TEAM LAW 001");
    expect(review).toContain("Product Decision Queue");
    expect(review).toContain("Candidate Patterns");
    expect(review).toContain("invent a numerical organism score");
    expect(review).toContain("Time saved is the product");

    expect(template).toContain("WORK TRANSFER");
    expect(template).toContain("Observation ID");
    expect(template).toContain("Human bridge");
    expect(template).toContain("Total operational time");
    expect(template).toContain("Time outside product");
    expect(template).toContain("DUPLICATE_ENTRY");
    expect(template).toContain("HANDOFF");
    expect(template).toContain("EXTERNAL_TOOL");
    expect(template).toContain("Do **not** fill unless a later Product Decision");

    expect(friction).toContain("F-21");
    expect(friction).toContain("F-22");
    expect(friction).toContain("F-23");
    expect(friction).toContain("Organism transfer categories");
    expect(friction).toContain("HANDOFF");
    expect(friction).toContain("UNSUPPORTED_OPERATION");
    expect(friction).toContain("UNAVAILABLE_SUBSTRATE");

    expect(framework).toContain("ORGANISM_REVIEW");
    expect(framework).toContain("ALL JOURNEYS CERTIFIED");
    expect(framework).toContain("Observation Sprint · **not** a new Experience");

    expect(playbook).toContain("ORGANISM_REVIEW");
    expect(playbook).toContain("OBSERVATION-ORGANISM-001");
    expect(playbook).toContain("Active Observation Sprint");
    expect(playbook).toContain("Do not open another Experience block");
    expect(playbook).not.toContain(
      "Active Experience Sprint: [CUSTOMER_EXPERIENCE_001]",
    );

    expect(journeys).toContain("Organism Review");
    expect(journeys).toContain("ORGANISM_REVIEW");
    expect(journeys).toContain("Observation Sprint    ▶ ACTIVE");

    expect(missions).toContain("ORGANISM_REVIEW");
    expect(missions).toContain("Observation Sprint         ▶ ACTIVE");
    expect(missions).toContain(
      "Do **not** open another Experience block until Observation",
    );
  });

  it("defines required evidence fields and forbids premature solutions", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/tenant-success/ORGANISM_REVIEW.md"),
      "utf8",
    );
    expect(review).toContain("Active work time");
    expect(review).toContain("Waiting time");
    expect(review).toContain("Number of handoffs");
    expect(review).toContain("CURRENT MEASURED TIME");
    expect(review).toContain("Do **not** calculate theoretical");
    expect(review).toContain("Would a button help?");
    expect(review).toContain("What do you do now?");
    expect(review).toContain("No solution fields");
  });
});
