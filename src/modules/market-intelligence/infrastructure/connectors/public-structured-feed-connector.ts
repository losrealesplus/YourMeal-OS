/**
 * CR-COST-05 PR5: Public Structured Feed Connector (Open JSON / CSV Feeds)
 *
 * Ingests publicly available structured feeds (JSON endpoints, open datasets, public CSV listings)
 * from approved open data providers or public wholesale pricing boards.
 *
 * STRICT INVARIANTS:
 * 1. Checks RestrictedSourcePolicy to prevent unauthorized access.
 * 2. Normalizes open feed records into canonical RawObservationItem.
 * 3. Enforces D-010 physical and fiscal integrity checks (confidence, quantity > 0, unit, price > 0).
 * 4. Places malformed or ambiguous items into quarantinedItems with Spanish diagnostic reasons.
 */

import {
  ConnectorFetchOptions,
  ConnectorFetchResult,
  IMarketSourceConnector,
  MarketConnectorMetadata,
  QuarantinedConnectorItem,
  RawObservationItem,
} from '../../domain/connector-types';
import { validateExtractedLine } from '../../domain/document-extraction';
import { RegionCode, TaxMode } from '../../domain/types';
import { calculateFileSha256 } from '../document-catalog-extractor';
import { BaseHttpConnector, BaseHttpConnectorOptions } from './base-http-connector';
import { RestrictedSourcePolicy } from './restricted-source-policy';

export type FeedFormat = 'json' | 'csv';

export interface FeedFieldMapping {
  productNameKey: string;
  priceKey: string;
  quantityKey?: string;
  unitKey?: string;
  gtinKey?: string;
  skuKey?: string;
  brandKey?: string;
  taxRateKey?: string;
  taxModeKey?: string;
  observedAtKey?: string;
  currencyKey?: string;
}

export interface PublicStructuredFeedConnectorConfig extends BaseHttpConnectorOptions {
  metadata: MarketConnectorMetadata;
  format?: FeedFormat;
  defaultFeedUrl?: string;
  mapping?: Partial<FeedFieldMapping>;
}

export class PublicStructuredFeedConnector extends BaseHttpConnector implements IMarketSourceConnector {
  public readonly metadata: MarketConnectorMetadata;
  public readonly format: FeedFormat;
  private readonly defaultFeedUrl?: string;
  private readonly mapping: FeedFieldMapping;

  constructor(config: PublicStructuredFeedConnectorConfig) {
    super(config);
    this.metadata = config.metadata;
    this.format = config.format || 'json';
    this.defaultFeedUrl = config.defaultFeedUrl || config.metadata.targetUrl;

    if (
      this.metadata.accessMode !== 'public_structured_feed' &&
      this.metadata.accessMode !== 'authorized_feed_only'
    ) {
      throw new Error(
        `PublicStructuredFeedConnector requiere accessMode = 'public_structured_feed' o 'authorized_feed_only' (recibido: ${this.metadata.accessMode})`
      );
    }

    this.mapping = {
      productNameKey: config.mapping?.productNameKey || 'name',
      priceKey: config.mapping?.priceKey || 'price',
      quantityKey: config.mapping?.quantityKey || 'quantity',
      unitKey: config.mapping?.unitKey || 'unit',
      gtinKey: config.mapping?.gtinKey || 'gtin',
      skuKey: config.mapping?.skuKey || 'sku',
      brandKey: config.mapping?.brandKey || 'brand',
      taxRateKey: config.mapping?.taxRateKey || 'taxRate',
      taxModeKey: config.mapping?.taxModeKey || 'taxMode',
      observedAtKey: config.mapping?.observedAtKey || 'observedAt',
      currencyKey: config.mapping?.currencyKey || 'currency',
    };
  }

  /**
   * Fetches the open feed and parses rows into standardized observation items.
   */
  public async fetchCatalog(
    options: ConnectorFetchOptions & { localPayload?: string | Record<string, unknown>[] } = {},
  ): Promise<ConnectorFetchResult> {
    RestrictedSourcePolicy.assertScrapingAllowed(this.metadata.sourceId);

    const targetUrl = options.customUrl || this.defaultFeedUrl;
    let rawPayloadText: string;
    let rawEntries: Record<string, unknown>[] = [];

    try {
      if (options.localPayload) {
        if (typeof options.localPayload === 'string') {
          rawPayloadText = options.localPayload;
          if (this.format === 'json') {
            const parsed = JSON.parse(rawPayloadText);
            rawEntries = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || []);
          } else {
            rawEntries = this.parseSimpleCsv(rawPayloadText);
          }
        } else if (Array.isArray(options.localPayload)) {
          rawEntries = options.localPayload;
          rawPayloadText = JSON.stringify(rawEntries);
        } else {
          rawPayloadText = '';
        }
      } else {
        if (!targetUrl) {
          return {
            success: false,
            items: [],
            failureReason: `No se especificó URL de consulta para el conector estructurado '${this.metadata.id}'.`,
          };
        }

        if (this.format === 'json') {
          const { data, status } = await this.fetchJson<unknown>(targetUrl, options.signal);
          rawPayloadText = JSON.stringify(data);
          if (Array.isArray(data)) {
            rawEntries = data as Record<string, unknown>[];
          } else if (data && typeof data === 'object') {
            const container = data as Record<string, unknown>;
            rawEntries = (container.items || container.data || container.products || []) as Record<string, unknown>[];
          }
        } else {
          const { text } = await this.fetchText(targetUrl, options.signal);
          rawPayloadText = text;
          rawEntries = this.parseSimpleCsv(text);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        sourceUrl: targetUrl,
        items: [],
        failureReason: `Fallo HTTP o de conexión en feed estructurado: ${message}`,
      };
    }

    const payloadHash = calculateFileSha256(rawPayloadText || JSON.stringify(rawEntries));

    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      return {
        success: false,
        sourceUrl: targetUrl,
        documentHash: payloadHash,
        items: [],
        failureReason: `El feed estructurado no contiene registros u ofertas comerciales reconocibles.`,
      };
    }

