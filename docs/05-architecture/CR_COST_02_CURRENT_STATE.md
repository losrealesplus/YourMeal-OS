# CR-COST-02: INVENTORY COST SYNC & COSTING INTEGRATION — CURRENT STATE AUDIT
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `FOUNDATION.md` (L0) · `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Estado Actual de la Conexión Compras $\rightarrow$ Inventario $\rightarrow$ Escandallos

```text
┌──────────────────────────────────────┬─────────────┬─────────────────────────────────────────────────┐
│ Componente                           │ Estado Real │ Diagnóstico y Evidencia                         │
├──────────────────────────────────────┼─────────────┼─────────────────────────────────────────────────┤
│ Procurement Invoices (E2)            │ 🟢 En Main  │ CR-COST-01 integrado (tablas y servicios).      │
│ Item Cost History (Historial)        │ 🟢 En Main  │ CR-COST-01 integrado (item_cost_history).       │
│ Ingredients Catalog ('ingredients')  │ 🟡 Estático │ 'cost' y 'stock' son escalares en tabla.        │
│ Stock Decrement (FLOW-04)            │ 🟢 En Main  │ InventoryService decrementa stock por ración.   │
│ Inbound Stock Increment              │ 🔴 Ausente  │ Las facturas recibidas no suman a 'stock'.      │
│ Cost Sync (Factura -> Ingrediente)   │ 🔴 Ausente  │ 'ingredients.cost' no se actualiza con compras. │
│ Dynamic Recipe Costing (Escandallos) │ 🟡 Parcial  │ Motor en 'bom-calculator.ts' listo, pero        │
│                                      │             │ 'dishes.cost' en DB sigue siendo estático.      │
│ Food Yield & Merma Factor            │ 🔴 Ausente  │ 'ingredients' no tiene 'waste_percentage'.      │
│ Production Overheads (Platos)        │ 🔴 Ausente  │ 'dishes' no tiene campos labor/energy/packaging.│
└──────────────────────────────────────┴─────────────┴─────────────────────────────────────────────────┘
```

---

## 2. El Problema Central: Desconexión entre Compras y Catálogo

Actualmente existen dos mundos separados:
1. **Mundo Compras (CR-COST-01):** Registra facturas y calcula `effective_unit_cost` con costes de transporte asignados en `item_cost_history`.
2. **Mundo Cocina/Catálogo (`ingredients` / `dishes`):** Mantiene `ingredients.cost` y `dishes.cost` como columnas escalares que no reaccionan a las compras de proveedores.

**Objetivo de CR-COST-02:** Tender el puente bidireccional entre ambos mundos **sin duplicar taxonomías** ni crear un inventario paralelo.
