/**
 * YOURMEAL OS — PURCHASES & OPERATIONAL EXPENSES PROTOTYPE (INCREMENT 1)
 * Domain types and contracts for unified document entry, physical reception,
 * cost classification, and accounting integration.
 */

export type DocumentType =
  | 'INVOICE'           // Factura completa oficial
  | 'DELIVERY_NOTE'     // Albarán de entrega (físico sin liquidación fiscal definitiva)
  | 'EXPENSE_RECEIPT'   // Ticket / Justificante de gasto menor
  | 'CREDIT_NOTE';      // Factura rectificativa / Abono

export type DocumentStatus =
  | 'DRAFT'             // Borrador inicial (recién subido o tecleado)
  | 'VERIFIED'          // Verificado y validado por humano
  | 'POSTED'            // Contabilizado en el periodo económico
  | 'CANCELLED';        // Anulado

export type ReceptionStatus =
  | 'NOT_APPLICABLE'    // Para servicios, suministros, alquiler (sin mercancía física)
  | 'PENDING'           // Mercancía pendiente de recepción física
  | 'PARTIALLY_RECEIVED'// Parte de la mercancía ha sido recibida
  | 'FULLY_RECEIVED';   // Toda la mercancía inventariable ha sido recibida

export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID'
  | 'DIRECT_DEBIT';     // Domiciliado bancariamente

export type ItemNature =
  | 'INVENTORYABLE'     // Mercancía que entra al almacén (ingredientes, envases, consumibles)
  | 'EXPENSE_SERVICE'   // Servicio, suministro o gasto operativo (luz, agua, alquiler, software)
  | 'CAPEX_ASSET';      // Activo fijo o equipamiento amortizable (horno, maquinaria)

export type ExpenseCategory =
  | 'RAW_MATERIALS'         // Materias primas e ingredientes
  | 'PACKAGING'             // Envases, bolsas y embalajes
  | 'LABOR'                 // Personal, nóminas y finiquitos
  | 'UTILITIES'             // Electricidad, agua, gas, internet
  | 'RENT_OCCUPANCY'        // Alquiler cocina central / local
  | 'LOGISTICS_TRANSPORT'   // Reparto de última milla, portes de proveedores
  | 'MAINTENANCE_CLEANING'  // Limpieza, desratización, mantenimiento maquinaria
  | 'SOFTWARE_TECH'         // TPV, YourMeal OS, hosting, SaaS
  | 'MARKETING_SALES'       // Publicidad, packaging branding, fotografía
  | 'PROFESSIONAL_SERVICES' // Gestoría, asesoría jurídica, auditoría
  | 'EQUIPMENT_INVESTMENT'  // Hornos, mesas de acero, abatidores
  | 'OTHER_OVERHEAD';       // Otros gastos generales

export type CostBehavior =
  | 'DIRECT_FOOD'           // Coste directo de materias primas
  | 'DIRECT_PACKAGING'      // Coste directo de envases por ración
  | 'INDIRECT_PRODUCTION'   // Coste indirecto de cocina (energía hornos, personal base)
  | 'LOGISTICS_DELIVERY'    // Coste de reparto
  | 'STRUCTURAL_FIXED';     // Coste fijo de estructura (alquiler, seguros, software)

export type CostCenter =
  | 'KITCHEN'               // Cocina central / Producción
  | 'PACKING_DISPATCH'      // Estación de empaquetado
  | 'DELIVERY_FLEET'        // Reparto y conductores
  | 'ADMINISTRATION'        // Oficina y gerencia
  | 'GENERAL_BUSINESS';     // Negocio global

export interface DocumentLineItem {
  id: string;
  documentId: string;
  lineNumber: number;
  supplierProductCode?: string;
  description: string;
  itemNature: ItemNature;
  expenseCategory: ExpenseCategory;
  costBehavior: CostBehavior;
  costCenter: CostCenter;
  
  // Inventory mapping (only if itemNature === 'INVENTORYABLE')
  matchedIngredientId?: string | null;
  matchedIngredientName?: string | null;

  // Quantities & units
  orderedQuantity: number;
  receivedQuantity: number;
  unit: string; // kg, g, l, ml, ud, pack, etc.
  
  // Pricing & taxes
  unitPrice: number;
  discountPct?: number;
  discountAmount?: number;
  taxRatePct: number; // 0, 3, 7 (Canarias IGIC) o 4, 10, 21 (Península IVA)
  taxAmount: number;
  lineTotal: number;

  // Reception tracking
  isPhysicallyReceived: boolean;
  receivedAt?: string | null;
  receptionNoteRef?: string | null; // e.g. "ALB-2026-089"
}

export interface PurchaseDocument {
  id: string;
  tenantId: string;
  documentType: DocumentType;
  supplierId: string;
  supplierName: string;
  supplierTaxId?: string; // CIF/NIF
  documentNumber: string; // e.g. "FAC-2026-0045"
  documentDate: string;   // YYYY-MM-DD
  economicPeriod: string; // YYYY-MM (devengo contable)
  currency: string;       // EUR
  documentStoragePath?: string | null;

  // Totals
  subtotalExTax: number;
  taxTotal: number;
  additionalCosts: number; // Portes, seguros prorrateables
  totalAmount: number;

  // Statuses
  documentStatus: DocumentStatus;
  receptionStatus: ReceptionStatus;
  paymentStatus: PaymentStatus;

  // Associated references (e.g. if this invoice consolidates an earlier delivery note)
  associatedDeliveryNoteIds?: string[];

  // Lines
  lines: DocumentLineItem[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalReceiptInput {
  tenantId: string;
  documentId: string;
  deliveryNoteNumber?: string;
  receptionDate?: string;
  receivedLines: Array<{
    lineId: string;
    quantityReceivedNow: number;
    notes?: string;
  }>;
}

export interface InventoryStockSnapshot {
  ingredientId: string;
  currentStock: number;
  currentWAC: number;
}

export interface ReceiptResult {
  documentId: string;
  receptionStatus: ReceptionStatus;
  linesUpdated: Array<{
    lineId: string;
    ingredientId: string;
    previousStock: number;
    quantityAdded: number;
    newStock: number;
    previousWAC: number;
    newWAC: number;
  }>;
  costHistoryEntries: Array<{
    id: string;
    ingredientId: string;
    documentLineId: string;
    unitCost: number;
    effectiveWAC: number;
    effectiveAt: string;
  }>;
  stockMovementEntries: Array<{
    id: string;
    ingredientId: string;
    movementType: 'PURCHASE_RECEIPT';
    quantity: number;
    balanceAfter: number;
    referenceDoc: string;
  }>;
}
