/**
 * DELIVERY EXPERIENCE 006 · Zero Friction Delivery Completion (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAssignment } from "@/delivery/DeliveryContext";
import {
  buildDeliveryCompletionDayView,
  clearDeliveryCompletionSessionForTests,
  completionStateLabel,
  filterCompletionCards,
  markConfirmedInSession,
  setSessionUnresolved,
} from "@/delivery-experience/completion-view";
import { deliveryCompletionToCsv } from "@/delivery-experience/export-completion";
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
      status: status === "Confirmed" || status === "Delivered"
        ? "delivered"
        : "ready_for_delivery",
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

describe("DELIVERY EXPERIENCE 006 · Zero Friction Delivery Completion", () => {
  beforeEach(() => {
    clearDeliveryCompletionSessionForTests();
  });

  it("documents TTDO · ConfirmDelivery Facade · no POD/Billing invent · Card retained", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_006.md"),
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
      resolve(ROOT, "src/delivery-experience/DeliveryCompletionPanel.tsx"),
      "utf8",
    );
    const view = readFileSync(
      resolve(ROOT, "src/delivery-experience/completion-view.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Delivery Completion");
    expect(doc).toContain(
      "Time-to-Understand-Delivery-Outcome (TTDO) < 5 seconds",
    );
    expect(doc).toContain("25–115 s");
    expect(doc).toContain("ConfirmDelivery");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");
    expect(doc).toContain("No changes to Delivery Capability");
    expect(doc).toContain("Billing outcome");

    expect(cards).toContain("006 Delivery Completion");
    expect(cards).toContain("Zero Friction Delivery Completion");
    expect(cards).toContain("Time-to-Understand-Delivery-Outcome <5 s");

    expect(missions).toContain("DELIVERY-EXPERIENCE-006");
    expect(missions).toContain("DE006 Completion ✅");
    expect(missions).toContain("TTDO");

    expect(ui).toContain("DELIVERY EXPERIENCE 006");
    expect(ui).toContain("DeliveryCompletionPanel");
    expect(ui).toContain('mode === "completion"');
    expect(ui).toContain("TTDO < 5 s");
    expect(ui).not.toContain("optimizeRoute");

    expect(panel).toContain("Cierre de entregas");
    expect(panel).toContain("confirmDeliverySupported = true");
    expect(panel).toContain("ConfirmDelivery (Facade)");
    expect(panel).toContain("Billing outcome unavailable in this substrate");
    expect(panel).toContain("Proof of Delivery → Future");
    expect(panel).toContain("Completed in this session");

    expect(view).toContain("markConfirmedInSession");
    expect(view).toContain("ReportDeliveryException");
    expect(view).toContain("billingSupported");
    expect(view).toContain("Billing outcome unavailable in this substrate");
    expect(view).not.toContain("createInvoice");
  });

  it("derives completed / remaining / session unresolved without inventing Billing", () => {
    const remaining = card("o1", "Ana");
    const done = card("o2", "Luis", "Confirmed");
    const view = buildDeliveryCompletionDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [remaining, done],
      assignmentSupported: false,
      confirmDeliverySupported: true,
      emptyReason: null,
    });

    expect(view.confirmDeliverySupported).toBe(true);
    expect(view.billingSupported).toBe(false);
    expect(view.totals.completed).toBe(1);
    expect(view.totals.remaining).toBe(1);
    expect(view.dayCompleteTrustworthy).toBe(false);
    expect(completionStateLabel("remaining")).toBe("Remaining");

    const ana = view.cards.find((c) => c.customerLabel === "Ana");
    expect(ana?.completionState).toBe("remaining");
    expect(ana?.billingOutcomeLabel).toMatch(/unavailable/i);

    markConfirmedInSession(remaining.id);
    const afterConfirm = buildDeliveryCompletionDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [remaining, done],
      assignmentSupported: false,
      confirmDeliverySupported: true,
      emptyReason: null,
    });
    const ana2 = afterConfirm.cards.find((c) => c.customerLabel === "Ana");
    expect(ana2?.completionState).toBe("completed");
    expect(ana2?.completedInSession).toBe(true);
    expect(afterConfirm.dayCompleteTrustworthy).toBe(true);
    expect(afterConfirm.statusSummary).toBe("Delivery day complete");

    clearDeliveryCompletionSessionForTests();
    setSessionUnresolved(
      remaining.id,
      "customer_unavailable",
      "no abre",
    );
    const unresolved = buildDeliveryCompletionDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [remaining, done],
      assignmentSupported: false,
      confirmDeliverySupported: true,
      emptyReason: null,
    });
    expect(
      unresolved.cards.find((c) => c.customerLabel === "Ana")?.completionState,
    ).toBe("failed");
    expect(filterCompletionCards(unresolved.cards, "failed")).toHaveLength(1);

    const csv = deliveryCompletionToCsv(unresolved);
    expect(csv).toContain("completion_state");
    expect(csv).toContain("billing_outcome");
    expect(csv).toContain("customer_unavailable");
  });

  it("refuses day-complete claim on empty untrustworthy list", () => {
    const view = buildDeliveryCompletionDayView({
      dayDate: "2026-08-08",
      dayLabel: "vie 8 ago",
      cards: [],
      assignmentSupported: false,
      confirmDeliverySupported: true,
      emptyReason: "Sin entregas",
    });
    expect(view.dayCompleteTrustworthy).toBe(false);
    expect(view.statusSummary).toBe("Delivery completion status unavailable");
  });
});
