import { describe, expect, it, vi } from "vitest";
import {
  calculatePurchaseInvoiceTotals,
  generateSecureUuid,
  isValidUuid,
} from "./purchase-invoice-calculator";
import { PurchaseInvoiceInput } from "./procurement-types";

describe("Purchase Invoice Calculator (CR-COST-01)", () => {
  const validTenantId = "8bba00ba-331b-42c8-9283-4e3836ffb870";
  const validIngredient1 = "11111111-1111-4111-8111-111111111111";
  const validIngredient2 = "22222222-2222-4222-8222-222222222222";
  const validInvoiceId = "33333333-3333-4333-8333-333333333333";

  const sampleInput: PurchaseInvoiceInput = {
    tenantId: validTenantId,
    supplierId: "SUPP-MAKRO",
    invoiceNumber: "INV-2026-001",
    invoiceDate: "2026-09-26",
    additionalCosts: 30.0, // 30€ portes
    allocationMethod: "value",
    items: [
      {
        itemId: validIngredient1,
        itemName: "Pechuga de Pollo",
        itemNature: "INVENTORYABLE",
        quantity: 20,
        unit: "kg",
        unitPrice: 5.0, // 100€ base
        taxRate: 10, // 10% IVA
        discountAmount: 10.0, // 10€ descuento (net base: 90€)
      },
      {
        itemId: validIngredient2,
        itemName: "Arroz Jazmín",
        itemNature: "INVENTORYABLE",
        quantity: 10,
        unit: "kg",
        unitPrice: 2.0, // 20€ base
        taxRate: 4, // 4% superreducido
      },
    ],
  };

  it("1. Calculates net subtotals, taxes, and prorates additional inbound costs", () => {
    const calculated = calculatePurchaseInvoiceTotals(sampleInput, validInvoiceId);

    expect(calculated.id).toBe(validInvoiceId);
    expect(calculated.subtotal).toBe(110.0); // 90€ (pollo con desc) + 20€ (arroz)
    expect(calculated.taxAmount).toBe(9.8); // 9.00€ (10% de 90) + 0.80€ (4% de 20)
    expect(calculated.additionalCosts).toBe(30.0);
    expect(calculated.totalAmount).toBe(149.8); // 110 + 9.8 + 30

    // Proration: Pollo base is 90€ / 110€ = 81.82%, Arroz base is 20€ / 110€ = 18.18%
    const pollo = calculated.items.find((i) => i.itemId === validIngredient1)!;
    const arroz = calculated.items.find((i) => i.itemId === validIngredient2)!;

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
    ).toThrow("Purchase invoice must contain at least one line item.");
  });

  it("3. Generates valid UUIDs when id is omitted and never emits temp-inv-id or constant dummy", () => {
    const calculated = calculatePurchaseInvoiceTotals({
      ...sampleInput,
      id: undefined,
    });

    expect(isValidUuid(calculated.id)).toBe(true);
    expect(calculated.id).not.toBe("temp-inv-id");
    expect(calculated.id).not.toBe("00000000-0000-4000-8000-000000000000");
    expect(calculated.items.length).toBe(2);
    calculated.items.forEach((item) => {
      expect(isValidUuid(item.id)).toBe(true);
      expect(item.id).not.toContain("item-");
      expect(item.id).not.toBe("00000000-0000-4000-8000-000000000000");
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
            itemId: validIngredient1,
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

  it("5. Rejects invalid UUIDs supplied by caller for invoiceId, input.id, or line item.id", () => {
    // Invalid invoiceId parameter
    expect(() =>
      calculatePurchaseInvoiceTotals(sampleInput, "invalid-uuid-string"),
    ).toThrow("INVALID_UUID");

    // Invalid input.id
    expect(() =>
      calculatePurchaseInvoiceTotals({
        ...sampleInput,
        id: "temp-inv-id",
      }),
    ).toThrow("INVALID_UUID");

    // Invalid line item.id
    expect(() =>
      calculatePurchaseInvoiceTotals({
        ...sampleInput,
        items: [
          {
            ...sampleInput.items[0],
            id: "not-a-uuid-line-id",
          },
        ],
      }),
    ).toThrow("INVALID_UUID");
  });

  it("6. Rejects inventoryable items without a valid ingredient UUID", () => {
    // Missing itemId for INVENTORYABLE
    expect(() =>
      calculatePurchaseInvoiceTotals({
        ...sampleInput,
        items: [
          {
            itemName: "Ingrediente sin ID",
            itemNature: "INVENTORYABLE",
            quantity: 10,
            unit: "kg",
            unitPrice: 5.0,
            itemId: "",
          },
        ],
      }),
    ).toThrow("INVALID_INGREDIENT_ID");

    // Non-UUID itemId for INVENTORYABLE
    expect(() =>
      calculatePurchaseInvoiceTotals({
        ...sampleInput,
        items: [
          {
            itemName: "Ingrediente con ID no-UUID",
            itemNature: "INVENTORYABLE",
            quantity: 10,
            unit: "kg",
            unitPrice: 5.0,
            itemId: "ING-POLLO-CUSTOM",
          },
        ],
      }),
    ).toThrow("INVALID_INGREDIENT_ID");
  });

  it("7. Preserves explicit 0% VAT without converting to default or fallback", () => {
    const invoice = calculatePurchaseInvoiceTotals({
      ...sampleInput,
      items: [
        {
          itemId: validIngredient1,
          itemName: "Harina Cero IVA",
          itemNature: "INVENTORYABLE",
          quantity: 10,
          unit: "kg",
          unitPrice: 2.5,
          taxRate: 0, // Explicit 0% VAT
        },
      ],
      additionalCosts: 0,
    });

    expect(invoice.items[0].taxRate).toBe(0);
    expect(invoice.items[0].taxAmount).toBe(0);
    expect(invoice.subtotal).toBe(25.0);
    expect(invoice.taxAmount).toBe(0);
    expect(invoice.totalAmount).toBe(25.0);
  });

  it("8. Fails safely when UUID generator is unavailable", () => {
    const spy = vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new Error("SECURE_UUID_UNAVAILABLE: crypto.randomUUID() is not available");
    });

    try {
      expect(() => generateSecureUuid()).toThrow("SECURE_UUID_UNAVAILABLE");
      expect(() =>
        calculatePurchaseInvoiceTotals({
          ...sampleInput,
          id: undefined,
        }),
      ).toThrow("SECURE_UUID_UNAVAILABLE");
    } finally {
      spy.mockRestore();
    }
  });
});
