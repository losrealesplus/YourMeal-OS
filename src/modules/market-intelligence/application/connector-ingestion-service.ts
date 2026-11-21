/**
 * CR-COST-05 PR5: Connector Ingestion Service & Orchestration
 *
 * Coordinates execution of decoupled public connectors and authorized feeds,
 * adhering to RestrictedSourcePolicy, rate limits and D-010 anti-hallucination rules.
 *
 * Implements hybrid failure behavior:
 * - Structural Fail-Closed: 0 valid items, HTTP 429/401/timeout or parse crashes mark batch 'failed'.
 * - Partial Quarantine: Valid items are published under 'authorized_feed' (owner_tenant_id = null for global Core),
 *   while ambiguous lines are held in quarantine_payload without halting the batch.
 */

import {
  ConnectorFetchOptions,
  ConnectorFetchResult,
  IMarketSourceConnector,
  MarketConnectorMetadata,
} from '../domain/connector-types';
import { MarketBatchStatus, RegionCode } from '../domain/types';
import { MarketConnectorRegistry } from '../infrastructure/connectors/market-connector-registry';
import {
  PublicPdfCatalogConnector,
  PublicPdfCatalogConnectorConfig,
} from '../infrastructure/connectors/public-pdf-catalog-connector';
import {
  PublicStructuredFeedConnector,
  PublicStructuredFeedConnectorConfig,
} from '../infrastructure/connectors/public-structured-feed-connector';
import {
  RestrictedSourceError,
  RestrictedSourcePolicy,
} from '../infrastructure/connectors/restricted-source-policy';
import {
  IngestionOptions,
  MarketCatalogIngestionService,
  QuarantinedRow,
} from './market-catalog-ingestion-service';

export interface ConnectorExecutionOptions extends ConnectorFetchOptions {
  importedBy: string; // User UUID or system service identifier
  ownerTenantId?: string | null; // Defaults to null for global shared Core intelligence
  fileName?: string;
  localBuffer?: Uint8Array;
  localPayload?: string | Record<string, unknown>[];
}

export interface ConnectorExecutionReport {
  success: boolean;
  connectorId: string;
  sourceId: string;
  batchId?: string;
  batchStatus?: MarketBatchStatus;
  totalRows: number;
  validCount: number;
  quarantinedCount: number;
  createdObservationsCount: number;
  updatedObservationsCount: number;
  quarantinedRows: QuarantinedRow[];
  warnings?: string[];
  failureReason?: string;
}

export class ConnectorIngestionService {
  constructor(
    private readonly registry: MarketConnectorRegistry,
    private readonly ingestionService: MarketCatalogIngestionService,
  ) {}

  /**
   * Returns the underlying registry.
   */
  public getRegistry(): MarketConnectorRegistry {
    return this.registry;
  }

  /**
   * Executes a registered connector on-demand.
   */
  public async executeConnector(
    connectorId: string,
    options: ConnectorExecutionOptions,
  ): Promise<ConnectorExecutionReport> {
    const connector = this.registry.getConnector(connectorId);
    if (!connector) {
      return {
        success: false,
        connectorId,
        sourceId: 'unknown',
        totalRows: 0,
        validCount: 0,
        quarantinedCount: 0,
        createdObservationsCount: 0,
        updatedObservationsCount: 0,
        quarantinedRows: [],
        failureReason: `El conector '${connectorId}' no está registrado en el sistema.`,
      };
    }

    const { sourceId, defaultRegion } = connector.metadata;

    // 1. Policy check before any network or extraction attempt
    try {
      if (
        connector.metadata.accessMode === 'public_pdf' ||
        connector.metadata.accessMode === 'public_structured_feed'
      ) {
        RestrictedSourcePolicy.assertScrapingAllowed(sourceId);
      }
    } catch (err: unknown) {
      const reason = err instanceof RestrictedSourceError ? err.message : String(err);
      return {
        success: false,
        connectorId,
        sourceId,
        totalRows: 0,
        validCount: 0,
        quarantinedCount: 0,
        createdObservationsCount: 0,
        updatedObservationsCount: 0,
        quarantinedRows: [],
        failureReason: reason,
      };
    }

    // 2. Execute connector extraction
    let fetchResult: ConnectorFetchResult;
    try {
      const fetchOpts: any = {
        region: options.region || defaultRegion,
        establishmentId: options.establishmentId,
        signal: options.signal,
        scheduledRun: options.scheduledRun,
        maxItems: options.maxItems,
        customUrl: options.customUrl,
        observedAt: options.observedAt,
      };
      if (options.localBuffer) {
        fetchOpts.localPdfBuffer = options.localBuffer;
      }
      if (options.localPayload) {
        fetchOpts.localPayload = options.localPayload;
      }

      fetchResult = await connector.fetchCatalog(fetchOpts);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : String(err);
      fetchResult = {
        success: false,
        items: [],
        failureReason: `Excepción no controlada durante la ejecución del conector: ${reason}`,
      };
    }

    // 3. Ingest connector result through MarketCatalogIngestionService
    const ingestionOptions: IngestionOptions = {
      importedBy: options.importedBy,
      ownerTenantId: options.ownerTenantId ?? null, // Global catalog for all tenants by default
      defaultSourceId: sourceId,
      defaultRegion: options.region || defaultRegion,
      batchType: 'authorized_feed',
      captureMethod: 'authorized_feed',
      fileName: options.fileName || `${connectorId}-${new Date().toISOString().slice(0, 10)}`,
      fileChecksumSha256: fetchResult.documentHash,
    };

    const report = await this.ingestionService.ingestConnectorResult(fetchResult, ingestionOptions);

    return {
      success: report.batchStatus === 'completed' || report.batchStatus === 'partial_quarantine',
      connectorId,
      sourceId,
      batchId: report.batchId,
      batchStatus: report.batchStatus,
      totalRows: report.totalRows,
      validCount: report.validCount,
      quarantinedCount: report.quarantinedCount,
      createdObservationsCount: report.createdObservationsCount,
      updatedObservationsCount: report.updatedObservationsCount,
      quarantinedRows: report.quarantinedRows,
      warnings: fetchResult.warnings,
      failureReason: fetchResult.failureReason || (report.batchStatus === 'failed' ? 'El lote fue marcado como fallido.' : undefined),
    };
  }

