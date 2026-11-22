import { describe, expect, it } from 'vitest';
import {
  extractPurchasingDraftFromDocument,
  resolveDocumentMimeType,
} from './purchasing-document-draft';
import type { IDocumentVisionOcrProvider } from '@/modules/market-intelligence/infrastructure/document-catalog-extractor';

describe('CR-COST-05 Bloque 1 · Purchasing Document Draft Service', () => {
  const sampleSuppliers = [
    { id: 'supp-makro', name: 'Makro España Mayorista', taxId: 'A-28123456' },
    { id: 'supp-gmcash', name: 'GM Cash & Carry', taxId: 'B-08987654' },
    { id: 'supp-5oceanos', name: '5 Océanos Congelados', taxId: 'B-38112233' },
  ];

  const sampleIngredients = [
    { id: 'ing-chicken', name: 'Pechuga de Pollo Fresca', unit: 'kg', cost: 5.25 },
    { id: 'ing-rice', name: 'Arroz Redondo Extra', unit: 'kg', cost: 1.15 },
    { id: 'ing-oil', name: 'Aceite de Oliva Virgen Extra', unit: 'l', cost: 8.5 },
  ];

  it('correctly resolves MIME types from file extensions and explicit headers', () => {
    expect(resolveDocumentMimeType('factura-noviembre.pdf')).toBe('application/pdf');
    expect(resolveDocumentMimeType('albaran-foto.jpg')).toBe('image/jpeg');
    expect(resolveDocumentMimeType('albaran-foto.png')).toBe('image/png');
    expect(resolveDocumentMimeType('albaran-foto.webp')).toBe('image/webp');
    expect(resolveDocumentMimeType('albaran.csv', 'text/csv')).toBe('application/pdf');
  });

  it('extracts candidate lines and pre-fills DRAFT invoice from pipe-delimited B2B document', async () => {
    const documentContent = `
FACTURA Nº: FAC-2026-8812
FECHA: 2026-11-20
EMISOR: Makro España Mayorista
CIF: A-28123456
PORTES: 15.50 €

MK-101 | Pechuga de Pollo Fresca | 25.0 | kg | 5.30 | 10%
MK-102 | Arroz Redondo Extra | 50.0 | kg | 1.18 | 10%
    `.trim();

    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: documentContent,
      fileName: 'factura_makro_nov2026.txt',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
    });

    expect(result.invoiceNumber).toBe('FAC-2026-8812');
    expect(result.invoiceDate).toBe('2026-11-20');
    expect(result.selectedSupplierId).toBe('supp-makro');
    expect(result.matchedSupplierName).toBe('Makro España Mayorista');
    expect(result.additionalCosts).toBe('15.5');
    expect(result.validLinesCount).toBe(2);
    expect(result.quarantinedLines.length).toBe(0);

    const [line1, line2] = result.candidateLines;
    expect(line1.itemId).toBe('ing-chicken');
    expect(line1.itemName).toBe('Pechuga de Pollo Fresca');
    expect(line1.quantity).toBe('25');
    expect(line1.unitPrice).toBe('5.3');
    expect(line1.taxRate).toBe('10');
    expect(line1.matchedIngredient).toBe(true);

    expect(line2.itemId).toBe('ing-rice');
    expect(line2.itemName).toBe('Arroz Redondo Extra');
    expect(line2.quantity).toBe('50');
    expect(line2.unitPrice).toBe('1.18');
    expect(line2.matchedIngredient).toBe(true);
  });

  it('extracts candidate lines from semicolon-delimited CSV document', async () => {
    const csvContent = `
ALBARÁN: ALB-9901
FECHA: 2026-11-21
NIF: B-08987654

GM-201;Pechuga de Pollo;10;kg;5.40;10%
GM-202;Aceite de Oliva Virgen Extra;5;l;8.60;10%
    `.trim();

    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: csvContent,
      fileName: 'albaran_gmcash.csv',
      mimeType: 'text/csv',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
    });

    expect(result.invoiceNumber).toBe('ALB-9901');
    expect(result.selectedSupplierId).toBe('supp-gmcash');
    expect(result.validLinesCount).toBe(2);

    expect(result.candidateLines[0].itemId).toBe('ing-chicken');
    expect(result.candidateLines[1].itemId).toBe('ing-oil');
  });

  it('quarantines lines violating D-010 anti-hallucination rules (zero price or unreadable data)', async () => {
    const mixedContent = `
FACTURA: FAC-ERR-001
FECHA: 2026-11-22
PROVEEDOR: Makro

MK-001 | Pechuga de Pollo Fresca | 10.0 | kg | 5.25 | 10%
MK-002 | Producto Sin Precio | 5.0 | kg | 0.00 | 10%
MK-003 | Cantidad Negativa | -3.0 | kg | 2.50 | 10%
    `.trim();

    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: mixedContent,
      fileName: 'factura_con_errores.txt',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
    });

    expect(result.validLinesCount).toBe(1);
    expect(result.candidateLines[0].itemName).toBe('Pechuga de Pollo Fresca');

    expect(result.quarantinedLines.length).toBe(2);
    expect(result.quarantinedLines[0].productName).toBe('Producto Sin Precio');
    expect(result.quarantinedLines[0].reason).toContain('Precio unitario no positivo');
    expect(result.quarantinedLines[1].productName).toBe('Cantidad Negativa');
    expect(result.quarantinedLines[1].reason).toContain('Cantidad física no positiva');
  });

  it('safely handles image files without active Vision OCR provider, returning D-010 warning', async () => {
    // Simulated raw PNG bytes
    const fakePngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);

    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: fakePngBytes,
      fileName: 'albaran_foto_camion.png',
      mimeType: 'image/png',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
      visionProvider: undefined,
    });

    expect(result.isImageWithoutOcr).toBe(true);
    expect(result.validLinesCount).toBe(0);
    expect(result.candidateLines.length).toBe(0);
    expect(result.d010Warning).toBeDefined();
    expect(result.d010Warning).toContain('Aviso D-010 (Anti-Alucinación)');
    expect(result.d010Warning).toContain('no hay un proveedor de OCR/Visión configurado');
    expect(result.fileChecksumSha256).toBeDefined();
    expect(result.fileChecksumSha256.length).toBe(64);
  });

  it('supports injectable Vision OCR provider when available', async () => {
    const mockVisionProvider: IDocumentVisionOcrProvider = {
      extractFromDocument: async () => ({
        header: {
          documentNumber: 'OCR-INV-2026',
          documentDate: '2026-11-22',
          issuerTaxId: 'A-28123456',
        },
        lines: [
          {
            lineNumber: 1,
            productName: 'Pechuga de Pollo Fresca',
            quantity: 30,
            unit: 'kg',
            rawPrice: 5.10,
            taxRate: 0.10,
            confidence: 0.94,
          },
        ],
        rawText: 'OCR extraction text',
      }),
    };

    const dummyImageBytes = new Uint8Array([1, 2, 3, 4]);
    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: dummyImageBytes,
      fileName: 'factura_escaneada.jpg',
      mimeType: 'image/jpeg',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
      visionProvider: mockVisionProvider,
    });

    expect(result.isImageWithoutOcr).toBe(false);
    expect(result.invoiceNumber).toBe('OCR-INV-2026');
    expect(result.selectedSupplierId).toBe('supp-makro');
    expect(result.validLinesCount).toBe(1);
    expect(result.candidateLines[0].unitPrice).toBe('5.1');
    expect(result.candidateLines[0].quantity).toBe('30');
    expect(result.candidateLines[0].matchedIngredient).toBe(true);
  });

  it('leaves candidate line itemId empty if ingredient is not found in tenant catalog', async () => {
    const content = `
MK-999 | Trufa Negra de Verano | 1.0 | kg | 120.00 | 10%
    `.trim();

    const result = await extractPurchasingDraftFromDocument({
      bufferOrText: content,
      fileName: 'trufas.txt',
      suppliers: sampleSuppliers,
      ingredients: sampleIngredients,
    });

    expect(result.validLinesCount).toBe(1);
    const line = result.candidateLines[0];
    expect(line.itemName).toBe('Trufa Negra de Verano');
    expect(line.itemId).toBe(''); // Must be selected by operator
    expect(line.matchedIngredient).toBe(false);
  });
});
