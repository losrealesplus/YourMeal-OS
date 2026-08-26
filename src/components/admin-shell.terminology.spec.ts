import { describe, expect, it } from "vitest";
import esAdmin from "@/i18n/locales/es/admin";
import enAdmin from "@/i18n/locales/en/admin";

describe("Operational UX Terminology Invariants (PRODUCT RULES)", () => {
  it("Spanish navigation labels do NOT leak internal architecture terminology", () => {
    const nav = esAdmin.ops.nav;
    const values = Object.values(nav);

    // Banned technical jargon in UI
    const bannedJargon = [
      "Workspace",
      "Experience",
      "Domain",
      "Capability",
      "Core Object",
      "TTO",
      "TTRI",
      "TTE",
      "Zero Friction",
      "read",
      "write",
      "create",
      "update",
      "archive",
    ];

    for (const val of values) {
      for (const banned of bannedJargon) {
        expect(val).not.toContain(banned);
      }
    }

    // Canonical label assertions
    expect(nav.customers).toBe("Clientes");
    expect(nav.customerWorkspace).toBe("Clientes");
    expect(nav.orders).toBe("Pedidos");
    expect(nav.orderWorkspace).toBe("Pedidos");
    expect(nav.kitchen).toBe("Cocina");
    expect(nav.kitchenWorkspace).toBe("Cocina");
    expect(nav.delivery).toBe("Reparto");
    expect(nav.deliveryWorkspace).toBe("Reparto");
    expect(nav.productionWorkspace).toBe("Producción");
    expect(nav.companyClients).toBe("Empresas");
    expect(nav.commercial).toBe("Resumen comercial");
    expect(nav.support).toBe("Atención al cliente");

    // Top-level keys
    expect(esAdmin.commercial).toBe("Resumen comercial");
    expect(esAdmin.dishes).toBe("Platos");
    expect(esAdmin.support).toBe("Atención al cliente");
    expect(esAdmin.branding).toBe("Marca");
    expect(esAdmin.menus).toBe("Menús");
    expect(esAdmin.kitchen).toBe("Cocina");
    expect(esAdmin.accounting).toBe("Facturación");
  });

  it("English navigation labels do NOT leak internal architecture terminology", () => {
    const nav = enAdmin.ops.nav;
    const values = Object.values(nav);

    const bannedJargon = [
      "Workspace",
      "Experience",
      "Domain",
      "Capability",
      "Core Object",
      "Zero Friction",
    ];

    for (const val of values) {
      for (const banned of bannedJargon) {
        expect(val).not.toContain(banned);
      }
    }

    expect(nav.customers).toBe("Customers");
    expect(nav.customerWorkspace).toBe("Customers");
    expect(nav.orders).toBe("Orders");
    expect(nav.orderWorkspace).toBe("Orders");
    expect(nav.kitchen).toBe("Kitchen");
    expect(nav.kitchenWorkspace).toBe("Kitchen");
    expect(nav.delivery).toBe("Delivery");
    expect(nav.deliveryWorkspace).toBe("Delivery");
    expect(nav.productionWorkspace).toBe("Production");
    expect(nav.companyClients).toBe("Companies");
    expect(nav.commercial).toBe("Commercial summary");
    expect(nav.support).toBe("Customer support");

    // Top-level keys
    expect(enAdmin.commercial).toBe("Commercial summary");
    expect(enAdmin.dishes).toBe("Dishes");
    expect(enAdmin.support).toBe("Customer support");
    expect(enAdmin.branding).toBe("Branding");
    expect(enAdmin.menus).toBe("Menus");
    expect(enAdmin.kitchen).toBe("Kitchen");
    expect(enAdmin.accounting).toBe("Accounting");
  });
});
