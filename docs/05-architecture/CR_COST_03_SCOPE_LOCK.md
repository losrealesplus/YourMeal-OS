# CR-COST-03 Scope Lock: Scenario Persistence & Decision Intelligence Cockpit

**Initiative:** CR-COST-03 — Scenario Persistence & Decision Intelligence Cockpit (v1.0.0)  
**Parent Platform Evolution:** Cost Intelligence & E9 Scenario Simulation  
**Target Instance:** `yourmeal-eatclean` (EatClean Tenerife Catering)  
**Status:** 🔒 **SCOPE LOCKED (PENDING IMPLEMENTATION AUTHORIZATION)**  
**Governance State:** 🔒 **IMPLEMENTATION BLOCKED** | 🔒 **MERGE BLOCKED** | 🔒 **DEPLOY BLOCKED**  
**Date:** 2026-09-26  
**Auditor / Co-Architect:** Antigravity (AG)

---

## 1. Cardinal Governance Principle & Separation of Concerns

> **“E9 puede modelar cualquier escenario permitido por el motor.  
> E9 puede demostrar su impacto económico con precisión matemática.  
> E9 puede registrar la decisión humana tomada por el operador.  
> E9 NUNCA ejecuta esa decisión sobre la realidad operativa.”**

```
┌────────────────────────────────────────────────────────────────────────────┐
│ CONSTITUTIONAL FIREWALL                                                    │
├────────────────────────────────────────────────────────────────────────────┤
│ 1. Simulation Engine (E9)   ──► Ephemeral mathematical What-If evaluation. │
│ 2. Scenarios Storage        ──► Frozen snapshots + applied variables.     │
│ 3. Decision Intent          ──► Human qualitative decision audit trail.    │
│ 4. Operational Reality      ──► STRICTLY PROTECTED (Zero direct mutation). │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Deliverables & Technical Architecture (4 Layers)

### Layer 1: Persistence Subsystem (Supabase DDL & Repositories)

**Database Migration:** `supabase/migrations/20260926190000_cost_simulation_scenarios_and_intents.sql` & `instances/yourmeal-eatclean/...`

```sql
-- 1. Scenarios Table (What-If Models)
CREATE TABLE IF NOT EXISTS public.cost_simulation_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  preset_type text NOT NULL DEFAULT 'custom',
  baseline_snapshot_id text NOT NULL,
  baseline_snapshot jsonb NOT NULL,
  applied_variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  simulation_result jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_scenario_status CHECK (status IN ('draft', 'simulated', 'archived')),
  CONSTRAINT check_preset_type CHECK (preset_type IN ('custom', 'supplier_hike', 'item_inflation', 'energy_surge', 'labor_escalation', 'yield_optimization'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_simulation_scenarios TO authenticated;
GRANT ALL ON public.cost_simulation_scenarios TO service_role;
ALTER TABLE public.cost_simulation_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_simulation_scenarios_staff ON public.cost_simulation_scenarios
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE INDEX IF NOT EXISTS idx_cost_sim_scenarios_tenant_created
  ON public.cost_simulation_scenarios(tenant_id, created_at DESC);

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
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_intent_type CHECK (intent_type IN ('renegotiate_supplier', 'adjust_menu_price', 'reformulate_recipe', 'accept_margin_compression', 'other')),
  CONSTRAINT check_intent_status CHECK (status IN ('pending_action', 'completed_manually', 'abandoned'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cost_decision_intents TO authenticated;
GRANT ALL ON public.cost_decision_intents TO service_role;
ALTER TABLE public.cost_decision_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY cost_decision_intents_staff ON public.cost_decision_intents
  FOR ALL TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id));

CREATE INDEX IF NOT EXISTS idx_cost_decision_intents_tenant_scenario
  ON public.cost_decision_intents(tenant_id, scenario_id);
```

**Repository & Services:**
- `src/modules/cost-intelligence/infrastructure/scenario-repository.ts` (CRUD + RLS).
- `src/modules/cost-intelligence/application/scenario-management-service.ts` (Handles scenario saving, running simulation against baseline, state transition `draft` $\rightarrow$ `simulated` $\rightarrow$ `archived`).
- `src/modules/cost-intelligence/application/decision-intent-service.ts` (Records operator qualitative intents, links to scenarios).

---

### Layer 2: Decision Intelligence Subsystem

- **Intent Logger:** Allows the operator to document what managerial action will be taken based on simulation findings.
- **Intent Status Tracking:** `pending_action` $\rightarrow$ `completed_manually` | `abandoned`.
- **Zero Execution Hook:** Creating a decision intent does **NOT** trigger automated database updates on dish prices or inventory.

---

### Layer 3: Operator Cockpit UI Subsystem

**Route:** `/admin/cost-intelligence` (Protected by `inventory.read` / `operations_manager` / `saas_admin`).

1. **Portfolio Financial Summary Bar:**
   - Total Baseline Cost vs Simulated Cost ($\Delta\text{ €}$).
   - Baseline Gross Margin vs Simulated Gross Margin ($\Delta\%$).
   - Projected Monthly Profit Impact ($\Delta\text{ €}$).
2. **Product Portfolio Matrix & Granular Drill-Down:**
   - Table displaying all catalog dishes: Price, Baseline Cost, Simulated Cost, Simulated Margin.
   - **Configurable Target Margin Filter:** Dynamic slider/input to highlight dishes falling below user-defined target threshold (e.g. $< X\%$).
   - **Cost Driver Drill-down Drawer:** Displays direct ingredient price changes, overheads inflation, and prep yield waste changes for any selected dish.
3. **Interactive Scenario Builder:**
   - Preset selector (Supplier Spike, Item Inflation, Energy Surge, Labor Escalation, Yield Tuning, Custom).
   - Dynamic parameter inputs feeding `HypotheticalVariables`.
   - Side-by-side comparative visualizer.
4. **Saved Scenarios & Decision Intent Archive:**
   - View historical simulation results and recorded decisions.

---

### Layer 4: Strict Security & Constitutional Invariants

| Invariant | Strict Constraint |
|---|---|
| **1. Zero Operational Mutation** | E9 and scenario persistence write **only** to `cost_simulation_scenarios` and `cost_decision_intents`. Zero writes to `ingredients`, `dishes`, `orders`, `invoices`, `item_cost_history`. |
| **2. Deterministic Reproducibility** | Baseline snapshots are frozen at scenario creation; future live WAC changes do not corrupt saved scenarios. |
| **3. Multi-Tenant Isolation ($X \neq Y$)** | Tenant $X$ cannot query or mutate Tenant $Y$ scenarios or decision intents. Enforced by PostgreSQL RLS and service assertion. |
| **4. Pure Preset Architecture** | Presets strictly construct `HypotheticalVariables` objects; zero divergent mathematical execution paths. |
| **5. Decision Intent $\neq$ Operational Command** | Decision intents are informational audit records; actual operational changes require separate manual actions in their respective modules. |

---

## 3. Explicit Non-Goals (Out of Scope for CR-COST-03)

- ❌ Automatic price updating on `dishes.price` based on simulation results.
- ❌ Automatic recipe formula modification on `dish_ingredients`.
- ❌ Automatic purchase order generation.
- ❌ Direct accounting journal entry creation.

---

## 4. Verification & Testing Requirements

- **Domain & Service Specs:**
  - `scenario-management-service.spec.ts`: Scenario lifecycle, snapshot attachment, simulation execution, result persistence.
  - `decision-intent-service.spec.ts`: Intent creation, validation of intent types, multi-tenant isolation.
- **Cockpit Component / Route Specs:**
  - `admin.cost-intelligence.spec.ts`: Route access control, preset population, target margin filter reactivity, side-by-side comparison rendering.
- **Regression Invariant:**
  - Monorepo test suite maintains 100% pass (227+ test files, 1206+ tests).
  - TypeScript typecheck produces 0 errors.

---

## 5. Governance State

```text
CR-COST-01 (Procurement Foundation)       🟢 PRODUCTION VERIFIED
CR-COST-02 (Inventory Cost Sync)          🟢 PRODUCTION VERIFIED
E2 → E9 Economic Foundation               🟢 PRODUCTION CERTIFIED

CR-COST-03 (Scenarios & Decision Cockpit)
  ├── Product Blueprint                   🟢 RATIFIED (`ffbb9705`)
  ├── Scope Lock                          🔒 LOCKED (v1.0.0)
  ├── Implementation                      🔴 BLOCKED (Awaiting Sovereign Authorization)
  ├── Merge to main                       🔴 BLOCKED
  └── Deploy to Production                🔴 BLOCKED
```
