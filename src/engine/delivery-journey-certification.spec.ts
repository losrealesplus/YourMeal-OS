/**
 * DELIVERY JOURNEY CERTIFICATION 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("DELIVERY JOURNEY CERTIFICATION 001", () => {
  it("records CERTIFIED · freezes Delivery · Operational Journeys complete · Estimated ≠ Measured", () => {
    const cert = readFileSync(
      resolve(ROOT, "docs/tenant-success/DELIVERY_JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    const journeys = readFileSync(
      resolve(ROOT, "docs/00-status/JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    const lifecycle = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_LIFECYCLE.md"),
      "utf8",
    );
    const cards = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_CARDS.md"),
      "utf8",
    );
    const missions = readFileSync(
      resolve(ROOT, "docs/00-status/EXPERIENCE_MISSIONS.md"),
      "utf8",
    );

    expect(cert).toContain("CERTIFIED");
    expect(cert).not.toContain("NOT CERTIFIED");
    expect(cert).toContain("FAIL count:** **0**");
    expect(cert).toContain("Required before certification: **NONE**");
    expect(cert).toContain("Estimated OTS");
    expect(cert).toContain("Measured Time Saved");
    expect(cert).toContain("15–55 min/day");
    expect(cert).toContain("ESTIMATED");
    expect(cert).toContain("No application code");
    expect(cert).toContain("ConfirmDelivery");
    expect(cert).toContain("SUPPORTED");
    expect(cert).toContain("AssignDelivery");
    expect(cert).toContain("UNIMPLEMENTED");
    expect(cert).toContain("ReportDeliveryException");
    expect(cert).toContain("Billing outcome unavailable");
    expect(cert).toContain("Route Preparation ≠ Route Optimization");
    expect(cert).toContain("Operational Journeys");
    expect(cert).toContain("COMPLETE");
    expect(cert).toContain("Organism Review");

    expect(journeys).toContain("Delivery Journey");
    expect(journeys).toContain("✅ **Certified**");
    expect(journeys).toContain("DELIVERY_JOURNEY_CERTIFICATION");
    expect(journeys).toContain(
      "Delivery Journey      ✅ Certified · Frozen",
    );
    expect(journeys).toContain(
      "Delivery: 001–006 ✅ → Review ✅ → Certification ✅ CERTIFIED · Frozen",
    );
    expect(journeys).toContain("Operational Journeys  ✅ COMPLETE");

    expect(lifecycle).toContain("Delivery Journey ✅ CERTIFIED");
    expect(lifecycle).toContain("Delivery Frozen");

    expect(cards).toContain("Journey Certified · Frozen");
    expect(cards).toContain("CERTIFIED");
    expect(cards).toContain("DELIVERY_JOURNEY_CERTIFICATION");
    expect(cards).toMatch(
      /Delivery Experience\s+✅ Journey Certified · Frozen/,
    );
    expect(cards).toContain(
      "¿El Journey Delivery está certificado? | ✅ CERTIFIED · Frozen",
    );
    expect(cards).toContain("Time-to-Understand-Delivery-Outcome <5 s");

    expect(missions).toContain("DELIVERY JOURNEY");
    expect(missions).toContain("CERTIFIED · FROZEN");
    expect(missions).toContain("DELIVERY-JOURNEY-CERTIFICATION");
    expect(missions).toContain(
      "Delivery Experience     ✅ Journey Certified · Frozen",
    );
    expect(missions).toContain(
      "Journey Certification ✅ CERTIFIED → Freeze ✅",
    );
  });

  it("certification matrix has zero FAIL and documents gaps honestly", () => {
    const cert = readFileSync(
      resolve(ROOT, "docs/tenant-success/DELIVERY_JOURNEY_CERTIFICATION.md"),
      "utf8",
    );
    expect(cert).toContain("| **Delivery Day entry**");
    expect(cert).toContain("| **Today's workload**");
    expect(cert).toContain("| **Delivery Search**");
    expect(cert).toContain("| **Delivery Adaptation**");
    expect(cert).toContain("| **Responsibility**");
    expect(cert).toContain("| **Route Preparation**");
    expect(cert).toContain("| **Sequence clarity**");
    expect(cert).toContain("| **Delivery Completion**");
    expect(cert).toContain("| **ConfirmDelivery**");
    expect(cert).toContain("| **Next responsibility**");
    expect(cert).toContain("| **Honesty of substrate**");
    expect(cert).toContain("| **Print / Export**");
    expect(cert).toContain("| **Production → Kitchen → Delivery boundary**");
    expect(cert).toContain("| **Delivery → Billing boundary**");
    expect(cert).toContain("| **AssignDelivery** | **UNIMPLEMENTED** |");
    expect(cert).toContain(
      "| **ReportDeliveryException** | **UNIMPLEMENTED** |",
    );
    expect(cert).toContain(
      "| **Proof of Delivery / customer acceptance** | **UNAVAILABLE** |",
    );
    expect(cert).toContain(
      "| **Billing outcomes / Ready for Billing** | **UNAVAILABLE** |",
    );
    expect(cert).toContain("| **UNIMPLEMENTED** |");
    expect(cert).toContain("| **UNAVAILABLE** |");
    expect(cert).not.toMatch(/\| \*\*[^*]+\*\* \| \*\*FAIL\*\* \|/);
  });
});
