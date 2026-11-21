/**
 * CR-COST-05 PR4: Document Catalog Extractor (PDF & Image Documents)
 * Parses commercial documents (invoices, delivery notes, quotes, supplier price sheets)
 * from text-embedded PDFs or via an injectable Vision/OCR provider.
 */

import crypto from 'node:crypto';
import {
  DocumentExtractionResult,
  DocumentMimeType,
  ExtractedDocumentHeader,
  ExtractedDocumentLine,
} from '../domain/document-extraction';
import { ContentUnit, PackPresentation, TaxMode, TaxRegime, ThermalState } from '../domain/types';

/**
 * Computes deterministic SHA-256 hex string for a given binary buffer or string payload.
 */
export function calculateFileSha256(bufferOrText: Uint8Array | string): string {
  const hash = crypto.createHash('sha256');
  if (typeof bufferOrText === 'string') {
    hash.update(bufferOrText, 'utf8');
  } else {
    hash.update(bufferOrText);
  }
  return hash.digest('hex');
}

export interface IDocumentVisionOcrProvider {
  extractFromDocument(input: {
    bufferOrText: Uint8Array | string;
    mimeType: DocumentMimeType;
    fileName: string;
  }): Promise<{
    header: Partial<ExtractedDocumentHeader>;
    lines: Partial<ExtractedDocumentLine>[];
    rawText: string;
  }>;
}

export class DocumentCatalogExtractor {
  constructor(private readonly visionProvider?: IDocumentVisionOcrProvider) {}

  /**
   * Convenience alias for extracting from a buffer/text with file name and optional mime type.
   */
  public async extractFromDocument(
    bufferOrText: Uint8Array | string,
    fileName: string,
    mimeType: DocumentMimeType = 'application/pdf'
  ): Promise<DocumentExtractionResult> {
    return this.extract({
      bufferOrText,
      fileName,
      mimeType,
    });
  }

  /**
   * Extracts structured invoice/quote data from a document buffer or text payload.
   */
  public async extract(input: {
    bufferOrText: Uint8Array | string;
    mimeType: DocumentMimeType;
    fileName: string;
    overrideVisionProvider?: IDocumentVisionOcrProvider;
  }): Promise<DocumentExtractionResult> {
    const checksum = await this.computeSha256Checksum(input.bufferOrText);
    const provider = input.overrideVisionProvider || this.visionProvider;

    if (provider) {
      const extracted = await provider.extractFromDocument({
        bufferOrText: input.bufferOrText,
        mimeType: input.mimeType,
        fileName: input.fileName,
      });

      const header: ExtractedDocumentHeader = {
        sourceNameOrId: extracted.header.sourceNameOrId,
        issuerTaxId: extracted.header.issuerTaxId,
        documentNumber: extracted.header.documentNumber,
        documentDate: extracted.header.documentDate,
        currency: extracted.header.currency || 'EUR',
        deliveryPostalCode: extracted.header.deliveryPostalCode,
        deliveryIslandCode: extracted.header.deliveryIslandCode,
        freightInclusion: extracted.header.freightInclusion,
        freightCostRaw: extracted.header.freightCostRaw,
        freeFreightMinOrderAmount: extracted.header.freeFreightMinOrderAmount,
        rawHeaderText: extracted.header.rawHeaderText,
      };

      const lines: ExtractedDocumentLine[] = (extracted.lines || []).map((l, idx) => ({
        lineNumber: l.lineNumber ?? idx + 1,
        rawText: l.rawText || '',
        sku: l.sku,
        gtin: l.gtin,
        productName: l.productName || '',
        brand: l.brand,
        quantity: l.quantity ?? 0,
        unit: l.unit || '',
        packPresentation: l.packPresentation,
        packCount: l.packCount,
        unitContentQty: l.unitContentQty,
        unitContentUnit: l.unitContentUnit,
        netContentQty: l.netContentQty,
        netContentUnit: l.netContentUnit,
        drainedWeightQty: l.drainedWeightQty,
        drainedWeightUnit: l.drainedWeightUnit,
        densityKgPerL: l.densityKgPerL,
        rawPrice: l.rawPrice ?? 0,
        taxMode: l.taxMode,
        taxRate: l.taxRate,
        taxRegime: l.taxRegime,
        aiemStatus: l.aiemStatus,
        aiemRate: l.aiemRate,
        aiemAmountRaw: l.aiemAmountRaw,
        thermalState: l.thermalState,
        confidence: typeof l.confidence === 'number' ? l.confidence : 0.85,
        isCatchWeight: l.isCatchWeight,
        taricCode: l.taricCode,
      }));

      return {
        header,
        lines,
        rawText: extracted.rawText,
        fileChecksumSha256: checksum,
        fileName: input.fileName,
        mimeType: input.mimeType,
      };
    }

    // Default text-based tabular extraction (for PDF text extractions, CSV-in-PDF, or text dumps)
    const rawText =
      typeof input.bufferOrText === 'string'
        ? input.bufferOrText
        : new TextDecoder('utf-8').decode(input.bufferOrText);

    return this.extractFromText(rawText, input.fileName, input.mimeType, checksum);
  }

