/**
 * DELIVERY EXPERIENCE 002 · Zero Friction Delivery Search (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryAssignment } from "@/delivery/DeliveryContext";
import {
  clearDeliveryRecentForTests,
  rememberDeliveryAccess,
  searchDeliveries,
} from "@/delivery-experience/delivery-search-rank";
import {
  mapAssignmentToCard,
  type DeliveryDayCard,
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

function cardFor(
  commitmentRef: string,
  customer: string,
  extras: Partial<OrderSummary> = {},
): DeliveryDayCard {
  return mapAssignmentToCard(
    assignment({
      commitmentRef,
      destinationLabel: customer,
      status: "Planned",
    }),
    {
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
        ...extras,
      },
      assignmentSupported: false,
    },
  );
}

describe("DELIVERY EXPERIENCE 002 · Zero Friction Delivery Search", () => {
  beforeEach(() => {
    clearDeliveryRecentForTests();
  });

  it("documents TTFD · delivery-only search · Experience-only · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/DELIVERY_EXPERIENCE_002.md"),
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
      resolve(ROOT, "src/delivery-experience/DeliverySearchPanel.tsx"),
      "utf8",
    );
    const rank = readFileSync(
      resolve(ROOT, "src/delivery-experience/delivery-search-rank.ts"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Delivery Search");
    expect(doc).toContain("Time-to-Find-Delivery (TTFD) < 10 seconds");
    expect(doc).toContain("20–80 s");
    expect(doc).toContain("No Delivery / Order / Customer Capability");
    expect(doc).toContain("does not become");
    expect(doc).toContain("Estimated");
    expect(doc).toContain("Measured Time Saved");

    expect(cards).toContain("002 Delivery Search");
    expect(cards).toContain("Zero Friction Delivery Search");
    expect(cards).toContain("Time-to-Find-Delivery <10 s");

    expect(missions).toContain("DELIVERY-EXPERIENCE-002");
    expect(missions).toContain("DE002 Search ▶");
    expect(missions).toContain("TTFD");

    expect(ui).toContain("DELIVERY EXPERIENCE 002");
    expect(ui).toContain("DeliverySearchPanel");
    expect(ui).toContain('mode === "search"');
    expect(ui).toContain("TTFD < 10 s");
    expect(ui).not.toMatch(/from ["']@\/modules\/operations/);
    expect(ui).not.toMatch(/from ["']@\/modules\/delivery/);
    expect(ui).not.toContain("confirmDelivery");
    expect(ui).not.toContain("optimizeRoute");

    expect(panel).toContain("Buscar entregas");
    expect(panel).toContain("Volver a Today's Deliveries");
    expect(panel).toContain("No hay entregas que coincidan");
    expect(panel).toContain("Build route / Navigate / Confirm → Future");
    expect(panel).toContain("no disponible en este substrate");
    expect(panel).not.toContain("confirmDelivery(");

    expect(rank).toContain("rememberDeliveryAccess");
    expect(rank).toContain("cliente");
    expect(rank).toContain("zona");
    expect(rank).not.toContain("optimizeRoute");
  });

  it("ranks customer matches and remembers recent access within day workload", () => {
    const cards = [
      cardFor("o-ana", "Ana Pérez"),
      cardFor("o-bruno", "Bruno López"),
      cardFor("o-carla", "Carla Ruiz"),
    ];

    const byName = searchDeliveries(cards, "bruno", "2026-08-08");
    expect(byName.length).toBeGreaterThanOrEqual(1);
    expect(byName[0]?.customerLabel).toMatch(/Bruno/);
    expect(byName[0]?.matchHints).toContain("cliente");

    const byOrder = searchDeliveries(cards, "o-carla", "2026-08-08");
    expect(byOrder[0]?.orderRef).toBe("o-carla");

    rememberDeliveryAccess(cards[1]!.id);
    const browse = searchDeliveries(cards, "", "2026-08-08");
    expect(browse.map((h) => h.id)).toContain(cards[1]!.id);
    const bruno = browse.find((h) => h.id === cards[1]!.id);
    const ana = browse.find((h) => h.id === cards[0]!.id);
    expect(bruno!.score).toBeGreaterThan(ana!.score - 1);

    const none = searchDeliveries(cards, "zzzz-no-match", "2026-08-08");
    expect(none).toHaveLength(0);
  });

  it("does not invent driver hits when assignment substrate is absent", () => {
    const cards = [cardFor("o1", "Ana")];
    expect(cards[0]?.driverLabel).toBeNull();
    const hits = searchDeliveries(cards, "conductor-fantasma", "2026-08-08");
    expect(hits).toHaveLength(0);
  });
});
