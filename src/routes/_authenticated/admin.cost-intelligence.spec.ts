import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route } from "./admin.cost-intelligence";

const ROOT = process.cwd();

describe("CR-COST-03 — Cost Intelligence Cockpit (admin.cost-intelligence)", () => {
  it("declares route and correct path configuration", () => {
    expect(Route).toBeDefined();
    expect(Route.options).toBeDefined();
  });

  it("contains operational tabs (Simulator, Anatomy, Scenarios, Decision History, Market Intelligence)", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    expect(src).toContain("Simulador de Escenarios (E9)");
    expect(src).toContain("Anatomía de Costes (Ficha Técnica)");
    expect(src).toContain("Escenarios Guardados");
    expect(src).toContain("Histórico de Decisiones");
  });

  it("integrates preset selector and configurable target margin threshold filter", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    expect(src).toContain("supplier_hike");
    expect(src).toContain("energy_surge");
    expect(src).toContain("labor_escalation");
    expect(src).toContain("item_inflation");
    expect(src).toContain("yield_optimization");
    expect(src).toContain("Margen Objetivo Mínimo");
  });

  it("integrates Record Decision Intent dialog with qualitative rationale", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    expect(src).toContain("Registrar Decisión de Gestión");
    expect(src).toContain("renegotiate_supplier");
    expect(src).toContain("adjust_menu_price");
    expect(src).toContain("reformulate_recipe");
    expect(src).toContain("accept_margin_compression");
  });

  it("D-010: Eliminates all synthetic cost fallbacks and invented overheads", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    // No hardcoded 3.50 fallback
    expect(src).not.toContain("cost || 3.5");
    // No hardcoded 5% waste injection
    expect(src).not.toContain("wastePercentage: 5");
    // No arbitrary + 2.50 addition
    expect(src).not.toContain("+ 2.50");
    expect(src).not.toContain("+ 2.5");
    // No substring matching for annual volume
    expect(src).not.toContain('.includes("pollo") ? 1200');
    expect(src).not.toContain('.includes("aceite") ? 600');
  });

  it("D-010: Implements partial subtotal transparency and provenance distinction", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    // Displays D-010 Subtotal Simulado with dish counts
    expect(src).toContain("Subtotal Simulado");
    expect(src).toContain("simulationResult.summary.calculableProductsCount");
    expect(src).toContain("simulationResult.summary.totalProductsCount");
    expect(src).toContain("No disponible");
    expect(src).toContain("Transparencia de Datos (D-010)");
    expect(src).toContain("FICHA TÉCNICA (CATÁLOGO ACTUAL)");
    expect(src).toContain("Escandallo");
    expect(src).toContain("Coste Manual");
    expect(src).toContain("Incompleto");
    expect(src).toContain("Margen Bruto (D-003)");
    expect(src).toContain("Completar Datos");
  });
});
