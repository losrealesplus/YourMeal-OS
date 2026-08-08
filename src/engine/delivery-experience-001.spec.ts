/**
 * DELIVERY EXPERIENCE 001 · Zero Friction Delivery Day (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  DeliveryAssignment,
  DeliveryContext,
} from "@/delivery/DeliveryContext";
import { deliveryDayToCsv } from "@/delivery-experience/export-delivery-day";
import {
  absentOr,
  buildTodaysDeliveryDay,
  filterDeliveryCards,
  mapAssignmentToCard,
} from "@/delivery-experience/today-delivery";
import type { OrderSummary } from "@/order/OrderContext";

const ROOT = process.cwd();

function assignment(
  partial: Partial<DeliveryAssignment> & { commitmentRef: string },
): DeliveryAssignment {
  const commitmentRef = partial.commitmentRef;
  return {
    id: partial.id ?? `assignment:${commitmentRef}`,
    tenantId: partial.tenantId ?? "t1",
    commitmentRef,
    executionRef: partial.executionRef ?? null,
    stopId: partial.stopId ?? `stop:${commitmentRef}`,
    routeId: partial.routeId ?? null,
    status: partial.status ?? "Planned",
    windowStart: partial.windowStart ?? null,
    windowEnd: partial.windowEnd ?? null,
    destinationLabel: partial.destinationLabel ?? "Cliente Demo",
  };
}

function summary(partial: Partial<OrderSummary> & { id: string }): OrderSummary {
  return {
    id: partial.id,
    week: partial.week ?? { weekStart: "2026-08-03" },
    status: partial.status ?? "ready_for_delivery",
    demandChannel: partial.demandChannel ?? "individual",
    orderSource: partial.orderSource ?? "test",
    partyRef: partial.partyRef ?? {
      kind: "individual",
      id: "c1",
      displayName: "Ana",
    },
    deliveryDayPrimary: partial.deliveryDayPrimary ?? "2026-08-08",
    itemCount: partial.itemCount ?? 2,
    total: partial.total ?? 20,
    currency: partial.currency ?? "EUR",
    tenantId: partial.tenantId ?? "t1",
  };
}

describe("DELIVERY EXPERIENCE 001 · Zero Friction Delivery Day", () => {
  it("documents TTUDD · Experience-only · no routes · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_001.md"),
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
      resolve(ROOT, "src/delivery-experience/DeliveryTodayPanel.tsx"),
      "utf8",
    );
    const today = readFileSync(
      resolve(ROOT, "src/delivery-experience/today-delivery.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Delivery Day");
    expect(doc).toContain(
      "Time-to-Understand-Delivery-Day (TTUDD) < 2 minutes",
    );
    expect(doc).toContain("3–18 min");
    expect(doc).toContain("No Delivery Capability");
    expect(doc).toContain("does not invent");
    expect(doc).toContain("Route Preparation ≠ Route Optimization");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");

    expect(cards).toContain("001 Today's Delivery Day");
    expect(cards).toContain("Zero Friction Delivery Day");
    expect(cards).toContain("Time-to-Understand-Delivery-Day <2 min");
    expect(cards).toContain("No routes · no maps");

    expect(missions).toContain("DELIVERY-EXPERIENCE-001");
    expect(missions).toContain("DELIVERY EXPERIENCE 001");
    expect(missions).toContain("TTUDD");

    expect(ui).toContain("DELIVERY EXPERIENCE 001");
    expect(ui).toContain("DeliveryTodayPanel");
    expect(ui).toContain("TTUDD < 2 min");
    expect(ui).toContain("logistics.operate");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/from ["']@\/modules\/delivery/);
    expect(ui).not.toContain("confirmDelivery");

    expect(panel).toContain("Entregas de hoy");
    expect(panel).toContain("No hay entregas listas para hoy");
    expect(panel).toContain("Revisar Kitchen");
    expect(panel).toContain("Driver assignment not available in this substrate");
    expect(panel).toContain(
      "Build route / Optimize / Navigate / Confirm → Future",
    );
    expect(panel).toContain("no disponible en este substrate");
    expect(panel).not.toContain("confirmDelivery(");

    expect(today).toContain("assignmentSupported");
    expect(today).toContain("Driver assignment not available in this substrate");
    expect(today).not.toContain("optimizeRoute");
  });

  it("builds delivery day from Facade assignments without inventing driver or routes", () => {
    const ctx: DeliveryContext = {
      tenantId: "t1",
      operationalDay: "2026-08-08",
      assignments: [
        assignment({
          commitmentRef: "o1",
          destinationLabel: "Ana Pérez",
          status: "Planned",
        }),
      ],
      routes: [],
      stops: [],
      permissions: {
        canAssign: true,
        canConfirm: true,
        canViewEvidence: true,
      },
    };

    const view = buildTodaysDeliveryDay({
      dayDate: "2026-08-08",
      context: ctx,
      summariesById: {
        o1: summary({ id: "o1", itemCount: 3 }),
      },
      assignmentSupported: false,
    });

    expect(view.cards).toHaveLength(1);
    expect(view.cards[0].customerLabel).toBe("Ana");
    expect(view.cards[0].packageSummary).toBe("3 ítem(s)");
    expect(view.cards[0].driverLabel).toBeNull();
    expect(view.cards[0].addressLabel).toBeNull();
    expect(view.assignmentAvailable).toBe(false);
    expect(view.totals.total).toBe(1);
    expect(view.totals.remaining).toBe(1);
    expect(view.warnings.some((w) => w.code === "assignment_unavailable")).toBe(
      true,
    );
    expect(view.warnings.some((w) => w.code === "routes_future")).toBe(true);
    expect(absentOr(null)).toBe("no disponible en este substrate");

    const csv = deliveryDayToCsv(view);
    expect(csv).toContain("order");
    expect(csv).toContain("o1");
    expect(csv).not.toContain("route_optimize");

    const warned = filterDeliveryCards(view.cards, "warnings");
    expect(warned.length).toBeGreaterThanOrEqual(1);
  });

  it("marks completed status honestly and empty day with next actions", () => {
    const completed: DeliveryContext = {
      tenantId: "t1",
      operationalDay: "2026-08-08",
      assignments: [
        assignment({
          commitmentRef: "o2",
          destinationLabel: "Bruno",
          status: "Confirmed",
        }),
      ],
      routes: [],
      stops: [],
      permissions: {
        canAssign: false,
        canConfirm: false,
        canViewEvidence: true,
      },
    };

    const view = buildTodaysDeliveryDay({
      dayDate: "2026-08-08",
      context: { ...completed, assignments: [] },
      completedContext: completed,
      assignmentSupported: false,
    });
    expect(view.cards[0].readiness).toBe("completed");
    expect(view.totals.completed).toBe(1);

    const empty = buildTodaysDeliveryDay({
      dayDate: "2026-08-08",
      context: {
        tenantId: "t1",
        operationalDay: "2026-08-08",
        assignments: [],
        routes: [],
        stops: [],
        permissions: {
          canAssign: false,
          canConfirm: false,
          canViewEvidence: true,
        },
      },
    });
    expect(empty.emptyReason).toMatch(/No hay entregas listas/);
    expect(empty.nextActionHint).toMatch(/Kitchen|Orders|Production/);

    const card = mapAssignmentToCard(
      assignment({ commitmentRef: "o3", destinationLabel: "" }),
      { assignmentSupported: false },
    );
    expect(card.customerLabel).toBeNull();
    expect(card.readiness).toBe("incomplete");
  });
});
