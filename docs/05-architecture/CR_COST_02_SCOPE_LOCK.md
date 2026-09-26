# CR-COST-02: INVENTORY COST SYNC & COSTING INTEGRATION — REFINED SCOPE LOCK
**Versión:** 2.0.0  
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority  
**Estado:** REFINADO Y CERRADO PARA REVISIÓN FINAL DE HUMAN AUTHORITY

---

## 1. Alcance Incluido (Scope In)

1. **Extensión DDL en Food Vertical (`ingredients` & `dishes`):**
   - Añadir `waste_percentage numeric(5,2) DEFAULT 0` a `public.ingredients`.
   - Añadir `labor_cost numeric(12,4) DEFAULT 0`, `energy_cost numeric(12,4) DEFAULT 0`, `packaging_cost numeric(12,4) DEFAULT 0` y `margin_pct numeric(5,2)` a `public.dishes`.
2. **Motor Matemático WAC en Core (`src/modules/cost-intelligence/domain/wac-calculator.ts`):**
   - Función pura `calculateWeightedAverageCost(previousStock, previousCost, newQuantity, newCost)`.
3. **Servicio de Derivación de Coste Operativo:**
   - Actualización determinista de `ingredients.cost` al registrar costes efectivos en `item_cost_history` usando la política WAC ratificada.
4. **Adaptador Culinario Sectorial (`FoodCostBaselineAdapter`):**
   - Reside en `src/modules/dish-library/application/` (capa Food).
   - Ensambla `CostBaselineSnapshot` a partir de `dishes`, `dish_ingredients` e `ingredients`, entregándolo al motor agnóstico E9.
5. **Servicio de Recálculo de Escandallos de Platos:**
   - `DishCostingService` en la capa Food: Calcula el coste de producción del plato y su margen $\%$ consumiendo `calculateBOMCost` del Core.
6. **Suite de Tests Exhaustiva:**
   - Tests unitarios del motor WAC (casos con stock $\le 0$, stock positivo, redondeo a 4 decimales).
   - Tests del adaptador `FoodCostBaselineAdapter` verificando que E9 recibe snapshots limpios y agnósticos.
   - Tests de recálculo de escandallo de platos con merma y overheads.

---

## 2. Fuera de Alcance (Scope Out)

- ❌ Entrada ciega de existencias físicas sin albarán material (`receiveInvoice` solo asienta costes financieros y WAC).
- ❌ UI visual de simulación de escenarios (será CR-COST-03).
- ❌ Mutación de bases de datos remotas de producción.
- ❌ Cero términos culinarios dentro de `src/modules/cost-intelligence/`.
