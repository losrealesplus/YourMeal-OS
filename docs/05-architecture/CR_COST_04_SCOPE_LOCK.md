# 🏛️ Scope Lock — CR-COST-04: Cost Intelligence Product Integration

**Initiative ID:** `CR-COST-04`  
**Parent Evolution:** Cost Intelligence (E2 → E9)  
**Objective:** Bridge the certified economic engine with the live user surface in EatClean, delivering full navigation, operational UI, live Supabase data connectivity, and cross-session persistence.  
**Version:** `v1.0.0`  
**Status:** 🔒 **SCOPE LOCKED & RATIFIED BY HUMAN PRODUCT AUTHORITY**  
**Date:** 2026-09-26  
**Author:** Antigravity (AG)

---

## 1. Executive Manifesto & Principle of Delivery

> **"No reconstruimos el motor económico; terminamos de entregarlo al usuario en EatClean."**

The economic calculation engine (WAC, BOM, E9 Simulation, Cost Allocator), database schemas, RLS policies, and headless services created in CR-COST-01/02/03 are mathematically certified and **remain 100% frozen**. 

CR-COST-04 exists solely to eliminate the gap between **Engine Certified** and **Product Capability Certified**, guaranteeing that any staff member with appropriate RBAC can discover, navigate, operate, and persist cost intelligence directly in EatClean.

---

## 2. Constitutional Governance Precisions (Non-Negotiable Firewalls)

1. **Purchase Invoice $\neq$ Physical Goods Receipt Boundary:**
   > *La acción de "Registrar/Procesar Factura" actualiza de forma estricta la información económica, el histórico de costes (`item_cost_history`) y el coste medio ponderado (`ingredients.cost`) conforme al modelo CR-COST-01/02. **No crea implícitamente una recepción física ni altera el stock físico de almacén**, manteniendo desacoplado el circuito financiero de la logística de almacén.*

2. **No Unintended Mutations:**
   > *Ninguna simulación What-If ni acción de Cockpit muta de forma automática recetas, precios de venta, pedidos o snapshots. Las mutaciones económicas explícitamente previstas por CR-COST-01/02 se producen de forma exclusiva a través de sus servicios canónicos autorizados.*

---

## 3. The 12-Step Product Capability Standard

Under CR-COST-04, no capability is declared complete until all 12 steps of the delivery chain are verified:

```
[1] CODE ──────────────► TypeScript services & UI components exist
[2] BUILD ─────────────► Vite + Nitro bundle without errors (0 TS errors)
[3] DEPLOY ────────────► Cloudflare Worker updated with new release
[4] ROUTE ─────────────► HTTP router resolves endpoint (200 OK)
[5] NAVIGATION ────────► Visible link in sidebar, mobile menu, & Ops Hub
[6] RBAC ──────────────► Guarded by explicit permissions (inventory.operate, etc.)
[7] REAL DATA ─────────► Queries live Supabase tables (zero hardcoded mock data)
[8] USER ACTION ───────► Operator triggers form submission / calculation
[9] PERSISTENCE ───────► Writes safely to PostgreSQL via Service layer
[10] RELOAD ───────────► Survives full browser refresh / cross-session
[11] NO UNINTENDED ────► Zero unintended mutations to live catalog/pricing
[12] INVARIANT AUDIT ──► Multi-tenant isolation (X ≠ Y) & mathematical precision
```

---

## 3. Scope Decomposition: What to Touch vs. What is Frozen

### 🟢 100% REUSED & FROZEN (DO NOT MODIFY)
1. **Mathematical Domain Engines:**
   - `src/modules/cost-intelligence/domain/wac-calculator.ts`
   - `src/modules/cost-intelligence/domain/cost-allocator.ts`
   - `src/modules/cost-intelligence/domain/bom-calculator.ts`
   - `src/modules/cost-intelligence/domain/purchase-invoice-calculator.ts`
   - `src/modules/cost-intelligence/domain/cost-simulation-engine.ts`
   - `src/modules/cost-intelligence/domain/variance-analyzer.ts`
2. **Database Schemas & DDL:**
   - Migrations `20260926170000`, `20260926180000`, `20260926190000`.
   - Existing tables (`purchase_invoices`, `purchase_invoice_items`, `item_cost_history`, `cost_simulation_scenarios`, `cost_decision_intents`) and column extensions.

---

### 🟡 INTEGRATION & WIRING (Connecting UI to Existing Services)
1. **Application Services Wired to React Components:**
   - `ProcurementCostService` ──► Connect to `/admin/purchasing`.
   - `DishCostingService` ──► Connect to `/admin/dishes` & `/admin/cost-intelligence`.
   - `ScenarioManagementService` ──► Connect to Cockpit "Guardar Escenario" & "Escenarios Guardados".
   - `DecisionIntentService` ──► Connect to Cockpit "Registrar Decisión" & "Histórico de Decisiones".

---

