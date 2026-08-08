/**
 * DELIVERY EXPERIENCE 005 · Zero Friction Route Preparation (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAssignment } from "@/delivery/DeliveryContext";
import {
  applyMoveRelative,
  applyRemoveFromSequence,
  applyReorder,
  buildRoutePrepDayView,
  clearRoutePreparationForTests,
  confirmRoutePreparation,
  previewReorder,
} from "@/delivery-experience/route-preparation";
import { routePrepDayToCsv } from "@/delivery-experience/export-route-preparation";
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

describe("DELIVERY EXPERIENCE 005 · Zero Friction Route Preparation", () => {
  beforeEach(() => {
    clearRoutePreparationForTests();
  });

  it("documents TPDD · not optimization · session sequence · Card retained", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_005.md"),
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
      resolve(
        ROOT,
        "src/delivery-experience/DeliveryRoutePreparationPanel.tsx",
      ),
      "utf8",
    );
    const prep = readFileSync(
      resolve(ROOT, "src/delivery-experience/route-preparation.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Route Preparation");
    expect(doc).toContain("Time-to-Prepare-Delivery-Day (TPDD) < 5 minutes");
    expect(doc).toContain("Route Preparation ≠ Route Optimization");
    expect(doc).toContain("2–15 min");
    expect(doc).toContain("design hypothesis");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");
    expect(doc).toContain("No changes to Delivery Capability");

    expect(cards).toContain("005 Route Preparation");
    expect(cards).toContain("Zero Friction Route Preparation");
    expect(cards).toContain("Time-to-Prepare-Delivery-Day <5 min");

    expect(missions).toContain("DELIVERY-EXPERIENCE-005");
    expect(missions).toContain("DE005 Route Preparation ✅");
    expect(missions).toContain("TPDD");

    expect(ui).toContain("DELIVERY EXPERIENCE 005");
    expect(ui).toContain("DeliveryRoutePreparationPanel");
    expect(ui).toContain('mode === "route"');
    expect(ui).toContain("TPDD < 5 min");
    expect(ui).not.toContain("confirmDelivery");
    expect(ui).not.toContain("optimizeRoute");

    expect(panel).toContain("Preparación de jornada");
    expect(panel).toContain(
      "Driver assignment not available in this substrate",
    );
    expect(panel).toContain("assignmentSupported = false");
    expect(panel).toContain("Optimize Route → Future");
    expect(panel).toContain("Imprimir / PDF");
    expect(panel).not.toContain("confirmDelivery(");

    expect(prep).toContain('persistence: "session"');
    expect(prep).toContain("Route Preparation ≠ Route Optimization");
    expect(prep).toContain("notOptimization");
    expect(prep).not.toContain("optimizeRoute");
    expect(prep).not.toContain("turn-by-turn");
  });

  it("builds session sequence with impact preview and never invents optimization", () => {
    const cards = [card("o1", "Ana"), card("o2", "Luis"), card("o3", "Mia")];
    const view = buildRoutePrepDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards,
      assignmentSupported: false,
      emptyReason: null,
    });

    expect(view.persistence).toBe("session");
    expect(view.totals.preparedSequence).toBe(3);
    expect(view.sequence[0]?.customerLabel).toBe("Ana");
    // Without address substrate → incomplete honesty (not fake ready)
    expect(view.statusSummary).toMatch(/incompleta|substrate|avisos|preparable/i);
    expect(["incomplete", "ready_with_warnings"]).toContain(view.readiness);
    expect(view.sequence.every((s) =>
      s.warnings.some((w) => w.code === "ASSIGNMENT_UNAVAILABLE"),
    )).toBe(true);

    const impact = previewReorder("2026-08-08", cards[0]!.id, 2, cards);
    expect(impact?.previousPosition).toBe(1);
    expect(impact?.newPosition).toBe(3);
    expect(impact?.persistence).toBe("session");
    expect(impact?.notOptimization).toBe(true);
    expect(impact?.orderUnchanged).toBe(true);
    expect(impact?.customerUnchanged).toBe(true);
    expect(impact?.responsibilityUnchanged).toBe(true);

    const applied = applyReorder("2026-08-08", cards[0]!.id, 2, cards);
    expect(applied?.newPosition).toBe(3);
    const after = buildRoutePrepDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards,
      assignmentSupported: false,
      emptyReason: null,
    });
    expect(after.sequence.map((s) => s.customerLabel)).toEqual([
      "Luis",
      "Mia",
      "Ana",
    ]);

    applyMoveRelative("2026-08-08", cards[0]!.id, -1, cards);
    const moved = buildRoutePrepDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards,
      assignmentSupported: false,
      emptyReason: null,
    });
    expect(moved.sequence.map((s) => s.customerLabel)).toEqual([
      "Luis",
      "Ana",
      "Mia",
    ]);

    applyRemoveFromSequence("2026-08-08", cards[1]!.id, cards);
    const removed = buildRoutePrepDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards,
      assignmentSupported: false,
      emptyReason: null,
    });
    expect(removed.sequence.map((s) => s.customerLabel)).toEqual([
      "Ana",
      "Mia",
    ]);
    expect(removed.pool.some((p) => p.customerLabel === "Luis")).toBe(true);

    const confirmed = confirmRoutePreparation("2026-08-08", cards);
    expect(confirmed.persistence).toBe("session");
    expect(confirmed.summary).toMatch(/sesión/);
    expect(confirmed.summary).not.toMatch(/optimiz/i);

    const csv = routePrepDayToCsv(
      buildRoutePrepDayView({
        dayDate: "2026-08-08",
        dayLabel: "vie 8 ago",
        cards,
        assignmentSupported: false,
        emptyReason: null,
      }),
    );
    expect(csv).toContain("sequence");
    expect(csv).toContain("Ana");
    expect(csv).toContain("assignment_unavailable");
  });

  it("empty state when no active deliveries", () => {
    const view = buildRoutePrepDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [],
      assignmentSupported: false,
      emptyReason: "Sin entregas hoy",
    });
    expect(view.readiness).toBe("route_preparation_unavailable");
    expect(view.statusSummary).toMatch(/No deliveries available/);
    expect(view.emptyReason).toBe("Sin entregas hoy");
  });
});
