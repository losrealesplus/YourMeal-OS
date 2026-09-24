import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("CR-OPS-01.1 — Centro de Operaciones Hub (admin.index)", () => {
  it("contains unified hub layout with Today & Monthly Planning tabs", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.index.tsx"),
      "utf8",
    );

    expect(src).toContain("Centro de Operaciones");
    expect(src).toContain('value="hoy"');
    expect(src).toContain('value="planificacion"');
    expect(src).toContain("Agenda de Hoy");
    expect(src).toContain("Planificación Mensual");
  });

  it("integrates MonthlyOperationsCalendar with date selection connected to UniversalOrderIntakeDrawer", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.index.tsx"),
      "utf8",
    );

    expect(src).toContain("MonthlyOperationsCalendar");
    expect(src).toContain("UniversalOrderIntakeDrawer");
    expect(src).toContain("onSelectDate=");
    expect(src).toContain("initialDayDate={intakeDate}");
  });

  it("contains prominent Quick Actions Bar for instant intake and production sheet", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.index.tsx"),
      "utf8",
    );

    expect(src).toContain("Nuevo Pedido");
    expect(src).toContain("Hoja de Producción");
    expect(src).toContain("Clientes");
    expect(src).toContain("/admin/production-sheet");
    expect(src).toContain("/admin/customers");
  });
});