### 🔵 NEW UI & SURFACE DEVELOPMENT
1. **Front 1: Procurement Surface (`/admin/purchasing`)**
   - Replace `PlaceholderPanel` in `src/routes/_authenticated/admin.purchasing.tsx`.
   - Implement **Purchase Invoices Management**:
     - Invoices table with status (`draft`, `received`, `cancelled`), supplier name, total amount, allocation method.
     - New Invoice Dialog / Form: Invoice number, invoice date, supplier selector, freight/additional costs, allocation method (`value`, `weight`, `quantity`).
     - Line items table: ingredient/item selector, quantity, unit cost, discount, tax rate.
     - "Recibir Factura" action: executes `ProcurementCostService.recordInboundCost()` which synchronously registers ledger entries and updates ingredient WAC.

2. **Front 2: Dish Costing & Overheads Surface (`/admin/dishes`)**
   - Update `src/routes/_authenticated/admin.dishes.tsx`:
     - Display **Calculated Food Cost** (derived from BOM WAC) alongside sale price.
     - Display **Gross Margin %** with visual health badge (e.g. green if $\ge 65\%$, amber if $< 65\%$).
     - Extend Dish Create/Edit Dialog to allow entering overhead costs:
       - `labor_cost` (€ / ración)
       - `energy_cost` (€ / ración)
       - `packaging_cost` (€ / ración)
       - `margin_pct` (target margin %)
     - Add collapsible "Desglose de Escandallo" showing BOM cost + overheads = Total Production Cost.

3. **Front 3: Navigation & Discoverability**
   - Register `cost-intelligence` in `src/lib/operations-departments.ts` (`DEPARTMENT_CATALOG`).
   - Add NavItem in `src/components/admin-shell.tsx` under "Operaciones" (desktop sidebar & mobile menu).
   - Add a direct dashboard widget card in `src/routes/_authenticated/admin.index.tsx` (Centro de Operaciones).
   - Ensure `/admin/purchasing` is enabled and visible for staff with `purchasing.operate` / `inventory.operate` / `admin`.

4. **Front 4: Live Data & Persistence in Cockpit (`/admin/cost-intelligence`)**
   - Refactor `src/routes/_authenticated/admin.cost-intelligence.tsx`:
     - **Remove hardcoded `EATCLEAN_LIVE_BASELINE` fixture.**
     - Implement live TanStack Query loading real tenant dishes, ingredients, and recipe lines via `DishCostingService.listDishCostingProfiles(ctx)`.
     - Connect **"Guardar Escenario"**: calls `ScenarioManagementService.createScenario(ctx, ...)` and stores in `cost_simulation_scenarios`.
     - Connect **"Registrar Decisión"**: calls `DecisionIntentService.createIntent(ctx, ...)` and stores in `cost_decision_intents`.
     - Load live saved scenarios and decision history directly from Supabase.
     - Add **"Cargar Escenario Guardado"** to verify cross-session reproducibility.

---

## 4. Acceptance Criteria & Test Plan

| ID | Capability Area | Acceptance Criteria |
|---|---|---|
| **AC-01** | Navigation Discoverability | Clicking "Cost Intelligence" or "Compras" in Admin sidebar opens the respective operational screen without manual URL editing. |
| **AC-02** | Live Dish Costing | `/admin/dishes` displays real WAC-based production cost and gross margin % for every dish in the tenant catalog. |
| **AC-03** | Dish Overheads | Operator can edit `labor_cost`, `energy_cost`, and `packaging_cost` in `/admin/dishes` and see immediate gross margin recalculation. |
| **AC-04** | Procurement Intake | Operator can create a purchase invoice in `/admin/purchasing` with items and additional freight, approve it, and observe ingredient WAC update in database. |
| **AC-05** | Cockpit Live Baseline | `/admin/cost-intelligence` builds its simulation baseline from real active tenant dishes and ingredients in Supabase (0 mock data). |
| **AC-06** | Scenario Persistence | Clicking "Guardar Escenario" writes to `cost_simulation_scenarios` with deterministic baseline snapshot JSON. |
| **AC-07** | Decision Intent Audit | Clicking "Registrar Decisión" writes to `cost_decision_intents` with rationale, target date, and link to scenario. |
| **AC-08** | Cross-Session Reload | Refreshing the page and selecting a saved scenario reloads the exact simulation inputs and calculated results. |
| **AC-09** | Multi-Tenant Isolation | Tenant X never sees invoices, dishes, or scenarios of Tenant Y ($X \neq Y$). |
| **AC-10** | Constitutional Firewall | Simulating or saving scenarios causes zero automatic mutations to live dish prices, ingredients, or stock. |

---

## 5. Implementation Gates & Governance Flow

```text
CR-COST-04 SCOPE LOCK
        🔒 PROPOSED (Awaiting Human Ratification)
        ↓
IMPLEMENTATION GATE (UI, Navigation, Live Connectivity)
        🔒 BLOCKED
        ↓
TEST SUITE & REGRESSION GATE
        🔒 BLOCKED
        ↓
PROD DEPLOY & RUNTIME VERIFICATION GATE
        🔒 BLOCKED
        ↓
FINAL PRODUCT CAPABILITY CERTIFICATION (Visual + DB Live)
        🔒 BLOCKED
```

**Next Required Action:** Sovereign review and explicit ratification of this Scope Lock (`AUTORIZO SCOPE LOCK CR-COST-04`) before writing any UI or integration code.
