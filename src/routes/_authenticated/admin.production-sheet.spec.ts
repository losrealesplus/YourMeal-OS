import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Route } from "./admin.production-sheet";

const ROOT = process.cwd();

describe("OPS-01 G6 — Production & Packing Sheet (admin.production-sheet)", () => {
  it("validates search parameters correctly", () => {
    const validate = Route.options.validateSearch as (s: Record<string, unknown>) => {
      date?: string;
    };

    expect(validate({})).toEqual({ date: undefined });
    expect(validate({ date: "2026-09-24" })).toEqual({ date: "2026-09-24" });
  });

  it("contains 2-level operational tabs (P1 Cocina, P2 Packing por Cliente, P2 Packing por Plato)", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.production-sheet.tsx"),
      "utf8",
    );

    expect(src).toContain("p1_kitchen");
    expect(src).toContain("p2_packing_client");
    expect(src).toContain("p2_packing_dish");
    expect(src).toContain("P1 · Cocina & Marmitas");
    expect(src).toContain("P2 · Packing por Cliente");
    expect(src).toContain("P2 · Packing por Plato");
  });

  it("contains printable 2-level physical sheet format with page breaks", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.production-sheet.tsx"),
      "utf8",
    );

    expect(src).toContain("HOJA DE PRODUCCIÓN (P1)");
    expect(src).toContain("HOJA DE PACKING POR CLIENTE (P2)");
    expect(src).toContain("page-break");
    expect(src).toContain("Modificaciones Culinarias y Alérgenos por Cliente");
  });
});