  /**
   * Executes all publicly accessible connectors registered in the system sequentially.
   */
  public async executeAllPublicConnectors(
    options: ConnectorExecutionOptions,
  ): Promise<ConnectorExecutionReport[]> {
    const connectors = this.registry.listConnectors();
    const reports: ConnectorExecutionReport[] = [];

    for (const metadata of connectors) {
      if (
        metadata.isPubliclyAvailable &&
        (metadata.accessMode === 'public_pdf' || metadata.accessMode === 'public_structured_feed')
      ) {
        const report = await this.executeConnector(metadata.id, options);
        reports.push(report);
      }
    }

    return reports;
  }
}

/**
 * Factory creating default Canarian and open wholesale public connectors.
 */
export function createDefaultCanariasConnectors(overrides?: {
  fetchFn?: typeof fetch;
}): IMarketSourceConnector[] {
  const cashDiploConfig: PublicPdfCatalogConnectorConfig = {
    metadata: {
      id: 'connector-canarias-cash-diplo-pdf',
      sourceId: 'src-cash-diplo',
      name: 'Cash Diplo Canarias (Folleto Público Mayorista)',
      channel: 'cash_carry',
      defaultRegion: 'ES_CANARIAS_REGIONAL',
      defaultTaxMode: 'ex_tax',
      isPubliclyAvailable: true,
      requiresAuthentication: false,
      accessMode: 'public_pdf',
      termsNotice: 'Folletos quincenales de libre acceso público sin requerir sesión ni tarjeta.',
    },
    fetchFn: overrides?.fetchFn,
  };

  const cincoOceanosConfig: PublicPdfCatalogConnectorConfig = {
    metadata: {
      id: 'connector-canarias-5oceanos-pdf',
      sourceId: 'src-5oceanos',
      name: '5 Océanos Canarias (Catálogo Público Congelados)',
      channel: 'regional_distributor',
      defaultRegion: 'ES_CANARIAS_REGIONAL',
      defaultTaxMode: 'inc_tax',
      isPubliclyAvailable: true,
      requiresAuthentication: false,
      accessMode: 'public_pdf',
      termsNotice: 'Ofertas públicas de congelados y perecederos en Canarias.',
    },
    fetchFn: overrides?.fetchFn,
  };

  const openWholesaleConfig: PublicStructuredFeedConnectorConfig = {
    metadata: {
      id: 'connector-public-wholesale-feed',
      sourceId: 'src-open-wholesale',
      name: 'Mercado Mayorista Abierto (Feed JSON)',
      channel: 'b2b_wholesale',
      defaultRegion: 'ES_PENINSULA_MAINLAND',
      defaultTaxMode: 'ex_tax',
      isPubliclyAvailable: true,
      requiresAuthentication: false,
      accessMode: 'public_structured_feed',
      termsNotice: 'Feed abierto de referencia mayorista sin barreras de autenticación.',
    },
    format: 'json',
    fetchFn: overrides?.fetchFn,
  };

  return [
    new PublicPdfCatalogConnector(cashDiploConfig),
    new PublicPdfCatalogConnector(cincoOceanosConfig),
    new PublicStructuredFeedConnector(openWholesaleConfig),
  ];
}
