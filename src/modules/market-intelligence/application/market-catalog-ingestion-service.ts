/**
 * CR-COST-05: Market Catalog Ingestion Service (PR1, Block 2, Block 4)
 * Validates, normalizes, fingerprints and persists price catalog observations
 * with full physical pack, geographic/coverage, fiscal metadata, auditable batches,
 * document extractions (PDF/photos), volume tiers, Open Food Facts enrichment, and safe revocation.
 */

import { PriceNormalizer } from "../domain/price-normalizer";
import { parseGtin } from "../domain/physical-format";
import { normalizePostalCode } from "../domain/geo-coverage";
import {
  AiemStatus,
  AvailabilityStatus,
  CaptureMethod,
  CatchWeightPolicy,
  ContentUnit,
  DeliveryCoverageState,
  FreightInclusion,
  MarketBatchStatus,
  MarketBatchType,
  MarketCatalogIngestionBatch,
  MarketPriceObservation,
  MarketProduct,
  MarketVolumeTier,
  MinOrderUnit,
  NormalizationStatus,
  ObservedChannel,
  ObservedPriceBasis,
  PackPresentation,
  PricingComparisonMode,
  PromotionStatus,
  QualityStatus,
  RegionCode,
  RevokeBatchResult,
  TaxInclusion,
  TaxMode,
  TaxRateSource,
  TaxRegime,
  ThermalState,
  ValiditySource,
} from "../domain/types";
import {
  DocumentExtractionResult,
  validateExtractedLine,
} from "../domain/document-extraction";
import { CsvCatalogParser, RawCsvRow } from "../infrastructure/csv-catalog-parser";
import { IMarketIntelligenceRepository } from "../infrastructure/repositories/market-repository-interface";
import { IOpenFoodFactsClient } from "../infrastructure/open-food-facts-client";
import { generateMarketEntityUuid } from "../domain/uuid";

export interface IngestionOptions {
  batchId?: string;
  batchType?: MarketBatchType;
  fileName?: string;
  fileMimeType?: string;
  fileChecksumSha256?: string;
  importedBy: string; // User UUID
  captureMethod?: CaptureMethod;
  defaultRegion?: RegionCode;
  defaultSourceId?: string;
  defaultObservedAt?: string;
  ownerTenantId?: string | null;
  catchWeightPolicy?: CatchWeightPolicy;
  pricingComparisonMode?: PricingComparisonMode;
  chunkSize?: number;
  offClient?: IOpenFoodFactsClient;
  enrichWithOff?: boolean;
}

export interface QuarantinedRow {
  lineNumber: number;
  rawLine: string;
  reason: string;
  fields: Record<string, string>;
}

export interface IngestionReport {
  batchId?: string;
  batchStatus?: MarketBatchStatus;
  totalRows: number;
  validCount: number;
  quarantinedCount: number;
  createdObservationsCount: number;
  updatedObservationsCount: number;
  quarantinedRows: QuarantinedRow[];
}

export interface ManualMarketEntryInput {
  sourceIdOrName: string;
  productName: string;
  rawPrice: number;
  currency?: string;
  quantity?: number;
  unit?: string;
  gtin?: string | null;
  packPresentation?: PackPresentation | null;
  packCount?: number | null;
  unitContentQty?: number | null;
  unitContentUnit?: ContentUnit | null;
  netContentQty?: number | null;
  netContentUnit?: ContentUnit | null;
  drainedWeightQty?: number | null;
  drainedWeightUnit?: "kg" | "g" | null;
  densityKgPerL?: number | null;
  observedPriceBasis?: ObservedPriceBasis;
  observedAt?: string;
  taxMode?: TaxMode;
  taxInclusion?: TaxInclusion;
  taxRate?: number | null;
  taxRegime?: TaxRegime;
  taxRateSource?: TaxRateSource;
  taxRuleRef?: string | null;
  taxEffectiveFrom?: string | null;
  taxEffectiveTo?: string | null;
  aiemStatus?: AiemStatus;
  aiemEvidence?: string | null;
  aiemRate?: number | null;
  aiemAmountRaw?: number | null;
  freightInclusion?: FreightInclusion;
  freightCostRaw?: number | null;
  freeFreightMinOrderAmount?: number | null;
  minOrderQty?: number | null;
  minOrderUnit?: MinOrderUnit | null;
  regionCode?: RegionCode;
  observationCountryCode?: string | null;
  observationSubdivisionCode?: string | null;
  observationProvinceCode?: string | null;
  observationIslandCode?: string | null;
  observationPostalCode?: string | null;
  observedChannel?: ObservedChannel;
  deliveryCoverageState?: DeliveryCoverageState;
  availabilityStatus?: AvailabilityStatus;
  validitySource?: ValiditySource;
  validFrom?: string;
  validTo?: string | null;
  thermalState?: ThermalState;
  cutSpec?: string;
  qualityGrade?: string;
  brand?: string;
  origin?: string;
  locationName?: string;
  promotionStatus?: PromotionStatus;
  promotionCondition?: string | null;
  promotionValidTo?: string | null;
  netDrainedQuantity?: number;
  isCatchWeight?: boolean;
  taricCode?: string | null;
  volumeTiers?: Array<{
    minQuantity: number;
    tierPriceRaw: number;
    tierQuantityUnit?: string;
    taxMode?: TaxMode;
    taxRate?: number | null;
  }>;
}

