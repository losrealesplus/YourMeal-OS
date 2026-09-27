/**
 * CR-COST-05: Market Catalog Ingestion Service (MVP 0/1)
 * Validates, normalizes, fingerprints and persists price catalog observations.
 */

import { PriceNormalizer } from '../domain/price-normalizer';
import {
  CaptureMethod,
  MarketPriceObservation,
  MarketProduct,
  PromotionStatus,
  QualityStatus,
  RegionCode,
  StandardUnit,
  TaxMode,
  ThermalState,
} from '../domain/types';
import { CsvCatalogParser, RawCsvRow } from '../infrastructure/csv-catalog-parser';
import { IMarketIntelligenceRepository } from '../infrastructure/repositories/market-repository-interface';

export interface IngestionOptions {
  fileName?: string;
  importedBy: string; // User UUID
  captureMethod?: CaptureMethod;
  defaultRegion?: RegionCode;
}

export interface QuarantinedRow {
  lineNumber: number;
  rawLine: string;
  reason: string;
  fields: Record<string, string>;
}

export interface IngestionReport {
  totalRows: number;
  validCount: number;
  quarantinedCount: number;
  createdObservationsCount: number;
  updatedObservationsCount: number;
  quarantinedRows: QuarantinedRow[];
}

export class MarketCatalogIngestionService {
  constructor(private readonly repository: IMarketIntelligenceRepository) {}

  /**
   * Ingests a CSV/TSV price catalog string.
   */
  public async ingestCsv(
    csvContent: string,
    options: IngestionOptions
  ): Promise<IngestionReport> {
    const parseResult = CsvCatalogParser.parse(csvContent);
    return this.processRows(parseResult.rows, options);
  }

  /**
   * Ingests a single assisted manual entry (Level 0).
   */
  public async ingestManualEntry(
    entry: {
      sourceIdOrName: string;
      productName: string;
      rawPrice: number;
      quantity: number;
      unit: string;
      taxMode?: TaxMode;
      taxRate?: number;
      regionCode?: RegionCode;
      thermalState?: ThermalState;
      cutSpec?: string;
      qualityGrade?: string;
      brand?: string;
      locationName?: string;
      promotionStatus?: PromotionStatus;
      netDrainedQuantity?: number;
    },
    options: IngestionOptions
  ): Promise<{ observationId: string; normalizedPriceExTax: number }> {
    const row: RawCsvRow = {
      lineNumber: 1,
      rawLine: JSON.stringify(entry),
      data: {
        source_name: entry.sourceIdOrName,
        product_name: entry.productName,
        raw_price: String(entry.rawPrice),
        quantity: String(entry.quantity),
        unit: entry.unit,
        tax_mode: entry.taxMode || 'ex_tax',
        tax_rate: entry.taxRate !== undefined ? String(entry.taxRate) : '',
        region_code: entry.regionCode || options.defaultRegion || 'ES_TENERIFE_TF',
        thermal_state: entry.thermalState || '',
        cut_spec: entry.cutSpec || '',
        quality_grade: entry.qualityGrade || '',
        brand: entry.brand || '',
        location_name: entry.locationName || '',
        promotion_status: entry.promotionStatus || 'standard',
        net_drained_qty: entry.netDrainedQuantity ? String(entry.netDrainedQuantity) : '',
      },
    };

    const report = await this.processRows([row], {
      ...options,
      captureMethod: 'assisted_entry',
    });

    if (report.quarantinedCount > 0) {
      throw new Error(`Manual entry validation failed: ${report.quarantinedRows[0].reason}`);
    }

    const source = (await this.repository.getSourceById(entry.sourceIdOrName)) ||
      (await this.repository.getSourceByName(entry.sourceIdOrName));
    const product = await this.repository.findProductByName(source!.id, entry.productName);
    const observations = await this.repository.getObservationsByProduct(product!.id);

    return {
      observationId: observations[0].id,
      normalizedPriceExTax: observations[0].normalizedPriceExTax,
    };
  }

