/**
 * ORDER EXPERIENCE 001 · Zero Friction Order Capture (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearOperationalCommitmentsForTests,
  listOperationalCommitments,
  mondayIso,
  saveOperationalCommitment,
  upcomingDeliveryDays,
} from "@/order-experience/operational-commitments";
import {
  CONVERSATION_DISHES,
  customDishId,
} from "@/order-experience/conversation-catalog";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE 001 · Zero Friction Order Capture", () => {
  beforeEach(() => {
    clearOperationalCommitmentsForTests();
  });

  it("documents TTO · conversation · Experience-only · OTS · Card In Progress", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_001.md"),
      "utf8",
    );
    const phase = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_001_PHASE1.md"),
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

    expect(doc).toContain("Zero Friction Order Capture");
    expect(doc).toContain("Time-to-Create Order (TTO) < 45 seconds");
    expect(doc).toContain("Think in conversations");
    expect(doc).toContain("UNIMPLEMENTED");
    expect(doc).toContain("No Capability / Facade / Engine");
    expect(doc).toContain("/admin/order-capture");

    expect(phase).toContain("Phase 1");
    expect(phase).toContain("Operational Time Saved");
    expect(phase).toContain("45–135 s");
    expect(phase).toContain("Evidence collection strategy");
    expect(phase).toContain("Do **not** modify Order Capability");

    expect(cards).toContain("001 Capture");
    expect(cards).toContain("Zero Friction Order Capture");
    expect(cards).toContain("Time-to-Create Order <45 s");
    expect(cards).toContain("002 Search");
    expect(cards).toContain("In Progress");

    expect(missions).toContain("ORDER-EXPERIENCE-004");
    expect(missions).toContain("TTO <45s");
    expect(missions).toContain("order-capture");

    expect(ui).toContain("ORDER EXPERIENCE 001");
    expect(ui).toContain("Zero Friction Order Capture");
    expect(ui).toContain('from "@/order/useOrder"');
    expect(ui).toContain('from "@/customer/useCustomer"');
    expect(ui).toContain("Instrucciones especiales");
    expect(ui).toContain("¿Qué quieres hacer ahora?");
    expect(ui).toContain("saveOperationalCommitment");
    expect(ui).toContain("UNIMPLEMENTED");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/order-intake/);
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);
    expect(ui).not.toMatch(/from ["']@\/order\/OrderFacade/);
  });

  it("keeps conversation catalog + session commitments without Facade writes", () => {
    expect(CONVERSATION_DISHES.length).toBeGreaterThan(3);
    expect(customDishId("Sin gluten bowl")).toContain("exp:custom:");
    expect(upcomingDeliveryDays(5).length).toBe(5);
    expect(mondayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

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
    expect(row.id).toBeTruthy();
    expect(listOperationalCommitments("c1")).toHaveLength(1);
    expect(listOperationalCommitments("c1")[0]?.instructions).toBe("sin cebolla");
  });
});
