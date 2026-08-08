/**
 * DELIVERY EXPERIENCE 003 · Zero Friction Delivery Adaptation (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAssignment } from "@/delivery/DeliveryContext";
import {
  clearDeliveryAdaptationsForTests,
  confirmDeliveryAdaptation,
  previewDeliveryAdaptation,
} from "@/delivery-experience/adapt-delivery";
import { mapAssignmentToCard } from "@/delivery-experience/today-delivery";

const ROOT = process.cwd();

function card(commitmentRef: string, customer: string) {
  const a: DeliveryAssignment = {
    id: `assignment:${commitmentRef}`,
    tenantId: "t1",
    commitmentRef,
    executionRef: null,
    stopId: `stop:${commitmentRef}`,
    routeId: null,
    status: "Planned",
    windowStart: null,
    windowEnd: null,
    destinationLabel: customer,
  };
  return mapAssignmentToCard(a, {
    summary: {
      id: commitmentRef,
      week: { weekStart: "2026-08-03" },
      status: "ready_for_delivery",
      demandChannel: "individual",
      orderSource: "test",
      partyRef: {
        kind: "individual",
        id: "c1",
        displayName: customer,
      },
      deliveryDayPrimary: "2026-08-08",
      itemCount: 2,
      total: 20,
      currency: "EUR",
      tenantId: "t1",
    },
    assignmentSupported: false,
  });
}

describe("DELIVERY EXPERIENCE 003 · Zero Friction Delivery Adaptation", () => {
  beforeEach(() => {
    clearDeliveryAdaptationsForTests();
  });

  it("documents TTAD · session adaptation · no routes · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_003.md"),
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
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.delivery-today.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/delivery-experience/DeliveryAdaptationPanel.tsx"),
      "utf8",
    );
    const adapt = readFileSync(
      resolve(ROOT, "src/delivery-experience/adapt-delivery.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Delivery Adaptation");
    expect(doc).toContain("Time-to-Adapt-Delivery (TTAD) < 30 seconds");
    expect(doc).toContain("90–570 s");
    expect(doc).toContain("Route Preparation signal");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");
    expect(doc).toContain("No changes to Delivery Capability");

    expect(cards).toContain("003 Delivery Adaptation");
    expect(cards).toContain("Zero Friction Delivery Adaptation");
    expect(cards).toContain("Time-to-Adapt-Delivery <30 s");

    expect(missions).toContain("DELIVERY-EXPERIENCE-003");
    expect(missions).toContain("DE003 Adaptation ✅");
    expect(missions).toContain("TTAD");

    expect(ui).toContain("DELIVERY EXPERIENCE 003");
    expect(ui).toContain("DeliveryAdaptationPanel");
    expect(ui).toContain('mode === "adapt"');
    expect(ui).toContain("TTAD < 30 s");
    expect(ui).not.toContain("confirmDelivery");
    expect(ui).not.toContain("optimizeRoute");

    expect(panel).toContain("Adaptación de entrega");
    expect(panel).toContain("Volver a Today's Deliveries");
    expect(panel).toContain("Revisar impacto");
    expect(panel).toContain("Route Preparation");
    expect(panel).toContain("Driver assignment not available in this substrate");
    expect(panel).toContain("≠ registro Customer");
    expect(panel).not.toContain("confirmDelivery(");

    expect(adapt).toContain("persistence: \"session\"");
    expect(adapt).toContain("orderCommitmentUnchanged");
    expect(adapt).toContain("routePreparationSignal");
    expect(adapt).toContain("requestRouteReorder");
    expect(adapt).not.toContain("optimizeRoute");
  });

  it("applies session sequence without mutating Order and registers route reorder", () => {
    const c = card("o1", "Ana");
    const impact = previewDeliveryAdaptation(c, {
      kind: "sequence",
      deliveryId: c.id,
      sequenceRank: 2,
    });
    expect(impact?.affectsDeliveryDay).toBe(true);
    expect(impact?.orderCommitmentUnchanged).toBe(true);
    expect(impact?.persistence).toBe("session");
    expect(impact?.routePreparationSignal).toBe(false);

    const confirmed = confirmDeliveryAdaptation(c, {
      kind: "sequence",
      deliveryId: c.id,
      sequenceRank: 2,
    });
    expect(confirmed?.summary).toMatch(/sesión/);

    const routeSignal = previewDeliveryAdaptation(c, {
      kind: "sequence",
      deliveryId: c.id,
      sequenceRank: 1,
      requestRouteReorder: true,
    });
    expect(routeSignal?.routePreparationSignal).toBe(true);
    expect(routeSignal?.affectsDeliveryDay).toBe(false);
    expect(routeSignal?.substrateGap).toMatch(/Route Preparation/);

    const orderEscalation = previewDeliveryAdaptation(c, {
      kind: "address_clarification",
      deliveryId: c.id,
      addressClarification: "portero 2B",
      requestOrderOrCustomerChange: true,
    });
    expect(orderEscalation?.affectsDeliveryDay).toBe(false);
    expect(orderEscalation?.escalationTarget).toBe("order");

    const addressLocal = confirmDeliveryAdaptation(c, {
      kind: "address_clarification",
      deliveryId: c.id,
      addressClarification: "portero 2B",
    });
    expect(addressLocal?.customerRecordUnchanged).toBe(true);
    expect(addressLocal?.summary).toMatch(/Customer address record intacto/);
  });
});
