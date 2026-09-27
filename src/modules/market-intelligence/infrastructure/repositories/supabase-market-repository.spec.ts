import { describe, it, expect, vi } from 'vitest';
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
});
