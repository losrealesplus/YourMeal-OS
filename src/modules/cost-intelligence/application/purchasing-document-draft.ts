/**
 * YOURMEAL OS — PURCHASING DOCUMENT DRAFT SERVICE (CR-COST-05 Bloque 1)
 * Extracts candidate lines and header metadata from commercial documents (PDF, image, CSV, TSV)
 * for human review and creation of DRAFT purchase invoices.
 *
 * Strictly adheres to rule D-010 (Anti-Hallucination):
 * - Never invents prices, quantities or ingredients.
 * - Rejects low confidence (< 0.70) or non-positive prices to quarantine.
 * - If image is uploaded without an active Vision/OCR provider, explicitly flags for manual entry.
 * - Never invokes receipt or WAC mutation (receive_purchase_invoice_v1); invoices remain DRAFT.
 */

import {
  DocumentCatalogExtractor,
  IDocumentVisionOcrProvider,
} from '@/modules/market-intelligence/infrastructure/document-catalog-extractor';
import {
  DocumentMimeType,
  validateExtractedLine,
} from '@/modules/market-intelligence/domain/document-extraction';
import { ItemNature } from '../domain/procurement-types';

export interface SupplierRef {
  id: string;
  name: string;
  taxId?: string; // NIF / CIF
}

export interface IngredientRef {
  id: string;
  name: string;
  unit: string;
  cost?: number;
  stock?: number;
}

export interface DraftFormLineItem {
  lineId: string;
  itemId: string;
  itemName: string;
  itemNature: ItemNature;
  quantity: string;
  unit: string;
  unitPrice: string;
  discountAmount: string;
  taxRate: string;
}

export interface DraftExtractionCandidateLine extends DraftFormLineItem {
  confidence: number;
  matchedIngredient: boolean;
  suggestedIngredientId?: string;
  suggestedIngredientName?: string;
  suggestedConfidence?: number;
  sku?: string;
  gtin?: string;
  rawText: string;
}

export interface QuarantinedDraftExtractionLine {
  lineNumber: number;
  productName: string;
  rawText: string;
  reason: string;
  rejectionReasons: string[];
}

export interface PurchasingDraftExtractionResult {
  fileName: string;
  fileChecksumSha256: string;
  mimeType: string;
  invoiceNumber: string;
  invoiceDate: string;
  selectedSupplierId: string;
  matchedSupplierName?: string;
  additionalCosts: string;
  notes: string;
  candidateLines: DraftExtractionCandidateLine[];
  quarantinedLines: QuarantinedDraftExtractionLine[];
  d010Warning?: string;
  isImageWithoutOcr: boolean;
  totalLinesDetected: number;
  validLinesCount: number;
}

