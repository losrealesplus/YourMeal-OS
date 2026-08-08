/**
 * DELIVERY EXPERIENCE 004 · Zero Friction Delivery Responsibility (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { DeliveryAssignment } from "@/delivery/DeliveryContext";
import {
  buildResponsibilityDayView,
  deriveResponsibilityState,
  filterResponsibilityCards,
  responsibilityStateLabel,
} from "@/delivery-experience/responsibility-view";
import { responsibilityDayToCsv } from "@/delivery-experience/export-responsibility";
import { mapAssignmentToCard } from "@/delivery-experience/today-delivery";

const ROOT = process.cwd();

function card(
  commitmentRef: string,
  customer: string,
  status: DeliveryAssignment["status"] = "Planned",
) {
  const a: DeliveryAssignment = {
    id: `assignment:${commitmentRef}`,
    tenantId: "t1",
    commitmentRef,
    executionRef: null,
    stopId: `stop:${commitmentRef}`,
    routeId: null,
    status,
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

describe("DELIVERY EXPERIENCE 004 · Zero Friction Delivery Responsibility", () => {
  it("documents TTDR · assignment honesty · no routes · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_004.md"),
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
      resolve(ROOT, "src/delivery-experience/DeliveryResponsibilityPanel.tsx"),
      "utf8",
    );
    const view = readFileSync(
      resolve(ROOT, "src/delivery-experience/responsibility-view.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Delivery Responsibility");
    expect(doc).toContain(
      "Time-to-Understand-Delivery-Responsibility (TTDR) < 10 seconds",
    );
    expect(doc).toContain("50–170 s");
    expect(doc).toContain("AssignDelivery");
    expect(doc).toContain("UNIMPLEMENTED");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");
    expect(doc).toContain("No changes to Delivery Capability");
    expect(doc).toContain("Route Preparation");

    expect(cards).toContain("004 Delivery Responsibility");
    expect(cards).toContain("Zero Friction Delivery Responsibility");
    expect(cards).toContain(
      "Time-to-Understand-Delivery-Responsibility <10 s",
    );

    expect(missions).toContain("DELIVERY-EXPERIENCE-004");
    expect(missions).toContain("DE004 Responsibility ▶");
    expect(missions).toContain("TTDR");

    expect(ui).toContain("DELIVERY EXPERIENCE 004");
    expect(ui).toContain("DeliveryResponsibilityPanel");
    expect(ui).toContain('mode === "responsibility"');
    expect(ui).toContain("TTDR < 10 s");
    expect(ui).not.toContain("confirmDelivery");
    expect(ui).not.toContain("optimizeRoute");

    expect(panel).toContain("Responsabilidad de entregas");
    expect(panel).toContain(
      "Driver assignment not available in this substrate",
    );
    expect(panel).toContain("AssignDelivery");
    expect(panel).toContain("UNIMPLEMENTED");
    expect(panel).toContain("Continuar a Route Preparation");
    expect(panel).toContain("assignmentSupported = false");
    expect(panel).not.toContain("confirmDelivery(");

    expect(view).toContain("assignment_unavailable");
    expect(view).toContain("allResponsibilitiesAccountedFor");
    expect(view).toContain("Never invent durable AssignDelivery");
  });

  it("derives assignment_unavailable when AssignDelivery substrate is missing", () => {
    const c = card("o1", "Ana");
    expect(deriveResponsibilityState(c, false)).toBe("assignment_unavailable");
    expect(responsibilityStateLabel("assignment_unavailable")).toBe(
      "Assignment unavailable",
    );

    const view = buildResponsibilityDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [c, card("o2", "Luis", "Confirmed")],
      assignmentSupported: false,
      emptyReason: null,
    });

    expect(view.assignmentSupported).toBe(false);
    expect(view.allResponsibilitiesAccountedFor).toBe(false);
    expect(view.totals.assignmentUnavailable).toBe(1);
    expect(view.totals.completed).toBe(1);
    expect(view.totals.unassigned).toBe(0);
    expect(view.responsibilityStatusSummary).toMatch(/unavailable/i);
    expect(view.responsibilityStatusSummary).not.toMatch(
      /All delivery responsibilities are accounted for/,
    );

    const unavailable = filterResponsibilityCards(view.cards, "unavailable");
    expect(unavailable).toHaveLength(1);
    expect(unavailable[0]?.customerLabel).toBe("Ana");

    const csv = responsibilityDayToCsv(view);
    expect(csv).toContain("responsibility_state");
    expect(csv).toContain("assignment_unavailable");
    expect(csv).toContain("Ana");
  });

  it("only reports all accounted for when assignment substrate supports it", () => {
    const base = card("o1", "Ana");
    const assigned = {
      ...base,
      driverLabel: "Conductor Demo",
      deliveryStatus: "Assigned" as const,
    };

    const unsupported = buildResponsibilityDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [assigned],
      assignmentSupported: false,
      emptyReason: null,
    });
    expect(unsupported.allResponsibilitiesAccountedFor).toBe(false);
    expect(unsupported.cards[0]?.responsibilityState).toBe(
      "assignment_unavailable",
    );

    const supported = buildResponsibilityDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [assigned],
      assignmentSupported: true,
      emptyReason: null,
    });
    expect(supported.cards[0]?.responsibilityState).toBe("assigned");
    expect(supported.allResponsibilitiesAccountedFor).toBe(true);
    expect(supported.responsibilityStatusSummary).toBe(
      "All delivery responsibilities are accounted for",
    );

    const unassigned = buildResponsibilityDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [{ ...base, driverLabel: null }],
      assignmentSupported: true,
      emptyReason: null,
    });
    expect(unassigned.cards[0]?.responsibilityState).toBe("unassigned");
    expect(unassigned.totals.unassigned).toBe(1);
    expect(unassigned.allResponsibilitiesAccountedFor).toBe(false);
    expect(unassigned.routePreparationEligible).toBe(false);
  });
});
