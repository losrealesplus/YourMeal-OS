/**
 * CR-COST-05 PR4: Document Extraction Domain Contracts
 * Types, interfaces and validators for structured extraction of B2B invoices, delivery notes (albaranes),
 * quotes (presupuestos), and supplier price lists from PDF and images.
 */

import { parseGtin } from './physical-format';
import {
  AiemStatus,
  ContentUnit,
  FreightInclusion,
  PackPresentation,
  TaxMode,
  TaxRegime,
  ThermalState,
} from './types';

export type DocumentMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp';

export interface ExtractedDocumentHeader {
  sourceNameOrId?: string;
  issuerName?: string;
  issuerTaxId?: string; // NIF / CIF
  documentNumber?: string; // Invoice / Delivery note number
  documentDate?: string; // ISO YYYY-MM-DD
  currency?: string;
  deliveryPostalCode?: string;
  deliveryIslandCode?: string;
  freightInclusion?: FreightInclusion;
  freightCostRaw?: number;
  freeFreightMinOrderAmount?: number;
  rawHeaderText?: string;
}

export interface ExtractedDocumentLine {
  lineNumber: number;
  rawText: string;
  sku?: string;
  gtin?: string;
  productName: string;
  brand?: string;
  quantity: number;
  unit: string;
  packPresentation?: PackPresentation;
  packCount?: number;
  unitContentQty?: number;
  unitContentUnit?: ContentUnit;
  netContentQty?: number;
  netContentUnit?: ContentUnit;
  drainedWeightQty?: number;
  drainedWeightUnit?: 'kg' | 'g';
  densityKgPerL?: number;
  rawPrice: number;
  taxMode?: TaxMode;
  taxRate?: number;
  taxRegime?: TaxRegime;
  aiemStatus?: AiemStatus;
  aiemRate?: number;
  aiemAmountRaw?: number;
  thermalState?: ThermalState;
  confidence: number; // 0.0 to 1.0 OCR / Vision model confidence
  isCatchWeight?: boolean;
  taricCode?: string;
}

export interface DocumentExtractionResult {
  header: ExtractedDocumentHeader;
  lines: ExtractedDocumentLine[];
  rawText: string;
  fileChecksumSha256: string;
  fileName: string;
  mimeType: DocumentMimeType;
}

export interface LineValidationResult {
  isValid: boolean;
  reason?: string;
  rejectionReasons?: string[];
}

export const MIN_EXTRACTION_CONFIDENCE = 0.7;

/**
 * Checks if a GTIN barcode conforms to GS1 Modulo-10 checksum standard.
 */
export function isValidGtinChecksum(gtin: string): boolean {
  if (!gtin || typeof gtin !== 'string') return false;
  const parsed = parseGtin(gtin);
  return Boolean(parsed.isValidFormat && parsed.checksumValid);
}

/**
 * Validates an extracted document line following CR-COST-05 D-010 anti-hallucination rules.
 * Any ambiguous, unreadable or non-physical line is sent to quarantine with an explicit Spanish reason.
 */
export function validateExtractedLine(line: ExtractedDocumentLine, lineNumber?: number): LineValidationResult {
  const errors: string[] = [];

  // 1. OCR / Vision Confidence check
  if (typeof line.confidence === 'number' && line.confidence < MIN_EXTRACTION_CONFIDENCE) {
    errors.push(`Baja confianza OCR (${(line.confidence * 100).toFixed(1)}% < ${(MIN_EXTRACTION_CONFIDENCE * 100).toFixed(1)}% requerido)`);
  }

  // 2. Product Name / Description
  if (!line.productName || !line.productName.trim()) {
    errors.push('No se ha detectado descripción o nombre de producto legible en la línea.');
  }

  // 3. Price validation
  if (!Number.isFinite(line.rawPrice) || line.rawPrice <= 0) {
    const displayPrice = Number.isFinite(line.rawPrice) ? line.rawPrice.toFixed(2) : String(line.rawPrice);
    errors.push(`Precio unitario no positivo (${displayPrice})`);
  }

  // 4. Physical quantity & unit specification
  const hasQuantity = Number.isFinite(line.quantity) && line.quantity > 0;
  const hasNetContent = Number.isFinite(line.netContentQty) && (line.netContentQty ?? 0) > 0;
  const hasUnit = Boolean((line.unit || line.netContentUnit || line.unitContentUnit)?.trim());

  if (!hasQuantity && !hasNetContent) {
    errors.push(`Cantidad física no positiva (${line.quantity})`);
  } else if (!hasUnit) {
    errors.push('Falta especificación de unidad de empaque o medida física');
  }

  // 5. Tax rate check
  if (line.taxRate !== undefined && line.taxRate !== null) {
    if (!Number.isFinite(line.taxRate) || line.taxRate < 0 || line.taxRate > 0.30) {
      errors.push(`Tipo impositivo fuera de rango (${(line.taxRate * 100).toFixed(2)}%)`);
    }
  }

  // 6. GTIN validation if present
  if (line.gtin) {
    if (!isValidGtinChecksum(line.gtin)) {
      errors.push(`Dígito de control GTIN inválido (${line.gtin})`);
    }
  }

  // 7. TARIC validation if present
  if (line.taricCode && !/^[0-9]{4,10}$/.test(line.taricCode.trim())) {
    errors.push(`Código arancelario '${line.taricCode}' inválido (requiere 4 a 10 dígitos).`);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      reason: errors.join('; '),
      rejectionReasons: errors,
    };
  }

  return { isValid: true, rejectionReasons: [] };
}