function normalizeString(val: string): string {
  return (val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function cleanTaxId(val?: string): string {
  return (val || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Resolves the appropriate DocumentMimeType from the file name and explicit MIME type.
 */
export function resolveDocumentMimeType(fileName: string, explicitMime?: string): DocumentMimeType {
  const lower = fileName.toLowerCase();
  if (explicitMime?.startsWith('image/png') || lower.endsWith('.png')) {
    return 'image/png';
  }
  if (explicitMime?.startsWith('image/webp') || lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (
    explicitMime?.startsWith('image/jpeg') ||
    explicitMime?.startsWith('image/jpg') ||
    lower.endsWith('.jpg') ||
    lower.endsWith('.jpeg')
  ) {
    return 'image/jpeg';
  }
  // Default to application/pdf (text decoding fallback handles PDF, CSV, TSV, TXT)
  return 'application/pdf';
}

/**
 * Extracts candidate lines and metadata from a commercial document to prefill a DRAFT purchase invoice.
 */
export async function extractPurchasingDraftFromDocument(options: {
  bufferOrText: Uint8Array | string;
  fileName: string;
  mimeType?: string;
  suppliers: SupplierRef[];
  ingredients: IngredientRef[];
  visionProvider?: IDocumentVisionOcrProvider;
}): Promise<PurchasingDraftExtractionResult> {
  const { bufferOrText, fileName, suppliers, ingredients, visionProvider } = options;
  const resolvedMime = resolveDocumentMimeType(fileName, options.mimeType);
  const isImage = resolvedMime.startsWith('image/');
  const isImageWithoutOcr = isImage && !visionProvider;

  const extractor = new DocumentCatalogExtractor(visionProvider);
  const extraction = await extractor.extract({
    bufferOrText,
    fileName,
    mimeType: resolvedMime,
  });

  // 1. Match supplier from header
  let matchedSupplierId = '';
  let matchedSupplierName: string | undefined = undefined;

  const issuerTaxIdClean = cleanTaxId(extraction.header.issuerTaxId);
  const issuerNameNorm = normalizeString(extraction.header.issuerName || '');
  const rawHeaderNorm = normalizeString(extraction.header.rawHeaderText || '');

  for (const s of suppliers) {
    const suppTaxClean = cleanTaxId(s.taxId);
    const suppNameNorm = normalizeString(s.name);

    // Exact Tax ID (CIF / NIF) match
    if (issuerTaxIdClean && suppTaxClean && issuerTaxIdClean === suppTaxClean) {
      matchedSupplierId = s.id;
      matchedSupplierName = s.name;
      break;
    }

    // Name match or header containment
    if (
      (issuerNameNorm && (issuerNameNorm.includes(suppNameNorm) || suppNameNorm.includes(issuerNameNorm))) ||
      (rawHeaderNorm && rawHeaderNorm.includes(suppNameNorm))
    ) {
      matchedSupplierId = s.id;
      matchedSupplierName = s.name;
      break;
    }
  }

  // 2. Validate extracted lines using D-010 anti-hallucination rules
  const candidateLines: DraftExtractionCandidateLine[] = [];
  const quarantinedLines: QuarantinedDraftExtractionLine[] = [];

  for (const line of extraction.lines) {
    const validation = validateExtractedLine(line, line.lineNumber);

    if (!validation.isValid) {
      quarantinedLines.push({
        lineNumber: line.lineNumber,
        productName: line.productName || '(Sin descripción legible)',
        rawText: line.rawText,
        reason: validation.reason || 'Descartada por regla anti-alucinación D-010',
        rejectionReasons: validation.rejectionReasons || [],
      });
      continue;
    }

    // Match candidate line to existing tenant ingredients
    const lineNameNorm = normalizeString(line.productName);
    let matchedIng: IngredientRef | undefined = undefined;

    // Direct normalized match
    matchedIng = ingredients.find((ing) => normalizeString(ing.name) === lineNameNorm);

    // Substring match if no exact match and name is sufficiently specific
    if (!matchedIng && lineNameNorm.length >= 4) {
      matchedIng = ingredients.find((ing) => {
        const ingNorm = normalizeString(ing.name);
        return ingNorm.includes(lineNameNorm) || lineNameNorm.includes(ingNorm);
      });
    }

    let suggestedIngredientId: string | undefined = undefined;
    let suggestedIngredientName: string | undefined = undefined;
    let suggestedConfidence: number | undefined = undefined;

    // If not matched, compute heuristic suggestion for human validation (Anti-Hallucination D-010: does not auto-assign)
    if (!matchedIng) {
      let bestSim = 0;
      let candidateIng: IngredientRef | undefined = undefined;

      for (const ing of ingredients) {
        const ingNorm = normalizeString(ing.name);
        if (!ingNorm) continue;
        const wordsA = Array.from(new Set(lineNameNorm.split(/\s+/).filter((w) => w.length >= 3)));
        const wordsB = Array.from(new Set(ingNorm.split(/\s+/).filter((w) => w.length >= 3)));
        if (wordsA.length === 0 || wordsB.length === 0) continue;
        let matches = 0;
        for (const wA of wordsA) {
          if (
            wordsB.some(
              (wB) =>
                wA === wB ||
                (wA.length >= 4 && wB.length >= 4 && (wA.startsWith(wB.slice(0, 4)) || wB.startsWith(wA.slice(0, 4))))
            )
          ) {
            matches++;
          }
        }
        const sim = (2 * matches) / (wordsA.length + wordsB.length);
        if (sim > bestSim && sim >= 0.30) {
          bestSim = sim;
          candidateIng = ing;
        }
      }

      if (candidateIng) {
        suggestedIngredientId = candidateIng.id;
        suggestedIngredientName = candidateIng.name;
        suggestedConfidence = Math.round(bestSim * 100) / 100;
      }
    }

    const lineId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `line-${line.lineNumber}-${Date.now()}`;

    // Tax rate formatted as percentage string (e.g. "10" for 0.10)
    let taxRateStr = '10';
    if (line.taxRate !== undefined && line.taxRate !== null && !isNaN(line.taxRate)) {
      taxRateStr = String(Math.round(line.taxRate * 100));
    }

    candidateLines.push({
      lineId,
      itemId: matchedIng ? matchedIng.id : '',
      itemName: matchedIng ? matchedIng.name : line.productName,
      itemNature: 'INVENTORYABLE',
      quantity: String(line.quantity),
      unit: matchedIng ? matchedIng.unit : line.unit || 'kg',
      unitPrice: String(line.rawPrice),
      discountAmount: '0.00',
      taxRate: taxRateStr,
      confidence: line.confidence,
      matchedIngredient: Boolean(matchedIng),
      suggestedIngredientId,
      suggestedIngredientName,
      suggestedConfidence,
      sku: line.sku,
      gtin: line.gtin,
      rawText: line.rawText,
    });
  }

  // 3. Compute D-010 warning if lines could not be extracted reliably
  let d010Warning: string | undefined = undefined;
  if (isImageWithoutOcr) {
    d010Warning =
      `Aviso D-010 (Anti-Alucinación): Se cargó un archivo de imagen ('${fileName}') pero no hay un proveedor de OCR/Visión configurado en este entorno. Ningún dato fue inventado. Por favor, introduce o completa los datos de la factura manualmente.`;
  } else if (extraction.lines.length === 0) {
    d010Warning =
      `Aviso D-010 (Anti-Alucinación): No se detectaron líneas de compra legibles en '${fileName}'. Revisa el documento e introduce las líneas manualmente sin inventar precios ni cantidades.`;
  } else if (candidateLines.length === 0 && quarantinedLines.length > 0) {
    d010Warning =
      `Aviso D-010 (Anti-Alucinación): Se detectaron ${quarantinedLines.length} líneas pero todas fueron descartadas por criterios de integridad (baja confianza, precios no positivos o unidades ausentes). Se requiere revisión manual.`;
  }

  const invoiceNumber = extraction.header.documentNumber || '';
  const invoiceDate = extraction.header.documentDate || new Date().toISOString().slice(0, 10);
  const additionalCosts = extraction.header.freightCostRaw ? String(extraction.header.freightCostRaw) : '0.00';
  const notes = `[Carga Asistida D-010] Documento: ${fileName} (SHA-256: ${extraction.fileChecksumSha256.slice(0, 12)}...)`;

  return {
    fileName,
    fileChecksumSha256: extraction.fileChecksumSha256,
    mimeType: resolvedMime,
    invoiceNumber,
    invoiceDate,
    selectedSupplierId: matchedSupplierId,
    matchedSupplierName,
    additionalCosts,
    notes,
    candidateLines,
    quarantinedLines,
    d010Warning,
    isImageWithoutOcr,
    totalLinesDetected: extraction.lines.length,
    validLinesCount: candidateLines.length,
  };
}
