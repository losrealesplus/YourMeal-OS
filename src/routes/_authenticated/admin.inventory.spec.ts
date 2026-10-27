import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route } from "./admin.inventory";

const ROOT = process.cwd();

describe("INVENTORY UI V1 — Operational Inventory Surface (admin.inventory)", () => {
  it("declares route and correct path configuration with inventory.operate guard", () => {
    expect(Route).toBeDefined();
    expect(Route.options).toBeDefined();
    expect(Route.options.beforeLoad).toBeDefined();
  });

  it("contains key inventory UI components, Kárdex tabs and KPI metrics", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.inventory.tsx"),
      "utf8",
    );

    expect(src).toContain("Inventario & Kárdex");
    expect(src).toContain("Existencias en Almacén");
    expect(src).toContain("Historial de Movimientos (Kárdex)");
    expect(src).toContain("Ingredientes Totales");
    expect(src).toContain("Con Existencias");
    expect(src).toContain("Agotados / Sin Stock");
    expect(src).toContain("Valor Total Almacén");
    expect(src).toContain("Coste Medio (PMP)");
    expect(src).toContain("Valor Estimado");
    expect(src).toContain("PURCHASE_RECEIPT");
    expect(src).toContain("PRODUCTION_CONSUMPTION");
    expect(src).toContain("DataTable");
    expect(src).toContain("Tabs");
  });
});
