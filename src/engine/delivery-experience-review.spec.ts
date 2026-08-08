/**
 * DELIVERY EXPERIENCE REVIEW 001 · docs only (no implementation).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("DELIVERY EXPERIENCE REVIEW 001 · Readiness Review", () => {
  it("records READY WITH IMPROVEMENTS · Estimated ≠ Measured · Certification NEXT", () => {
    const review = readFileSync(
      resolve(ROOT, "docs/tenant-success/DELIVERY_EXPERIENCE_REVIEW.md"),
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

    expect(review).toContain("READY WITH IMPROVEMENTS");
    expect(review).toContain("No application code changes");
    expect(review).toContain("Estimated OTS");
    expect(review).toContain("Measured Time Saved");
    expect(review).toContain("15–55 minutes");
    expect(review).toContain("Required before Journey Certification");
    expect(review).toContain("*None.*");
    expect(review).toContain("Operational Boundaries");
    expect(review).toContain("ConfirmDelivery");
    expect(review).toContain("SUPPORTED");
    expect(review).toContain("AssignDelivery");
    expect(review).toContain("UNIMPLEMENTED");
    expect(review).toContain("ReportDeliveryException");
    expect(review).toContain("Billing outcome");
    expect(review).toContain("Route Preparation ≠ Route Optimization");
    expect(review).toContain("Journey Certification");
    expect(review).toContain("DELIVERY_JOURNEY_CERTIFICATION");
    expect(review).toContain("CERTIFIED");
    expect(review).not.toContain("createInvoice");

    expect(journeys).toContain("READY WITH IMPROVEMENTS");
    expect(journeys).toContain("DELIVERY_EXPERIENCE_REVIEW");
    expect(journeys).toContain("DELIVERY_JOURNEY_CERTIFICATION");
    expect(journeys).toContain(
      "Delivery Journey      ✅ Certified · Frozen",
    );

    expect(lifecycle).toContain("Delivery Review ✅");
    expect(lifecycle).toContain("READY WITH IMPROVEMENTS");
    expect(lifecycle).toContain("Delivery Journey ✅ CERTIFIED");
    expect(lifecycle).toContain("Delivery Frozen");

    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("DELIVERY_EXPERIENCE_REVIEW");
    expect(cards).toContain("DELIVERY_JOURNEY_CERTIFICATION");
    expect(cards).toMatch(
      /Delivery Experience\s+✅ Journey Certified · Frozen/,
    );
    expect(cards).toContain(
      "¿El viaje completo está listo para certificar? | ✅ READY WITH IMPROVEMENTS",
    );
    expect(cards).toContain(
      "¿El Journey Delivery está certificado? | ✅ CERTIFIED · Frozen",
    );

    expect(missions).toContain("DELIVERY-EXPERIENCE-REVIEW");
    expect(missions).toContain("READY WITH IMPROVEMENTS");
    expect(missions).toContain("DE006 Completion ✅");
    expect(missions).toContain("DELIVERY-JOURNEY-CERTIFICATION");
    expect(missions).toContain(
      "Journey Certification ✅ CERTIFIED → Freeze ✅",
    );
  });
});
