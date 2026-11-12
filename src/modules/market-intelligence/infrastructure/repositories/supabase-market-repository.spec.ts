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

  it("preserves null taxRate/normalizedPriceExTax, sanitizes public rawPayload, and supports establishments & coverages", async () => {
    const insertObsMock = vi.fn().mockResolvedValue({ error: null });
    const insertEstMock = vi.fn().mockResolvedValue({ error: null });
    const insertCovMock = vi.fn().mockResolvedValue({ error: null });
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "11111111-1111-4111-8111-111111111111",
            market_product_id: "22222222-2222-4222-8222-222222222222",
            owner_tenant_id: null,
            observed_at: "2026-11-12T10:00:00Z",
            valid_from: "2026-11-12",
            valid_to: null,
            price_raw: 3.34,
            currency: "EUR",
            tax_mode: "unknown",
            tax_rate: null,
            tax_regime: "UNKNOWN",
            normalized_price_ex_tax: null,
            normalized_unit: "EUR_PER_KG",
            promotion_status: "standard",
            region_code: "ES_CANARIAS_REGIONAL",
            observation_postal_code: "08001",
            capture_method: "catalog_import",
            quality_status: "OBSERVED",
            created_at: "2026-11-12T10:00:00Z",
          },
          error: null,
        }),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    const repo = new SupabaseMarketRepository({
      from: vi.fn((table: string) => {
        if (table === "market_price_observations") {
          return { insert: insertObsMock, select: selectMock };
        }
        if (table === "market_establishments") {
          return { insert: insertEstMock, select: selectMock };
        }
        if (table === "market_delivery_coverages") {
          return { insert: insertCovMock, select: selectMock };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }),
    } as unknown as SupabaseClient<Database>);

    await repo.saveObservation(
      {
        id: "11111111-1111-4111-8111-111111111111",
        marketProductId: "22222222-2222-4222-8222-222222222222",
        ownerTenantId: null,
        observedAt: "2026-11-12T10:00:00Z",
        validFrom: "2026-11-12",
        validTo: null,
        priceRaw: 3.34,
        currency: "EUR",
        taxMode: "unknown",
        taxRate: null,
        normalizedPriceExTax: null,
        normalizedUnit: "EUR_PER_KG",
        normalizationStatus: "tax_unknown",
        promotionStatus: "standard",
        regionCode: "ES_CANARIAS_REGIONAL",
        observationPostalCode: "08001",
        captureMethod: "catalog_import",
        qualityStatus: "OBSERVED",
        rawPayload: {
          tenantId: "must-be-stripped",
          lineNumber: 3,
        },
        createdAt: "2026-11-12T10:00:00Z",
      },
      "fp-block2-public",
    );

    expect(insertObsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tax_rate: null,
        normalized_price_ex_tax: null,
        observation_postal_code: "08001",
        raw_payload: { lineNumber: 3 },
      }),
    );

    const mapped = await repo.getObservationById("11111111-1111-4111-8111-111111111111");
    expect(mapped?.taxRate).toBeNull();
    expect(mapped?.normalizedPriceExTax).toBeNull();
    expect(mapped?.observationPostalCode).toBe("08001");

    await repo.saveEstablishment({
      id: "33333333-3333-4333-8333-333333333333",
      sourceId: "src-makro",
      ownerTenantId: null,
      establishmentCode: "MAKRO-TF-ADEJE",
      name: "Makro Adeje",
      channelKind: "cash_carry",
      countryCode: "ES",
      islandCode: "TF",
      postalCode: "38670",
      isActive: true,
      createdAt: "2026-11-12T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    });
    expect(insertEstMock).toHaveBeenCalledTimes(1);

    await repo.saveCoverage({
      id: "44444444-4444-4444-8444-444444444444",
      sourceId: "src-makro",
      establishmentId: "33333333-3333-4333-8333-333333333333",
      ownerTenantId: null,
      fulfillmentMode: "delivery",
      coverageStatus: "documented_available",
      countryCode: "ES",
      islandCode: "TF",
      postalCodePrefix: "386",
      createdAt: "2026-11-12T00:00:00Z",
      updatedAt: "2026-11-12T00:00:00Z",
    });
    expect(insertCovMock).toHaveBeenCalledTimes(1);
  });
});
