# CR-COST-01: PROCUREMENT COST FOUNDATION — CURRENT STATE AUDIT
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `FOUNDATION.md` (L0) · `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Auditoría del Estado Actual de Proveedores y Catálogo

```text
┌───────────────────────────┬──────────────┬───────────────────────────────────────────────────────┐
│ Entidad Existente         │ Tabla DB     │ Estado & Columnas Actuales                            │
├───────────────────────────┼──────────────┼───────────────────────────────────────────────────────┤
│ Suppliers (Proveedores)   │ 'suppliers'  │ id, tenant_id, name, contact (jsonb), deleted_at/by.  │
│ Ingredients               │ 'ingredients'│ id, tenant_id, supplier_id, name, unit, cost, stock.  │
│ Dish Ingredients (BOM)    │ 'dish_ing...'│ dish_id, ingredient_id, amount.                      │
│ Purchase Invoices         │ N/A          │ 🔴 AUSENTE en el esquema de base de datos.            │
│ Purchase Invoice Lines    │ N/A          │ 🔴 AUSENTE en el esquema de base de datos.            │
│ Item Cost History Ledger  │ N/A          │ 🔴 AUSENTE (el coste es un escalar mutable).          │
└───────────────────────────┴──────────────┴───────────────────────────────────────────────────────┘
```

### Hallazgos de Reutilización:
1. **`public.suppliers` es 100% Reutilizable:** La tabla existente ya posee `tenant_id`, soporte de soft-delete (`deleted_at`, `deleted_by`) y políticas RLS aisladas para staff.
2. **Relación `supplier_id` $\rightarrow$ `ingredients`:** Ya existe como clave foránea opcional en `public.ingredients(supplier_id)`.
3. **El Eslabón Faltante:** No existía el documento contractual de entrada de mercancías (`purchase_invoices` y `purchase_invoice_items`) que relacione la factura del proveedor con el coste unitario efectivo y el desglose de impuestos y gastos adicionales.
