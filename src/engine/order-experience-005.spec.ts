/**
 * ORDER EXPERIENCE 005 · Zero Friction Operational Incident (Experience only).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOperationalIncidentsForTests,
  listOperationalIncidents,
  routeOperationalIncident,
  saveOperationalIncident,
  suggestedRoute,
} from "@/order-experience/operational-incidents";

const ROOT = process.cwd();

describe("ORDER EXPERIENCE 005 · Zero Friction Operational Incident", () => {
  beforeEach(() => {
    clearOperationalIncidentsForTests();
  });

  it("documents TTRI · route · Experience-only · Card Frozen · Review", () => {
    const doc = readFileSync(
      resolve(ROOT, "docs/00-status/ORDER_EXPERIENCE_005.md"),
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
      resolve(ROOT, "src/order-experience/OrderIncidentPanel.tsx"),
      "utf8",
    );

    expect(doc).toContain("Zero Friction Operational Incident");
    expect(doc).toContain("Time-to-Record Operational Incident (TTRI) < 30 seconds");
    expect(doc).toContain("Time-to-Route Incident < 10 seconds");
    expect(doc).toContain("30–150 s");
    expect(doc).toContain("No Capability / Facade / Engine");
    expect(doc).toContain("OCC remains **Reserved**");

    expect(cards).toContain("005 Incident");
    expect(cards).toContain("Time-to-Record Operational Incident <30 s");
    expect(cards).toContain("READY WITH IMPROVEMENTS");
    expect(cards).toContain("Journey Certified");

    expect(missions).toContain("ORDER-EXPERIENCE-005");
    expect(missions).toContain("OE005 Incident ✅");
    expect(missions).toContain("ORDER_EXPERIENCE_REVIEW");

    expect(ui).toContain("ORDER EXPERIENCE 005");
    expect(ui).toContain("OrderIncidentPanel");
    expect(ui).toContain("onReportIncident");
    expect(ui).not.toMatch(/from ["']@\/integrations\/supabase/);
    expect(ui).not.toMatch(/from ["']@\/modules\/orders/);

    expect(panel).toContain("Registrar y derivar");
    expect(panel).toContain("suggestedRoute");
    expect(panel).toContain("OCC → Reserved");
    expect(panel).not.toMatch(/from ["']@\/order\/OrderFacade/);
  });

  it("records · suggests route · routes without Facade writes", () => {
    expect(suggestedRoute("allergy_issue")).toBe("kitchen");
    expect(suggestedRoute("delivery_issue")).toBe("delivery");
    expect(suggestedRoute("customer_change")).toBe("customer_service");

    const row = saveOperationalIncident({
      orderRef: "sess_1",
      orderSource: "session",
      customerId: "c1",
      customerName: "Juan",
      deliveryDay: "2026-08-11",
      deliveryArea: "Centro",
      type: "kitchen_issue",
      route: suggestedRoute("kitchen_issue"),
      priority: "high",
      notes: "Sin proteína disponible",
      status: "recorded",
    });
    expect(listOperationalIncidents("sess_1")).toHaveLength(1);
    expect(row.status).toBe("recorded");

    const routed = routeOperationalIncident(row.id, "kitchen");
    expect(routed?.status).toBe("routed");
    expect(routed?.route).toBe("kitchen");
    expect(routed?.routedAt).toBeTruthy();
  });
});
