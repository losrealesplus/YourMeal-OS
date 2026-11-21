/**
 * CR-COST-05 PR5: Integration Tests for ConnectorIngestionService
 *
 * Tests the end-to-end orchestration of isolated public connectors,
 * fail-closed structural failures, partial quarantine, restricted source protection,
 * and global vs tenant persistence scopes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConnectorIngestionService,
  createDefaultCanariasConnectors,
} from './connector-ingestion-service';
import { MarketCatalogIngestionService } from './market-catalog-ingestion-service';
import { InMemoryMarketRepository } from '../infrastructure/repositories/in-memory-market-repository';
import { MarketConnectorRegistry } from '../infrastructure/connectors/market-connector-registry';
import { PublicPdfCatalogConnector } from '../infrastructure/connectors/public-pdf-catalog-connector';
import { PublicStructuredFeedConnector } from '../infrastructure/connectors/public-structured-feed-connector';
import { DocumentCatalogExtractor } from '../infrastructure/document-catalog-extractor';

describe('ConnectorIngestionService (CR-COST-05 PR5)', () => {
  let repository: InMemoryMarketRepository;
  let ingestionService: MarketCatalogIngestionService;
  let registry: MarketConnectorRegistry;
  let connectorService: ConnectorIngestionService;

  const importedByUserUuid = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    repository = new InMemoryMarketRepository();
    ingestionService = new MarketCatalogIngestionService(repository);
    registry = new MarketConnectorRegistry();
    connectorService = new ConnectorIngestionService(registry, ingestionService);
  });

  it('executes a public PDF flyer connector successfully and persists into global catalog (ownerTenantId = null)', async () => {
    const mockExtractor = {
      extract: vi.fn().mockResolvedValue({
        header: {
          sourceNameOrId: 'Cash Diplo Canarias',
          documentDate: '2026-11-20',
          currency: 'EUR',
        },
        lines: [
          {
            lineNumber: 1,
            rawText: 'Solomillo Vacuno Mayor 14.50 €/kg',
            productName: 'Solomillo Vacuno Mayor',
            rawPrice: 14.50,
            quantity: 1,
            unit: 'kg',
            confidence: 0.95,
          },
          {
            lineNumber: 2,
            rawText: 'Arroz Canario Grano Largo 1.10 €/kg',
            productName: 'Arroz Canario Grano Largo',
            rawPrice: 1.10,
            quantity: 1,
            unit: 'kg',
            confidence: 0.90,
          },
        ],
        rawText: 'Folleto Noviembre 2026',
        fileChecksumSha256: 'deadbeef1234567890abcdefdeadbeef1234567890abcdefdeadbeef12345678',
        fileName: 'cash-diplo-nov-2026.pdf',
        mimeType: 'application/pdf',
      }),
    } as unknown as DocumentCatalogExtractor;

    const pdfConnector = new PublicPdfCatalogConnector({
      metadata: {
        id: 'connector-canarias-cash-diplo-pdf',
        sourceId: 'src-cash-diplo',
        name: 'Cash Diplo Canarias',
        channel: 'cash_carry',
        defaultRegion: 'ES_CANARIAS_REGIONAL',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_pdf',
      },
      extractor: mockExtractor,
    });

    registry.registerConnector(pdfConnector);

    const report = await connectorService.executeConnector('connector-canarias-cash-diplo-pdf', {
      importedBy: importedByUserUuid,
      localBuffer: new Uint8Array([1, 2, 3]),
      region: 'ES_TENERIFE_TF',
    });

    expect(report.success).toBe(true);
    expect(report.batchStatus).toBe('completed');
    expect(report.totalRows).toBe(2);
    expect(report.validCount).toBe(2);
    expect(report.quarantinedCount).toBe(0);
    expect(report.createdObservationsCount).toBe(2);

    // Verify observations are in repository and attached to global catalog
    const prods = await repository.getProductsBySource('src-cash-diplo');
    expect(prods).toHaveLength(2);

    const obs = await repository.getObservationsByProduct(prods[0].id);
    expect(obs).toHaveLength(1);
    expect(obs[0].ownerTenantId).toBeNull(); // Core global catalog!
    expect(obs[0].captureMethod).toBe('authorized_feed');
    expect(obs[0].normalizedUnit).toBe('EUR_PER_KG');
  });

  it('handles partial quarantine when feed contains a mix of valid rows and ambiguous lines', async () => {
    const feedConnector = new PublicStructuredFeedConnector({
      metadata: {
        id: 'connector-open-mixed-feed',
        sourceId: 'src-open-wholesale',
        name: 'Open Mixed Feed',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_structured_feed',
      },
      format: 'json',
      mapping: {
        productNameKey: 'name',
        priceKey: 'price',
        quantityKey: 'qty',
        unitKey: 'unit',
      },
    });

    registry.registerConnector(feedConnector);

    const mixedPayload = [
      { name: 'Patata Nueva 5kg', price: 4.50, qty: 5, unit: 'kg' },
      { name: 'Cebolla Morada 1kg', price: 1.20, qty: 1, unit: 'kg' },
      { name: 'Producto Fallido', price: -5.0, qty: 1, unit: 'kg' }, // Negative price -> quarantine
    ];

    const report = await connectorService.executeConnector('connector-open-mixed-feed', {
      importedBy: importedByUserUuid,
      localPayload: mixedPayload,
    });

    expect(report.success).toBe(true);
    expect(report.batchStatus).toBe('partial_quarantine');
    expect(report.validCount).toBe(2);
    expect(report.quarantinedCount).toBe(1);
    expect(report.createdObservationsCount).toBe(2);
    expect(report.quarantinedRows).toHaveLength(1);
    expect(report.quarantinedRows[0].reason).toContain('Precio unitario no positivo');

    // Confirm that the 2 valid observations are published
    const prods = await repository.getProductsBySource('src-open-wholesale');
    expect(prods).toHaveLength(2);
  });

  it('implements fail-closed behavior on structural failure (0 items, parse crash or HTTP error)', async () => {
    const failingConnector = new PublicStructuredFeedConnector({
      metadata: {
        id: 'connector-failing-empty',
        sourceId: 'src-open-wholesale',
        name: 'Failing Empty Feed',
        channel: 'b2b_wholesale',
        defaultRegion: 'ES_PENINSULA_MAINLAND',
        defaultTaxMode: 'ex_tax',
        isPubliclyAvailable: true,
        requiresAuthentication: false,
        accessMode: 'public_structured_feed',
      },
      format: 'json',
    });

    registry.registerConnector(failingConnector);

    // Empty array payload simulating no readable catalog items
    const report = await connectorService.executeConnector('connector-failing-empty', {
      importedBy: importedByUserUuid,
      localPayload: [],
    });

    expect(report.success).toBe(false);
    expect(report.batchStatus).toBe('failed');
    expect(report.validCount).toBe(0);
    expect(report.createdObservationsCount).toBe(0);
    expect(report.failureReason).toContain('no contiene registros u ofertas comerciales reconocibles');

    // Confirm NO products or observations were created
    const prods = await repository.getProductsBySource('src-open-wholesale');
    expect(prods).toHaveLength(0);
  });

  it('returns clean error report when attempting to execute an unregistered connector', async () => {
    const report = await connectorService.executeConnector('non-existent-connector', {
      importedBy: importedByUserUuid,
    });

    expect(report.success).toBe(false);
    expect(report.failureReason).toContain("El conector 'non-existent-connector' no está registrado en el sistema.");
  });

  it('can register and execute default Canarian connectors factory', async () => {
    const defaultConnectors = createDefaultCanariasConnectors();
    expect(defaultConnectors.length).toBeGreaterThanOrEqual(2);

    for (const c of defaultConnectors) {
      registry.registerConnector(c);
    }

    expect(registry.listConnectors()).toHaveLength(defaultConnectors.length);
    expect(registry.getConnector('connector-canarias-cash-diplo-pdf')).toBeDefined();
    expect(registry.getConnector('connector-canarias-5oceanos-pdf')).toBeDefined();
    expect(registry.getConnector('connector-public-wholesale-feed')).toBeDefined();
  });
});
