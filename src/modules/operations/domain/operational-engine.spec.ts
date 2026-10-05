import { describe, expect, it } from "vitest";
import {
  getOperationalToday,
  resolveTemporalMode,
  normalizeOperationalOrders,
  extractCriticalSafetyAllergens,
} from "./operational-date-resolver";
import { buildKitchenProductionSheet } from "./production-kitchen-engine";
import { buildPackingHierarchySheet } from "./packing-hierarchy-engine";
import {
  canonicalSerialize,
  generateVersionMetadata,
  detectDrift,
  sortLinesCanonically,
} from "./operational-version-manager";
import {
  buildFlatAnalyticMatrix,
  exportToCSV,
  buildThermalLabels,
  CANONICAL_EXCEL_HEADERS,
} from "./operational-sheet-exporter";
import type { OperationalOrderListItem } from "../infrastructure/operations-repository";
import type { NormalizedOperationalLine } from "./operational-engine-types";

describe("CR-OPS-07: Operational Engine Specification", () => {
  const mockDishMeta = new Map([
    ["dish-1", { allergens: ["gluten", "milk"], prepMinutes: 20, weightG: 450 }],
    ["dish-2", { allergens: ["fish"], prepMinutes: 15, weightG: 400 }],
  ]);

  const mockOrders: OperationalOrderListItem[] = [
    {
      id: "ord-1",
      tenantId: "t-1",
      status: "confirmed",
      weekStart: "2026-10-05",
      notes: null,
      total: 25.0,
      createdAt: "2026-10-01T10:00:00Z",
      demandChannel: "company",
      customerId: "cust-1",
      customerName: "Juan Pérez",
      customerEmail: "juan@example.com",
      companyId: "comp-1",
      companyName: "DISA Finanzas",
      siteId: "site-1",
      siteName: "Finanzas 1B",
      siteAddress: "Av. Las Américas 5, Adeje",
      organizationalUnitId: "unit-1",
      organizationalUnitName: "General",
      deliveryGroupId: "grp-1",
      deliveryGroupName: "Ruta Sur",
      deliveryDates: ["2026-10-07"],
      dietarySnapshot: {
        capturedAt: "2026-10-01T10:00:00Z",
        allergens: ["gluten"],
        customAllergens: [],
        restrictions: ["celiac"],
        preferences: [],
        dietaryNotes: "Alérgico al gluten severo",
        isOverride: false,
      },
      items: [
        {
          id: "item-1",
          dishId: "dish-1",
          dishName: "Pollo con salsa cremosa",
          dayDate: "2026-10-07",
          qty: 2,
          notes: "Sin cebolla",
        },
      ],
    },
    {
      id: "ord-2",
      tenantId: "t-1",
      status: "confirmed",
      weekStart: "2026-10-05",
      notes: null,
      total: 12.5,
      createdAt: "2026-10-01T11:00:00Z",
      demandChannel: "individual",
      customerId: "cust-2",
      customerName: "María González",
      customerEmail: "maria@example.com",
      companyId: null,
      companyName: null,
      siteId: null,
      siteName: null,
      siteAddress: "Calle Grande 12, Adeje",
      organizationalUnitId: null,
      organizationalUnitName: null,
      deliveryGroupId: null,
      deliveryGroupName: null,
      deliveryDates: ["2026-10-07"],
      dietarySnapshot: {
        capturedAt: "2026-10-01T11:00:00Z",
        allergens: [],
        customAllergens: [],
        restrictions: [],
        preferences: ["vegano"],
        dietaryNotes: null,
        isOverride: false,
      },
      items: [
        {
          id: "item-2",
          dishId: "dish-1",
          dishName: "Pollo con salsa cremosa",
          dayDate: "2026-10-07",
          qty: 1,
          notes: null,
        },
      ],
    },
  ];

  describe("1. OperationalDateResolver", () => {
    it("resolves operational today in Europe/Madrid timezone", () => {
      const today = getOperationalToday("Europe/Madrid");
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("correctly identifies historical vs present vs future dates", () => {
      expect(resolveTemporalMode("2020-01-01")).toBe("historical");
      expect(resolveTemporalMode("2099-01-01")).toBe("future");
    });

    it("normalizes multi-qty items into individual portion lines", () => {
      const { lines, resolutionStatus } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      expect(lines).toHaveLength(3); // 2 from ord-1 + 1 from ord-2
      expect(resolutionStatus).toBe("COMPLETE");
      expect(lines[0].identity.portionIndex).toBe(0);
      expect(lines[1].identity.portionIndex).toBe(1);
    });

    it("flags INCOMPLETE_SNAPSHOT if historical order lacks dietary snapshot", () => {
      const historicalOrders = [
        {
          ...mockOrders[0],
          dietarySnapshot: null,
        },
      ];

      const { resolutionStatus, warnings } = normalizeOperationalOrders({
        orders: historicalOrders,
        targetDate: "2026-10-07",
        temporalMode: "historical",
      });

      expect(resolutionStatus).toBe("INCOMPLETE_SNAPSHOT");
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe("2. ProductionKitchenEngine (P1 Cocina)", () => {
    it("segregates critical allergens (🔴) from modifications (🟡) and standard portions", async () => {
      const { lines, resolutionStatus } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const version = await generateVersionMetadata({
        targetDate: "2026-10-07",
        lines,
      });

      const sheet = buildKitchenProductionSheet({
        lines,
        targetDate: "2026-10-07",
        temporalMode: "future",
        resolutionStatus,
        versionMetadata: version,
      });

      expect(sheet.dishes).toHaveLength(1);
      const dish = sheet.dishes[0];
      expect(dish.totalQty).toBe(3);

      // Juan has gluten allergy and dish has gluten -> 2 portions critical_allergy
      expect(dish.safetyAllergyPortionsCount).toBe(2);
      expect(dish.standardPortionsCount).toBe(1);
      expect(sheet.safetySummary.totalAllergyAlertCount).toBe(2);

      const criticalVariant = dish.variants.find((v) => v.severity === "critical_allergy");
      expect(criticalVariant).toBeDefined();
      expect(criticalVariant?.variantLabel).toContain("🔴 ALERTA: GLUTEN");
    });
  });

  describe("3. PackingHierarchyEngine (P2 Packing)", () => {
    it("constructs the 6-level hierarchy (Municipio -> Canal -> Empresa -> Sede -> Unidad -> Cliente)", async () => {
      const { lines, resolutionStatus } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const version = await generateVersionMetadata({
        targetDate: "2026-10-07",
        lines,
      });

      const packingSheet = buildPackingHierarchySheet({
        lines,
        targetDate: "2026-10-07",
        temporalMode: "future",
        resolutionStatus,
        versionMetadata: version,
      });

      expect(packingSheet.municipalities).toHaveLength(1);
      const muni = packingSheet.municipalities[0];
      expect(muni.municipality).toBe("Adeje");

      // B2C
      expect(muni.b2cIndividuals).toHaveLength(1);
      expect(muni.b2cIndividuals[0].customerName).toBe("María González");

      // B2B
      expect(muni.b2bCompanies).toHaveLength(1);
      const comp = muni.b2bCompanies[0];
      expect(comp.companyName).toBe("DISA Finanzas");
      expect(comp.sites[0].siteName).toBe("Finanzas 1B");
      expect(comp.sites[0].units[0].unitName).toBe("General");
      expect(comp.sites[0].units[0].customers[0].customerName).toBe("Juan Pérez");
    });
  });

  describe("4. VersionManager & DriftDetector", () => {
    it("produces deterministic fingerprints regardless of initial array ordering", async () => {
      const { lines } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const reversed = [...lines].reverse();
      const v1 = await generateVersionMetadata({ targetDate: "2026-10-07", lines });
      const v2 = await generateVersionMetadata({ targetDate: "2026-10-07", lines: reversed });

      expect(v1.planningFingerprint).toBe(v2.planningFingerprint);
      expect(v1.versionId).toBe(v2.versionId);
    });

    it("detects granular semantic drift when a new order is added", async () => {
      const { lines: baseLines } = normalizeOperationalOrders({
        orders: [mockOrders[0]],
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const { lines: liveLines } = normalizeOperationalOrders({
        orders: mockOrders, // has ord-1 and ord-2
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const baseVersion = await generateVersionMetadata({
        targetDate: "2026-10-07",
        lines: baseLines,
      });
      const liveVersion = await generateVersionMetadata({
        targetDate: "2026-10-07",
        lines: liveLines,
      });

      const drift = detectDrift({
        baseVersion,
        baseLines,
        currentLiveVersion: liveVersion,
        currentLiveLines: liveLines,
      });

      expect(drift.hasDrift).toBe(true);
      expect(drift.deltaSummary.addedOrdersCount).toBe(1);
      expect(drift.deltaSummary.addedPortionsCount).toBe(1);
      expect(drift.addedLines).toHaveLength(1);
      expect(drift.addedLines[0].customerName).toBe("María González");
    });
  });

  describe("5. OperationalSheetExporter", () => {
    it("generates a canonical 17-column unmerged matrix and valid CSV output", () => {
      const { lines } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const matrix = buildFlatAnalyticMatrix(lines);
      expect(matrix).toHaveLength(3);
      expect(Object.keys(matrix[0])).toHaveLength(17);

      const csv = exportToCSV(matrix);
      expect(csv).toContain(CANONICAL_EXCEL_HEADERS.join(","));
      expect(csv).toContain("DISA Finanzas");
      expect(csv).toContain("🔴 GLUTEN");
    });

    it("generates thermal label models with valid barcode keys", () => {
      const { lines } = normalizeOperationalOrders({
        orders: mockOrders,
        targetDate: "2026-10-07",
        temporalMode: "future",
        dishMetaMap: mockDishMeta,
      });

      const labels = buildThermalLabels(lines);
      expect(labels).toHaveLength(3);
      expect(labels[0].barcodeKey).toContain("ord-1:item-1:1");
      expect(labels[1].barcodeKey).toContain("ord-1:item-1:2");
      expect(labels[0].safetyTag).toContain("🔴 ALERGIA: GLUTEN");
    });
  });
});
