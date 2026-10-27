import { describe, expect, it } from "vitest";
import {
  calculatePurchaseInvoiceTotals,
  isValidUuid,
} from "./purchase-invoice-calculator";
import { PurchaseInvoiceInput } from "./procurement-types";

describe("Purchase Invoice Calculator (CR-COST-01)", () => {
  const sampleInput: PurchaseInvoiceInput = {
    tenantId: "8bba00ba-331b-42c8-9283-4e3836ffb870",
    supplierId: "SUPP-MAKRO",
    invoiceNumber: "INV-2026-001",
    invoiceDate: "2026-09-26",
    additionalCosts: 30.0, // 30€ portes
    allocationMethod: "value",
    items: [
      {
        itemId: "ING-POLLO",
        itemName: "Pechuga de Pollo",
        quantity: 20,
        unit: "kg",
        unitPrice: 5.0, // 100€ base
        taxRate: 10, // 10% IVA
        discountAmount: 10.0, // 10€ descuento (net base: 90€)
      },
      {
        itemId: "ING-ARROZ",
        itemName: "Arroz Jazmín",
        quantity: 10,
        unit: "kg",
        unitPrice: 2.0, // 20€ base
        taxRate: 4, // 4% superreducido
      },
    ],
  };

  it("1. Calculates net subtotals, taxes, and prorates additional inbound costs", () => {
    const calculated = calculatePurchaseInvoiceTotals(sampleInput, "inv-test-1");

    expect(calculated.id).toBe("inv-test-1");
    expect(calculated.subtotal).toBe(110.0); // 90€ (pollo con desc) + 20€ (arroz)
    expect(calculated.taxAmount).toBe(9.8); // 9.00€ (10% de 90) + 0.80€ (4% de 20)
    expect(calculated.additionalCosts).toBe(30.0);
    expect(calculated.totalAmount).toBe(149.8); // 110 + 9.8 + 30

    // Proration: Pollo base is 90€ / 110€ = 81.82%, Arroz base is 20€ / 110€ = 18.18%
    const pollo = calculated.items.find((i) => i.itemId === "ING-POLLO")!;
    const arroz = calculated.items.find((i) => i.itemId === "ING-ARROZ")!;

    expect(pollo.allocatedOverhead).toBeGreaterThan(arroz.allocatedOverhead);
    expect(pollo.allocatedOverhead + arroz.allocatedOverhead).toBe(30.0);

    // Effective unit cost: (90€ + allocatedOverhead) / 20kg
    expect(pollo.effectiveUnitCost).toBeGreaterThan(4.5); // 4.50€ is net unit price before overhead
  });

  it("2. Rejects empty line items", () => {
    expect(() =>
      calculatePurchaseInvoiceTotals({
        ...sampleInput,
        items: [],
      }),
    ).toThrow();
  });

  it("3. Generates valid UUIDs when id is omitted and never emits temp-inv-id", () => {
    const calculated = calculatePurchaseInvoiceTotals({
      ...sampleInput,
      id: undefined,
    });

    expect(isValidUuid(calculated.id)).toBe(true);
    expect(calculated.id).not.toBe("temp-inv-id");
    expect(calculated.items.length).toBe(2);
    calculated.items.forEach((item) => {
      expect(isValidUuid(item.id)).toBe(true);
      expect(item.id).not.toContain("item-");
    });
  });

  it("4. Preserves provided valid UUIDs and itemNature for inventory and service lines", () => {
    const customInvoiceUuid = "11111111-2222-4333-8444-555555555555";
    const customLineUuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const calculated = calculatePurchaseInvoiceTotals(
      {
        ...sampleInput,
        id: customInvoiceUuid,
        items: [
          {
            id: customLineUuid,
            itemId: "99999999-8888-4777-8666-555555555555",
            itemName: "Transporte Refrigerado Especial",
            itemNature: "EXPENSE_SERVICE",
            quantity: 1,
            unit: "serv",
            unitPrice: 50.0,
            taxRate: 21,
          },
          {
            itemId: "88888888-7777-4666-8555-444444444444",
            itemName: "Sal marina gruesa",
            itemNature: "INVENTORYABLE",
            quantity: 25,
            unit: "kg",
            unitPrice: 0.8,
            taxRate: 10,
          },
        ],
      },
    );

    expect(calculated.id).toBe(customInvoiceUuid);
    expect(calculated.items[0].id).toBe(customLineUuid);
    expect(calculated.items[0].itemNature).toBe("EXPENSE_SERVICE");
    expect(calculated.items[1].itemNature).toBe("INVENTORYABLE");
    expect(isValidUuid(calculated.items[1].id)).toBe(true);
  });
});
