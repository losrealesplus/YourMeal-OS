import { describe, it, expect, beforeEach } from "vitest";
import { InventoryService } from "./inventory-service";
import {
  createInventoryRepository,
  __seedIngredient,
  __seedStockMovement,
  __resetInventoryStoreForTests,
} from "../infrastructure/inventory-repository";
import type { ServiceContext } from "@/services/types";
import type { InventoryStockItem, StockMovementRecord } from "../domain/inventory-types";

function makeContext(tenantId = "tenant-eatclean", capabilities = ["inventory.operate"]): ServiceContext {
  return {
    supabase: {} as any, // unit test double
    userId: "user-1",
    tenantId,
    roles: ["company_admin"],
    capabilities: new Set(capabilities as any),
  };
}

describe("Inventory Queries & Summary (INVENTORY UI V1)", () => {
  beforeEach(() => {
    __resetInventoryStoreForTests();
  });

  const sampleIngredientA: InventoryStockItem = {
    id: "ing-1",
    tenantId: "tenant-eatclean",
    name: "Pechuga de Pollo Certificada",
    unit: "kg",
    stock: 12.0,
    cost: 4.7037,
    minStock: 5.0,
    wastePercentage: 5.0,
    totalValue: 56.44,
    status: "available",
  };

  const sampleIngredientB: InventoryStockItem = {
    id: "ing-2",
    tenantId: "tenant-eatclean",
    name: "Arroz Integral Bio",
    unit: "kg",
    stock: 0,
    cost: 2.15,
    minStock: 10.0,
    wastePercentage: 0,
    totalValue: 0,
    status: "out_of_stock",
  };

  const otherTenantIngredient: InventoryStockItem = {
    id: "ing-other",
    tenantId: "tenant-other",
    name: "Ingrediente de Otro Restaurante",
    unit: "kg",
    stock: 50.0,
    cost: 10.0,
    minStock: 2.0,
    wastePercentage: 0,
    totalValue: 500.0,
    status: "available",
  };

  const movementA: StockMovementRecord = {
    id: "mov-1",
    tenantId: "tenant-eatclean",
    ingredientId: "ing-1",
    ingredientName: "Pechuga de Pollo Certificada",
    ingredientUnit: "kg",
    movementType: "PURCHASE_RECEIPT",
    direction: "IN",
    quantity: 5.0,
    previousStock: 10.0,
    newStock: 15.0,
    unitCost: 4.84,
    referenceDocumentType: "PURCHASE_INVOICE",
    referenceDocumentId: "inv-uuid-1",
    receiptId: "rec-uuid-1",
    notes: "Recepción de compra",
    createdAt: "2026-10-27T01:00:00Z",
  };

  const movementB: StockMovementRecord = {
    id: "mov-2",
    tenantId: "tenant-eatclean",
    ingredientId: "ing-1",
    ingredientName: "Pechuga de Pollo Certificada",
    ingredientUnit: "kg",
    movementType: "PRODUCTION_CONSUMPTION",
    direction: "OUT",
    quantity: 3.0,
    previousStock: 15.0,
    newStock: 12.0,
    unitCost: 4.7037,
    referenceDocumentType: "PRODUCTION_ORDER",
    referenceDocumentId: "cons-uuid-1",
    notes: "Consumo de cocina",
    createdAt: "2026-10-27T02:00:00Z",
  };

  const otherTenantMovement: StockMovementRecord = {
    id: "mov-other",
    tenantId: "tenant-other",
    ingredientId: "ing-other",
    ingredientName: "Ingrediente Otro",
    ingredientUnit: "kg",
    movementType: "PURCHASE_RECEIPT",
    direction: "IN",
    quantity: 10.0,
    previousStock: 0,
    newStock: 10.0,
    unitCost: 5.0,
    referenceDocumentType: "PURCHASE_INVOICE",
    referenceDocumentId: "inv-other",
    createdAt: "2026-10-27T01:00:00Z",
  };

  it("1. Returns stock list with proper fields and tenant isolation", async () => {
    __seedIngredient("tenant-eatclean", sampleIngredientA);
    __seedIngredient("tenant-eatclean", sampleIngredientB);
    __seedIngredient("tenant-other", otherTenantIngredient);

    const ctx = makeContext("tenant-eatclean");
    const stockList = await InventoryService.getInventoryStock(ctx);

    expect(stockList.length).toBe(2);
    // Alphabetical order: "Arroz Integral Bio" (ing-2) before "Pechuga de Pollo" (ing-1)
    expect(stockList.map((s) => s.id)).toEqual(["ing-2", "ing-1"]);
    expect(stockList.find((s) => s.id === "ing-1")?.stock).toBe(12.0);
    expect(stockList.find((s) => s.id === "ing-1")?.cost).toBe(4.7037);
    expect(stockList.find((s) => s.id === "ing-2")?.status).toBe("out_of_stock");
  });

  it("2. Computes inventory summary KPIs correctly", async () => {
    __seedIngredient("tenant-eatclean", sampleIngredientA);
    __seedIngredient("tenant-eatclean", sampleIngredientB);

    const ctx = makeContext("tenant-eatclean");
    const summary = await InventoryService.getInventorySummary(ctx);

    expect(summary.totalIngredients).toBe(2);
    expect(summary.inStockCount).toBe(1);
    expect(summary.outOfStockCount).toBe(1);
    expect(summary.totalValuation).toBe(56.44);
  });

  it("3. Returns Kárdex stock movements with direction, pagination, and filters", async () => {
    __seedStockMovement(movementA);
    __seedStockMovement(movementB);
    __seedStockMovement(otherTenantMovement);

    const ctx = makeContext("tenant-eatclean");

    // All movements for tenant (sorted created_at DESC)
    const movements = await InventoryService.getStockMovements(ctx);
    expect(movements.totalCount).toBe(2);
    expect(movements.items.length).toBe(2);
    expect(movements.items[0].direction).toBe("OUT"); // 02:00:00Z
    expect(movements.items[1].direction).toBe("IN");  // 01:00:00Z
    expect(movements.page).toBe(1);
    expect(movements.hasMore).toBe(false);

    // Filter by movementType
    const purchasesOnly = await InventoryService.getStockMovements(ctx, {
      movementType: "PURCHASE_RECEIPT",
    });
    expect(purchasesOnly.totalCount).toBe(1);
    expect(purchasesOnly.items.length).toBe(1);
    expect(purchasesOnly.items[0].movementType).toBe("PURCHASE_RECEIPT");

    // Filter by ingredientId
    const forChicken = await InventoryService.getStockMovements(ctx, {
      ingredientId: "ing-1",
    });
    expect(forChicken.totalCount).toBe(2);
    expect(forChicken.items.length).toBe(2);
  });

  it("4. Supports pagination and date filtering on Kárdex movements", async () => {
    __seedStockMovement(movementA); // 2026-10-27T01:00:00Z
    __seedStockMovement(movementB); // 2026-10-27T02:00:00Z

    const ctx = makeContext("tenant-eatclean");

    // Page size 1
    const page1 = await InventoryService.getStockMovements(ctx, { page: 1, pageSize: 1 });
    expect(page1.totalCount).toBe(2);
    expect(page1.items.length).toBe(1);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(2);
    expect(page1.hasMore).toBe(true);

    const page2 = await InventoryService.getStockMovements(ctx, { page: 2, pageSize: 1 });
    expect(page2.totalCount).toBe(2);
    expect(page2.items.length).toBe(1);
    expect(page2.page).toBe(2);
    expect(page2.hasMore).toBe(false);
    expect(page2.items[0].id).not.toBe(page1.items[0].id);

    // Date filtering
    const dateFiltered = await InventoryService.getStockMovements(ctx, {
      dateFrom: "2026-10-27T01:30:00Z",
      dateTo: "2026-10-27T02:30:00Z",
    });
    expect(dateFiltered.totalCount).toBe(1);
    expect(dateFiltered.items[0].id).toBe("mov-2");
  });

  it("5. Computes summary directly without duplicate network roundtrip", async () => {
    __seedIngredient("tenant-eatclean", sampleIngredientA);
    __seedIngredient("tenant-eatclean", sampleIngredientB);

    const ctx = makeContext("tenant-eatclean");
    const stock = await InventoryService.getInventoryStock(ctx);
    const summary = await InventoryService.getInventorySummary(ctx, stock);

    expect(summary.totalIngredients).toBe(2);
    expect(summary.inStockCount).toBe(1);
    expect(summary.outOfStockCount).toBe(1);
    expect(summary.totalValuation).toBe(56.44);
  });

  it("6. Enforces RBAC capability inventory.operate", async () => {
    const ctxNoPerms = makeContext("tenant-eatclean", ["kitchen.view"]);
    await expect(InventoryService.getInventoryStock(ctxNoPerms)).rejects.toThrow(
      "Missing capability: inventory.operate",
    );
  });
});
