# COST INTELLIGENCE: CURRENT STATE AUDIT (E1–E8)
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `FOUNDATION.md` (L0) · `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)  
**Propósito:** Auditoría basada en evidencia del estado real de la base de código respecto a los módulos E1–E8.

---

## 1. Tabla de Madurez Real en el Repositorio

```text
┌──────────────────────────────────────┬─────────────┬─────────────────────────────────────────────────┐
│ Capacidad (Evolution Roadmap)        │ Estado Real │ Evidencia en Código                             │
├──────────────────────────────────────┼─────────────┼─────────────────────────────────────────────────┤
│ E1: Stock Ledger Foundation          │ 🟡 PARCIAL  │ Tablas 'ingredients.stock' y FLOW-04 existen    │
│                                      │             │ pero sin ledger inmutable de transacciones.     │
│ E2: Purchase Invoices & Items        │ 🔴 AUSENTE  │ Existe 'suppliers', pero 0 tablas de facturas   │
│                                      │             │ de compra o líneas de albarán.                  │
│ E3: Cost Allocation Engine           │ 🔴 AUSENTE  │ No existen algoritmos de prorrateo ni cálculo   │
│                                      │             │ de coste efectivo con portes/gastos.            │
│ E4: Recipe Costing (Escandallo BOM)  │ 🟡 PARCIAL  │ 'dish_ingredients' existe como lista plana;     │
│                                      │             │ costes calculados estáticamente en cliente.     │
│ E5: Production Overheads             │ 🔴 AUSENTE  │ No hay soporte para mano de obra, energía ni    │
│                                      │             │ packaging en el modelo de escandallo.           │
│ E6: Yield & Loss Engine              │ 🔴 AUSENTE  │ No existen factores de merma o rendimiento.     │
│ E7: Margin & Variance Intelligence   │ 🔴 AUSENTE  │ No hay comparación standard vs real cost.       │
│ E8: Cost Anomalies                   │ 🟡 PARCIAL  │ Módulo 'operational-exceptions' existe, pero    │
│                                      │             │ sin triggers de desviación de costes/precios.   │
│ E9: Cost Simulation & Scenarios      │ 🔴 AUSENTE  │ No existe motor sandbox de simulación what-if.  │
└──────────────────────────────────────┴─────────────┴─────────────────────────────────────────────────┘
```

---

## 2. Detalle de Hallazgos por Componente

### E1: Stock & Inventory (Estado: PARCIAL)
- **Implementado:** `public.ingredients` contiene `stock numeric(12,3)` y `cost numeric(12,4)`. El servicio `InventoryService` ([`src/modules/inventory/application/inventory-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/inventory/application/inventory-service.ts)) gestiona el pipeline FLOW-04 (`planConsumptionFromProduction` $\rightarrow$ `applyConsumption` $\rightarrow$ `sealConsumption`).
- **Brecha:** El decremento de stock es una mutación directa sobre una columna escalar (`UPDATE ingredients SET stock = stock - qty`). No existe un libro diario (`stock_movements`) que preserve la trazabilidad de cada lote o entrada de mercancía.

### E2 & E3: Compras y Prorrateo de Costes (Estado: AUSENTE)
- **Implementado:** Tabla `public.suppliers` con `id, name, contact`.
- **Brecha:** No existen entidades para registrar facturas de compra (`purchase_invoices`), gastos de transporte anexos ni servicios de dominio para prorratear gastos sobre los costes unitarios.

### E4: Escandallo y Composición (Estado: PARCIAL)
- **Implementado:** Tabla `public.dish_ingredients` relaciona `dish_id` con `ingredient_id` y `amount`.
- **Brecha:** Es una relación plana de 1 nivel (sin soporte de sub-recetas / elaboraciones intermedias), y no calcula el coste dinámico en backend ni preserva snapshots históricos de escandallo por lote de producción.

### E5, E6, E7: Overheads, Merma y Varianza (Estado: AUSENTE)
- **Brecha:** No hay campos ni lógica para merma de materia prima (`yield_loss`), horas hombre (`labor_rate`) ni costes energéticos en la base de datos.

### E8: Anomalías Operativas (Estado: PARCIAL)
- **Implementado:** Módulo robusto `src/modules/operational-exceptions/` con soporte para excepciones de cliente, cocina y reparto.
- **Brecha:** No hay reglas configuradas para emitir anomalías de tipo `price_anomaly`, `supplier_anomaly` o `margin_anomaly`.

---

## 3. Conclusión de la Auditoría

El repositorio cuenta con **los cimientos estructurales necesarios** (tipos de datos, arquitectura modular en `src/modules/`, sistema de excepciones y catálogo básico), pero **carece de la capa de inteligencia económica (Cost Engine + Costing + Simulation)**.

La implementación debe introducir un módulo **Core de Cost Intelligence** limpio, tipado y desacoplado, sin romper los flujos existentes de EatClean.
