import { describe, it, expect, vi } from 'vitest';
import {
  OpenFoodFactsClient,
  OpenFoodFactsProductData,
} from './open-food-facts-client';

describe('CR-COST-05 PR4 · OpenFoodFactsClient (Physical Catalog Metadata Only)', () => {
  const sampleGtin = '8410076472018';

  it('rejects invalid or malformed GTINs immediately without making network calls', async () => {
    const fetchMock = vi.fn();
    const client = new OpenFoodFactsClient({ fetchFn: fetchMock });

    const result = await client.fetchProductByGtin('invalid_gtin_123');
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches and normalizes physical package dimensions and brand from OFF API', async () => {
    const mockApiResponse = {
      status: 1,
      code: sampleGtin,
      product: {
        product_name: 'Atún Claro en Aceite de Oliva',
        brands: 'Calvo',
        categories_tags: ['en:canned-tunas', 'en:canned-fishes'],
        quantity: '3 x 80 g',
        product_quantity: 240,
        product_quantity_unit: 'g',
        packaging: 'lata, pack',
        origins: 'España',
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const client = new OpenFoodFactsClient({
      fetchFn: fetchMock,
      cacheTtlMs: 60000,
    });

    const data = await client.fetchProductByGtin(sampleGtin);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(data).toBeDefined();
    expect(data?.gtin).toBe(sampleGtin);
    expect(data?.brand).toBe('Calvo');
    expect(data?.netContentQty).toBe(240);
    expect(data?.netContentUnit).toBe('g');
    expect(data?.packPresentation).toBe('can');
    expect(data?.origin).toBe('España');

    // STRICT INVARIANT: Ensure NO price fields exist in the returned data object
    expect((data as unknown as Record<string, unknown>).price).toBeUndefined();
    expect((data as unknown as Record<string, unknown>).unitPrice).toBeUndefined();
    expect((data as unknown as Record<string, unknown>).taxRate).toBeUndefined();
  });

  it('caches GTIN lookup in memory to avoid duplicate external HTTP requests', async () => {
    const mockApiResponse = {
      status: 1,
      code: sampleGtin,
      product: {
        product_name: 'Pechuga Pollo',
        brands: 'Granja Real',
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const client = new OpenFoodFactsClient({
      fetchFn: fetchMock,
      cacheTtlMs: 60000,
    });

    const first = await client.fetchProductByGtin(sampleGtin);
    const second = await client.fetchProductByGtin(sampleGtin);

    expect(fetchMock).toHaveBeenCalledTimes(1); // Cached!
    expect(first).toEqual(second);
  });

  it('handles non-existent products gracefully (returns null)', async () => {
    const mockApiResponse = {
      status: 0,
      status_verbose: 'product not found',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const client = new OpenFoodFactsClient({ fetchFn: fetchMock });
    const result = await client.fetchProductByGtin(sampleGtin);

    expect(result).toBeNull();
  });

  it('handles network timeouts or fetch errors gracefully without throwing', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const client = new OpenFoodFactsClient({
      fetchFn: fetchMock,
      timeoutMs: 100,
    });

    const result = await client.fetchProductByGtin(sampleGtin);
    expect(result).toBeNull();
  });
});
