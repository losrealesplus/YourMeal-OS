# CR-COST-03 — Decision Intelligence & Scenario Cockpit: Product Blueprint

**Initiative:** CR-COST-03 — Scenario Persistence & Operator Decision Cockpit  
**Parent Evolution:** Cost Intelligence & E9 Scenario Simulation  
**Target Instance:** `yourmeal-eatclean` (EatClean Tenerife Catering)  
**Status:** 🧠 **PRODUCT BLUEPRINT (RATIFIED BY HUMAN PRODUCT AUTHORITY)**  
**Governance State:** 🔒 **ZERO CODE MUTATIONS** (Pre-Scope Lock Phase)  
**Date:** 2026-09-26  
**Auditor / Co-Architect:** Antigravity (AG)

---

## 1. Constitutional Decision Principle

> **“E9 puede modelar cualquier escenario permitido por el motor.  
> E9 puede demostrar su impacto económico con precisión matemática.  
> E9 puede registrar la decisión humana tomada por el operador.  
> E9 NUNCA ejecuta esa decisión sobre la realidad operativa.”**

```
                    COST INTELLIGENCE COCKPIT
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
       REALITY             ANOMALIES           SCENARIOS
          │                   │                   │
       Live WAC          Standard vs Real      Baseline Snapshot
       Margins            Cost Drivers         Variables / Presets
       Overheads          Alerts               E9 Sandbox Simulation
                                                      │
                                                      ▼
                                                COMPARISON
                                           (Global → Product → Driver)
                                                      │
                                                      ▼
                                                HUMAN DECISION
                                                      │
                                                      ▼
                                               DECISION INTENT
                                           (Audit Trail of Intent)
                                                      │
                                        ──────────────┼──────────────
                                                      │
                                            NEVER AUTO-APPLY
                                    (Separate operational workflows)
```

---

## 2. Product Pillars & Architectural Decisions

### Pillar 1: Presets as Pure Variable Templates
Presets are pure configuration templates that populate generic `HypotheticalVariables` consumed by Core E9. They introduce **zero specialized math formulas**.

| Preset Template | Injected Variables | Typical Operational Use Case |
|---|---|---|
| **Supplier Price Hike** | `supplierCostDeltas: { [supplierId]: +X% }` | Key supplier increases raw material rates |
| **Commodity / Item Inflation** | `itemCostDeltas: { [itemId]: +X% }` | Specific ingredient market spike (e.g. Salmon, Olive Oil) |
| **Energy / Utility Surge** | `overheadDeltas: { energyRateDeltaPct: +X% }` | Dark kitchen electricity / gas price hikes |
| **Labor Rate Escalation** | `overheadDeltas: { laborRateDeltaPct: +X% }` | Kitchen staff wage adjustment or overtime |
| **Prep Yield Optimization** | `yieldLossAdjustments: { [itemId]: -X% }` | Butchery / kitchen prep technique improvement |
| **Custom Scenario** | Arbitrary combination of above | Complex multi-factor market conditions |

---

### Pillar 2: Hierarchical Granularity & Configurable Target Margin
The Cockpit allows the operator to drill down from high-level portfolio financials to individual cost drivers:

```
LEVEL 1: Portfolio Executive Summary
  ├── Total Baseline Monthly Cost vs Total Simulated Monthly Cost (Δ €)
  ├── Baseline Portfolio Gross Margin vs Simulated Gross Margin (Δ %)
  └── Monthly Profit Impact (Δ €)

LEVEL 2: Product Portfolio Matrix
  ├── Table of all dishes with Sales Price, Baseline Cost, Simulated Cost, Margin Delta
  └── Dynamic Threshold Filter: "Show dishes falling below target margin (e.g. < X%)"
      (Target margin threshold X% is fully configurable by the operator, never hardcoded)

LEVEL 3: Product Cost Driver Breakdown
  └── For any selected dish:
        ├── Direct Ingredient Variances (e.g. Salmon +0.82 €, Quinoa +0.05 €)
        ├── Overhead Variances (e.g. Energy +0.11 €, Labor +0.08 €)
        └── Yield & Waste Variances (e.g. Prep waste +0.07 €)
```

---

### Pillar 3: Deterministic Baseline Snapshots
- **Default Behavior (Fresh Live Snapshot):** At scenario creation, the Cockpit captures the live EatClean catalog (WAC, recipes, dish prices, overheads) into a frozen `CostBaselineSnapshot`.
- **Historical Reproducibility:** Future changes to live WAC or catalog prices never alter this scenario's baseline.
- **Optional Historical Baseline Picker:** Allows simulating scenarios against past historical dates (e.g., *"What if we had applied this salmon contract in July?"*).

---

### Pillar 4: Decoupled `Decision Intent` (Human Action Audit Trail)

To prevent any conceptual ambiguity between *"simulating"* and *"altering reality"*, the scenario lifecycle is strictly separated from the human decision:

#### Scenario Entity: `cost_simulation_scenarios`
- **Fields:** `id`, `tenant_id`, `name`, `description`, `baseline_snapshot_id`, `applied_variables` (JSON), `summary_result` (JSON), `status` (`draft` | `simulated` | `archived`), `created_by`, `created_at`.

#### Decision Intent Entity: `cost_decision_intents`
- **Fields:** `id`, `tenant_id`, `scenario_id` (FK), `intent_type` (`renegotiate_supplier` | `adjust_menu_price` | `reformulate_recipe` | `accept_margin_compression` | `other`), `target_entity_id` (optional dish/supplier/ingredient ID), `rationale` (text), `planned_effective_date` (date), `status` (`pending_action` | `completed_manually` | `abandoned`), `recorded_by`, `recorded_at`.

---

## 3. Data Model Blueprint (CR-COST-03 DDL Preview)

```sql
-- 1. Scenarios Table (What-If Models)
CREATE TABLE IF NOT EXISTS public.cost_simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  preset_type text DEFAULT 'custom',
  baseline_snapshot_id text NOT NULL,
  baseline_snapshot jsonb NOT NULL,
  applied_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_result jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_scenario_status CHECK (status IN ('draft', 'simulated', 'archived'))
);

-- 2. Decision Intents Table (Operator Action Audit Trail)
CREATE TABLE IF NOT EXISTS public.cost_decision_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES public.cost_simulation_scenarios(id) ON DELETE CASCADE,
  intent_type text NOT NULL,
  target_entity_type text,
  target_entity_id uuid,
  rationale text NOT NULL,
  planned_effective_date date,
  status text NOT NULL DEFAULT 'pending_action',
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_intent_status CHECK (status IN ('pending_action', 'completed_manually', 'abandoned'))
);
```

---

## 4. Cockpit Route & UI Architecture

- **Route:** `/admin/cost-intelligence` (Protected by `inventory.read` / `operations_manager` / `saas_admin`).
- **Tab 1 — Cost Anatomy:** Live EatClean catalog, WAC valuations, product gross margins, overhead breakdown.
- **Tab 2 — Variance & Anomalies:** Standard vs real costs, missing price alerts, cost spikes.
- **Tab 3 — Scenario Simulator (E9):**
  - Scenario Creation Modal with Presets.
  - Interactive What-If Variable Sliders & Inputs.
  - Side-by-Side Comparison Dashboard with dynamic target margin filter.
  - Decision Intent Logger (*"Record Operator Decision"*).
  - Saved Scenarios & Decision Archive.

---

## 5. Scope Lock Readiness

The product definition is complete and constitutional boundaries are locked.  
Standing by for Human Product Authority review and authorization to draft the formal **CR-COST-03 Scope Lock**.
