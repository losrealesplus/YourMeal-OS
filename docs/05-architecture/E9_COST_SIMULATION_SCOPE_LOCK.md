# E9: COST SIMULATION & SCENARIO INTELLIGENCE — SCOPE LOCK
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority  
**Estado:** PROPUESTO Y CERRADO PARA IMPLEMENTACIÓN

---

## 1. Alcance de Implementación Autorizado (Scope In)

1. **Dominio Matemático y Motor de Asignación (`src/modules/cost-intelligence/domain/`):**
   - Motor puro de prorrateo de costes de adquisición (`prorateOverheadsByValue`, `prorateOverheadsByWeight`, `prorateOverheadsByVolume`, `prorateOverheadsByUnits`, `prorateOverheadsManual`).
   - Algoritmo de cálculo de coste efectivo unitario ($c_i^{eff}$).
   - Motor de escandallo genérico con factores de rendimiento y merma (`Yield & Loss`).
   - Descomposición explicativa de varianza (Standard vs Real Cost Breakdown).
   - Motor Sandbox de Simulación E9 (`CostSimulationEngine`).
   - Comparador multi-escenario (`MultiScenarioComparator`).
2. **Servicio de Aplicación (`src/modules/cost-intelligence/application/`):**
   - `CostSimulationService`: Carga de snapshots, ejecución de simulación y exportación de escenarios.
3. **Suite de Pruebas Rigurosa (`src/modules/cost-intelligence/domain/*.spec.ts`):**
   - Verificación de Invariante `Simulation != Reality` (0 mutaciones).
   - Verificación de exactitud matemática de prorrateos ($\sum g_i = G$).
   - Verificación de escenarios multi-variable y estrés.
   - Manejo estricto de costes cero explícitos vs desconocidos, redondeo monetario y tipos de cambio.

---

## 2. Fuera de Alcance (Scope Out)

- ❌ Mutaciones o migraciones DDL directas en la base de datos de producción de Supabase.
- ❌ Modificación de la pantalla de toma de pedidos o facturación B2B.
- ❌ Reemplazo del servicio FLOW-04 existente en `src/modules/inventory/`.
- ❌ Merge a `main` o deploy a Cloudflare Workers (bloqueado por mandato).
