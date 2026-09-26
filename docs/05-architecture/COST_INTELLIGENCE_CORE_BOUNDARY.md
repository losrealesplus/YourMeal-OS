# COST INTELLIGENCE: CORE VS FOOD VS INSTANCE BOUNDARY
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Principio de Separación de Capas

El subsistema de **Cost Intelligence** sigue estrictamente el modelo de capas de YourMeal OS:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. PLATFORM CORE (src/modules/cost-intelligence/)                           │
│    • Motor matemático de prorrateo (Valor, Peso, Volumen, Unidades, Manual)│
│    • Invariante de Inmutabilidad Financiera (Cost History Snapshots)        │
│    • Estructura genérica de composición (BOM - Bill of Materials)           │
│    • Descomposición de varianza (Standard Cost vs Real Cost)                │
│    • Operador genérico de rendimiento y pérdida (Yield & Loss)              │
│    • Taxonomía de 6 anomalías de coste (Operational Exceptions)             │
│    • Motor Sandbox de Simulación y Escenarios (What-if Engine)              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. FOOD & CATERING VERTICAL PACK                                            │
│    • Mapeo de BOM a Recetas / Platos (dishes / dish_ingredients)            │
│    • Mapeo de Items a Ingredientes (ingredients)                            │
│    • Reglas de merma culinaria (pelado, limpieza, mermas de cocción)        │
│    • Overheads de estaciones de cocina y empaque térmico                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. INSTANCE LAYER (EatClean Tenerife)                                       │
│    • Proveedores reales configurados en DB (Makro, Mercadona, etc.)         │
│    • Precios de compra y costes horarios de personal de cocina de Tenerife  │
│    • Escenarios comerciales de simulación guardados por la gerencia         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Invariantes de Pureza del Core

1. **Zero Food Jargon in Core Domain:** El Core (`src/modules/cost-intelligence/`) utiliza términos genéricos: `Item`, `Component`, `BOM`, `YieldLossFactor`, `OverheadRate`, `Scenario`, `CostSnapshot`.
2. **Zero Hardcoded Constants:** No existen porcentajes fijos ni divisas quemadas en el código del Core. Todas las tasas, umbrales de anomalía y monedas se inyectan como parámetros o configuración de tenant.
3. **Pluggable Allocators:** Los algoritmos de prorrateo son funciones puras independientes que reciben datos numéricos y devuelven asignaciones exactas garantizando $\sum g_i = G$.