  private async processRows(
    rows: RawCsvRow[],
    options: IngestionOptions
  ): Promise<IngestionReport> {
    const quarantinedRows: QuarantinedRow[] = [];
    let validCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    const sources = await this.repository.getSources();
    const sourceMap = new Map<string, typeof sources[0]>();
    for (const s of sources) {
      sourceMap.set(s.id.toLowerCase(), s);
      sourceMap.set(s.name.toLowerCase(), s);
    }

    const nowIso = new Date().toISOString();

    for (const row of rows) {
      const data = row.data;

      // 1. Validate mandatory fields
      const sourceNameRaw = data.source_name;
      const productName = data.product_name;
      const rawPriceStr = data.raw_price?.replace(',', '.');
      const quantityStr = data.quantity?.replace(',', '.');
      const unit = data.unit;

      if (!sourceNameRaw || !productName || !rawPriceStr || !quantityStr || !unit) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: 'Missing mandatory fields (source_name, product_name, raw_price, quantity, unit)',
          fields: data,
        });
        continue;
      }

      // 2. Resolve source
      const cleanSourceKey = sourceNameRaw.trim().toLowerCase();
      let matchedSource = sourceMap.get(cleanSourceKey);
      if (!matchedSource) {
        for (const [key, s] of sourceMap.entries()) {
          if (cleanSourceKey.includes(key) || key.includes(cleanSourceKey)) {
            matchedSource = s;
            break;
          }
        }
      }

      if (!matchedSource) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Unrecognized source "${sourceNameRaw}". Must match an active registered market source.`,
          fields: data,
        });
        continue;
      }

      // 3. Parse numbers
      const rawPrice = parseFloat(rawPriceStr);
      const quantity = parseFloat(quantityStr);
      if (isNaN(rawPrice) || rawPrice <= 0) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid raw_price: "${data.raw_price}". Must be a positive number.`,
          fields: data,
        });
        continue;
      }

      if (isNaN(quantity) || quantity <= 0) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid quantity: "${data.quantity}". Must be greater than 0.`,
          fields: data,
        });
        continue;
      }

      // 4. Resolve tax mode and rate
      const taxMode: TaxMode =
        data.tax_mode === 'inc_tax' || data.tax_mode === 'ex_tax'
          ? data.tax_mode
          : matchedSource.defaultTaxMode;

      let taxRate: number;
      if (data.tax_rate && data.tax_rate.trim().length > 0) {
        taxRate = parseFloat(data.tax_rate.replace(',', '.'));
        if (isNaN(taxRate) || taxRate < 0) {
          taxRate = taxMode === 'inc_tax' ? 0.07 : 0.0;
        }
      } else {
        taxRate = taxMode === 'inc_tax' ? 0.07 : 0.0;
      }

      const netDrainedQty = data.net_drained_qty
        ? parseFloat(data.net_drained_qty.replace(',', '.'))
        : undefined;

      // 5. Normalize Price
      let normalizedResult;
      try {
        normalizedResult = PriceNormalizer.normalize({
          priceRaw: rawPrice,
          taxMode,
          taxRate,
          quantity,
          unit,
          netDrainedQuantity: netDrainedQty,
        });
      } catch (err: any) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Normalization error: ${err.message}`,
          fields: data,
        });
        continue;
      }

      // 6. Resolve / Create Market Product in Core
      const externalSku = data.external_sku || this.generateSku(matchedSource.id, productName);
      let marketProduct = await this.repository.findProductBySku(matchedSource.id, externalSku);

      if (!marketProduct) {
        marketProduct = {
          id: `mp-${matchedSource.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sourceId: matchedSource.id,
          externalSku,
          rawName: productName,
          brand: data.brand || undefined,
          category: data.category || 'General Food',
          thermalState: this.inferThermalState(data.thermal_state, productName),
          standardQuantity: normalizedResult.standardQuantity,
          standardUnit: normalizedResult.standardUnit,
          cutSpecification: data.cut_spec || undefined,
          qualityGrade: data.quality_grade || 'standard',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await this.repository.saveProduct(marketProduct);
      }

      // 7. Deduplication & Idempotent Fingerprint
      const regionCode: RegionCode =
        (data.region_code as RegionCode) || options.defaultRegion || matchedSource.defaultRegion;
      const locationName = data.location_name || 'Central Warehouse';
      const promoStatus: PromotionStatus =
        data.promotion_status === 'temporary_discount' || data.promotion_status === 'clearance'
          ? data.promotion_status
          : 'standard';

      const observedDateStr = nowIso.slice(0, 10);
      const fingerprint = this.computeFingerprint(
        matchedSource.id,
        externalSku,
        observedDateStr,
        regionCode,
        locationName,
        promoStatus,
        normalizedResult.normalizedPriceExTax
      );

      const existingObservation = await this.repository.findObservationByFingerprint(fingerprint);

      if (existingObservation) {
        // Idempotent update: update validity window, no duplicate time-series row
        const updatedObs: MarketPriceObservation = {
          ...existingObservation,
          validTo: data.valid_to || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        };
        await this.repository.saveObservation(updatedObs, fingerprint);
        updatedCount++;
      } else {
        const qualityStatus: QualityStatus =
          promoStatus !== 'standard' ? 'PROMOTIONAL' : 'OBSERVED';

        const newObservation: MarketPriceObservation = {
          id: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          marketProductId: marketProduct.id,
          observedAt: nowIso,
          validFrom: data.valid_from || observedDateStr,
          validTo: data.valid_to || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          priceRaw: rawPrice,
          currency: 'EUR',
          taxMode,
          taxRate,
          normalizedPriceExTax: normalizedResult.normalizedPriceExTax,
          normalizedUnit: normalizedResult.normalizedUnit,
          promotionStatus: promoStatus,
          regionCode,
          locationName,
          captureMethod: options.captureMethod || 'catalog_import',
          qualityStatus,
          createdAt: nowIso,
        };

        await this.repository.saveObservation(newObservation, fingerprint);
        createdCount++;
      }

      validCount++;
    }

    return {
      totalRows: rows.length,
      validCount,
      quarantinedCount: quarantinedRows.length,
      createdObservationsCount: createdCount,
      updatedObservationsCount: updatedCount,
      quarantinedRows,
    };
  }

  private computeFingerprint(
    sourceId: string,
    sku: string,
    observedDate: string,
    regionCode: string,
    locationName: string,
    promoStatus: string,
    normalizedPrice: number
  ): string {
    const rawKey = `${sourceId}|${sku}|${observedDate}|${regionCode}|${locationName}|${promoStatus}|${normalizedPrice.toFixed(4)}`;
    return this.simpleHash(rawKey);
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private generateSku(sourceId: string, name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 12);
    return `${sourceId.slice(4).toUpperCase()}-${slug}`;
  }

  private inferThermalState(providedState?: string, productName: string = ''): ThermalState {
    const text = (providedState + ' ' + productName).toLowerCase();
    if (text.includes('congelad') || text.includes('frozen')) {
      return 'frozen';
    }
    if (text.includes('fresc') || text.includes('fresh')) {
      return 'fresh';
    }
    if (text.includes('seco') || text.includes('dry') || text.includes('harina') || text.includes('legumbre')) {
      return 'dry';
    }
    return 'ambient';
  }
}
