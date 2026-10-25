/**
 * YOURMEAL OS — PURCHASES & EXPENSES PROTOTYPE (INCREMENT 1 SPEC & TESTS)
 * Comprehensive verification of atomic physical receipt, WAC recalculation,
 * service isolation, mixed invoices, and prior delivery note reconciliation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type {
  PurchaseDocument,
  InventoryStockSnapshot,
} from './domain-types';
import {
  executePhysicalReceipt,
  calculateWAC,
  DomainError,
} from './receipt-engine';
import { SyntheticBenchmarkProvider } from './extraction-service';

describe('Atomic Physical Receipt Engine (Increment 1 Prototype)', () => {
  let stockMap: Map<string, InventoryStockSnapshot>;
  const provider = new SyntheticBenchmarkProvider();

  beforeEach(() => {
    stockMap = new Map();
    // Seed initial warehouse stock in EatClean
    stockMap.set('ing-pollo-001', {
      ingredientId: 'ing-pollo-001',
      currentStock: 10.0,
      currentWAC: 5.80,
    });
    stockMap.set('ing-arroz-002', {
      ingredientId: 'ing-arroz-002',
      currentStock: 5.0,
      currentWAC: 1.75,
    });
    stockMap.set('pkg-bowl-003', {
      ingredientId: 'pkg-bowl-003',
      currentStock: 100.0,
      currentWAC: 0.16,
    });
  });

  it('WAC Calculator: calculates exact weighted average cost and handles edge cases', () => {
    // 10 kg @ 5.80 € (58 €) + 20 kg @ 6.20 € (124 €) = 182 € / 30 kg = 6.0667 €
    const wac = calculateWAC({
      previousStock: 10.0,
      previousWAC: 5.80,
      inboundQuantity: 20.0,
      inboundUnitCost: 6.20,
    });
    expect(wac).toBe(6.0667);

    // When previous stock is 0 or negative, adopts inbound cost directly
    const wacFromZero = calculateWAC({
      previousStock: 0,
      previousWAC: 0,
      inboundQuantity: 15.0,
      inboundUnitCost: 2.10,
    });
    expect(wacFromZero).toBe(2.10);
  });

  it('Scenario 1 (Full Goods Receipt): increments stock, updates WAC, records immutable history and stock movements', async () => {
    const extracted = await provider.extractDocument({ fileName: 'factura_makro.pdf' });

    // Build document from extracted data
    const doc: PurchaseDocument = {
      id: 'doc-makro-001',
      tenantId: 'tenant-eatclean-tf',
      documentType: extracted.documentType,
      supplierId: 'supp-makro-tf',
      supplierName: extracted.supplier.name,
      documentNumber: extracted.documentNumber,
      documentDate: extracted.documentDate,
      economicPeriod: extracted.economicPeriod,
      currency: 'EUR',
      subtotalExTax: extracted.summary.subtotalExTax,
      taxTotal: extracted.summary.taxTotal,
      additionalCosts: extracted.summary.additionalCosts,
      totalAmount: extracted.summary.totalAmount,
      documentStatus: 'DRAFT',
      receptionStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      lines: extracted.lines.map((l, idx) => ({
        ...l,
        id: `line-${idx + 1}`,
        documentId: 'doc-makro-001',
        orderedQuantity: l.quantity,
        receivedQuantity: 0,
        isPhysicallyReceived: false,
        matchedIngredientId:
          l.supplierProductCode === '741289' ? 'ing-pollo-001' :
          l.supplierProductCode === '109844' ? 'ing-arroz-002' :
          l.supplierProductCode === '990312' ? 'pkg-bowl-003' : null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Receive the 3 inventoryable lines
    const receiptInput = {
      tenantId: 'tenant-eatclean-tf',
      documentId: 'doc-makro-001',
      deliveryNoteNumber: 'ALB-MAKRO-7721',
      receivedLines: [
        { lineId: 'line-1', quantityReceivedNow: 20 }, // Pollo: 20 kg
        { lineId: 'line-2', quantityReceivedNow: 15 }, // Arroz: 15 kg
        { lineId: 'line-3', quantityReceivedNow: 300 }, // Bowls: 300 uds
      ],
    };

    const { updatedDocument, result } = executePhysicalReceipt(doc, receiptInput, stockMap);

    // Assert stock mutations
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(30.0); // 10 + 20
    expect(stockMap.get('ing-pollo-001')?.currentWAC).toBe(6.0667);
    expect(stockMap.get('ing-arroz-002')?.currentStock).toBe(20.0); // 5 + 15
    expect(stockMap.get('pkg-bowl-003')?.currentStock).toBe(400.0); // 100 + 300

    // Assert document reception state
    expect(updatedDocument.receptionStatus).toBe('FULLY_RECEIVED');
    expect(updatedDocument.documentStatus).toBe('VERIFIED');
    expect(result.linesUpdated).toHaveLength(3);
    expect(result.costHistoryEntries).toHaveLength(3);
    expect(result.stockMovementEntries).toHaveLength(3);

    // Verify stock movement entry details
    const polloMovement = result.stockMovementEntries.find((s) => s.ingredientId === 'ing-pollo-001');
    expect(polloMovement?.quantity).toBe(20);
    expect(polloMovement?.balanceAfter).toBe(30.0);
    expect(polloMovement?.movementType).toBe('PURCHASE_RECEIPT');
  });

  it('Scenario 2 (Service / Expense Isolation): Services and supplies never mutate physical stock', async () => {
    const extracted = await provider.extractDocument({ fileName: 'factura_endesa_electricidad.pdf' });

    const doc: PurchaseDocument = {
      id: 'doc-endesa-002',
      tenantId: 'tenant-eatclean-tf',
      documentType: extracted.documentType,
      supplierId: 'supp-endesa',
      supplierName: extracted.supplier.name,
      documentNumber: extracted.documentNumber,
      documentDate: extracted.documentDate,
      economicPeriod: extracted.economicPeriod, // '2026-09'
      currency: 'EUR',
      subtotalExTax: extracted.summary.subtotalExTax,
      taxTotal: extracted.summary.taxTotal,
      additionalCosts: 0,
      totalAmount: extracted.summary.totalAmount,
      documentStatus: 'VERIFIED',
      receptionStatus: 'NOT_APPLICABLE',
      paymentStatus: 'DIRECT_DEBIT',
      lines: extracted.lines.map((l, idx) => ({
        ...l,
        id: `line-elec-${idx + 1}`,
        documentId: 'doc-endesa-002',
        orderedQuantity: l.quantity,
        receivedQuantity: 0,
        isPhysicallyReceived: false,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If an operator mistakenly tries to physically receive a service line, reject cleanly
    expect(() => {
      executePhysicalReceipt(
        doc,
        {
          tenantId: 'tenant-eatclean-tf',
          documentId: 'doc-endesa-002',
          receivedLines: [{ lineId: 'line-elec-1', quantityReceivedNow: 1 }],
        },
        stockMap,
      );
    }).toThrowError(DomainError);

    try {
      executePhysicalReceipt(
        doc,
        {
          tenantId: 'tenant-eatclean-tf',
          documentId: 'doc-endesa-002',
          receivedLines: [{ lineId: 'line-elec-1', quantityReceivedNow: 1 }],
        },
        stockMap,
      );
    } catch (e: any) {
      expect(e.code).toBe('CANNOT_RECEIVE_SERVICE');
    }

    // Warehouse stock remains strictly unchanged
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(10.0);
  });

  it('Scenario 3 (Mixed Invoice Bifurcation): Goods update stock, freight charge remains pure expense', async () => {
    const extracted = await provider.extractDocument({ fileName: 'factura_makro.pdf' });

    // The mixed invoice contains 3 inventoryable lines and 1 freight service line
    const doc: PurchaseDocument = {
      id: 'doc-mixed-003',
      tenantId: 'tenant-eatclean-tf',
      documentType: 'INVOICE',
      supplierId: 'supp-makro-tf',
      supplierName: 'Makro Adeje',
      documentNumber: 'MAK-MIX-001',
      documentDate: '2026-10-22',
      economicPeriod: '2026-10',
      currency: 'EUR',
      subtotalExTax: extracted.summary.subtotalExTax,
      taxTotal: extracted.summary.taxTotal,
      additionalCosts: 0,
      totalAmount: extracted.summary.totalAmount,
      documentStatus: 'DRAFT',
      receptionStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      lines: extracted.lines.map((l, idx) => ({
        ...l,
        id: `m-line-${idx + 1}`,
        documentId: 'doc-mixed-003',
        orderedQuantity: l.quantity,
        receivedQuantity: 0,
        isPhysicallyReceived: false,
        matchedIngredientId:
          l.itemNature === 'INVENTORYABLE' ? (l.supplierProductCode === '741289' ? 'ing-pollo-001' : 'ing-arroz-002') : null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Receive only inventoryable items (Lines 1 & 2)
    const receiptInput = {
      tenantId: 'tenant-eatclean-tf',
      documentId: 'doc-mixed-003',
      receivedLines: [
        { lineId: 'm-line-1', quantityReceivedNow: 20 },
        { lineId: 'm-line-2', quantityReceivedNow: 15 },
      ],
    };

    const { updatedDocument, result } = executePhysicalReceipt(doc, receiptInput, stockMap);

    // Pollo & Arroz updated
    expect(result.linesUpdated).toHaveLength(2);
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(30.0);
    // Line 4 (Porte) remains unreceived physically, but does not block status because it is EXPENSE_SERVICE
    const freightLine = updatedDocument.lines.find((l) => l.itemNature === 'EXPENSE_SERVICE');
    expect(freightLine?.isPhysicallyReceived).toBe(false);
  });

  it('Scenario 4 (Partial Goods Reception): Handles staged warehouse deliveries without data corruption', () => {
    const doc: PurchaseDocument = {
      id: 'doc-partial-004',
      tenantId: 'tenant-eatclean-tf',
      documentType: 'INVOICE',
      supplierId: 'supp-pollo',
      supplierName: 'Avícola Canaria S.L.',
      documentNumber: 'AV-2026-88',
      documentDate: '2026-10-23',
      economicPeriod: '2026-10',
      currency: 'EUR',
      subtotalExTax: 500,
      taxTotal: 15,
      additionalCosts: 0,
      totalAmount: 515,
      documentStatus: 'DRAFT',
      receptionStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      lines: [
        {
          id: 'line-p-1',
          documentId: 'doc-partial-004',
          lineNumber: 1,
          description: 'Pechuga de Pollo Fresca 100 kg',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'RAW_MATERIALS',
          costBehavior: 'DIRECT_FOOD',
          costCenter: 'KITCHEN',
          matchedIngredientId: 'ing-pollo-001',
          orderedQuantity: 100, // Ordered 100 kg
          receivedQuantity: 0,
          unit: 'kg',
          unitPrice: 5.00,
          taxRatePct: 3.0,
          taxAmount: 15,
          lineTotal: 515,
          isPhysicallyReceived: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Staged Delivery 1: Driver arrives with first 40 kg
    const delivery1 = executePhysicalReceipt(
      doc,
      {
        tenantId: 'tenant-eatclean-tf',
        documentId: 'doc-partial-004',
        deliveryNoteNumber: 'ALB-PARCIAL-1',
        receivedLines: [{ lineId: 'line-p-1', quantityReceivedNow: 40 }],
      },
      stockMap,
    );

    expect(delivery1.updatedDocument.receptionStatus).toBe('PARTIALLY_RECEIVED');
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(50.0); // 10 initial + 40
    expect(delivery1.updatedDocument.lines[0].receivedQuantity).toBe(40);
    expect(delivery1.updatedDocument.lines[0].isPhysicallyReceived).toBe(false);

    // Staged Delivery 2: Next day driver brings remaining 60 kg
    const delivery2 = executePhysicalReceipt(
      delivery1.updatedDocument,
      {
        tenantId: 'tenant-eatclean-tf',
        documentId: 'doc-partial-004',
        deliveryNoteNumber: 'ALB-PARCIAL-2',
        receivedLines: [{ lineId: 'line-p-1', quantityReceivedNow: 60 }],
      },
      stockMap,
    );

    expect(delivery2.updatedDocument.receptionStatus).toBe('FULLY_RECEIVED');
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(110.0); // 50 + 60
    expect(delivery2.updatedDocument.lines[0].receivedQuantity).toBe(100);
    expect(delivery2.updatedDocument.lines[0].isPhysicallyReceived).toBe(true);
  });

  it('Scenario 5 (Prior Delivery Note / Albarán Reconciliation): Strictly avoids double inventory increment', () => {
    // Tuesday: Goods arrived on Delivery Note ALB-101 and were received (20 kg Pollo)
    const initialLine = {
      id: 'line-alb-1',
      documentId: 'doc-alb-101',
      lineNumber: 1,
      description: 'Pechuga Pollo Fresca 20 kg',
      itemNature: 'INVENTORYABLE' as const,
      expenseCategory: 'RAW_MATERIALS' as const,
      costBehavior: 'DIRECT_FOOD' as const,
      costCenter: 'KITCHEN' as const,
      matchedIngredientId: 'ing-pollo-001',
      orderedQuantity: 20,
      receivedQuantity: 20, // ALREADY RECEIVED on Tuesday!
      unit: 'kg',
      unitPrice: 6.00,
      taxRatePct: 3.0,
      taxAmount: 3.60,
      lineTotal: 123.60,
      isPhysicallyReceived: true, // ALREADY MARKED RECEIVED
      receptionNoteRef: 'ALB-101',
    };

    const monthlyInvoice: PurchaseDocument = {
      id: 'doc-invoice-end-month',
      tenantId: 'tenant-eatclean-tf',
      documentType: 'INVOICE',
      supplierId: 'supp-pollo',
      supplierName: 'Avícola Canaria S.L.',
      documentNumber: 'FAC-CONSOLIDADA-10',
      documentDate: '2026-10-31',
      economicPeriod: '2026-10',
      currency: 'EUR',
      subtotalExTax: 120,
      taxTotal: 3.60,
      additionalCosts: 0,
      totalAmount: 123.60,
      documentStatus: 'DRAFT',
      receptionStatus: 'FULLY_RECEIVED',
      paymentStatus: 'UNPAID',
      associatedDeliveryNoteIds: ['doc-alb-101'],
      lines: [initialLine],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // When reconciling the monthly invoice, stock must NOT increment a second time
    const { updatedDocument, result } = executePhysicalReceipt(
      monthlyInvoice,
      {
        tenantId: 'tenant-eatclean-tf',
        documentId: 'doc-invoice-end-month',
        receivedLines: [{ lineId: 'line-alb-1', quantityReceivedNow: 20 }],
      },
      stockMap,
    );

    // Zero additional stock added!
    expect(result.linesUpdated).toHaveLength(0);
    expect(stockMap.get('ing-pollo-001')?.currentStock).toBe(10.0); // Kept original 10.0, zero duplicate add
    expect(updatedDocument.receptionStatus).toBe('FULLY_RECEIVED');
  });

  it('Defensive Validation: rejects unmapped ingredients and negative reception quantities', () => {
    const unmappedDoc: PurchaseDocument = {
      id: 'doc-unmapped',
      tenantId: 'tenant-eatclean-tf',
      documentType: 'INVOICE',
      supplierId: 'supp-random',
      supplierName: 'Proveedor Desconocido',
      documentNumber: 'DESC-01',
      documentDate: '2026-10-24',
      economicPeriod: '2026-10',
      currency: 'EUR',
      subtotalExTax: 10,
      taxTotal: 0,
      additionalCosts: 0,
      totalAmount: 10,
      documentStatus: 'DRAFT',
      receptionStatus: 'PENDING',
      paymentStatus: 'UNPAID',
      lines: [
        {
          id: 'line-unmapped-1',
          documentId: 'doc-unmapped',
          lineNumber: 1,
          description: 'Hierba Limón Especial Tailandesa',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'RAW_MATERIALS',
          costBehavior: 'DIRECT_FOOD',
          costCenter: 'KITCHEN',
          matchedIngredientId: null, // NOT MAPPED
          orderedQuantity: 2,
          receivedQuantity: 0,
          unit: 'kg',
          unitPrice: 5.00,
          taxRatePct: 0,
          taxAmount: 0,
          lineTotal: 10,
          isPhysicallyReceived: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(() => {
      executePhysicalReceipt(
        unmappedDoc,
        {
          tenantId: 'tenant-eatclean-tf',
          documentId: 'doc-unmapped',
          receivedLines: [{ lineId: 'line-unmapped-1', quantityReceivedNow: 2 }],
        },
        stockMap,
      );
    }).toThrowError(/not mapped/i);

    expect(() => {
      executePhysicalReceipt(
        unmappedDoc,
        {
          tenantId: 'tenant-eatclean-tf',
          documentId: 'doc-unmapped',
          receivedLines: [{ lineId: 'line-unmapped-1', quantityReceivedNow: -5 }],
        },
        stockMap,
      );
    }).toThrowError();
  });
});