  private extractFromText(
    text: string,
    fileName: string,
    mimeType: DocumentMimeType,
    checksum: string
  ): DocumentExtractionResult {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

    const header = this.parseDocumentHeader(lines, text);
    const parsedLines: ExtractedDocumentLine[] = [];

    let lineCounter = 1;
    for (const rawLine of lines) {
      const lineItem = this.tryParseDocumentLine(rawLine, lineCounter);
      if (lineItem) {
        parsedLines.push(lineItem);
        lineCounter++;
      }
    }

    return {
      header,
      lines: parsedLines,
      rawText: text,
      fileChecksumSha256: checksum,
      fileName,
      mimeType,
    };
  }

  private parseDocumentHeader(lines: string[], fullText: string): ExtractedDocumentHeader {
    const header: ExtractedDocumentHeader = {
      currency: 'EUR',
      rawHeaderText: lines.slice(0, 10).join('\n'),
    };

    // 1. CIF / NIF detection
    const nifMatch = fullText.match(/\b([A-HJ-NP-SUVW][-\s.]?[0-9]{7}[-\s.]?[0-9A-J]|[0-9]{8}[-\s.]?[A-Z])\b/i);
    if (nifMatch) {
      header.issuerTaxId = nifMatch[1].toUpperCase();
    }

    // Issuer Name detection (first non-empty header line without colon)
    const candidateNameLine = lines.slice(0, 5).find((l) => l.trim().length > 3 && !l.includes(':'));
    if (candidateNameLine) {
      header.issuerName = candidateNameLine.trim();
    }

    // 2. Invoice / Delivery note number
    const docNumMatch = fullText.match(
      /(?:FACTURA|ALBAR[AÁ]N|PRESUPUESTO|PEDIDO|INVOICE|DOC)(?:\s+(?:N[º°\.]?|N[UÚ]MERO))?[\s#:.-]+([A-Z0-9\/-]{3,20})/i
    );
    if (docNumMatch) {
      header.documentNumber = docNumMatch[1];
    }

    // 3. Document Date
    const dateMatch = fullText.match(
      /\b(?:FECHA|DATE|EMISI[OÓ]N)?[:\s]*(\d{4}[-/.]\d{2}[-/.]\d{2}|\d{2}[-/.]\d{2}[-/.]\d{4})\b/i
    );
    if (dateMatch) {
      header.documentDate = this.normalizeDate(dateMatch[1]);
    }

    // 4. Source Name Detection
    const knownSources = [
      { id: 'src-makro', name: 'Makro' },
      { id: 'src-gmcash', name: 'GM Cash' },
      { id: 'src-5oceanos', name: '5 Océanos' },
      { id: 'src-mercadona', name: 'Mercadona' },
    ];
    for (const src of knownSources) {
      if (fullText.toLowerCase().includes(src.name.toLowerCase())) {
        header.sourceNameOrId = src.id;
        break;
      }
    }

    // 5. Freight Detection
    const freightMatch = fullText.match(
      /(?:PORTES|TRANSPORTE|FREIGHT|GASTOS\s+ENV[IÍ]O)[:\s]+([0-9.,]+)\s*€?/i
    );
    if (freightMatch) {
      const freightVal = parseFloat(freightMatch[1].replace(',', '.'));
      if (!isNaN(freightVal)) {
        header.freightCostRaw = freightVal;
        header.freightInclusion = freightVal === 0 ? 'included' : 'excluded';
      }
    }

    return header;
  }

  private tryParseDocumentLine(
    rawLine: string,
    lineNumber: number
  ): ExtractedDocumentLine | null {
    // Ignore obvious non-item lines (headers, totals, legal notes, page numbers)
    const upper = rawLine.toUpperCase();
    if (
      upper.startsWith('PÁGINA') ||
      upper.startsWith('PAGE') ||
      upper.startsWith('TOTAL') ||
      upper.startsWith('SUBTOTAL') ||
      upper.startsWith('BASE IMPONIBLE') ||
      upper.startsWith('FECHA') ||
      upper.startsWith('NIF') ||
      upper.startsWith('CIF') ||
      upper.startsWith('CONCEPTO') ||
      upper.startsWith('CANTIDAD') ||
      upper.startsWith('DESCRIPCIÓN') ||
      upper.length < 5
    ) {
      return null;
    }

    // Delimited row match (pipe, semicolon, or multiple spaces/tabs)
    // Format: [SKU/Code]? Description Quantity Unit Price [Tax%]?
    const pipeParts = rawLine.split('|').map((p) => p.trim());
    if (pipeParts.length >= 4) {
      return this.parsePipedLine(pipeParts, rawLine, lineNumber);
    }

    // Tabular whitespace match: Description  Qty  Unit  Price
    // e.g.: "Pechuga de Pollo Fresca 2.5 kg 13.125 0%"
    // e.g.: "MK-101 Pechuga de Pollo Fresca 2.5 kg 13.125"
    const regex =
      /^(?:([A-Z0-9-]{3,14})\s+)?(.+?)\s+([0-9.,]+)\s+(kg|g|l|ml|ud|uds|unit|unidades|pack|caja|bote|lata|bot)\s+([0-9.,]+)(?:\s+[0-9.,]+)?(?:\s+€)?(?:\s+([0-9.,]+)%)?/i;
    const match = rawLine.match(regex);

    if (match) {
      const sku = match[1] || undefined;
      const productName = match[2].trim();
      const qtyStr = match[3].replace(',', '.');
      const unit = match[4].toLowerCase();
      const priceStr = match[5].replace(',', '.');
      const taxRateStr = match[6]?.replace(',', '.');

      const quantity = parseFloat(qtyStr);
      const rawPrice = parseFloat(priceStr);
      const taxRate = taxRateStr ? parseFloat(taxRateStr) / 100 : undefined;

      const isValidNumbers = !isNaN(quantity) && quantity > 0 && !isNaN(rawPrice) && rawPrice > 0;

      return {
        lineNumber,
        rawText: rawLine,
        sku,
        productName,
        quantity: isValidNumbers ? quantity : 0,
        unit: this.normalizeUnit(unit),
        rawPrice: isValidNumbers ? rawPrice : 0,
        taxMode: taxRate !== undefined ? (taxRate === 0 ? 'ex_tax' : 'ex_tax') : 'unknown',
        taxRate: taxRate !== undefined && !isNaN(taxRate) ? taxRate : undefined,
        confidence: isValidNumbers ? 0.95 : 0.45,
        thermalState: this.inferThermalState(productName),
      };
    }

    return null;
  }

  private parsePipedLine(
    parts: string[],
    rawLine: string,
    lineNumber: number
  ): ExtractedDocumentLine {
    // If 5 parts: [0] SKU/GTIN, [1] Name, [2] Qty, [3] Unit, [4] Price, [5?] Tax
    let sku: string | undefined;
    let gtin: string | undefined;
    let productName = '';
    let qtyStr = '1';
    let unit = 'kg';
    let priceStr = '0';
    let taxStr: string | undefined;

    if (parts.length >= 5) {
      const first = parts[0];
      if (/^[0-9]{8,14}$/.test(first)) {
        gtin = first;
      } else {
        sku = first;
      }
      productName = parts[1];
      qtyStr = parts[2];
      unit = parts[3];
      priceStr = parts[4];
      taxStr = parts[5];
    } else {
      productName = parts[0];
      qtyStr = parts[1];
      unit = parts[2];
      priceStr = parts[3];
      taxStr = parts[4];
    }

    const quantity = parseFloat(qtyStr.replace(',', '.'));
    const rawPrice = parseFloat(priceStr.replace(',', '.'));
    const taxRate = taxStr ? parseFloat(taxStr.replace(',', '.').replace('%', '')) / 100 : undefined;

    const isValid = !isNaN(quantity) && quantity > 0 && !isNaN(rawPrice) && rawPrice > 0;

    return {
      lineNumber,
      rawText: rawLine,
      sku,
      gtin,
      productName: productName.trim(),
      quantity: isValid ? quantity : 0,
      unit: this.normalizeUnit(unit),
      rawPrice: isValid ? rawPrice : 0,
      taxMode: taxRate !== undefined ? 'ex_tax' : 'unknown',
      taxRate: taxRate !== undefined && !isNaN(taxRate) ? taxRate : undefined,
      confidence: isValid ? 0.90 : 0.40,
      thermalState: this.inferThermalState(productName),
    };
  }

  private normalizeUnit(rawUnit: string): string {
    const clean = rawUnit.toLowerCase().trim();
    if (clean === 'uds' || clean === 'unidades' || clean === 'ud') return 'unit';
    return clean;
  }

  private normalizeDate(dateStr: string): string {
    const clean = dateStr.trim();
    // YYYY-MM-DD
    if (/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(clean)) {
      return clean.replace(/[/.]/g, '-');
    }
    // DD-MM-YYYY
    const parts = clean.split(/[-/.]/);
    if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
      const dd = parts[0].padStart(2, '0');
      const mm = parts[1].padStart(2, '0');
      const yyyy = parts[2];
      return `${yyyy}-${mm}-${dd}`;
    }
    return new Date().toISOString().slice(0, 10);
  }

  private inferThermalState(productName: string): ThermalState {
    const lower = productName.toLowerCase();
    if (lower.includes('congelad') || lower.includes('frozen')) return 'frozen';
    if (lower.includes('fresc') || lower.includes('fresh')) return 'fresh';
    if (lower.includes('seco') || lower.includes('harina') || lower.includes('legumbre')) return 'dry';
    return 'ambient';
  }

  private async computeSha256Checksum(bufferOrText: Uint8Array | string): Promise<string> {
    return calculateFileSha256(bufferOrText);
  }
}
