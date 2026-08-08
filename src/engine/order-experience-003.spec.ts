/**
 * ORDER EXPERIENCE 003 · Zero Friction Order Edit (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOperationalCommitmentsForTests,
  saveOperationalCommitment,
  updateOperationalCommitment,
} from "@/order-experience/operational-commitments";
import {
  clearOrderEditsForTests,
  facadeEditKey,
  getOrderEdit,
  saveOrderEdit,
} from "@/order-experience/operational-order-edits";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE 003 · Zero Friction Order Edit", () => {
  beforeEach(() => {
    clearOperationalCommitmentsForTests();
    clearOrderEditsForTests();
  });

  it("documents TTEO · resume · honesty · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_003.md"),
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
      resolve(ROOT, "src/order-experience/OrderEditPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Order Edit");
    expect(doc).toContain("Time-to-Edit Order (TTEO) < 20 seconds");
    expect(doc).toContain("Time-to-Resume Operation < 5 seconds");
    expect(doc).toContain("20–70 s");
    expect(doc).toContain("UpdateOrder");
    expect(doc).toContain("No Capability / Facade / Engine changes");

    expect(cards).toContain("003 Edit");
    expect(cards).toContain("Zero Friction Order Edit");
    expect(cards).toContain("Time-to-Edit Order <20 s");
    expect(cards).toContain("READY WITH IMPROVEMENTS");

    expect(missions).toContain("ORDER-EXPERIENCE-005");
    expect(missions).toContain("ORDER_EXPERIENCE_REVIEW");
    expect(missions).toContain("TTEO <20s");

    expect(ui).toContain("ORDER EXPERIENCE 003");
    expect(ui).toContain("OrderEditPanel");
    expect(ui).toContain('from "@/order/useOrder"');
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);

    expect(panel).toContain("Corregir compromiso");
    expect(panel).toContain("saveOrderEdit");
    expect(panel).toContain("updateOperationalCommitment");
    expect(panel).toContain("Volver a búsqueda");
    expect(panel).not.toMatch(/from ["']@\/order\/OrderFacade/);
  });

  it("updates session commitments and facade overlays without Facade writes", () => {
    const row = saveOperationalCommitment({
      customerId: "c1",
      customerKind: "individual",
      customerName: "Juan",
      deliveryDay: "2026-08-10",
      weekStart: "2026-08-10",
      items: [{ dishId: "exp:poke-salmon", label: "Poke salmón", qty: 2 }],
      instructions: "sin cebolla",
      channel: "phone",
      persistence: "experience_session",
      facadeOrderId: null,
    });
    const updated = updateOperationalCommitment(row.id, {
      instructions: "sin cebolla · sin picante",
      items: [{ dishId: "exp:poke-salmon", label: "Poke salmón", qty: 3 }],
    });
    expect(updated?.instructions).toContain("picante");
    expect(updated?.items[0]?.qty).toBe(3);

    const key = facadeEditKey("order-99");
    saveOrderEdit(key, {
      deliveryDay: "2026-08-12",
      instructions: "dejar en recepción",
    });
    expect(getOrderEdit(key)?.deliveryDay).toBe("2026-08-12");
  });
});
