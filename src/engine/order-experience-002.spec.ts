/**
 * ORDER EXPERIENCE 002 · Zero Friction Order Search (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  rankOrderHits,
  scoreOrderHit,
  statusLabel,
} from "@/order-experience/order-search-rank";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE 002 · Zero Friction Order Search", () => {
  it("documents TTFO · lifecycle · Order roadmap · Experience-only", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_002.md"),
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
    const ui = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.order-capture.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(ROOT, "src/order-experience/OrderSearchPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Order Search");
    expect(doc).toContain("Time-to-Find Order (TTFO) < 10 seconds");
    expect(doc).toContain("20–50 s");
    expect(doc).toContain("Order Templates");
    expect(doc).toContain("Operational Incident");
    expect(doc).toContain("No Capability / Facade / Engine changes");

    expect(lifecycle).toContain("EXPERIENCE LIFECYCLE");
    expect(lifecycle).toContain("Observation Sprint");
    expect(lifecycle).toContain("Operational Accelerators");
    expect(lifecycle).toContain("OE004");
    expect(lifecycle).toContain("Order Templates");

    expect(cards).toContain("002 Search");
    expect(cards).toContain("Time-to-Find Order <10 s");
    expect(cards).toContain("Order Templates");
    expect(cards).toContain("Operational Incident");

    expect(missions).toContain("ORDER-EXPERIENCE-005");
    expect(missions).toContain("TTFO <10s");
    expect(missions).toContain("EXPERIENCE_LIFECYCLE");

    expect(ui).toContain("ORDER EXPERIENCE 002");
    expect(ui).toContain("OrderSearchPanel");
    expect(ui).toContain('from "@/order/useOrder"');
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);

    expect(panel).toContain("Buscar pedido");
    expect(panel).toContain("rankOrderHits");
    expect(panel).toContain("listOperationalCommitments");
    expect(panel).toContain("Crear pedido");
    expect(panel).not.toMatch(/from ["']@\/integrations\/supabase/);
  });

  it("ranks people and pending delivery above weak matches", () => {
    const hits = [
      {
        id: "1",
        customerName: "Empresa Juan",
        deliveryDay: "2026-08-10",
        status: "delivered" as const,
        itemCount: 1,
        hasInstructions: false,
        source: "facade" as const,
      },
      {
        id: "2",
        customerName: "Juan Pérez",
        phone: "+34622111222",
        deliveryDay: "2026-08-11",
        status: "ready_for_delivery" as const,
        itemCount: 3,
        hasInstructions: true,
        source: "facade" as const,
      },
      {
        id: "3",
        customerName: "María",
        deliveryDay: "2026-08-12",
        status: "session_commitment" as const,
        itemCount: 2,
        hasInstructions: false,
        source: "session" as const,
      },
    ];

    const byName = rankOrderHits(hits, "Juan Pérez");
    expect(byName[0]?.id).toBe("2");

    const byPhone = rankOrderHits(hits, "622111");
    expect(byPhone[0]?.id).toBe("2");

    expect(scoreOrderHit(hits[1]!, "")).toBeGreaterThan(
      scoreOrderHit(hits[0]!, ""),
    );
    expect(statusLabel("ready_for_delivery")).toBe("Listo reparto");
  });
});
