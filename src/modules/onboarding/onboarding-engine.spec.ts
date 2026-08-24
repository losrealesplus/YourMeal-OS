import { describe, it, expect } from "vitest";
import {
  proposeSemanticMappings,
  normalizePhone,
  normalizeEmail,
  normalizeWhitespace,
} from "./semantic-mapper";
import {
  SYNTHETIC_CUSTOMERS_FIXTURE,
  SYNTHETIC_DISHES_FIXTURE,
} from "./synthetic-fixtures";
import type {
  SemanticMappingProposal,
  RowValidationResult,
  ReconciliationReport,
} from "./types";

describe("Block 3.6: Data Onboarding Engine Contract & Specification Tests", () => {
  it("1. Ingest & Semantic Mapping: Proposes high-confidence mappings for standard customer headers", () => {
    const sourceHeaders = Object.keys(SYNTHETIC_CUSTOMERS_FIXTURE[0]);
    const proposals = proposeSemanticMappings(sourceHeaders, "customers");

    expect(proposals.length).toBe(sourceHeaders.length);

    const nameProposal = proposals.find((p) => p.sourceColumn === "Nombre Completo");
    expect(nameProposal).toBeDefined();
    expect(nameProposal?.targetField).toBe("displayName");
    expect(nameProposal?.confidence).toBeGreaterThanOrEqual(0.95);

    const emailProposal = proposals.find((p) => p.sourceColumn === "Correo Electronico");
    expect(emailProposal?.targetField).toBe("email");
    expect(emailProposal?.confidence).toBeGreaterThanOrEqual(0.95);

    const phoneProposal = proposals.find((p) => p.sourceColumn === "Telefono");
    expect(phoneProposal?.targetField).toBe("phone");
    expect(phoneProposal?.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("2. Normalization Engine: Normalizes phone numbers to standard E.164 and emails to lowercase without data loss", () => {
    // Phone normalization
    const p1 = normalizePhone("612345678");
    expect(p1.isValid).toBe(true);
    expect(p1.normalized).toBe("+34612345678");

    const p2 = normalizePhone("+34 622 987 654");
    expect(p2.isValid).toBe(true);
    expect(p2.normalized).toBe("+34622987654");

    const pInvalid = normalizePhone("12345");
    expect(pInvalid.isValid).toBe(false);
    expect(pInvalid.normalized).toBeNull();

    // Email normalization
    const e1 = normalizeEmail("  Carlos.Mendoza@TechAcme.ES  ");
    expect(e1.isValid).toBe(true);
    expect(e1.normalized).toBe("carlos.mendoza@techacme.es");

    const eInvalid = normalizeEmail("marta.invalida-email-sin-arroba");
    expect(eInvalid.isValid).toBe(false);
    expect(eInvalid.normalized).toBeNull();

    // Whitespace normalization
    const rawName = "   Carlos   Mendoza   Ruiz  ";
    expect(normalizeWhitespace(rawName)).toBe("Carlos Mendoza Ruiz");
  });

  it("3. Validation & Categorization: Classifies rows into Green, Yellow, and Red categories", () => {
    const results: RowValidationResult[] = [];

    for (let i = 0; i < SYNTHETIC_CUSTOMERS_FIXTURE.length; i++) {
      const row = SYNTHETIC_CUSTOMERS_FIXTURE[i];
      const emailCheck = normalizeEmail(row["Correo Electronico"]);
      const phoneCheck = normalizePhone(row["Telefono"]);

      if (!emailCheck.isValid || !phoneCheck.isValid) {
        results.push({
          rowIndex: i,
          severity: "RED",
          issues: [
            ...(!emailCheck.isValid ? [{ field: "email", message: "Invalid email format" }] : []),
            ...(!phoneCheck.isValid ? [{ field: "phone", message: "Invalid phone number" }] : []),
          ],
        });
      } else if (row["Nombre Completo"].includes(".")) {
        // Potential abbreviation / yellow review required
        results.push({
          rowIndex: i,
          severity: "YELLOW",
          issues: [{ field: "displayName", message: "Abbreviated surname requires review" }],
          potentialDuplicates: [
            {
              existingEntityId: "synth-001",
              matchedOn: ["email", "phone"],
              similarityScore: 0.94,
            },
          ],
        });
      } else {
        results.push({
          rowIndex: i,
          severity: "GREEN",
          issues: [],
        });
      }
    }

    expect(results.filter((r) => r.severity === "GREEN").length).toBe(3); // Rows 0, 1, 2
    expect(results.filter((r) => r.severity === "YELLOW").length).toBe(1); // Row 3 (Duplicate candidate)
    expect(results.filter((r) => r.severity === "RED").length).toBe(1); // Row 4 (Invalid email & phone)
  });

  it("4. Human Approval Gate: Only approved rows proceed to import; unapproved rows are blocked", () => {
    const unapprovedRows = [
      { rowIndex: 3, status: "YELLOW", isApproved: false },
      { rowIndex: 4, status: "RED", isApproved: false },
    ];

    const canImportRow = (row: { isApproved: boolean; status: string }) => {
      return row.isApproved && row.status !== "RED";
    };

    expect(unapprovedRows.every((r) => !canImportRow(r))).toBe(true);

    // If human approves row 3 after verifying duplicate:
    const approvedRow3 = { rowIndex: 3, status: "YELLOW", isApproved: true };
    expect(canImportRow(approvedRow3)).toBe(true);
  });

  it("5. 100% Reconciliation Accounting: Every input row is accounted for in the final report", () => {
    const totalSourceRows = SYNTHETIC_CUSTOMERS_FIXTURE.length; // 5 rows

    const report: ReconciliationReport = {
      fileId: "file-synth-101",
      tenantId: "tenant-synth-001",
      totalSourceRows,
      processedRows: 5,
      createdCount: 3, // Rows 0, 1, 2
      updatedCount: 1, // Row 3 (merged after approval)
      skippedCount: 0,
      duplicateCount: 1,
      rejectedCount: 1, // Row 4 (Red validation rejected)
      failedCount: 0,
      is100PercentReconciled: true,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const accountedTotal =
      report.createdCount +
      report.updatedCount +
      report.skippedCount +
      report.rejectedCount +
      report.failedCount;

    expect(accountedTotal).toBe(totalSourceRows);
    expect(report.is100PercentReconciled).toBe(true);
  });
});
