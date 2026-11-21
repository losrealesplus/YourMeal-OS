/**
 * CR-COST-05 PR5: Domain Contracts for Public Connectors and Isolated Adapters
 * Types, interfaces and result containers for decoupled market data ingestion.
 *
 * STRICT INVARIANT:
 * Connectors do not interact with the persistence layer directly.
 * They produce normalized observation payloads and quarantine diagnostic reports,
 * delegating persistence to MarketCatalogIngestionService.
 */

import {
  AiemStatus,
  FreightInclusion,
  RegionCode,
  SourceChannelType,
  TaxMode,
  TaxRegime,
  ThermalState,
} from './types';

export type MarketConnectorAccessMode =
  | 'public_pdf'
  | 'public_structured_feed'
  | 'authorized_feed_only'
  | 'manual_or_invoice_only';

export interface MarketConnectorMetadata {
  id: string; // e.g. 'connector-canarias-cash-diplo-pdf'
  sourceId: string; // Foreign key or identifier linking to market_sources (e.g. 'src-cash-diplo')
  name: string;
  channel: SourceChannelType;
  defaultRegion: RegionCode;
  defaultTaxMode: TaxMode;
  isPubliclyAvailable: boolean;
  requiresAuthentication: boolean;
  accessMode: MarketConnectorAccessMode;
  termsNotice?: string;
  targetUrl?: string;
}

export interface ConnectorFetchOptions {
  region?: RegionCode;
  establishmentId?: string;
  signal?: AbortSignal;
  scheduledRun?: boolean;
  maxItems?: number;
  customUrl?: string;
  observedAt?: string;
}

export interface RawObservationItem {
  productName: string;
  rawPrice: number;
  quantity?: number;
  unit?: string;
  gtin?: string;
  sku?: string;
  currency?: string;
  taxMode?: TaxMode;
  taxRate?: number;
  taxRegime?: TaxRegime;
  aiemStatus?: AiemStatus;
  aiemRate?: number;
  aiemAmountRaw?: number;
  freightInclusion?: FreightInclusion;
  freightCostRaw?: number;
  freeFreightMinOrderAmount?: number;
  regionCode?: RegionCode;
  observedAt?: string;
  confidence?: number;
  brand?: string;
  origin?: string;
  thermalState?: ThermalState;
  isCatchWeight?: boolean;
  taricCode?: string;
  volumeTiers?: Array<{
    minQuantity: number;
    tierPriceRaw: number;
    description?: string;
  }>;
  rawPayload?: Record<string, unknown>;
}

export interface QuarantinedConnectorItem {
  item?: Partial<RawObservationItem>;
  rawLine?: string;
  reason: string;
  rejectionCode: string;
}

export interface ConnectorFetchResult {
  success: boolean;
  sourceUrl?: string;
  documentHash?: string;
  items: RawObservationItem[];
  warnings?: string[];
  quarantinedItems?: QuarantinedConnectorItem[];
  failureReason?: string;
}

export interface IMarketSourceConnector {
  readonly metadata: MarketConnectorMetadata;
  fetchCatalog(options?: ConnectorFetchOptions): Promise<ConnectorFetchResult>;
}
