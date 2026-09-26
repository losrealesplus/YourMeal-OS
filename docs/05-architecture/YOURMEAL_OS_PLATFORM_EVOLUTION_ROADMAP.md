# YOURMEAL OS — PLATFORM EVOLUTION ROADMAP: COST INTELLIGENCE & SCENARIO ENGINE
**Documento:** Arquitectura Funcional, Modelo de Dominio y Backlog de Microevolución (E1–E9)  
**Versión:** 1.2.0 (Incorporación de E9: Cost Simulation & Scenario Intelligence)  
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `FOUNDATION.md` (L0) · `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)  
**Modo:** DISCOVERY / ARCHITECTURE SPECIFICATION (0 mutaciones de código / 0 migraciones aplicadas)

---

## 1. Visión y North Star: De Inventario a Decision Intelligence

> **"Un sistema de inventario registra existencias; un motor de Cost Intelligence comprende el valor económico en la operación diaria; un motor de Simulación permite experimentar con el futuro antes de comprometer el dinero."**

YourMeal OS articula su subsistema económico en torno a cuatro componentes sinérgicos en el **Platform Core**:

```text
                                YOURMEAL OS
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
INVENTORY CORE                 COST ENGINE                   COSTING CORE
(Existencias y Flujos)        (Precios y Trazabilidad)      (Composición y Márgenes)
      │                              │                              │
      ├── Products & SKUs            ├── Effective Purchase Cost    ├── BOM / Escandallo Árbol
      ├── Suppliers (Proveedores)    ├── Cost Allocation Proration  ├── Yield & Loss (Mermas)
      ├── Purchase Invoices          ├── Cost History & Snapshots   ├── Production Overheads
      └── Stock Ledger Inmutable     ├── Standard vs Real Cost      ├── Margin Intelligence
                                     └── Anomaly Detection          └── Variance Analysis
                                                                    │
                                                                    ▼
                                                    [E9] COST SIMULATION ENGINE
                                                    (Escenarios Hipotéticos "What-If")
                                                    ├── Sandbox & Ephemeral Snapshots
                                                    ├── Multi-Variable Stress Testing
                                                    └── Scenario Comparison Matrix
```

---

## 2. Separación Constitucional (Core vs Vertical vs Instance)

```text
                                YOURMEAL OS
                                     │
      ┌──────────────────────────────┴──────────────────────────────┐
      │                                                             │
PLATFORM CORE                                                VERTICAL PACKS
(Capacidades Económicas Universales)                         (Especialización Sectorial)
      │                                                             │
      ├── Inventory (Proveedores, Facturas, Ledger)                 ├── Food & Catering Vertical
      ├── Cost Engine (Prorrateo, Coste Efectivo, Histórico)       │   ├── Dishes & Ingredients
      ├── Yield & Loss Core (Modelo genérico de pérdidas)           │   ├── Culinary Waste (Pelado/Cocción)
      ├── Costing (BOM genérico, Mano de obra, Overheads)           │   ├── Batch Stations & Packaging
      ├── Cost Anomaly Alerts (Excepciones operativas)              │   └── Thermal / Delivery Logs
      └── Scenario Simulation Engine (What-if Sandbox)              │
                                                                    └── Future Verticals (Laundry/Services)
                                                                        ├── Chemical consumption per kg
                                                                        └── Machine cycle energy / Wear
