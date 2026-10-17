import { describe, expect, it } from "vitest";
import {
  canonicalOrderCommandSchema,
  type CanonicalOrderCommand,
} from "@/modules/orders/domain/canonical-order-write";
import {
  readOrderItem,
  type OrderItemReadRow,
  type OrderItemReadModel,
} from "@/modules/orders/domain/order-item-read-model";
import { normalizeOperationalOrders } from "../domain/operational-date-resolver";
import { buildKitchenProductionSheet } from "../domain/production-kitchen-engine";
import { buildPackingHierarchySheet } from "../domain/packing-hierarchy-engine";
import { buildProductionReport } from "../domain/production-report";
import {
  buildFlatAnalyticMatrix,
  buildThermalLabels,
  exportToCSV,
} from "../domain/operational-sheet-exporter";
import { generateVersionMetadata } from "../domain/operational-version-manager";
import type { OperationalOrderListItem } from "../infrastructure/operations-repository";

describe("P1 End-to-End Operational Flow (Synthetic Isolated Test)", () => {
  const tenantId = "10000000-0000-4000-8000-000000000001";
  const customerId = "30000000-0000-4000-8000-000000000001";
  const orderId = "b84acba6-0c1b-492e-99dd-261bb0452c61";
  const deliveryDate = "2026-10-19";
  const weekStart = "2026-10-19";

  const weeklyDishId = "40000000-0000-4000-8000-000000000001";
  const catalogDishId = "40000000-0000-4000-8000-000000000002";
  const customItemId = "80000000-0000-4000-8000-000000000001";

  // 1. CANONICAL INTAKE PAYLOAD (Validates P1 Universal Intake schema)
  const canonicalCommand: CanonicalOrderCommand = {
    operation: "capture",
    weekStart,
    demandChannel: "individual",
    customer: { kind: "existing", id: customerId },
    orderNotes: "Entrega urgente de mañana",
    lines: [
      // Line A: Weekly menu dish
      {
        kind: "dish",
        dishId: weeklyDishId,
        dayDate: deliveryDate,
        qty: 2,
        comment: null,
      },
      // Line B: Off-menu catalog dish with price override & note
      {
        kind: "dish",
        dishId: catalogDishId,
        dayDate: deliveryDate,
        qty: 1,
        isOffMenu: true,
        unitPriceOverride: "13.00",
        unitPriceOverrideReason: "Precio especial fuera de menú",
        comment: "Poco hecho",
      },
      // Line C: Custom preparation (preparación libre)
      {
        kind: "custom",
        name: "Tortilla de claras con espinacas y pavo",
        description: "Preparación especial sin sal",
        dayDate: deliveryDate,
        qty: 3,
        unitPrice: "10.50",
        comment: "Sin sal añadida",
      },
    ],
  };

  it("validates canonical order intake command without schema violations", () => {
    const parsed = canonicalOrderCommandSchema.parse(canonicalCommand);
    expect(parsed.lines).toHaveLength(3);
    expect(parsed.lines[0].kind).toBe("dish");
    expect(parsed.lines[1].kind).toBe("dish");
    expect(parsed.lines[2].kind).toBe("custom");
  });

  // 2. SIMULATED DB ROWS (as written by canonical writer)
  const dbItems: OrderItemReadRow[] = [
    {
      id: "line-weekly-001",
      dish_id: weeklyDishId,
      item_kind: "dish",
      name_snapshot: "Lentejas estofadas con verduras",
      description_snapshot: "Plato tradicional del menú semanal",
      allergen_state: "DECLARED",
      allergens_snapshot: ["apio"],
      snapshot_captured_at: "2026-10-17T12:00:00Z",
      snapshot_author_id: "staff-01",
    },
    {
      id: "line-catalog-002",
      dish_id: catalogDishId,
      item_kind: "dish",
      name_snapshot: "Salmón al horno con hierbas",
      description_snapshot: "Fuera de carta del catálogo",
      allergen_state: "DECLARED",
      allergens_snapshot: ["pescado"],
      snapshot_captured_at: "2026-10-17T12:00:00Z",
      snapshot_author_id: "staff-01",
    },
    {
      id: customItemId,
      dish_id: null,
      item_kind: "custom",
      name_snapshot: "Tortilla de claras con espinacas y pavo",
      description_snapshot: "Preparación especial sin sal",
      allergen_state: "UNKNOWN",
      allergens_snapshot: [],
      snapshot_captured_at: "2026-10-17T12:00:00Z",
      snapshot_author_id: "staff-01",
    },
  ];

  it("reads order items with strict kind, recipeState, and allergenState contracts", () => {
    const readA = readOrderItem(dbItems[0]);
    expect(readA).toMatchObject({
      kind: "dish",
      dishId: weeklyDishId,
      identity: `dish:${weeklyDishId}`,
      allergenState: "DECLARED",
      allergensSnapshot: ["apio"],
      recipeState: "CATALOGUE_LINKED",
    });

    const readB = readOrderItem(dbItems[1]);
    expect(readB).toMatchObject({
      kind: "dish",
      dishId: catalogDishId,
      identity: `dish:${catalogDishId}`,
      allergenState: "DECLARED",
      allergensSnapshot: ["pescado"],
      recipeState: "CATALOGUE_LINKED",
    });

    const readC = readOrderItem(dbItems[2]);
    expect(readC).toMatchObject({
      kind: "custom",
      dishId: null,
      identity: `custom:${customItemId}`,
      allergenState: "UNKNOWN",
      allergensSnapshot: [],
      recipeState: "NOT_AVAILABLE",
    });
  });

  // 3. OPERATIONAL ORDER & NORMALIZATION
  const operationalOrder: OperationalOrderListItem = {
    id: orderId,
    tenantId,
    status: "confirmed",
    customerId,
    customerName: "Carlos Gómez",
    customerEmail: "carlos@example.com",
    weekStart,
    createdAt: "2026-10-17T12:00:00Z",
    total: 63.5, // 2*9.50 + 1*13.00 + 3*10.50 = 19 + 13 + 31.50 = 63.50
    demandChannel: "individual",
    notes: "Entrega urgente de mañana",
    companyId: null,
    companyName: null,
    siteId: null,
    siteName: null,
    siteAddress: null,
    organizationalUnitId: null,
    organizationalUnitName: null,
    deliveryGroupId: null,
    deliveryGroupName: null,
    dietarySnapshot: {
      allergens: ["pescado"], // Customer is allergic to pescado!
      customAllergens: [],
      restrictions: [],
      preferences: [],
      dietaryNotes: null,
      overrideReason: null,
      isOverride: false,
      capturedAt: "2026-10-17T12:00:00Z",
      authorUserId: "staff-01",
    },
    deliveryDates: [deliveryDate],
    items: [
      {
        id: dbItems[0].id,
        dishId: weeklyDishId,
        dishName: "Lentejas estofadas con verduras",
        dayDate: deliveryDate,
        qty: 2,
        unitPrice: 9.5,
        notes: null,
        line: readOrderItem(dbItems[0]),
      },
      {
        id: dbItems[1].id,
        dishId: catalogDishId,
        dishName: "Salmón al horno con hierbas",
        dayDate: deliveryDate,
        qty: 1,
        unitPrice: 13.0,
        notes: "Poco hecho",
        line: readOrderItem(dbItems[1]),
      },
      {
        id: dbItems[2].id,
        dishId: null,
        dishName: "Tortilla de claras con espinacas y pavo",
        dayDate: deliveryDate,
        qty: 3,
        unitPrice: 10.5,
        notes: "Sin sal añadida",
        line: readOrderItem(dbItems[2]),
      },
    ],
  };

  it("normalizes 3 lines into exactly 6 individual portion lines with safety segregation", () => {
    const dishMetaMap = new Map([
      [weeklyDishId, { allergens: ["apio"], prepMinutes: 30, weightG: 350 }],
      [catalogDishId, { allergens: ["pescado"], prepMinutes: 20, weightG: 300 }],
    ]);

    const normalized = normalizeOperationalOrders({
      orders: [operationalOrder],
      targetDate: deliveryDate,
      temporalMode: "present",
      dishMetaMap,
    });

    expect(normalized.lines).toHaveLength(6); // 2 + 1 + 3

    // Portions 1-2: Lentils
    const lentils = normalized.lines.filter((l) => l.identity.dishId === weeklyDishId);
    expect(lentils).toHaveLength(2);
    expect(lentils[0].criticalSafetyAllergens).toEqual([]);
    expect(lentils[0].modifications).toEqual([]);

    // Portion 3: Salmon (Customer allergic to pescado -> CRITICAL ALLERGY TRIGGERED!)
    const salmon = normalized.lines.filter((l) => l.identity.dishId === catalogDishId);
    expect(salmon).toHaveLength(1);
    expect(salmon[0].criticalSafetyAllergens).toContain("pescado");
    expect(salmon[0].modifications).toContain("Poco hecho");

    // Portions 4-6: Custom Tortilla (itemKind === 'custom', UNKNOWN allergen state)
    const tortilla = normalized.lines.filter((l) => l.identity.itemKind === "custom");
    expect(tortilla).toHaveLength(3);
    expect(tortilla[0].allergenSnapshotState).toBe("UNKNOWN");
    expect(tortilla[0].modifications).toContain("Sin sal añadida");
  });

  it("builds kitchen sheet segregating 🔴 critical safety alerts, 🟡 modifications, and custom items", async () => {
    const dishMetaMap = new Map([
      [weeklyDishId, { allergens: ["apio"], prepMinutes: 30, weightG: 350 }],
      [catalogDishId, { allergens: ["pescado"], prepMinutes: 20, weightG: 300 }],
    ]);

    const normalized = normalizeOperationalOrders({
      orders: [operationalOrder],
      targetDate: deliveryDate,
      temporalMode: "present",
      dishMetaMap,
    });

    const versionMetadata = await generateVersionMetadata({
      targetDate: deliveryDate,
      lines: normalized.lines,
    });

    const kitchen = buildKitchenProductionSheet({
      ...normalized,
      targetDate: deliveryDate,
      temporalMode: "present",
      versionMetadata,
    });

    expect(kitchen.dishes).toHaveLength(3);

    // 1. Salmon block has critical allergy banner
    const salmonBlock = kitchen.dishes.find((d) => d.dishId === catalogDishId)!;
    expect(salmonBlock.safetyAllergyPortionsCount).toBe(1);
    expect(salmonBlock.variants[0].severity).toBe("critical_allergy");
    expect(salmonBlock.variants[0].variantLabel).toContain("🔴 ALERTA: PESCADO");

    // 2. Custom block has UNKNOWN allergenState and NOT_AVAILABLE recipeState
    const customBlock = kitchen.dishes.find((d) => d.itemKind === "custom")!;
    expect(customBlock.dishId).toBeNull();
    expect(customBlock.itemIdentity).toBe(`custom:${customItemId}`);
    expect(customBlock.allergenState).toBe("UNKNOWN");
    expect(customBlock.recipeState).toBe("NOT_AVAILABLE");
    expect(customBlock.variants[0].variantLabel).toContain("Alérgenos sin declarar");

    // 3. Lentils block has standard portions
    const lentilsBlock = kitchen.dishes.find((d) => d.dishId === weeklyDishId)!;
    expect(lentilsBlock.standardPortionsCount).toBe(2);
    expect(lentilsBlock.recipeState).toBe("CATALOGUE_LINKED");
  });

  it("builds packing sheet with correct safety tags per customer unit", async () => {
    const dishMetaMap = new Map([
      [weeklyDishId, { allergens: ["apio"], prepMinutes: 30, weightG: 350 }],
      [catalogDishId, { allergens: ["pescado"], prepMinutes: 20, weightG: 300 }],
    ]);

    const normalized = normalizeOperationalOrders({
      orders: [operationalOrder],
      targetDate: deliveryDate,
      temporalMode: "present",
      dishMetaMap,
    });

    const versionMetadata = await generateVersionMetadata({
      targetDate: deliveryDate,
      lines: normalized.lines,
    });

    const packing = buildPackingHierarchySheet({
      ...normalized,
      targetDate: deliveryDate,
      temporalMode: "present",
      versionMetadata,
    });

    expect(packing.totals.grandTotalPortions).toBe(6);
    expect(packing.totals.grandTotalOrders).toBe(1);

    const b2cUnit = packing.municipalities[0].b2cIndividuals[0];
    expect(b2cUnit.customerName).toBe("Carlos Gómez");
    expect(b2cUnit.items).toHaveLength(3);

    // Salmon: Critical safety alert
    const salmonPacking = b2cUnit.items.find((d) => d.dishId === catalogDishId)!;
    expect(salmonPacking.safetyTag).toContain("🔴 PESCADO");

    // Custom Tortilla: Tagged with UNKNOWN allergen and custom notice
    const customPacking = b2cUnit.items.find((d) => d.itemKind === "custom")!;
    expect(customPacking.safetyTag).toContain("PERSONALIZADO · Alérgenos sin declarar");
    expect(customPacking.allergenState).toBe("UNKNOWN");
  });

  it("generates thermal labels ensuring UNKNOWN allergens are never presented as safe", () => {
    const dishMetaMap = new Map([
      [weeklyDishId, { allergens: ["apio"], prepMinutes: 30, weightG: 350 }],
      [catalogDishId, { allergens: ["pescado"], prepMinutes: 20, weightG: 300 }],
    ]);

    const normalized = normalizeOperationalOrders({
      orders: [operationalOrder],
      targetDate: deliveryDate,
      temporalMode: "present",
      dishMetaMap,
    });

    const labels = buildThermalLabels(normalized.lines);
    expect(labels).toHaveLength(6);

    const customLabels = labels.filter((l) => l.itemKind === "custom");
    expect(customLabels).toHaveLength(3);
    for (const label of customLabels) {
      expect(label.barcodeKey).toContain(`custom:${customItemId}`);
      expect(label.allergenState).toBe("UNKNOWN");
      expect(label.safetyTag).toContain("Alérgenos sin declarar · Receta no vinculada");
      expect(label.modificationTag).toBe("🟡 MODIF: Sin sal añadida");
    }

    const salmonLabel = labels.find((l) => l.itemIdentity === `dish:${catalogDishId}`)!;
    expect(salmonLabel.safetyTag).toContain("🔴 ALERGIA: PESCADO");
    expect(salmonLabel.modificationTag).toBe("🟡 MODIF: Poco hecho");
  });

  it("exports flat analytics matrix preserving all 17 columns and UNKNOWN status", () => {
    const dishMetaMap = new Map([
      [weeklyDishId, { allergens: ["apio"], prepMinutes: 30, weightG: 350 }],
      [catalogDishId, { allergens: ["pescado"], prepMinutes: 20, weightG: 300 }],
    ]);

    const normalized = normalizeOperationalOrders({
      orders: [operationalOrder],
      targetDate: deliveryDate,
      temporalMode: "present",
      dishMetaMap,
    });

    const matrix = buildFlatAnalyticMatrix(normalized.lines);
    expect(matrix).toHaveLength(6);

    const customRows = matrix.filter((r) => r.tipoItem === "custom");
    expect(customRows).toHaveLength(3);
    expect(customRows.every((r) => r.estadoAlergenos === "UNKNOWN")).toBe(true);
    expect(customRows.every((r) => r.identidadItem === `custom:${customItemId}`)).toBe(true);

    const csv = exportToCSV(matrix);
    expect(csv).toContain("FECHA_ENTREGA,MUNICIPIO,CANAL,EMPRESA");
    expect(csv).toContain("Tortilla de claras con espinacas y pavo");
    expect(csv).toContain("UNKNOWN");
    expect(csv).toContain("Salmón al horno con hierbas");
    expect(csv).toContain("🔴 PESCADO");
  });
});
