/**
 * YOURMEAL OS — DOCUMENT EXTRACTION & SYNTHETIC BENCHMARK ENGINE
 * Decoupled provider interface supporting:
 * 1. Manual Form Entry (Zero-AI baseline)
 * 2. Realistic Synthetic Invoices (EatClean Tenerife fixtures for test & onboarding)
 * 3. Gemini Multimodal / OCR Cloud extraction specification
 */

import type {
  DocumentType,
  ItemNature,
  ExpenseCategory,
  CostBehavior,
  CostCenter,
  PurchaseDocument,
} from './domain-types';

export interface ExtractedField<T> {
  value: T;
  confidence: number; // 0.00 to 1.00
  sourceBoundingBox?: { x: number; y: number; width: number; height: number };
}

export interface ExtractedDocumentLine {
  lineNumber: number;
  supplierProductCode?: string;
  description: string;
  itemNature: ItemNature;
  expenseCategory: ExpenseCategory;
  costBehavior: CostBehavior;
  costCenter: CostCenter;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountAmount: number;
  taxRatePct: number;
  taxAmount: number;
  lineTotal: number;
  confidence: number;
}

export interface ExtractedDocumentResult {
  documentType: DocumentType;
  supplier: {
    taxId?: string;
    name: string;
    confidence: number;
  };
  documentNumber: string;
  documentDate: string;
  economicPeriod: string; // YYYY-MM
  currency: string;
  lines: ExtractedDocumentLine[];
  summary: {
    subtotalExTax: number;
    taxTotal: number;
    additionalCosts: number;
    totalAmount: number;
    checksumMatches: boolean; // sum(lines) + taxes + additional === total
  };
  overallConfidence: number;
  processingTimeMs: number;
  provenance: 'MANUAL_TEMPLATE' | 'SYNTHETIC_BENCHMARK' | 'AI_GEMINI_FLASH' | 'OCR_PDF_PARSER';
}

export interface DocumentExtractionProvider {
  extractDocument(file: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    contentBase64OrUrl?: string;
  }): Promise<ExtractedDocumentResult>;
}

/**
 * Baseline Provider 1: Manual Template (When user uploads without AI or for manual typing)
 */
export class ManualTemplateProvider implements DocumentExtractionProvider {
  async extractDocument(): Promise<ExtractedDocumentResult> {
    const today = new Date().toISOString().slice(0, 10);
    return {
      documentType: 'INVOICE',
      supplier: { name: '', confidence: 1.0 },
      documentNumber: '',
      documentDate: today,
      economicPeriod: today.slice(0, 7),
      currency: 'EUR',
      lines: [
        {
          lineNumber: 1,
          description: '',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'RAW_MATERIALS',
          costBehavior: 'DIRECT_FOOD',
          costCenter: 'KITCHEN',
          quantity: 1,
          unit: 'kg',
          unitPrice: 0,
          discountAmount: 0,
          taxRatePct: 7, // Default IGIC
          taxAmount: 0,
          lineTotal: 0,
          confidence: 1.0,
        },
      ],
      summary: {
        subtotalExTax: 0,
        taxTotal: 0,
        additionalCosts: 0,
        totalAmount: 0,
        checksumMatches: true,
      },
      overallConfidence: 1.0,
      processingTimeMs: 15,
      provenance: 'MANUAL_TEMPLATE',
    };
  }
}

/**
 * Baseline Provider 2: Synthetic Benchmark Fixtures for EatClean Tenerife
 * Used for instant onboarding, deterministic tests, and visual demonstrations without network costs.
 */