```

---

## 3. Motor de Asignación de Costes (Allocation Engine)

El cálculo del **Coste Efectivo de Adquisición ($c_i^{eff}$)** distribuye los costes indirectos de compra ($G$) según reglas configurables por factura:

$$c_i^{eff} = \frac{(q_i \times p_i) + g_i}{q_i}$$

### Estrategias de Prorrateo Soportadas:
1. **Por Valor Económico (Punto de partida MVP - E3):**  
   $$g_i = G \times \left( \frac{q_i \times p_i}{\sum (q_j \times p_j)} \right)$$
2. **Por Peso Físico:** $g_i = G \times (w_i / \sum w_j)$
3. **Por Volumen:** $g_i = G \times (v_i / \sum v_j)$
4. **Por Unidades:** $g_i = G \times (q_i / \sum q_j)$
5. **Manual:** Asignación explícita de importe por línea.

---

## 4. Trazabilidad Histórica y Supplier Intelligence

El motor no sobreescribe precios pasados. Cada cambio de precio genera un registro inmutable en `item_cost_history`:

```text
HISTORIAL INMUTABLE DE COSTE
Item: Pechuga de Pollo (SKU-POL-01)
├── 2026-07-01 ──► 4,50 €/kg (Makro)
├── 2026-08-15 ──► 5,10 €/kg (Makro) ── [+13.3% ↑]
└── 2026-09-20 ──► 4,80 €/kg (Avícola Local) ── [-5.8% ↓]
```

### Inteligencia de Proveedores (Effective Supplier Cost):
Permite comparar proveedores más allá del precio facial:
$$\text{Coste Proveedor Real} = \text{Precio Base} + \text{Transporte Medio} + \text{Impacto en Merma/Calidad}$$

---

## 5. Yield & Loss y Explicación de Variaciones (Variance Breakdown)

En el escandallo, el coste real no se limita a un semáforo rojo/verde, sino que descompone la causa raíz de las desviaciones:

$$\text{Standard Cost} = 3,00\ \text{€} \quad \longleftrightarrow \quad \text{Real Cost} = 3,47\ \text{€} \quad (\Delta = +0,47\ \text{€} \ / \ +15,67\%)$$

```text
DESCOMPOSICIÓN DE LA DESVIACIÓN (VARIANCE BREAKDOWN)
┌─────────────────────────────────────────────────────────────┐
│ • Materia Prima (subida precio adquisición):       +0,22 €  │
│ • Gastos Transporte (combustible/portes):           +0,10 €  │
│ • Energía y Mano de Obra:                           +0,08 €  │
│ • Yield & Loss (merma superior a la estándar):      +0,07 €  │
│ ─────────────────────────────────────────────────────────── │
│ VARIACIÓN TOTAL EXPLICADA:                         +0,47 €  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. [E9] Cost Simulation & Scenario Intelligence (Sandbox "What-If")

El módulo E9 representa la cúspide de la inteligencia económica de YourMeal OS. Permite a los gestores de negocio proyectar el impacto económico de variaciones de mercado o decisiones estratégicas antes de ejecutarlas.

### Invariante Fundamental de Simulación:
> **"Simulation $\neq$ Reality. El motor de simulación opera estrictamente sobre snapshots desacoplados en memoria o tablas de escenario aisladas. NUNCA muta el inventario real, las facturas registradas, los costes históricos, los pedidos en curso ni la contabilidad."**

```text
FLUJO DE SIMULACIÓN Y COMPARACIÓN DE ESCENARIOS
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Snapshot Base (Costes actuales congelados a fecha T)                      │
│ 2. Inyección de Variables Hipotéticas:                                      │
│    • Proveedor A: +8% precio base                                           │
│    • Nuevo Proveedor B: -4% precio pero +12% transporte                     │
│    • Optimización de cocina: -3% merma (Yield +3%)                          │
│    • Tarifa eléctrica: +10% en overhead de cocción                          │
│ 3. Recálculo en Sandbox de Escandallos y Márgenes                           │
│ 4. Proyección Mensual de Impacto en Cuenta de Resultados (€ / %)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Estructura de un Escenario Guardable:

```json
{
  "scenario_id": "scen_2026_q4_energy_shock",
  "name": "Subida Tarifas Eléctricas & Descuento Avícola Q4",
  "base_snapshot_date": "2026-09-26T12:00:00Z",
  "hypothetical_variables": {
    "supplier_cost_deltas": { "SUPP-MAKRO": 0.05, "SUPP-AVICOLA": -0.04 },
    "overhead_deltas": { "energy_rate": 0.15, "labor_rate": 0.02 },
    "yield_loss_adjustments": { "ING-POLLO": -0.02 }
  },
  "projected_results": {
    "avg_dish_cost_delta": "+0.14 €",
    "projected_monthly_cost_impact": "+640.00 €",
    "avg_gross_margin_pct": "58.2% (vs 60.1% base)"
  }
}
```

---

## 7. Tipología de Anomalías y Conexión con Operations Center

Las anomalías detectadas por el Cost Engine se emiten como eventos de `OperationalException` en el **Centro de Operaciones** (`admin.index.tsx`):

```text
ANOMALY ENGINE TAXONOMY
┌─────────────────────────┬───────────────────────────────────────────────────┐
│ Tipo de Anomalía        │ Condición de Disparo                              │
├─────────────────────────┼───────────────────────────────────────────────────┤
│ 1. Price Anomaly        │ Precio compra > 15% respecto a media histórica    │
│ 2. Supplier Anomaly     │ Coste adquisición proveedor A > 20% vs histórico  │
│ 3. Consumption Anomaly  │ Consumo real producción excede escandallo teórico │
│ 4. Yield / Loss Anomaly │ Merma en lote > umbral de tolerancia técnica      │
│ 5. Margin Anomaly       │ Margen bruto real < suelo de rentabilidad (45%)   │
│ 6. Cost Trend Anomaly   │ Deriva acumulada ascendente durante 3 compras     │
└─────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 8. Grafo de Dependencias y Backlog Completo (E1 a E9)

