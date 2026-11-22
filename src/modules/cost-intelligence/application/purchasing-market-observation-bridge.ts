/**
 * YOURMEAL OS — PURCHASING TO MARKET OBSERVATION BRIDGE (CR-COST-05 Opción A)
 *
 * Bridges confirmed purchase invoice lines into private tenant price observations ([REAL])
 * within market_price_observations without mutating receive_purchase_invoice_v1, WAC calculations,
 * or economic_studies.
 *
 * STRICT INVARIANTS:
 * 1. Rule D-010 (Anti-Hallucination): Skips unmapped items, items with zero or negative prices,
 *    and items without confirmed product mappings. Never invents data.
 * 2. Multi-Tenant Isolation: Always sets ownerTenantId to the active tenantId.
 * 3. Idempotent Fingerprinting: Generates deterministic SHA-safe fingerprint keys to prevent duplicate records.
 * 4. ADR 0010: Code in English; diagnostics and comments in Spanish.
 */

import { generateMarketEntityUuid } from '@/modules/market-intelligence/domain/uuid';
import type {
  MarketPriceObservation,
  NormalizedUnit,
  ProductMapping,
  TaxMode,
} from '@/modules/market-intelligence/domain/types';
import type { IMarketIntelligenceRepository } from '@/modules/market-intelligence/infrastructure/repositories/market-repository-interface';

export interface PurchaseLineForMarketSync {
  id?: string;
  itemId: string; // Tenant ingredient ID
  itemName?: string;
  unitPrice: number;
  quantity: number;
  unit?: string;
  taxRate?: number;
  effectiveUnitCost?: number;
}

export interface PurchaseInvoiceForMarketSync {
  id: string;
  tenantId: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  items: PurchaseLineForMarketSync[];
}

export interface PurchaseMarketObservationBridgeOptions {
  tenantId: string;
  invoice: PurchaseInvoiceForMarketSync;
  mappings: ProductMapping[];
  repository: IMarketIntelligenceRepository;
}

export interface PurchaseMarketObservationBridgeResult {
  recordedCount: number;
  skippedCount: number;
  createdObservations: MarketPriceObservation[];
}

function resolveNormalizedUnit(unitStr?: string): NormalizedUnit {
  const u = (unitStr || 'kg').toLowerCase().trim();
  if (u === 'l' || u === 'litro' || u === 'litros') return 'EUR_PER_L';
  if (u === 'unit' || u === 'ud' || u === 'unidades') return 'EUR_PER_UNIT';
  return 'EUR_PER_KG';
}

export async function recordPurchaseObservationsFromInvoice({
  tenantId,
  invoice,
  mappings,
  repository,
}: PurchaseMarketObservationBridgeOptions): Promise<PurchaseMarketObservationBridgeResult> {
  if (!tenantId || !invoice || !invoice.items || invoice.items.length === 0) {
    return { recordedCount: 0, skippedCount: 0, createdObservations: [] };
  }

  // Pre-filter confirmed mappings for this tenant
  const confirmedMappingsByIngredient = new Map<string, ProductMapping>();
  for (const map of mappings) {
    if (
      map.tenantIngredientId &&
      map.matchStatus === 'confirmed' &&
      map.comparabilityGrade !== 'UNKNOWN' &&
      (!map.tenantId || map.tenantId === tenantId)
    ) {
      confirmedMappingsByIngredient.set(map.tenantIngredientId, map);
    }
  }

  const observedDate = (invoice.invoiceDate || new Date().toISOString().slice(0, 10)).trim().slice(0, 10);
  const createdObservations: MarketPriceObservation[] = [];
  let skippedCount = 0;

  for (const item of invoice.items) {
    // 1. D-010 Integrity Check: item must have valid ingredient ID and positive price & quantity
    if (!item.itemId || item.itemId.trim() === '') {
      skippedCount++;
      continue;
    }

    const price = Number(item.unitPrice);
    const qty = Number(item.quantity);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(qty) || qty <= 0) {
      skippedCount++;
      continue;
    }

    // 2. Check if a confirmed mapping exists for this ingredient
    const mapping = confirmedMappingsByIngredient.get(item.itemId);
    if (!mapping || !mapping.marketProductId) {
      skippedCount++;
      continue;
    }

    // 3. Compute deterministic fingerprint for idempotent deduping
    const lineKey = item.id || `${item.itemId}-${price}`;
    const fingerprint = `real-inv-${tenantId}-${invoice.id}-${lineKey}-${observedDate}`;

    // 4. Check if already recorded
    const existing = await repository.findObservationByFingerprint(fingerprint);
    if (existing) {
      skippedCount++;
      continue;
    }

    const normalizedPrice =
      item.effectiveUnitCost != null && Number.isFinite(item.effectiveUnitCost) && item.effectiveUnitCost > 0
        ? Number(item.effectiveUnitCost)
        : price;

    const observation: MarketPriceObservation = {
      id: generateMarketEntityUuid(),
      marketProductId: mapping.marketProductId,
      ownerTenantId: tenantId,
      observedAt: `${observedDate}T12:00:00Z`,
      validFrom: observedDate,
      validTo: new Date(new Date(observedDate).getTime() + 30 * 86400000).toISOString().slice(0, 10),
      validitySource: 'source_declared',
      priceRaw: price,
      currency: 'EUR',
      taxMode: 'ex_tax' as TaxMode,
      taxRate: item.taxRate != null && Number.isFinite(item.taxRate) ? Number(item.taxRate) : null,
      normalizedPriceExTax: Math.round(normalizedPrice * 10000) / 10000,
      normalizedUnit: resolveNormalizedUnit(item.unit),
      promotionStatus: 'standard',
      regionCode: 'ES_TENERIFE_TF',
      captureMethod: 'assisted_entry',
      qualityStatus: 'VERIFIED',
      createdAt: new Date().toISOString(),
      rawPayload: {
        provenance: 'REAL',
        sourceType: 'purchase_invoice',
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber || 'Sin número',
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName || 'Proveedor',
        ingredientId: item.itemId,
        ingredientName: item.itemName,
        effectiveUnitCost: item.effectiveUnitCost,
      },
    };

    await repository.saveObservation(observation, fingerprint);
    createdObservations.push(observation);
  }

  return {
    recordedCount: createdObservations.length,
    skippedCount,
    createdObservations,
  };
}
