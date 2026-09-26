# CR-COST-01: PROCUREMENT COST FOUNDATION — SCOPE LOCK
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority  
**Estado:** SCOPE LOCKED PARA IMPLEMENTACIÓN

---

## 1. Alcance Incluido (Scope In)

1. **Esquema de Base de Datos (DDL):**
   - Tabla `purchase_invoices` con estados (`draft`, `received`, `posted`, `cancelled`), métodos de prorrateo, importes, impuestos y gastos adicionales.
   - Tabla `purchase_invoice_items` con vinculación a proveedor, item, cantidades, precio unitario, descuentos, prorrateo asignado y coste unitario efectivo.
   - Tabla `item_cost_history` para trazabilidad inmutable cronológica.
   - Políticas RLS completas con enforcement por `tenant_id` y roles staff.
   - Índices de rendimiento por `(tenant_id, supplier_id)`, `(tenant_id, invoice_date)` e `(tenant_id, item_id, effective_at)`.
2. **Dominio y Cálculo:**
   - Motor puro de cálculo de factura de compra (`calculatePurchaseInvoiceTotals`).
   - Integración nativa con `allocateInboundCosts` (`cost-allocator.ts`).
3. **Servicio de Aplicación:**
   - `ProcurementCostService`: Creación de facturas, validación de líneas, cálculo de prorrateo, recepción de mercancía y registro en historial inmutable.
4. **Plan de Rollback:**
   - Script de reversión completo `DROP TABLE IF EXISTS ... CASCADE`.
5. **Suite de Tests Exhaustiva:**
   - Tests de creación de facturas multi-línea y multi-proveedor.
   - Tests de cálculo de costes efectivos con descuentos y portes.
   - Tests de inmutabilidad y aislamiento multi-tenant.

---

## 2. Fuera de Alcance (Scope Out)

- ❌ Módulo de contabilidad de doble partida / cuentas contables / conciliación bancaria.
- ❌ Modificación del modelo de multi-tenancy o shared database.
- ❌ UI visual de facturas de compra (será abordado en el siguiente CR tras validar el dominio).
- ❌ Merge a `main` o deploy a producción.