El desarrollo se estructura como un Grafo Acíclico Dirigido (DAG) donde cada nodo aporta valor productivo independiente:

```text
                  [E1] Stock Ledger Foundation
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
     [E2] Purchase Invoices           Cost History Core
                 │                             │
                 ▼                             │
     [E3] Cost Allocation                      │
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                   [E4] Recipe Costing (BOM Base)
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
     [E5] Production Overheads      [E6] Yield & Loss Engine
                 │                             │
                 └──────────────┬──────────────┘
                                ▼
                 [E7] Margin & Variance Breakdown
                                │
                 ┌──────────────┴──────────────┐
                 ▼                             ▼
     [E8] Cost Anomalies (Ops Hub)   [E9] Cost Simulation & Scenarios
```

---

## 9. Matriz de Entregables de Microevolución (E1 a E9)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 YOURMEAL OS COST INTELLIGENCE MATRIX (E1–E9)                │
├────┬─────────────────────────────┬──────────────┬───────────────────────────┤
│ ID │ Módulo / Capacidad          │ Capa         │ Valor Operacional y SaaS  │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E1 │ Stock Ledger Foundation     │ Core         │ Trazabilidad de entradas  │
│    │                             │              │ y salidas sin sobreescrit.│
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E2 │ Purchase Invoices & Lines   │ Core         │ Registro de facturas de   │
│    │                             │              │ proveedores y costes base │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E3 │ Cost Allocation Engine      │ Core         │ Prorrateo de transportes  │
│    │                             │              │ y coste efectivo real     │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E4 │ Recipe Costing (Escandallo) │ Food / Core  │ Cálculo automático del    │
│    │                             │              │ coste de materia prima    │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E5 │ Production Overheads        │ Food / Core  │ Inclusión de mano de obra │
│    │                             │              │ y energía en escandallo   │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E6 │ Yield & Loss Engine         │ Core / Food  │ Factor transversal de     │
│    │                             │              │ mermas y rendimiento      │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E7 │ Margin & Variance Engine    │ Core         │ Descomposición explicada  │
│    │                             │              │ de desviación de costes   │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E8 │ Cost Anomaly Alarms         │ Core / Ops   │ Alertas automáticas en el │
│    │                             │              │ Centro de Operaciones     │
├────┼─────────────────────────────┼──────────────┼───────────────────────────┤
│ E9 │ Cost Simulation & Scenarios │ Core / SaaS  │ Sandbox "What-if" para    │
│    │                             │              │ decisiones de negocio     │
└──────────────────────────────────┴──────────────┴───────────────────────────┘
```

---

## 10. Regla de Gobernanza y Ejecución

> **"El Evolution Roadmap es un catálogo normativo de arquitectura, no una orden de ejecución. Cada elemento (E1 a E9) se activará únicamente como un Change Request (CR) independiente, con su propio Scope Lock, plan de verificación y autorización formal por parte de Human Product Authority."**

---

*Documento actualizado en el repositorio bajo estricta conformidad L0/L1. Workspace verificado y sin modificaciones en código ni base de datos.*