    const effectiveRegion: RegionCode = options.region || this.metadata.defaultRegion;
    const effectiveTaxMode: TaxMode = this.metadata.defaultTaxMode;
    const fallbackObservedAt = options.observedAt || new Date().toISOString().slice(0, 10);

    const items: RawObservationItem[] = [];
    const quarantinedItems: QuarantinedConnectorItem[] = [];
    const warnings: string[] = [];

    let lineIndex = 0;
    for (const entry of rawEntries) {
      lineIndex++;
      const productName = String(this.getValue(entry, this.mapping.productNameKey) || '').trim();
      const rawPriceStr = this.getValue(entry, this.mapping.priceKey);
      const rawPrice = typeof rawPriceStr === 'number' ? rawPriceStr : parseFloat(String(rawPriceStr).replace(',', '.'));
      
      const quantityStr = this.getValue(entry, this.mapping.quantityKey);
      const quantity = quantityStr !== undefined && quantityStr !== null && quantityStr !== ''
        ? (typeof quantityStr === 'number' ? quantityStr : parseFloat(String(quantityStr).replace(',', '.')))
        : 1;

      const unit = String(this.getValue(entry, this.mapping.unitKey) || 'ud').trim();
      const gtin = this.getValue(entry, this.mapping.gtinKey) ? String(this.getValue(entry, this.mapping.gtinKey)).trim() : undefined;
      const sku = this.getValue(entry, this.mapping.skuKey) ? String(this.getValue(entry, this.mapping.skuKey)).trim() : undefined;
      const brand = this.getValue(entry, this.mapping.brandKey) ? String(this.getValue(entry, this.mapping.brandKey)).trim() : undefined;
      const observedAt = String(this.getValue(entry, this.mapping.observedAtKey) || fallbackObservedAt).trim().slice(0, 10);
      const currency = String(this.getValue(entry, this.mapping.currencyKey) || 'EUR').trim();

      const rawTaxMode = this.getValue(entry, this.mapping.taxModeKey);
      const taxMode: TaxMode = (rawTaxMode === 'ex_tax' || rawTaxMode === 'inc_tax') ? rawTaxMode : effectiveTaxMode;

      const taxRateVal = this.getValue(entry, this.mapping.taxRateKey);
      const taxRate = taxRateVal !== undefined && taxRateVal !== null && taxRateVal !== ''
        ? (typeof taxRateVal === 'number' ? taxRateVal : parseFloat(String(taxRateVal).replace(',', '.')))
        : undefined;

      // Validate through D-010 criteria
      const validation = validateExtractedLine({
        lineNumber: lineIndex,
        rawText: JSON.stringify(entry),
        productName,
        rawPrice,
        quantity,
        unit,
        gtin,
        sku,
        taxMode,
        taxRate,
        confidence: 1.0, // Structured feed entries inherently have high extraction certainty
      });

      if (!validation.isValid) {
        quarantinedItems.push({
          rawLine: JSON.stringify(entry),
          reason: validation.reason || 'Registro del feed no cumple las reglas de consistencia de precio y unidad física.',
          rejectionCode: 'D010_FEED_ITEM_INVALID',
          item: {
            productName,
            rawPrice: Number.isFinite(rawPrice) ? rawPrice : 0,
            quantity,
            unit,
            gtin,
          },
        });
        continue;
      }

      items.push({
        productName,
        rawPrice,
        quantity,
        unit,
        gtin,
        sku,
        brand,
        currency,
        taxMode,
        taxRate,
        regionCode: effectiveRegion,
        observedAt,
        confidence: 1.0,
        rawPayload: {
          rawEntry: entry,
          sourceConnectorId: this.metadata.id,
          payloadHash,
        },
      });
    }

    if (quarantinedItems.length > 0) {
      warnings.push(`${quarantinedItems.length} registros del feed fueron derivados a cuarentena por datos incompletos o inválidos.`);
    }

    return {
      success: items.length > 0,
      sourceUrl: targetUrl,
      documentHash: payloadHash,
      items,
      quarantinedItems,
      warnings,
      failureReason: items.length === 0 ? 'Todos los registros del feed estructurado fueron derivados a cuarentena.' : undefined,
    };
  }

  private getValue(obj: Record<string, unknown>, key?: string): unknown {
    if (!key || !obj) return undefined;
    return obj[key];
  }

  private parseSimpleCsv(csvText: string): Record<string, unknown>[] {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());

    const result: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      const row: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx];
      });
      result.push(row);
    }
    return result;
  }
}
