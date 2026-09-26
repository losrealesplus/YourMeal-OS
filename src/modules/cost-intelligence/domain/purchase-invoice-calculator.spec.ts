import { describe, expect, it } from "vitest";
import { calculatePurchaseInvoiceTotals } from "./purchase-invoice-calculator";
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
});
