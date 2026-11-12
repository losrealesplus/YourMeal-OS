import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { SupabaseMarketRepository } from './supabase-market-repository';

describe('SupabaseMarketRepository', () => {
  it('fetches and maps market sources from Supabase query builder', async () => {
    const mockData = [
      {
        id: 'src-makro',
        name: 'Makro',
        source_type: 'b2b_wholesale',
        default_tax_mode: 'ex_tax',
        default_region: 'ES_TENERIFE_TF',
        is_active: true,
        notes: 'HORECA baseline',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    } as any;

    const repo = new SupabaseMarketRepository(mockSupabase);
    const sources = await repo.getSources();

    expect(sources).toHaveLength(1);
    expect(sources[0]).toEqual({
      id: 'src-makro',
      name: 'Makro',
      sourceType: 'b2b_wholesale',
      defaultTaxMode: 'ex_tax',
      defaultRegion: 'ES_TENERIFE_TF',
      isActive: true,
      notes: 'HORECA baseline',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
  });

  it('fetches and maps product mappings by tenant', async () => {
    const mockData = [
      {
        id: 'map-001',
        tenant_id: 't-123',
        tenant_ingredient_id: 'ing-456',
        market_product_id: 'prod-789',
        match_confidence: 0.95,
        match_status: 'confirmed',
        comparability_grade: 'HIGH',
        verified_at: '2026-09-27T10:00:00Z',
        verified_by: 'usr-111',
        created_at: '2026-09-27T09:00:00Z',
        updated_at: '2026-09-27T10:00:00Z',
      },
    ];

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    } as any;

    const repo = new SupabaseMarketRepository(mockSupabase);
    const mappings = await repo.getMappingsByTenant('t-123');

    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toEqual({
      id: 'map-001',
      tenantId: 't-123',
      tenantIngredientId: 'ing-456',
      marketProductId: 'prod-789',
      matchConfidence: 0.95,
      matchStatus: 'confirmed',
      comparabilityGrade: 'HIGH',
      verifiedAt: '2026-09-27T10:00:00Z',
      verifiedBy: 'usr-111',
      createdAt: '2026-09-27T09:00:00Z',
      updatedAt: '2026-09-27T10:00:00Z',
    });
  });

  it('persists owner_tenant_id, raw_payload, imported_by on saveObservation and updates valid_to via UPDATE', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const updateEqMock = vi.fn().mockResolvedValue({ error: null });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'market_price_observations') {
          return {
            insert: insertMock,
            update: updateMock,
          };
        }
        return {};
      }),
    } as unknown as SupabaseClient<Database>;

    const repo = new SupabaseMarketRepository(mockSupabase);
    const obsId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const prodId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const tenantUuid = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const userUuid = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    await repo.saveObservation(
      {
        id: obsId,
        marketProductId: prodId,
        ownerTenantId: tenantUuid,
        observedAt: '2026-11-12T10:00:00Z',
        validFrom: '2026-11-12',
        validTo: '2026-11-26',
        priceRaw: 10.5,
        currency: 'EUR',
        taxMode: 'ex_tax',
        taxRate: 0,
        normalizedPriceExTax: 5.25,
        normalizedUnit: 'EUR_PER_KG',
        promotionStatus: 'standard',
        regionCode: 'ES_TENERIFE_TF',
        locationName: 'Adeje',
        captureMethod: 'catalog_import',
        qualityStatus: 'OBSERVED',
        rawPayload: { lineNumber: 2, rawLine: 'Makro,Pollo,10.5,2,kg' },
        importedBy: userUuid,
        createdAt: '2026-11-12T10:00:00Z',
      },
      'fp-sha256-test'
    );

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: obsId,
        market_product_id: prodId,
        owner_tenant_id: tenantUuid,
        raw_payload: { lineNumber: 2, rawLine: 'Makro,Pollo,10.5,2,kg' },
        imported_by: userUuid,
      })
    );

    await repo.updateObservationValidity(obsId, '2026-12-10', { lineNumber: 2, renewed: true });
    expect(updateMock).toHaveBeenCalledWith({
      valid_to: '2026-12-10',
      raw_payload: { lineNumber: 2, renewed: true },
    });
    expect(updateEqMock).toHaveBeenCalledWith('id', obsId);
  });

  it('retrieves 1:N mappings per ingredient without calling maybeSingle on non-unique columns', async () => {
    const maybeSingleSpy = vi.fn();
    const rows = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        tenant_id: 't-1',
        tenant_ingredient_id: 'ing-1',
        market_product_id: 'prod-makro',
        match_confidence: 1,
        match_status: 'confirmed',
        comparability_grade: 'HIGH',
        created_at: '2026-11-12T00:00:00Z',
        updated_at: '2026-11-12T02:00:00Z',
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        tenant_id: 't-1',
        tenant_ingredient_id: 'ing-1',
        market_product_id: 'prod-gm',
        match_confidence: 0.95,
        match_status: 'confirmed',
        comparability_grade: 'HIGH',
        created_at: '2026-11-12T00:00:00Z',
        updated_at: '2026-11-12T01:00:00Z',
      },
    ];

    const orderMock = vi.fn().mockResolvedValue({ data: rows, error: null });
    const eq2Mock = vi.fn().mockReturnValue({ order: orderMock, maybeSingle: maybeSingleSpy });
    const eq1Mock = vi.fn().mockReturnValue({ eq: eq2Mock });
    const selectMock = vi.fn().mockReturnValue({ eq: eq1Mock });

    const repo = new SupabaseMarketRepository({
      from: vi.fn().mockReturnValue({ select: selectMock }),
    } as unknown as SupabaseClient<Database>);

    const list = await repo.getMappingsForIngredient('t-1', 'ing-1');
    expect(list).toHaveLength(2);
    expect(maybeSingleSpy).not.toHaveBeenCalled();

    const compatSingle = await repo.getMapping('t-1', 'ing-1');
    expect(compatSingle?.marketProductId).toBe('prod-makro');
    expect(maybeSingleSpy).not.toHaveBeenCalled();
  });
});
