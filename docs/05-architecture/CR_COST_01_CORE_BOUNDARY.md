# CR-COST-01: PROCUREMENT COST FOUNDATION — CORE BOUNDARY SPECIFICATION
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Separación de Capas (Core vs Vertical vs Instance)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PLATFORM CORE                                                            │
│    • Tablas 'purchase_invoices' y 'purchase_invoice_items'                  │
│    • Tabla 'item_cost_history' (Ledger inmutable de costes históricos)      │
│    • Motor de prorrateo 'cost-allocator.ts' (Valor, Peso, Volumen, Unidades)│
│    • Tipos TypeScript genéricos: PurchaseInvoice, InvoiceItem, CostHistory  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FOOD & CATERING VERTICAL PACK                                            │
│    • Mapeo de 'item_id' a 'ingredients' (Ingredientes de cocina)           │
│    • Actualización del coste de ingrediente para cálculo de escandallos     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INSTANCE LAYER (EatClean Tenerife)                                       │
│    • Proveedores reales: Makro, Mercadona, distribuidores locales canarios │
│    • Facturas reales de compra y albaranes de entrada de mercancía          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariantes de Pureza

1. **Zero Food Jargon in DDL:** Las tablas `purchase_invoices` y `purchase_invoice_items` utilizan `item_id uuid` y `item_name text`, permitiendo que una lavandería compre detergente o un catering compre arroz sin alterar el esquema.
2. **Zero Hardcoded Constants:** No existen divisas fijas ni impuestos por defecto en el código del Core.
