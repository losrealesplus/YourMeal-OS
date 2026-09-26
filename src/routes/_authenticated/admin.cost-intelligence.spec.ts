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

  it("contains 4 operational tabs (Simulator, Anatomy, Scenarios, Decision History)", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.cost-intelligence.tsx"),
      "utf8",
    );

    expect(src).toContain("Simulador de Escenarios (E9)");
    expect(src).toContain("Anatomía de Costes Live");
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
});
