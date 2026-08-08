/**
 * ORDER EXPERIENCE 004 · Zero Friction Order Templates (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOrderTemplatesForTests,
  deleteOrderTemplate,
  listOrderTemplates,
  markTemplateUsed,
  saveOrderTemplate,
  templateSummary,
} from "@/order-experience/order-templates";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE 004 · Zero Friction Order Templates", () => {
  beforeEach(() => {
    clearOrderTemplatesForTests();
  });

  it("documents frequent-order KPI · flexibility · Experience-only", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_004.md"),
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
      resolve(ROOT, "src/order-experience/OrderTemplatesPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Order Templates");
    expect(doc).toContain("Time-to-Create a Frequent Order < 20 seconds");
    expect(doc).toContain("Time-to-Reuse an Existing Pattern < 10 seconds");
    expect(doc).toContain("25–100 s");
    expect(doc).toContain("flexible starting points");
    expect(doc).toContain("No Capability / Facade / Engine");

    expect(cards).toContain("004 Templates");
    expect(cards).toContain("Zero Friction Order Templates");
    expect(cards).toContain("Time-to-Create a Frequent Order <20 s");
    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("Frozen");

    expect(missions).toContain("ORDER-EXPERIENCE-005");
    expect(missions).toContain("OE004 Templates ✅");
    expect(missions).toContain("OE005 Incident ✅");

    expect(ui).toContain("ORDER EXPERIENCE 004");
    expect(ui).toContain("OrderTemplatesPanel");
    expect(ui).toContain("saveOrderTemplate");
    expect(ui).toContain("Guardar como plantilla");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);

    expect(panel).toContain("Plantillas operativas");
    expect(panel).toContain("Aplicar");
    expect(panel).toContain("Editar antes de confirmar");
  });

  it("saves · reuses · deletes templates without Facade writes", () => {
    const t = saveOrderTemplate({
      name: "Juan · poke",
      customerId: "c1",
      customerKind: "individual",
      customerName: "Juan",
      preferredDeliveryDay: "2026-08-11",
      items: [{ dishId: "exp:poke-salmon", label: "Poke salmón", qty: 2 }],
      instructions: "sin cebolla",
      source: "from_order",
    });
    expect(listOrderTemplates("c1")).toHaveLength(1);
    expect(templateSummary(t)).toContain("Poke");
    markTemplateUsed(t.id);
    expect(listOrderTemplates("c1")[0]?.useCount).toBe(1);
    expect(deleteOrderTemplate(t.id)).toBe(true);
    expect(listOrderTemplates()).toHaveLength(0);
  });
});
