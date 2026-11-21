import { describe, it, expect } from 'vitest';
import {
  DocumentCatalogExtractor,
  calculateFileSha256,
} from './document-catalog-extractor';
import {
  validateExtractedLine,
  isValidGtinChecksum,
  ExtractedDocumentLine,
} from '../domain/document-extraction';

describe('CR-COST-05 PR4 · DocumentCatalogExtractor & Anti-Hallucination Validation', () => {
  const extractor = new DocumentCatalogExtractor();

  describe('calculateFileSha256', () => {
    it('computes deterministic SHA-256 for a given buffer', () => {
      const buffer = Buffer.from('TEST_INVOICE_CONTENT_B2B');
      const hash1 = calculateFileSha256(buffer);
      const hash2 = calculateFileSha256(buffer);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces distinct hashes for different contents', () => {
      const hashA = calculateFileSha256(Buffer.from('Invoice A'));
      const hashB = calculateFileSha256(Buffer.from('Invoice B'));
      expect(hashA).not.toBe(hashB);
    });
  });

  describe('isValidGtinChecksum', () => {
    it('validates standard EAN-13 check digits correctly', () => {
      // 8412345678905 (Valid Spanish Barcode check digit: 5)
      expect(isValidGtinChecksum('8412345678905')).toBe(true);
      // 8412345678906 (Invalid check digit)
      expect(isValidGtinChecksum('8412345678906')).toBe(false);
    });

    it('rejects malformed lengths or non-numeric GTINs', () => {
      expect(isValidGtinChecksum('123')).toBe(false);
      expect(isValidGtinChecksum('841234567890A')).toBe(false);
    });
  });

  describe('validateExtractedLine (D-010 Strict Guard)', () => {
    const validLine: ExtractedDocumentLine = {
      lineNumber: 1,
      rawText: 'POL-01 Pechuga 10 kg 6.50 3%',
      sku: 'SKU-001',
      productName: 'Pechuga de Pollo Fresca',
      quantity: 10,
      unit: 'kg',
      rawPrice: 6.5,
      taxRate: 0.03, // 3% IGIC
      gtin: '8412345678905',
      confidence: 0.95,
    };

    it('accepts completely valid line with high confidence and valid GTIN', () => {
      const res = validateExtractedLine(validLine);
      expect(res.isValid).toBe(true);
      expect(res.rejectionReasons).toHaveLength(0);
    });

    it('rejects lines with confidence below 70% threshold', () => {
      const lowConfidenceLine: ExtractedDocumentLine = {
        ...validLine,
        confidence: 0.65,
      };
      const res = validateExtractedLine(lowConfidenceLine);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReasons).toContain(
        'Baja confianza OCR (65.0% < 70.0% requerido)'
      );
    });

    it('rejects lines with zero or negative price', () => {
      const zeroPriceLine: ExtractedDocumentLine = {
        ...validLine,
        rawPrice: 0,
      };
      const res = validateExtractedLine(zeroPriceLine);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReasons).toContain('Precio unitario no positivo (0.00)');

      const negPriceLine: ExtractedDocumentLine = {
        ...validLine,
        rawPrice: -5.5,
      };
      const resNeg = validateExtractedLine(negPriceLine);
      expect(resNeg.isValid).toBe(false);
      expect(resNeg.rejectionReasons).toContain('Precio unitario no positivo (-5.50)');
    });

    it('rejects lines with abnormal or negative tax rates (>30% or <0%)', () => {
      const highTaxLine: ExtractedDocumentLine = {
        ...validLine,
        taxRate: 0.45,
      };
      const resHigh = validateExtractedLine(highTaxLine);
      expect(resHigh.isValid).toBe(false);
      expect(resHigh.rejectionReasons).toContain('Tipo impositivo fuera de rango (45.00%)');

      const negTaxLine: ExtractedDocumentLine = {
        ...validLine,
        taxRate: -0.05,
      };
      const resNeg = validateExtractedLine(negTaxLine);
      expect(resNeg.isValid).toBe(false);
      expect(resNeg.rejectionReasons).toContain('Tipo impositivo fuera de rango (-5.00%)');
    });

    it('rejects lines with invalid GTIN checksum', () => {
      const badGtinLine: ExtractedDocumentLine = {
        ...validLine,
        gtin: '8412345678906',
      };
      const res = validateExtractedLine(badGtinLine);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReasons).toContain('Dígito de control GTIN inválido (8412345678906)');
    });

    it('rejects lines with non-positive physical quantities', () => {
      const badQtyLine: ExtractedDocumentLine = {
        ...validLine,
        quantity: -2,
      };
      const res = validateExtractedLine(badQtyLine);
      expect(res.isValid).toBe(false);
      expect(res.rejectionReasons).toContain('Cantidad física no positiva (-2)');
    });
  });

  describe('DocumentCatalogExtractor (Parsing Text B2B Invoices & Quotes)', () => {
    it('extracts structured invoice header and lines from B2B document text', async () => {
      const invoiceText = `
        DISTRIBUCIONES ALIMENTARIAS CANARIAS S.L.
        NIF/CIF: B-35123456
        FACTURA Nº: FAC-2026-0891
        FECHA: 15/10/2026
        VENCIMIENTO: 15/11/2026

        DESCRIPCION                           CANT    UNIDAD   PRECIO     TOTAL     IGIC
        POL-01 Pechuga Pollo Granja            25.0    kg        6.80    170.00     3%
        ARR-05 Arroz Bomba 5kg                 10.0    pack     12.50    125.00     0%
        ACE-01 Aceite Oliva Virgen Extra 5L     4.0    bot      28.90    115.60     0%

        BASE IMPONIBLE: 410.60 EUR
        TOTAL FACTURA: 415.70 EUR
      `;

      const buffer = Buffer.from(invoiceText);
      const result = await extractor.extractFromDocument(buffer, 'invoice_oct_2026.pdf', 'application/pdf');

      expect(result.fileChecksumSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(result.header.documentNumber).toBe('FAC-2026-0891');
      expect(result.header.issuerTaxId).toBe('B-35123456');
      expect(result.header.issuerName).toContain('DISTRIBUCIONES ALIMENTARIAS');
      expect(result.header.documentDate).toBe('2026-10-15');

      expect(result.lines.length).toBeGreaterThanOrEqual(3);

      const pollo = result.lines.find((l) => l.sku === 'POL-01');
      expect(pollo).toBeDefined();
      expect(pollo?.quantity).toBe(25.0);
      expect(pollo?.unit).toBe('kg');
      expect(pollo?.rawPrice).toBe(6.8);
      expect(pollo?.taxRate).toBe(0.03);
      expect(pollo?.confidence).toBeGreaterThanOrEqual(0.85);

      const arroz = result.lines.find((l) => l.sku === 'ARR-05');
      expect(arroz).toBeDefined();
      expect(arroz?.quantity).toBe(10.0);
      expect(arroz?.rawPrice).toBe(12.5);
      expect(arroz?.taxRate).toBe(0.0);
    });

    it('gracefully handles empty or unparseable buffers without throwing', async () => {
      const emptyBuffer = Buffer.from('');
      const result = await extractor.extractFromDocument(emptyBuffer, 'empty.pdf');
      expect(result.lines).toHaveLength(0);
      expect(result.header.documentNumber).toBeUndefined();
    });
  });
});
