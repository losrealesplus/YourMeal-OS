/**
 * CR-COST-05 PR5: Tests for Public Connectors (PDF, Structured Feeds & Registry)
 */

import { describe, it, expect, vi } from 'vitest';
import { PublicPdfCatalogConnector } from './public-pdf-catalog-connector';
import { PublicStructuredFeedConnector } from './public-structured-feed-connector';
import { MarketConnectorRegistry } from './market-connector-registry';
import { DocumentCatalogExtractor } from '../document-catalog-extractor';
import { RestrictedSourceError } from './restricted-source-policy';

describe('PublicPdfCatalogConnector', () => {
  it('blocks execution when configured with a restricted source requiring login/feed', async () => {
    const connector = new PublicPdfCatalogConnector({
      metadata: {
        id: 'illegal-makro-scraper',
        sourceId: 'src-makro',
        name: 'Makro Scraper',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: false,
        requiresAuthentication: true,
        accessMode: 'public_pdf',
      },
    });

    await expect(connector.fetchCatalog()).rejects.toThrow(RestrictedSourceError);
  });

  it('extracts valid flyer lines, marks Canarian island region, and sends ambiguous lines to quarantine', async () => {
    // Mock extractor returning lines resembling a Canarian Cash Diplo / 5 Océanos flyer
    const mockExtractor = {
      extract: vi.fn().mockResolvedValue({
        header: {
          sourceNameOrId: 'Cash Diplo Canarias',
          documentDate: '2026-11-15',
          currency: 'EUR',
        },
        lines: [
          {
            lineNumber: 1,
            rawText: 'Pechuga de Pollo Fresca Entera 5.45 €/kg',
            productName: 'Pechuga de Pollo Fresca Entera',
            rawPrice: 5.45,
            quantity: 1,
            unit: 'kg',
            confidence: 0.95,
          },
          {
            lineNumber: 2,
            rawText: 'Aceite de Oliva Virgen Extra 5L Garrafa 34.50 €',
            productName: 'Aceite de Oliva Virgen Extra 5L',
            rawPrice: 34.50,
            quantity: 5,
            unit: 'l',
            confidence: 0.92,
          },
          {
            lineNumber: 3,
            rawText: 'Línea borrosa ilegible 0.00 €',
            productName: '',
            rawPrice: 0.0,
            quantity: 0,
            unit: '',
            confidence: 0.45, // < 0.70 and invalid price
          },
        ],
        rawText: 'Folleto Ofertas Canarias Noviembre 2026',
        fileChecksumSha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
        fileName: 'cash-diplo-canarias-nov-2026.pdf',
        mimeType: 'application/pdf',
      }),
    } as unknown as DocumentCatalogExtractor;

    const connector = new PublicPdfCatalogConnector({
      metadata: {
        id: 'connector-canarias-cash-diplo-pdf',
        sourceId: 'src-cash-diplo',
        name: 'Cash Diplo Canarias (Folleto Público)',
        channel: 'cash_carry',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_pdf',
      },
      extractor: mockExtractor,
    });

    const dummyBuffer = new Uint8Array([1, 2, 3, 4]);
    const result = await connector.fetchCatalog({
      localPdfBuffer: dummyBuffer,
      region: 'ES_TENERIFE_TF', // Specific island override
    });

    expect(result.success).toBe(true);
    expect(result.documentHash).toBeDefined();
    expect(result.items).toHaveLength(2);
    expect(result.quarantinedItems).toHaveLength(1);

    // Verify first extracted item
    const item1 = result.items[0];
    expect(item1.productName).toBe('Pechuga de Pollo Fresca Entera');
    expect(item1.rawPrice).toBe(5.45);
    expect(item1.quantity).toBe(1);
    expect(item1.unit).toBe('kg');
    expect(item1.regionCode).toBe('ES_TENERIFE_TF');
    expect(item1.taxMode).toBe('ex_tax');
    expect(item1.observedAt).toBe('2026-11-15');

    // Verify quarantined item
    const quarantined = result.quarantinedItems![0];
    expect(quarantined.rejectionCode).toBe('D010_LINE_VALIDATION_FAILED');
    expect(quarantined.reason).toContain('Baja confianza OCR');
    expect(quarantined.reason).toContain('Precio unitario no positivo');
  });

  it('fails with Spanish diagnostic reason if PDF contains zero readable items', async () => {
    const mockExtractor = {
      extract: vi.fn().mockResolvedValue({
        header: {},
        lines: [],
        rawText: '',
        fileChecksumSha256: 'empty-sha',
        fileName: 'empty.pdf',
        mimeType: 'application/pdf',
      }),
    } as unknown as DocumentCatalogExtractor;

    const connector = new PublicPdfCatalogConnector({
      metadata: {
        id: 'connector-empty-pdf',
        sourceId: 'src-cash-diplo',
        name: 'Empty PDF',
        channel: 'cash_carry',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_pdf',
      },
      extractor: mockExtractor,
    });

    const result = await connector.fetchCatalog({ localPdfBuffer: new Uint8Array([0]) });
    expect(result.success).toBe(false);
    expect(result.items).toHaveLength(0);
    expect(result.failureReason).toContain('no contiene líneas legibles ni ofertas comerciales válidas');
  });
});