const FORBIDDEN_PUBLIC_RAW_PAYLOAD_KEYS = new Set([
  "tenantId",
  "tenant_id",
  "ownerTenantId",
  "owner_tenant_id",
  "privateConditions",
  "rawLine",
  "raw_line",
]);

function sanitizeUnknownValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknownValue(item));
  }
  if (value && typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (!FORBIDDEN_PUBLIC_RAW_PAYLOAD_KEYS.has(k)) {
        clean[k] = sanitizeUnknownValue(v);
      }
    }
    return clean;
  }
  return value;
}

export function sanitizeRawPayloadForScope(
  rawPayload: Record<string, unknown> | undefined,
  ownerTenantId: string | null | undefined,
): Record<string, unknown> | undefined {
  if (!rawPayload) return rawPayload;
  if (ownerTenantId) return rawPayload;

  return sanitizeUnknownValue(rawPayload) as Record<string, unknown>;
}

function parseOptionalFloat(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const parsed = Number(raw.trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parseOptionalInt(raw: string | undefined): number | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (!/^[+-]?\d+$/.test(trimmed)) return NaN;
  return Number.parseInt(trimmed, 10);
}

function resolveTaxModeInput(
  rawTaxMode: string | undefined,
  rawTaxInclusion: TaxInclusion | undefined,
  _sourceDefault?: TaxMode,
): TaxMode {
  if (rawTaxInclusion === "included") return "inc_tax";
  if (rawTaxInclusion === "excluded") return "ex_tax";
  if (rawTaxInclusion === "unknown") return "unknown";

  const clean = (rawTaxMode || "").trim().toLowerCase();
  if (!clean) return "unknown";
  if (clean === "inc_tax" || clean === "included" || clean === "si" || clean === "true") {
    return "inc_tax";
  }
  if (clean === "ex_tax" || clean === "excluded" || clean === "no" || clean === "false") {
    return "ex_tax";
  }
  if (clean === "unknown" || clean === "desconocido") {
    return "unknown";
  }
  return "unknown";
}

function mapTaxInclusion(taxMode: TaxMode): TaxInclusion {
  if (taxMode === "inc_tax") return "included";
  if (taxMode === "ex_tax") return "excluded";
  return "unknown";
}

export class MarketCatalogIngestionService {
  constructor(private readonly repository: IMarketIntelligenceRepository) {}

  /**
   * Ingests a CSV/TSV price catalog string with full batch auditing.
   */
  public async ingestCsv(csvContent: string, options: IngestionOptions): Promise<IngestionReport> {
    const parseResult = CsvCatalogParser.parse(csvContent);
    const checksum =
      options.fileChecksumSha256 || (await this.sha256Hex(csvContent));
    return this.processRows(parseResult.rows, {
      ...options,
      batchType: options.batchType || "csv_catalog",
      fileChecksumSha256: checksum,
      fileMimeType: options.fileMimeType || "text/csv",
    });
  }

  /**
   * Ingests commercial documents extracted from PDF or images (invoices, delivery notes, quotes).
   */
  public async ingestDocument(
    extraction: DocumentExtractionResult,
    options: IngestionOptions,
  ): Promise<IngestionReport> {
    const batchType: MarketBatchType =
      extraction.mimeType === "application/pdf"
        ? "b2b_invoice_pdf"
        : "b2b_document_image";

    const rows: RawCsvRow[] = [];
    const preQuarantined: QuarantinedRow[] = [];

    for (const line of extraction.lines) {
      const validation = validateExtractedLine(line);
      if (!validation.isValid) {
        preQuarantined.push({
          lineNumber: line.lineNumber,
          rawLine: line.rawText,
          reason: validation.reason || "Línea documental rechazada por validación previa.",
          fields: {
            product_name: line.productName,
            raw_price: String(line.rawPrice),
            quantity: String(line.quantity),
            unit: line.unit,
            confidence: String(line.confidence),
          },
        });
        continue;
      }

      rows.push({
        lineNumber: line.lineNumber,
        rawLine: line.rawText,
        data: {
          source_name: extraction.header.sourceNameOrId || options.defaultSourceId || "",
          observed_at: extraction.header.documentDate || options.defaultObservedAt || "",
          product_name: line.productName,
          raw_price: String(line.rawPrice),
          quantity: String(line.quantity),
          unit: line.unit,
          gtin: line.gtin || "",
          external_sku: line.sku || "",
          currency: extraction.header.currency || "EUR",
          tax_mode: line.taxMode || "unknown",
          tax_rate: line.taxRate !== undefined ? String(line.taxRate) : "",
          tax_regime: line.taxRegime || "",
          aiem_status: line.aiemStatus || "",
          aiem_rate: line.aiemRate !== undefined ? String(line.aiemRate) : "",
          aiem_amount_raw: line.aiemAmountRaw !== undefined ? String(line.aiemAmountRaw) : "",
          freight_inclusion: extraction.header.freightInclusion || "",
          freight_cost_raw:
            extraction.header.freightCostRaw !== undefined
              ? String(extraction.header.freightCostRaw)
              : "",
          free_freight_min_order_amount:
            extraction.header.freeFreightMinOrderAmount !== undefined
              ? String(extraction.header.freeFreightMinOrderAmount)
              : "",
          thermal_state: line.thermalState || "",
          is_catch_weight: line.isCatchWeight ? "true" : "false",
          taric_code: line.taricCode || "",
        },
      });
    }

    return this.processRows(
      rows,
      {
        ...options,
        batchType,
        fileName: extraction.fileName,
        fileMimeType: extraction.mimeType,
        fileChecksumSha256: extraction.fileChecksumSha256,
        defaultSourceId: extraction.header.sourceNameOrId || options.defaultSourceId,
        defaultObservedAt: extraction.header.documentDate || options.defaultObservedAt,
      },
      preQuarantined,
    );
  }

  /**
   * Ingests a single assisted manual entry (Level 0 / Block 2 structured input).
   */
  public async ingestManualEntry(
    entry: ManualMarketEntryInput,
    options: IngestionOptions,
  ): Promise<{
    observationId: string;
    normalizedPriceExTax: number | null;
    normalizationStatus?: NormalizationStatus;
  }> {
    const qtyFallback = entry.quantity ?? entry.netContentQty ?? entry.unitContentQty ?? undefined;
    const unitFallback = entry.unit ?? entry.netContentUnit ?? entry.unitContentUnit ?? "";

    const tierRows: Record<string, string> = {};
    if (entry.volumeTiers && entry.volumeTiers.length > 0) {
      entry.volumeTiers.forEach((tier, idx) => {
        const slot = idx + 1;
        tierRows[`tier_${slot}_qty`] = String(tier.minQuantity);
        tierRows[`tier_${slot}_price`] = String(tier.tierPriceRaw);
        if (tier.tierQuantityUnit) tierRows.tier_quantity_unit = tier.tierQuantityUnit;
        if (tier.taxMode) tierRows.tier_tax_mode = tier.taxMode;
      });
    }

    const row: RawCsvRow = {
      lineNumber: 1,
      rawLine: JSON.stringify(entry),
      data: {
        source_name: entry.sourceIdOrName,
        product_name: entry.productName,
        raw_price: String(entry.rawPrice),
        currency: entry.currency || "EUR",
        quantity: qtyFallback !== undefined ? String(qtyFallback) : "",
        unit: unitFallback,
        gtin: entry.gtin ?? "",
        observed_at: entry.observedAt || options.defaultObservedAt || "",
        pack_presentation: entry.packPresentation ?? "",
        pack_count: entry.packCount != null ? String(entry.packCount) : "",
        unit_content_qty: entry.unitContentQty != null ? String(entry.unitContentQty) : "",
        unit_content_unit: entry.unitContentUnit ?? "",
        net_content_qty: entry.netContentQty != null ? String(entry.netContentQty) : "",
        net_content_unit: entry.netContentUnit ?? "",
        drained_weight_unit: entry.drainedWeightUnit ?? "",
        density_kg_per_l: entry.densityKgPerL != null ? String(entry.densityKgPerL) : "",
        observed_price_basis: entry.observedPriceBasis ?? "",
        tax_mode:
          entry.taxInclusion === "included"
            ? "inc_tax"
            : entry.taxInclusion === "excluded"
              ? "ex_tax"
              : entry.taxInclusion === "unknown"
                ? "unknown"
                : entry.taxMode || "",
        tax_rate:
          entry.taxRate !== undefined && entry.taxRate !== null ? String(entry.taxRate) : "",
        tax_regime: entry.taxRegime ?? "",
        tax_rate_source: entry.taxRateSource ?? "",
        tax_rule_ref: entry.taxRuleRef ?? "",
        tax_effective_from: entry.taxEffectiveFrom ?? "",
        tax_effective_to: entry.taxEffectiveTo ?? "",
        aiem_status: entry.aiemStatus ?? "",
        aiem_evidence: entry.aiemEvidence ?? "",
        aiem_rate: entry.aiemRate != null ? String(entry.aiemRate) : "",
        aiem_amount_raw: entry.aiemAmountRaw != null ? String(entry.aiemAmountRaw) : "",
        freight_inclusion: entry.freightInclusion ?? "",
        freight_cost_raw: entry.freightCostRaw != null ? String(entry.freightCostRaw) : "",
        free_freight_min_order_amount:
          entry.freeFreightMinOrderAmount != null ? String(entry.freeFreightMinOrderAmount) : "",
        min_order_qty: entry.minOrderQty != null ? String(entry.minOrderQty) : "",
        min_order_unit: entry.minOrderUnit ?? "",
        region_code: entry.regionCode || options.defaultRegion || "ES_TENERIFE_TF",
        observation_country_code: entry.observationCountryCode ?? "",
        observation_subdivision_code: entry.observationSubdivisionCode ?? "",
        observation_province_code: entry.observationProvinceCode ?? "",
        observation_island_code: entry.observationIslandCode ?? "",
        observation_postal_code: entry.observationPostalCode ?? "",
        observed_channel: entry.observedChannel ?? "",
        delivery_coverage_state: entry.deliveryCoverageState ?? "",
        availability_status: entry.availabilityStatus ?? "",
        validity_source: entry.validitySource ?? "",
        valid_from: entry.validFrom ?? "",
        valid_to: entry.validTo ?? "",
        thermal_state: entry.thermalState || "",
        cut_spec: entry.cutSpec || "",
        quality_grade: entry.qualityGrade || "",
        brand: entry.brand || "",
        origin: entry.origin || "",
        location_name: entry.locationName || "",
        promotion_status: entry.promotionStatus || "standard",
        promotion_condition: entry.promotionCondition ?? "",
        promotion_valid_to: entry.promotionValidTo ?? "",
        is_catch_weight: entry.isCatchWeight ? "true" : "false",
        taric_code: entry.taricCode ?? "",
        net_drained_qty:
          entry.drainedWeightQty != null
            ? String(entry.drainedWeightQty)
            : entry.netDrainedQuantity != null
              ? String(entry.netDrainedQuantity)
              : "",
        ...tierRows,
      },
    };

    const report = await this.processRows([row], {
      ...options,
      batchType: "manual_entry",
      captureMethod: "assisted_entry",
    });

    if (report.quarantinedCount > 0) {
      throw new Error(`Manual entry validation failed: ${report.quarantinedRows[0].reason}`);
    }

    const source =
      (await this.repository.getSourceById(entry.sourceIdOrName)) ||
      (await this.repository.getSourceByName(entry.sourceIdOrName));
    const product = await this.repository.findProductByName(source!.id, entry.productName, options.ownerTenantId);
    const observations = await this.repository.getObservationsByProduct(product!.id, options.ownerTenantId);
    const latest = [...observations].sort(
      (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime(),
    )[0];

    return {
      observationId: latest.id,
      normalizedPriceExTax: latest.normalizedPriceExTax,
      normalizationStatus: latest.normalizationStatus,
    };
  }

  /**
   * Non-destructive soft-revocation of an erroneous or disputed ingestion batch.
   * Expires observation validity and sets quality_status = 'LOW_CONFIDENCE',
   * safely neutralizing the batch from benchmarks without violating PostgreSQL append-only triggers.
   */
  public async revokeBatch(
    ctx: { tenantId?: string; userId: string; isSaasAdmin?: boolean },
    batchId: string,
    reason: string,
  ): Promise<RevokeBatchResult> {
    if (!reason || !reason.trim()) {
      throw new Error("Se requiere un motivo de revocación válido.");
    }
    const batch = await this.repository.getBatchById(batchId);
    if (!batch) {
      throw new Error(`Lote no encontrado: ${batchId}`);
    }

    // Access check:
    if (batch.ownerTenantId === null) {
      if (!ctx.isSaasAdmin) {
        throw new Error(
          "Solo administradores de plataforma (SaaS Admin) pueden revocar lotes públicos compartidos.",
        );
      }
    } else {
      if (ctx.tenantId !== batch.ownerTenantId && !ctx.isSaasAdmin) {
        throw new Error("Acceso denegado: no puedes revocar lotes pertenecientes a otro tenant.");
      }
    }

    if (batch.status === "revoked") {
      return {
        batchId,
        status: "revoked",
        revokedAt: batch.revokedAt || new Date().toISOString(),
        revokedBy: batch.revokedBy || ctx.userId,
        revocationReason: batch.revocationReason || reason,
        affectedObservationsCount: 0,
      };
    }

    const nowIso = new Date().toISOString();
    const { affectedObservations } = await this.repository.revokeBatchObservations(
      batchId,
      reason.trim(),
    );

    await this.repository.updateBatchProgress(batchId, {
      status: "revoked",
      revokedAt: nowIso,
      revokedBy: ctx.userId,
      revocationReason: reason.trim(),
    });

    return {
      batchId,
      status: "revoked",
      revokedAt: nowIso,
      revokedBy: ctx.userId,
      revocationReason: reason.trim(),
      affectedObservationsCount: affectedObservations,
    };
  }

  private async processRows(
    rows: RawCsvRow[],
    options: IngestionOptions,
    initialQuarantined: QuarantinedRow[] = [],
  ): Promise<IngestionReport> {
    const quarantinedRows: QuarantinedRow[] = [...initialQuarantined];
    let validCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    const sources = await this.repository.getSources();
    const sourceMap = new Map<string, (typeof sources)[0]>();
    for (const s of sources) {
      sourceMap.set(s.id.toLowerCase(), s);
      sourceMap.set(s.name.toLowerCase(), s);
    }

    const nowIso = new Date().toISOString();
    const batchId = options.batchId || generateMarketEntityUuid();
    const ownerTenantId = options.ownerTenantId ?? null;
    const batchType: MarketBatchType = options.batchType || "csv_catalog";

    // 1. Initialize Batch in Repository for Complete Auditability
    const initialBatch: MarketCatalogIngestionBatch = {
      id: batchId,
      ownerTenantId,
      sourceId: options.defaultSourceId || sources[0]?.id || "src-makro",
      batchType,
      fileName: options.fileName || null,
      fileMimeType: options.fileMimeType || "text/csv",
      fileChecksumSha256: options.fileChecksumSha256 || null,
      totalRows: rows.length + initialQuarantined.length,
      validRows: 0,
      quarantinedRows: initialQuarantined.length,
      createdCount: 0,
      updatedCount: 0,
      status: "processing",
      quarantinePayload: initialQuarantined.map((q) => ({
        lineNumber: q.lineNumber,
        rawLine: ownerTenantId ? q.rawLine : undefined,
        reason: q.reason,
        fields: q.fields,
      })),
      importedBy: options.importedBy,
      createdAt: nowIso,
    };
    await this.repository.createBatch(initialBatch);

    let firstMatchedSourceId: string | undefined;

    // 2. Iterate and Normalize Rows
    for (const row of rows) {
      const data = row.data;

      // Validate mandatory core fields
      const sourceNameRaw = data.source_name || options.defaultSourceId;
      const productName = data.product_name;
      const rawPriceStr = data.raw_price?.replace(",", ".");
      const hasPackStructuredQty =
        Boolean(data.net_content_qty && data.net_content_unit) ||
        Boolean(data.unit_content_qty && data.unit_content_unit);
      const quantityStr = data.quantity?.replace(",", ".");
      const unit = data.unit || data.net_content_unit || data.unit_content_unit;

      if (
        !sourceNameRaw ||
        !productName ||
        !rawPriceStr ||
        (!quantityStr && !hasPackStructuredQty) ||
        !unit
      ) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason:
            "INVALID_PHYSICAL_SPEC: Missing or invalid physical measurement specification (quantity/pack dimensions and unit required; defaulting to 1 kg is strictly prohibited).",
          fields: data,
        });
        continue;
      }

      // Resolve source
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

      if (!firstMatchedSourceId) {
        firstMatchedSourceId = matchedSource.id;
      }

      // Parse numeric & physical fields
      const rawPrice = parseFloat(rawPriceStr);
      if (isNaN(rawPrice) || rawPrice <= 0) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid raw_price: "${data.raw_price}". Must be a positive number.`,
          fields: data,
        });
        continue;
      }

      const quantity = quantityStr ? parseFloat(quantityStr) : undefined;
      if (quantity !== undefined && (isNaN(quantity) || quantity <= 0)) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid quantity: "${data.quantity}". Must be greater than 0.`,
          fields: data,
        });
        continue;
      }

      const gtinResult = parseGtin(data.gtin);
      if (!gtinResult.isValidFormat) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: gtinResult.error || `Invalid GTIN "${data.gtin}"`,
          fields: data,
        });
        continue;
      }

      let normalizedPostal: string | null = null;
      try {
        normalizedPostal = normalizePostalCode(data.observation_postal_code);
      } catch (postalErr) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: postalErr instanceof Error ? postalErr.message : String(postalErr),
          fields: data,
        });
        continue;
      }

      const packCount = parseOptionalInt(data.pack_count);
      const unitContentQty = parseOptionalFloat(data.unit_content_qty);
      const netContentQty = parseOptionalFloat(data.net_content_qty);
      const drainedWeightQty = parseOptionalFloat(data.net_drained_qty);
      const densityKgPerL = parseOptionalFloat(data.density_kg_per_l);

      if (
        Number.isNaN(packCount) ||
        Number.isNaN(unitContentQty) ||
        Number.isNaN(netContentQty) ||
        Number.isNaN(drainedWeightQty) ||
        Number.isNaN(densityKgPerL)
      ) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: "Invalid numeric value in pack or physical dimension columns.",
          fields: data,
        });
        continue;
      }

      // Resolve tax mode and documented tax rate (never infer default rate)
      const taxMode = resolveTaxModeInput(data.tax_mode, undefined, matchedSource.defaultTaxMode);
      const taxRateParsed = parseOptionalFloat(data.tax_rate);
      if (Number.isNaN(taxRateParsed)) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid tax_rate: "${data.tax_rate}".`,
          fields: data,
        });
        continue;
      }
      if (taxRateParsed !== null && (taxRateParsed < 0 || taxRateParsed > 1.0)) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid tax_rate: "${data.tax_rate}". Must be between 0.0 and 1.0.`,
          fields: data,
        });
        continue;
      }

      const aiemRate = parseOptionalFloat(data.aiem_rate);
      const aiemAmountRaw = parseOptionalFloat(data.aiem_amount_raw);
      const freightCostRaw = parseOptionalFloat(data.freight_cost_raw);
      const freeFreightMinOrderAmount = parseOptionalFloat(data.free_freight_min_order_amount);
      const minOrderQty = parseOptionalFloat(data.min_order_qty);

      if (
        Number.isNaN(aiemRate) ||
        Number.isNaN(aiemAmountRaw) ||
        Number.isNaN(freightCostRaw) ||
        Number.isNaN(freeFreightMinOrderAmount) ||
        Number.isNaN(minOrderQty)
      ) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: "Invalid numeric value in AIEM, freight, or minimum order columns.",
          fields: data,
        });
        continue;
      }

      const taxRegime: TaxRegime =
        (data.tax_regime?.trim().toUpperCase() as TaxRegime) || "UNKNOWN";
      if (
        (taxRegime === "EXEMPT" || taxRegime === "OUT_OF_SCOPE") &&
        taxRateParsed &&
        taxRateParsed > 0
      ) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Tax regime ${taxRegime} cannot declare a positive tax_rate (${taxRateParsed}).`,
          fields: data,
        });
        continue;
      }

      const observedPriceBasis: ObservedPriceBasis =
        data.observed_price_basis === "per_pack" ||
        data.observed_price_basis === "per_inner_unit" ||
        data.observed_price_basis === "per_base_unit"
          ? data.observed_price_basis
          : "unknown";

      const isCatchWeightRaw = (data.is_catch_weight || "").trim().toLowerCase();
      const isCatchWeight =
        isCatchWeightRaw === "true" ||
        isCatchWeightRaw === "1" ||
        isCatchWeightRaw === "si" ||
        isCatchWeightRaw === "sí" ||
        isCatchWeightRaw === "yes";

      const taricCode = (data.taric_code || "").trim() || null;
      if (taricCode && !/^[0-9]{4,10}$/.test(taricCode)) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Invalid TARIC code "${data.taric_code}". Must be 4 to 10 numeric digits.`,
          fields: data,
        });
        continue;
      }

      // Normalize Price
      let normalizedResult;
      try {
        normalizedResult = PriceNormalizer.normalize({
          priceRaw: rawPrice,
          taxMode,
          taxRate: taxRateParsed,
          quantity,
          unit,
          packPresentation: (data.pack_presentation as PackPresentation) || null,
          packCount,
          unitContentQty,
          unitContentUnit: (data.unit_content_unit as ContentUnit) || null,
          netContentQty,
          netContentUnit: (data.net_content_unit as ContentUnit) || null,
          drainedWeightQty,
          drainedWeightUnit: data.drained_weight_unit || null,
          densityKgPerL,
          observedPriceBasis,
          isCatchWeight,
          catchWeightPolicy: options.catchWeightPolicy || "allow_variable_kg",
        });
      } catch (err) {
        quarantinedRows.push({
          lineNumber: row.lineNumber,
          rawLine: row.rawLine,
          reason: `Normalization error: ${err instanceof Error ? err.message : String(err)}`,
          fields: data,
        });
        continue;
      }

      // Resolve or Create Market Product in Core
      const externalSku = data.external_sku || this.generateSku(matchedSource.id, productName);
      let marketProduct = await this.repository.findProductBySku(matchedSource.id, externalSku, ownerTenantId);

      if (!marketProduct) {
        let brand = data.brand || undefined;
        let packPres = (data.pack_presentation as PackPresentation) || null;
        let pNetQty = netContentQty;
        let pNetUnit = (data.net_content_unit as ContentUnit) || null;
        let pDrainedQty = drainedWeightQty;
        let pDrainedUnit: 'kg' | 'g' | null =
          data.drained_weight_unit === "kg" || data.drained_weight_unit === "g"
            ? (data.drained_weight_unit as 'kg' | 'g')
            : null;
        let origin = data.origin || undefined;

        // Open Food Facts enrichment (Physical & Descriptive ONLY)
        if (options.enrichWithOff && options.offClient && gtinResult.gtin) {
          try {
            const offData = await options.offClient.fetchProductByGtin(gtinResult.gtin);
            if (offData) {
              if (!brand && offData.brand) brand = offData.brand;
              if (!packPres && offData.packPresentation) packPres = offData.packPresentation;
              if (!pNetQty && offData.netContentQty) {
                pNetQty = offData.netContentQty;
                pNetUnit = offData.netContentUnit || pNetUnit;
              }
              if (!pDrainedQty && offData.drainedWeightQty) {
                pDrainedQty = offData.drainedWeightQty;
                pDrainedUnit = offData.drainedWeightUnit || pDrainedUnit;
              }
              if (!origin && offData.origin) origin = offData.origin;
            }
          } catch {
            // OFF is fail-safe; network timeouts do not block catalog creation
          }
        }

        const newProduct: MarketProduct = {
          id: generateMarketEntityUuid(),
          sourceId: matchedSource.id,
          ownerTenantId,
          externalSku,
          gtin: gtinResult.gtin,
          rawName: productName,
          brand,
          category: data.category || "General Food",
          thermalState: this.inferThermalState(data.thermal_state, productName),
          measurementDimension: normalizedResult.measurementDimension,
          standardQuantity: normalizedResult.standardQuantity,
          standardUnit: normalizedResult.standardUnit,
          packPresentation: packPres,
          packCount,
          unitContentQty,
          unitContentUnit: (data.unit_content_unit as ContentUnit) || null,
          netContentQty: pNetQty,
          netContentUnit: pNetUnit,
          drainedWeightQty: pDrainedQty,
          drainedWeightUnit: pDrainedUnit,
          densityKgPerL,
          cutSpecification: data.cut_spec || undefined,
          qualityGrade: data.quality_grade || "standard",
          origin,
          isCatchWeight,
          taricCode,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await this.repository.saveProduct(newProduct);
        marketProduct = newProduct;
      }

      // Deduplication & Idempotent Fingerprint with Real Document Observation Date
      const regionCode: RegionCode =
        (data.region_code as RegionCode) || options.defaultRegion || matchedSource.defaultRegion;
      const locationName = data.location_name || "Central Warehouse";
      const promoStatus: PromotionStatus =
        data.promotion_status === "temporary_discount" || data.promotion_status === "clearance"
          ? data.promotion_status
          : "standard";
      const currency = (data.currency?.trim().toUpperCase() || "EUR").slice(0, 3);
      const aiemStatus: AiemStatus = (data.aiem_status as AiemStatus) || "unknown";

      // Real Document Date Support (avoids false duplicates upon re-import on subsequent days)
      const declaredDate = (data.observed_at || options.defaultObservedAt || nowIso.slice(0, 10)).trim();
      const observedDateStr =
        declaredDate.length >= 10 ? declaredDate.slice(0, 10) : nowIso.slice(0, 10);

      const fingerprint = await this.computeFingerprint({
        sourceId: matchedSource.id,
        sku: externalSku,
        observedDate: observedDateStr,
        regionCode,
        locationName,
        promoStatus,
        normalizedPrice: normalizedResult.normalizedPriceExTax,
        priceRaw: rawPrice,
        ownerTenantId,
        gtin: gtinResult.gtin,
        packCount,
        observedPriceBasis,
        taxMode,
        taxRegime,
        taxRate: taxRateParsed,
        aiemStatus,
        islandCode: data.observation_island_code || null,
        postalCode: normalizedPostal,
      });

      const rawPayload = sanitizeRawPayloadForScope(
        {
          batchId,
          fileName: options.fileName || null,
          lineNumber: row.lineNumber,
          ...(ownerTenantId ? { rawLine: row.rawLine } : {}),
          parsedFields: data,
        },
        ownerTenantId,
      );

      const hasDeclaredValidTo = Boolean(data.valid_to && data.valid_to.trim().length > 0);
      const nextValidTo = hasDeclaredValidTo
        ? data.valid_to.trim()
        : data.validity_source === "unknown"
          ? null
          : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      const validitySource: ValiditySource =
        (data.validity_source as ValiditySource) ||
        (hasDeclaredValidTo ? "source_declared" : "inferred_default");

      // Parse Volume Tiers (Block 2B / D-010 compliant)
      const volumeTiers: MarketVolumeTier[] = [];
      const tierSpecs = [
        { qty: data.tier_1_qty, price: data.tier_1_price },
        { qty: data.tier_2_qty, price: data.tier_2_price },
        { qty: data.tier_3_qty, price: data.tier_3_price },
      ];
      for (const spec of tierSpecs) {
        const minQty = parseOptionalFloat(spec.qty);
        const tierPrice = parseOptionalFloat(spec.price);
        if (minQty && minQty > 0 && tierPrice && tierPrice > 0) {
          const tierTaxMode = resolveTaxModeInput(
            data.tier_tax_mode || data.tax_mode,
            undefined,
            matchedSource.defaultTaxMode,
          );
          let tierNormalizedPriceExTax: number | null = null;
          if (tierTaxMode === "ex_tax") {
            const divisor =
              normalizedResult.standardQuantity > 0 ? normalizedResult.standardQuantity : 1;
            tierNormalizedPriceExTax = Number((tierPrice / divisor).toFixed(4));
          } else if (tierTaxMode === "inc_tax" && taxRateParsed !== null) {
            const netTier = tierPrice / (1 + taxRateParsed);
            const divisor =
              normalizedResult.standardQuantity > 0 ? normalizedResult.standardQuantity : 1;
            tierNormalizedPriceExTax = Number((netTier / divisor).toFixed(4));
          }

          volumeTiers.push({
            id: generateMarketEntityUuid(),
            observationId: "",
            minQuantity: minQty,
            tierQuantityUnit: (data.tier_quantity_unit || data.min_order_unit || "unit") as any,
            tierPriceRaw: tierPrice,
            taxMode: tierTaxMode,
            taxRate: taxRateParsed,
            tierNormalizedPriceExTax,
          });
        }
      }

      const existingObservation = await this.repository.findObservationByFingerprint(fingerprint);

      if (existingObservation) {
        if (nextValidTo) {
          await this.repository.updateObservationValidity(
            existingObservation.id,
            nextValidTo,
            rawPayload,
          );
        }
        updatedCount++;
      } else {
        const qualityStatus: QualityStatus =
          promoStatus !== "standard" ? "PROMOTIONAL" : "OBSERVED";

        const minOrderUnit: MinOrderUnit | null =
          minOrderQty != null && data.min_order_unit
            ? (data.min_order_unit as MinOrderUnit)
            : minOrderQty != null
              ? "pack"
              : null;

        const newObservation: MarketPriceObservation = {
          id: generateMarketEntityUuid(),
          marketProductId: marketProduct.id,
          ownerTenantId,
          ingestionBatchId: batchId,
          observedAt: `${observedDateStr}T12:00:00.000Z`,
          validFrom: data.valid_from || observedDateStr,
          validTo: nextValidTo,
          validitySource,
          priceRaw: rawPrice,
          currency,
          taxMode,
          taxInclusion: mapTaxInclusion(taxMode),
          taxRate: taxRateParsed,
          taxRegime,
          taxRateSource:
            (data.tax_rate_source as TaxRateSource) ||
            (taxRateParsed !== null ? "observed_document" : "unknown"),
          taxRuleRef: data.tax_rule_ref || null,
          taxEffectiveFrom: data.tax_effective_from || null,
          taxEffectiveTo: data.tax_effective_to || null,
          aiemStatus,
          aiemEvidence: data.aiem_evidence || null,
          aiemRate,
          aiemAmountRaw,
          normalizedPriceExTax: normalizedResult.normalizedPriceExTax,
          normalizedUnit: normalizedResult.normalizedUnit,
          observedPriceBasis,
          normalizationBasis: normalizedResult.normalizationBasis,
          normalizationStatus: normalizedResult.normalizationStatus,
          promotionStatus: promoStatus,
          promotionCondition: data.promotion_condition || null,
          promotionValidTo: data.promotion_valid_to || null,
          freightInclusion: (data.freight_inclusion as FreightInclusion) || "unknown",
          freightCostRaw,
          freeFreightMinOrderAmount,
          minOrderQty,
          minOrderUnit,
          regionCode,
          locationName,
          observationCountryCode: data.observation_country_code?.trim().toUpperCase() || null,
          observationSubdivisionCode: data.observation_subdivision_code?.trim() || null,
          observationProvinceCode: data.observation_province_code?.trim() || null,
          observationIslandCode: data.observation_island_code?.trim().toUpperCase() || null,
          observationPostalCode: normalizedPostal,
          observedChannel: (data.observed_channel as ObservedChannel) || "unknown",
          deliveryCoverageState:
            (data.delivery_coverage_state as DeliveryCoverageState) || "unknown",
          availabilityStatus: (data.availability_status as AvailabilityStatus) || "unknown",
          captureMethod: options.captureMethod || "catalog_import",
          qualityStatus,
          rawPayload,
          importedBy: options.importedBy,
          volumeTiers: volumeTiers.length > 0 ? volumeTiers : undefined,
          createdAt: nowIso,
        };

        await this.repository.saveObservation(newObservation, fingerprint);
        createdCount++;
      }

      validCount++;
    }

    // 3. Close and Persist Batch Outcome
    const totalProcessed = rows.length + initialQuarantined.length;
    const finalStatus: MarketBatchStatus =
      quarantinedRows.length === 0
        ? "completed"
        : validCount > 0
          ? "partial_quarantine"
          : "failed";

    const sanitizedQuarantine = sanitizeRawPayloadForScope(
      quarantinedRows.map((q) => ({
        lineNumber: q.lineNumber,
        rawLine: ownerTenantId ? q.rawLine : undefined,
        reason: q.reason,
        fields: q.fields,
      })) as any,
      ownerTenantId,
    ) as any;

    await this.repository.updateBatchProgress(batchId, {
      totalRows: totalProcessed,
      validRows: validCount,
      quarantinedRows: quarantinedRows.length,
      createdCount,
      updatedCount,
      status: finalStatus,
      quarantinePayload: sanitizedQuarantine || [],
      sourceId: firstMatchedSourceId || initialBatch.sourceId,
    });

    return {
      batchId,
      batchStatus: finalStatus,
      totalRows: totalProcessed,
      validCount,
      quarantinedCount: quarantinedRows.length,
      createdObservationsCount: createdCount,
      updatedObservationsCount: updatedCount,
      quarantinedRows,
    };
  }

  private async computeFingerprint(params: {
    sourceId: string;
    sku: string;
    observedDate: string;
    regionCode: string;
    locationName: string;
    promoStatus: string;
    normalizedPrice: number | null;
    priceRaw: number;
    ownerTenantId: string | null;
    gtin: string | null;
    packCount: number | null;
    observedPriceBasis: ObservedPriceBasis;
    taxMode: TaxMode;
    taxRegime: TaxRegime;
    taxRate: number | null;
    aiemStatus: AiemStatus;
    islandCode: string | null;
    postalCode: string | null;
  }): Promise<string> {
    const scope = params.ownerTenantId ?? "PUBLIC";
    const normStr = params.normalizedPrice !== null ? params.normalizedPrice.toFixed(4) : "NULL";
    const rateStr = params.taxRate !== null ? params.taxRate.toFixed(4) : "NULL";
    const rawKey = [
      scope,
      params.sourceId,
      params.sku,
      params.observedDate,
      params.regionCode,
      params.locationName,
      params.promoStatus,
      normStr,
      params.priceRaw.toFixed(4),
      params.gtin ?? "",
      params.packCount ?? "",
      params.observedPriceBasis,
      params.taxMode,
      params.taxRegime,
      rateStr,
      params.aiemStatus,
      params.islandCode ?? "",
      params.postalCode ?? "",
    ].join("|");
    return this.sha256Hex(rawKey);
  }

  private async sha256Hex(str: string): Promise<string> {
    if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
      const encoded = new TextEncoder().encode(str);
      const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    let hash1 = 0x811c9dc5;
    let hash2 = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      hash1 = Math.imul(hash1 ^ c, 0x01000193);
      hash2 = Math.imul(hash2 ^ (c + i), 0x01000193);
    }
    return (
      (hash1 >>> 0).toString(16).padStart(8, "0") + (hash2 >>> 0).toString(16).padStart(8, "0")
    );
  }

  private generateSku(sourceId: string, name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 12);
    return `${sourceId.slice(4).toUpperCase()}-${slug}`;
  }

  private inferThermalState(providedState?: string, productName: string = ""): ThermalState {
    const text = (providedState + " " + productName).toLowerCase();
    if (text.includes("congelad") || text.includes("frozen")) {
      return "frozen";
    }
    if (text.includes("fresc") || text.includes("fresh")) {
      return "fresh";
    }
    if (
      text.includes("seco") ||
      text.includes("dry") ||
      text.includes("harina") ||
      text.includes("legumbre")
    ) {
      return "dry";
    }
    return "ambient";
  }
}
