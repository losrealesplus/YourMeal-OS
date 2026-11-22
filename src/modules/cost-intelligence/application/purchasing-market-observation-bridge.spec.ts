import { describe, it, expect, vi, beforeEach } from 'vitest';
import { recordPurchaseObservationsFromInvoice } from './purchasing-market-observation-bridge';
import type { IMarketIntelligenceRepository } from '@/modules/market-intelligence/infrastructure/repositories/market-repository-interface';
import type { ProductMapping } from '@/modules/market-intelligence/domain/types';

describe('purchasing-market-observation-bridge (CR-COST-05 Opción A)', () => {
  let mockRepo: IMarketIntelligenceRepository;
  const savedObservations: any[] = [];
  const existingFingerprints = new Set<string>();

  const sampleMappings: ProductMapping[] = [
    {
      id: 'map-1',
      tenantId: 'tenant-123',
      tenantIngredientId: 'ing-chicken',
      marketProductId: 'mp-makro-chicken',
      matchStatus: 'confirmed',
      comparabilityGrade: 'HIGH',
      matchConfidence: 0.95,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
    {
      id: 'map-2',
      tenantId: 'tenant-123',
      tenantIngredientId: 'ing-rice',
      marketProductId: 'mp-makro-rice',
      matchStatus: 'suggested', // NOT confirmed -> D-010 must skip
      comparabilityGrade: 'HIGH',
      matchConfidence: 0.8,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-09-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    savedObservations.length = 0;
    existingFingerprints.clear();

    mockRepo = {
      saveObservation: vi.fn(async (obs, fp) => {
        savedObservations.push({ obs, fp });
        existingFingerprints.add(fp);
      }),
      findObservationByFingerprint: vi.fn(async (fp) => {
        if (existingFingerprints.has(fp)) {
          return { id: 'existing-obs' } as any;
        }
        return null;
      }),
    } as unknown as IMarketIntelligenceRepository;
  });

  it('records real private market observations for confirmed mapped lines with valid price (D-010 compliant)', async () => {
    const invoice = {
      id: 'inv-100',
      tenantId: 'tenant-123',
      supplierId: 'supp-avicola',
      supplierName: 'Avícola Canaria S.L.',
      invoiceNumber: 'FAC-2026-001',
      invoiceDate: '2026-11-20',
      items: [
        {
          id: 'line-1',
          itemId: 'ing-chicken',
          itemName: 'Pechuga de Pollo Fresca',
          unitPrice: 5.8,
          effectiveUnitCost: 6.1,
          quantity: 20,
          unit: 'kg',
          taxRate: 0.03,
        },
      ],
    };

    const result = await recordPurchaseObservationsFromInvoice({
      tenantId: 'tenant-123',
      invoice,
      mappings: sampleMappings,
      repository: mockRepo,
    });

    expect(result.recordedCount).toBe(1);
    expect(result.skippedCount).toBe(0);
    expect(mockRepo.saveObservation).toHaveBeenCalledTimes(1);

    const saved = savedObservations[0].obs;
    expect(saved.ownerTenantId).toBe('tenant-123');
    expect(saved.marketProductId).toBe('mp-makro-chicken');
    expect(saved.priceRaw).toBe(5.8);
    expect(saved.normalizedPriceExTax).toBe(6.1);
    expect(saved.normalizedUnit).toBe('EUR_PER_KG');
    expect(saved.observedAt).toBe('2026-11-20T12:00:00Z');
    expect(saved.rawPayload.provenance).toBe('REAL');
    expect(saved.rawPayload.supplierName).toBe('Avícola Canaria S.L.');
  });

  it('quarantines / skips lines without itemId or with zero/negative price (Rule D-010 anti-hallucination)', async () => {
    const invoice = {
      id: 'inv-101',
      tenantId: 'tenant-123',
      items: [
        {
          id: 'line-unassigned',
          itemId: '', // unassigned
          itemName: 'Trufa Negra',
          unitPrice: 120,
          quantity: 1,
        },
        {
          id: 'line-zero-price',
          itemId: 'ing-chicken',
          itemName: 'Muestra gratis',
          unitPrice: 0, // zero price
          quantity: 5,
        },
        {
          id: 'line-negative-qty',
          itemId: 'ing-chicken',
          itemName: 'Abono devolución',
          unitPrice: 5.5,
          quantity: -2, // negative qty
        },
        {
          id: 'line-unconfirmed-mapping',
          itemId: 'ing-rice', // status: 'pending' mapping -> not confirmed!
          itemName: 'Arroz Bomba',
          unitPrice: 1.45,
          quantity: 10,
        },
      ],
    };

    const result = await recordPurchaseObservationsFromInvoice({
      tenantId: 'tenant-123',
      invoice,
      mappings: sampleMappings,
      repository: mockRepo,
    });

    expect(result.recordedCount).toBe(0);
    expect(result.skippedCount).toBe(4);
    expect(mockRepo.saveObservation).not.toHaveBeenCalled();
  });

  it('guarantees idempotency by skipping observations with existing fingerprints', async () => {
    const invoice = {
      id: 'inv-102',
      tenantId: 'tenant-123',
      invoiceDate: '2026-11-21',
      items: [
        {
          id: 'line-chicken-1',
          itemId: 'ing-chicken',
          unitPrice: 5.9,
          quantity: 10,
        },
      ],
    };

    // First execution -> recorded
    const result1 = await recordPurchaseObservationsFromInvoice({
      tenantId: 'tenant-123',
      invoice,
      mappings: sampleMappings,
      repository: mockRepo,
    });
    expect(result1.recordedCount).toBe(1);

    // Second execution with identical payload -> skipped idempotently
    const result2 = await recordPurchaseObservationsFromInvoice({
      tenantId: 'tenant-123',
      invoice,
      mappings: sampleMappings,
      repository: mockRepo,
    });
    expect(result2.recordedCount).toBe(0);
    expect(result2.skippedCount).toBe(1);
    expect(mockRepo.saveObservation).toHaveBeenCalledTimes(1);
  });
});