export class SyntheticBenchmarkProvider implements DocumentExtractionProvider {
  async extractDocument(file: { fileName: string }): Promise<ExtractedDocumentResult> {
    const name = file.fileName.toLowerCase();

    // Case 1: Electricity invoice (Endesa Energía) -> Pure Service / OPEX
    if (name.includes('luz') || name.includes('endesa') || name.includes('electricidad')) {
      return {
        documentType: 'INVOICE',
        supplier: { taxId: 'A81948077', name: 'Endesa Energía S.A.U.', confidence: 0.99 },
        documentNumber: 'ES-2026-98124',
        documentDate: '2026-10-05',
        economicPeriod: '2026-09', // Consumo del mes anterior
        currency: 'EUR',
        lines: [
          {
            lineNumber: 1,
            supplierProductCode: 'POT-KW',
            description: 'Término de Potencia Contratada Cocina Central (25 kW)',
            itemNature: 'EXPENSE_SERVICE',
            expenseCategory: 'UTILITIES',
            costBehavior: 'STRUCTURAL_FIXED',
            costCenter: 'KITCHEN',
            quantity: 1,
            unit: 'mes',
            unitPrice: 185.40,
            discountAmount: 0,
            taxRatePct: 3.0, // IGIC Energía
            taxAmount: 5.56,
            lineTotal: 190.96,
            confidence: 0.98,
          },
          {
            lineNumber: 2,
            supplierProductCode: 'E-KWH',
            description: 'Consumo Activo Hornos y Cámaras Frigoríficas (3.420 kWh)',
            itemNature: 'EXPENSE_SERVICE',
            expenseCategory: 'UTILITIES',
            costBehavior: 'INDIRECT_PRODUCTION',
            costCenter: 'KITCHEN',
            quantity: 3420,
            unit: 'kWh',
            unitPrice: 0.178,
            discountAmount: 0,
            taxRatePct: 3.0,
            taxAmount: 18.26,
            lineTotal: 627.02,
            confidence: 0.96,
          },
        ],
        summary: {
          subtotalExTax: 794.16,
          taxTotal: 23.82,
          additionalCosts: 0,
          totalAmount: 817.98,
          checksumMatches: true,
        },
        overallConfidence: 0.97,
        processingTimeMs: 420,
        provenance: 'SYNTHETIC_BENCHMARK',
      };
    }

    // Case 2: Kitchen Rent (Tenerife Inversiones) -> Structural OPEX
    if (name.includes('alquiler') || name.includes('renta') || name.includes('local')) {
      return {
        documentType: 'INVOICE',
        supplier: { taxId: 'B38901234', name: 'Inversiones Inmobiliarias Tenerife S.L.', confidence: 0.99 },
        documentNumber: 'ALQ-2026-10',
        documentDate: '2026-10-01',
        economicPeriod: '2026-10',
        currency: 'EUR',
        lines: [
          {
            lineNumber: 1,
            description: 'Arrendamiento Cocina Central Polígono Los Majuelos (Nave 4B)',
            itemNature: 'EXPENSE_SERVICE',
            expenseCategory: 'RENT_OCCUPANCY',
            costBehavior: 'STRUCTURAL_FIXED',
            costCenter: 'GENERAL_BUSINESS',
            quantity: 1,
            unit: 'mes',
            unitPrice: 1800.00,
            discountAmount: 0,
            taxRatePct: 7.0, // IGIC Alquiler comercial
            taxAmount: 126.00,
            lineTotal: 1926.00,
            confidence: 0.99,
          },
        ],
        summary: {
          subtotalExTax: 1800.00,
          taxTotal: 126.00,
          additionalCosts: 0,
          totalAmount: 1926.00,
          checksumMatches: true,
        },
        overallConfidence: 0.99,
        processingTimeMs: 250,
        provenance: 'SYNTHETIC_BENCHMARK',
      };
    }

    // Case 3: Mixed invoice from Makro Adeje -> Food Goods + Packaging + Freight Porte
    return {
      documentType: 'INVOICE',
      supplier: { taxId: 'A28143236', name: 'Makro Autoservicio Mayorista S.A. (Adeje)', confidence: 0.98 },
      documentNumber: 'MAK-TF-2026-0418',
      documentDate: '2026-10-22',
      economicPeriod: '2026-10',
      currency: 'EUR',
      lines: [
        {
          lineNumber: 1,
          supplierProductCode: '741289',
          description: 'Pechuga de Pollo Limpia Fileteada Extra (Caja 10 kg)',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'RAW_MATERIALS',
          costBehavior: 'DIRECT_FOOD',
          costCenter: 'KITCHEN',
          quantity: 20, // 20 kg
          unit: 'kg',
          unitPrice: 6.20,
          discountAmount: 0,
          taxRatePct: 3.0, // IGIC Alimentos elaborados
          taxAmount: 3.72,
          lineTotal: 127.72,
          confidence: 0.98,
        },
        {
          lineNumber: 2,
          supplierProductCode: '109844',
          description: 'Arroz Integral Grano Redondo (Saco 5 kg)',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'RAW_MATERIALS',
          costBehavior: 'DIRECT_FOOD',
          costCenter: 'KITCHEN',
          quantity: 15, // 3 sacos = 15 kg
          unit: 'kg',
          unitPrice: 1.85,
          discountAmount: 0,
          taxRatePct: 0.0, // IGIC Cesta Básica 0%
          taxAmount: 0.00,
          lineTotal: 27.75,
          confidence: 0.96,
        },
        {
          lineNumber: 3,
          supplierProductCode: '990312',
          description: 'Bowl Biodegradable Caña Azúcar 750ml con Tapa (Pack 100 uds)',
          itemNature: 'INVENTORYABLE',
          expenseCategory: 'PACKAGING',
          costBehavior: 'DIRECT_PACKAGING',
          costCenter: 'PACKING_DISPATCH',
          quantity: 300, // 3 packs
          unit: 'ud',
          unitPrice: 0.18,
          discountAmount: 0,
          taxRatePct: 7.0, // IGIC Envases
          taxAmount: 3.78,
          lineTotal: 57.78,
          confidence: 0.95,
        },
        {
          lineNumber: 4,
          supplierProductCode: 'LOG-FRIG',
          description: 'Suplemento Porte Especial Temperatura Controlada Isoterma',
          itemNature: 'EXPENSE_SERVICE',
          expenseCategory: 'LOGISTICS_TRANSPORT',
          costBehavior: 'LOGISTICS_DELIVERY',
          costCenter: 'KITCHEN',
          quantity: 1,
          unit: 'servicio',
          unitPrice: 22.00,
          discountAmount: 0,
          taxRatePct: 7.0,
          taxAmount: 1.54,
          lineTotal: 23.54,
          confidence: 0.92,
        },
      ],
      summary: {
        subtotalExTax: 229.25,
        taxTotal: 9.04,
        additionalCosts: 0,
        totalAmount: 238.29,
        checksumMatches: true,
      },
      overallConfidence: 0.96,
      processingTimeMs: 510,
      provenance: 'SYNTHETIC_BENCHMARK',
    };
  }
}
