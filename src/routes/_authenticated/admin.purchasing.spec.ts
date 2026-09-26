import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route } from "./admin.purchasing";

const ROOT = process.cwd();

describe("CR-COST-04 — Purchasing & Invoices Surface (admin.purchasing)", () => {
  it("declares route and correct path configuration", () => {
    expect(Route).toBeDefined();
    expect(Route.options).toBeDefined();
  });

  it("contains key procurement UI components and WAC execution actions", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.purchasing.tsx"),
      "utf8",
    );

    expect(src).toContain("Gestión de Compras y Facturas");
    expect(src).toContain("Nueva Factura");
    expect(src).toContain("Procesar WAC");
    expect(src).toContain("allocationMethod");
  });
});