describe('PublicStructuredFeedConnector', () => {
  it('parses open JSON feed, applies field mapping and separates valid items from quarantine', async () => {
    const mockJsonFeed = [
      {
        nombre: 'Arroz Redondo Extra 1kg',
        precio: 1.25,
        cantidad: 1,
        medida: 'kg',
        ean: '8410000000016',
        marca: 'SOS',
      },
      {
        nombre: 'Leche Entera 1L',
        precio: '0,99',
        cantidad: 1,
        medida: 'l',
        ean: '8410000000023',
      },
      {
        nombre: 'Producto Sin Precio',
        precio: 0,
        cantidad: 1,
        medida: 'ud',
      },
    ];

    const connector = new PublicStructuredFeedConnector({
      metadata: {
        id: 'connector-open-wholesale-json',
        sourceId: 'src-open-wholesale',
        name: 'Open Wholesale JSON',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_structured_feed',
      },
      format: 'json',
      mapping: {
        productNameKey: 'nombre',
        priceKey: 'precio',
        quantityKey: 'cantidad',
        unitKey: 'medida',
        gtinKey: 'ean',
        brandKey: 'marca',
      },
    });

    const result = await connector.fetchCatalog({
      localPayload: mockJsonFeed,
      region: 'ES_GRAN_CANARIA_GC',
    });

    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.quarantinedItems).toHaveLength(1);

    expect(result.items[0].productName).toBe('Arroz Redondo Extra 1kg');
    expect(result.items[0].rawPrice).toBe(1.25);
    expect(result.items[0].unit).toBe('kg');
    expect(result.items[0].regionCode).toBe('ES_GRAN_CANARIA_GC');

    expect(result.items[1].productName).toBe('Leche Entera 1L');
    expect(result.items[1].rawPrice).toBe(0.99);

    expect(result.quarantinedItems![0].rejectionCode).toBe('D010_FEED_ITEM_INVALID');
    expect(result.quarantinedItems![0].reason).toContain('Precio unitario no positivo');
  });

  it('parses open CSV feed with delimiter detection', async () => {
    const csvContent = `nombre;precio;cantidad;medida
Tomate Canario Rama;1.85;1;kg
Plátano de Canarias IGP;1.40;1;kg`;

    const connector = new PublicStructuredFeedConnector({
      metadata: {
        id: 'connector-open-csv',
        sourceId: 'src-open-wholesale',
        name: 'Open CSV',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_structured_feed',
      },
      format: 'csv',
      mapping: {
        productNameKey: 'nombre',
        priceKey: 'precio',
        quantityKey: 'cantidad',
        unitKey: 'medida',
      },
    });

    const result = await connector.fetchCatalog({ localPayload: csvContent });
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].productName).toBe('Tomate Canario Rama');
    expect(result.items[0].rawPrice).toBe(1.85);
    expect(result.items[1].productName).toBe('Plátano de Canarias IGP');
    expect(result.items[1].rawPrice).toBe(1.40);
  });
});

describe('MarketConnectorRegistry', () => {
  it('registers and looks up public connectors', () => {
    const registry = new MarketConnectorRegistry();
    const connector = new PublicStructuredFeedConnector({
      metadata: {
        id: 'test-connector',
        sourceId: 'src-open-wholesale',
        name: 'Test Registry Connector',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_structured_feed',
      },
    });

    registry.registerConnector(connector);
    expect(registry.getConnector('test-connector')).toBe(connector);
    expect(registry.listConnectors()).toHaveLength(1);
    expect(registry.getConnectorsBySource('src-open-wholesale')).toHaveLength(1);
  });

  it('refuses registration of restricted sources for public scraping modes', () => {
    const registry = new MarketConnectorRegistry();
    const restrictedConnector = new PublicPdfCatalogConnector({
      metadata: {
        id: 'illegal-mercadona-pdf',
        sourceId: 'src-mercadona',
        name: 'Mercadona PDF',
        channel: 'retail_store',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'inc_tax',
        isPubliclyAvailable: false,
        requiresAuthentication: true,
        accessMode: 'public_pdf',
      },
    });

    expect(() => registry.registerConnector(restrictedConnector)).toThrow(RestrictedSourceError);
  });
});
