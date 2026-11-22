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
    expect(src).toContain("Procesada / WAC");
    expect(src).toContain("allocationMethod");
    expect(src).toContain("+ Servicio");
    expect(src).toContain("draftInvoiceId");
    expect(src).toContain("createInitialLineItem");
    expect(src).toContain("lineId");
    expect(src).toContain("EXPENSE_SERVICE");
  });

  it("contains assisted document upload action and D-010 integrity handling (CR-COST-05 Bloque 1)", () => {
    const src = readFileSync(
      resolve(ROOT, "src/routes/_authenticated/admin.purchasing.tsx"),
      "utf8",
    );

    // 1. Assisted upload action buttons and dialog
    expect(src).toContain("Cargar Factura desde Documento");
    expect(src).toContain("Carga Asistida de Factura o Albarán");
    expect(src).toContain("extractPurchasingDraftFromDocument");

    // 2. Multi-format support (.pdf, images, csv/tsv/txt)
    expect(src).toContain(".pdf,image/png,image/jpeg,image/webp,.csv,.tsv,.txt");

    // 3. D-010 Anti-hallucination governance notices
    expect(src).toContain("Control de Integridad D-010 (Anti-Alucinación)");
    expect(src).toContain("d010Notice");
    expect(src).toContain("docSummary");
    expect(src).toContain("líneas válidas");
    expect(src).toContain("en cuarentena");

    // 4. Invoices are created strictly in DRAFT state for human review
    expect(src).toContain("Crear Factura Borrador (DRAFT)");
    expect(src).toContain("en estado Borrador (DRAFT)");
    expect(src).toContain("revisión humana soberana");
  });
});
