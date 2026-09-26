# 🏛️ Read-Only Incident Audit: EatClean Production Surface & Certification Discrepancy

**Incident ID:** INC-2026-09-26-COST-SURFACE  
**Initiative Scope:** CR-COST-01, CR-COST-02, CR-COST-03 (Cost Intelligence & E9 Cockpit)  
**Target Environment:** EatClean Production (`eatclean.yourmealos.com` · Cloudflare Worker `yourmeal-instance-eatclean`)  
**Remote Database:** Supabase `nhirlpkuvonggctdzzad` (Frankfurt / `eu-central-1`)  
**Audit Mode:** 🔒 **READ-ONLY FORENSIC AUTOPSY (NO CODE/DB/GIT MUTATIONS)**  
**Auditor:** Antigravity (AG)  
**Date:** 2026-09-26  

---

## 1. Executive Summary

A critical discrepancy has been identified between the **"Production Certified"** status reported for CR-COST-01/02/03 and the **actual visible/usable reality** for the EatClean operator in production.

### The Forensic Diagnosis:
1. **The Engine vs. Product Fallacy:** The engineering team designed, implemented, migrated, and certified pure TypeScript math engines, domain algorithms (WAC, BOM, E9 Simulator, Cost Allocator), database DDL schemas, and headless application services. All unit/domain tests pass (1216/1216), but **the visual product surfaces that allow a human operator to use these capabilities in EatClean were never wired or exposed.**
2. **Orphaned Cockpit Route:** The route `/_authenticated/admin/cost-intelligence` exists in the codebase and is compiled into the Cloudflare Worker bundle (returning HTTP 200), but it was **never added to the navigation menus** (`AdminShell` sidebar/mobile navigation or `admin.index` Operations Center). It is an inaccessible orphaned route.
3. **Hardcoded Mock Baseline & In-Memory State in Cockpit:** The cockpit component (`admin.cost-intelligence.tsx`) was written using static hardcoded fixtures (`EATCLEAN_LIVE_BASELINE`) and local in-memory React state (`useState`). It **never calls Supabase**, never connects to `ScenarioManagementService` or `DecisionIntentService`, and cannot read real tenant catalog items or write persistent records to production tables.
4. **Complete Absence of Procurement & Food Costing UI:** 
   - CR-COST-01 has **zero UI** (no supplier management, no invoice registration, no receipt screens; `/admin/purchasing` is an empty placeholder scaffold).
   - CR-COST-02 has **zero UI** (dish costing, recipe ingredient breakdown, waste %, labor, energy, and packaging inputs were never added to `/admin/dishes`; `/admin/inventory` is an empty placeholder scaffold).

---

## 2. What We Expected vs. What Is Actually Live

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ EXPECTATION: "Platform Capability Live in Production"                            │
│ Database Tables ──► Domain Engine ──► Services ──► Connected UI ──► Navigation  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼ REALITY
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Database Tables ──► Domain Engine ──► Services ──X──► [Disconnected Mock UI]     │
│   (Migrated)           (Tested)      (Uncalled)         (Orphaned / No Menu)     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Surface Audit Matrix (8-Dimensional Analysis)

### Dimension Legend:
- **A (Code):** TypeScript files exist in `src/`.
- **B (Build):** Compiles cleanly into Vite / Nitro output.
- **C (Worker):** Uploaded in Cloudflare Worker asset bundle.
- **D (Runtime Route):** HTTP route responds at `eatclean.yourmealos.com`.
- **E (User Access):** Accessible via direct URL by authenticated staff.
- **F (Navigation):** Visible in sidebar, mobile menu, or dashboard cards.
- **G (Real Data):** Queries live PostgreSQL tables in Supabase.
- **H (Operable):** Operator can execute the end-to-end business workflow.

| Feature / Capability | A (Code) | B (Build) | C (Worker) | D (Route) | E (Access) | F (Nav) | G (Data) | H (Operable) | Final Classification |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **Procurement Invoices UI (CR-01)** | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 **NOT IMPLEMENTED** |
| **Supplier Purchasing (CR-01)** | 🟡 Scaffold | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟡 (404/Empty) | 🟠 Flag-off | 🔴 No | 🔴 No | 🟠 **DEPLOYED / NOT CONNECTED** |
| **WAC Sync Service (CR-01)** | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🔴 Headless | 🔴 Headless | 🔴 Headless | 🟢 DB Ready | 🔴 No UI | 🟡 **CODE EXISTS / NOT PRODUCT-LIVE** |
| **Food Costing / Escandallos (CR-02)** | 🟢 Engine | 🟢 Yes | 🟢 Yes | 🔴 Headless | 🔴 Headless | 🔴 Headless | 🟢 DB Ready | 🔴 No UI | 🟡 **CODE EXISTS / NOT PRODUCT-LIVE** |
| **Dish Overheads & Waste UI (CR-02)** | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 No | 🔴 **NOT IMPLEMENTED** |
| **Cost Intelligence Cockpit (CR-03)** | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟢 200 OK | 🟡 Direct URL | 🔴 **No Link** | 🔴 **Hardcoded**| 🔴 **Mock Only** | 🟠 **DEPLOYED / NOT CONNECTED** |
| **E9 Scenario Simulation (CR-03)** | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟢 Yes | 🟡 Direct URL | 🔴 No Link | 🔴 In-memory | 🟡 Ephemeral | 🟠 **DEPLOYED / NOT CONNECTED** |
| **Scenario Persistence (CR-03)** | 🟢 Service | 🟢 Yes | 🟢 Yes | 🔴 Headless | 🔴 Headless | 🔴 Headless | 🟢 DB Ready | 🔴 Disconnected | 🟡 **CODE EXISTS / NOT PRODUCT-LIVE** |
| **Decision Intent Audit Trail (CR-03)**| 🟢 Service | 🟢 Yes | 🟢 Yes | 🔴 Headless | 🔴 Headless | 🔴 Headless | 🟢 DB Ready | 🔴 Disconnected | 🟡 **CODE EXISTS / NOT PRODUCT-LIVE** |

---

## 4. CR-COST-01 Surface Audit (Procurement Cost Foundation)

### Findings:
1. **Database & DDL:** `public.purchase_invoices`, `public.purchase_invoice_items`, and `public.item_cost_history` are fully created with RLS and indexes on Supabase `nhirlpkuvonggctdzzad`.
2. **Application & Domain Services:** `ProcurementCostService`, `ProcurementCostRepository`, `WACCalculator`, `PurchaseInvoiceCalculator`, and `CostAllocator` exist with 100% test coverage.
3. **UI Surfaces:**
   - There is **no screen to list, create, edit, or approve purchase invoices**.
   - There is **no screen to manage suppliers or invoice freight allocation**.
   - Route [`src/routes/_authenticated/admin.purchasing.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.purchasing.tsx) is an empty placeholder:
     ```tsx
     // admin.purchasing.tsx (lines 22-29)
     function AdminPurchasingPage() {
       return (
         <PlaceholderPanel
           title="Purchasing"
           description="Scaffold only. Business rules live in Services — never in this component."
         />
       );
     }
     ```
   - Furthermore, in [`src/components/admin-shell.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/components/admin-shell.tsx#L183-L189), the link to `/admin/purchasing` is hidden behind `moduleFlags[PILOT_ADMIN_MODULE_FLAGS.purchasing]` which defaults to `false`.

---

## 5. CR-COST-02 Surface Audit (Food Costing & Dish Library Extension)

### Findings:
1. **Database & DDL:** Extended columns (`ingredients.waste_percentage`, `dishes.labor_cost`, `dishes.energy_cost`, `dishes.packaging_cost`, `dishes.margin_pct`) are live on Supabase.
2. **Application & Domain Services:** `DishCostingService`, `FoodCostBaselineAdapter`, `InventoryCostSyncService`, `BOMCalculator`, and `VarianceAnalyzer` exist and pass all tests.
3. **UI Surfaces:**
   - [`src/routes/_authenticated/admin.dishes.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.dishes.tsx) was **never updated**. It only displays and edits standard fields (`name`, `description`, `price`, manual `cost`, `kcal`, `weight_g`, `prep_minutes`, `macros`, `allergens`).
   - The user cannot view or input `waste_percentage`, `labor_cost`, `energy_cost`, `packaging_cost`, or calculated gross margin percentage in `/admin/dishes`.
   - Recipe composition (associating ingredients to dishes with quantities and yields) has **no UI** in EatClean.
   - [`src/routes/_authenticated/admin.inventory.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.inventory.tsx) is an empty `PlaceholderPanel` scaffold.

---

## 6. CR-COST-03 Surface Audit (Cockpit Runtime & Data Connectivity)

### Findings:
1. **Route & Worker Bundle:**
   - Route file [`src/routes/_authenticated/admin.cost-intelligence.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.cost-intelligence.tsx) exists and is bundled into the Cloudflare Worker.
   - Responds with `200 OK` at `https://eatclean.yourmealos.com/admin/cost-intelligence`.
2. **Navigation & Discoverability:**
   - Grep verification across `src/` reveals `cost-intelligence` is **referenced nowhere in the navigation tree**.
   - Not in [`src/components/admin-shell.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/components/admin-shell.tsx) (neither desktop sidebar nor mobile bottom sheet).
   - Not in [`src/lib/operations-departments.ts`](file:///Users/alex/Developer/YourMeal-OS/src/lib/operations-departments.ts) (`DEPARTMENT_CATALOG`).
   - Not in [`src/routes/_authenticated/admin.index.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.index.tsx) (Operations Center Hub cards).
   - **Result:** The route is an orphan. No user navigating the product can find it.
3. **Data Connectivity & Mocks:**
   - Inspecting `admin.cost-intelligence.tsx` (lines 75–181) shows that it uses **100% hardcoded static fixtures**:
     ```tsx
     // admin.cost-intelligence.tsx (lines 76-181)
     const EATCLEAN_LIVE_BASELINE: CostBaselineSnapshot = {
       snapshotId: "snap-eatclean-live-20260926",
       products: [
         { productId: "dish-poke-salmon", productName: "Salmon Quinoa Poke Bowl", ... },
         { productId: "dish-curry-garbanzos", productName: "Curry Cremoso de Garbanzos & Coco", ... },
         { productId: "dish-pollo-teriyaki", productName: "Pollo de Corral Teriyaki & Arroz", ... },
       ]
     };
     ```
   - Saved Decision Intents (lines 214–230 & 278–299) are stored in React local state:
     ```tsx
     // admin.cost-intelligence.tsx (lines 214-230)
     const [savedIntents, setSavedIntents] = useState<Array<...>>([...]);
     ```
   - The component **never imports or instantiates** `ScenarioManagementService` or `DecisionIntentService`.
   - The component **never calls Supabase** to fetch live dishes or persist scenarios/intents.
   - If the user reloads the browser, all created intents in the UI disappear.

---

## 7. Runtime & Edge Worker Telemetry Audit

```
================================================================================
Target Cloudflare Worker:   yourmeal-instance-eatclean
Custom Domain:              https://eatclean.yourmealos.com
Current Version ID:         ebbbc940-a71f-4bdc-a616-fec2077fadb0
Git Head on Worker:         a70b6fbcbf30cd6f286b7a87a1d0fac9ac4e5500
Nitro Build Status:         Successful (298 assets deployed)
Route Resolution:           /_authenticated/admin/cost-intelligence -> MATCHED
HTTP Status Code:           200 OK
================================================================================
```

### Verification:
The deployment to Cloudflare was technically accurate and flawless in terms of asset compilation, routing resolution, and environment binding. However, **the bundled component itself contained disconnected mock logic and was omitted from navigation.**

---

## 8. Root Cause Analysis (How This Discrepancy Occurred)

### Root Cause 1: Conflation of "Engine Verification" with "Product Certification"
The tests in `src/modules/cost-intelligence/e2e-runtime-proof.spec.ts` tested the mathematical formulas and domain services (WAC, BOM calculation, E9 simulation, mock repository persistence). The audit reports incorrectly equated "Domain Engine 100% Passing" with "EatClean Product Live & Operational".

### Root Cause 2: Scope Lock Isolation Strategy without Surface Integration
During the Scope Lock definition for CR-COST-03, the focus was placed on creating the simulation algorithms and establishing non-mutation firewalls. The cockpit UI was created as an isolated page (`admin.cost-intelligence.tsx`), but:
1. It was never added to `admin-shell.tsx` navigation.
2. It was scaffolded with static sample data for initial visual layout and never refactored to consume the real application services (`ScenarioManagementService`, `DishCostingService`, `DecisionIntentService`).

### Root Cause 3: Incomplete End-to-End Delivery Chain
In the platform delivery pipeline, the technical checks (TypeScript compilation `0 errors`, Vitest `1216/1216`, Nitro build, Cloudflare deploy `HTTP 200`) all passed because there were no syntax errors. But there was no automated check verifying **Navigation Link Registration** or **End-to-End Live Supabase Querying from UI Components**.

---

## 9. Recommended Corrective Roadmap (Read-Only Blueprint)

To turn this certified engine into a genuine, visible, operational capability in EatClean, the following structured sequence is required:

### Phase 1: Navigation & Shell Registration (CR-COST-03-SURFACE-01)
- Add "Cost Intelligence" / "Simulador E9" to `DEPARTMENT_CATALOG` in `src/lib/operations-departments.ts`.
- Add NavItem in `src/components/admin-shell.tsx` under Operaciones or Más.
- Add quick-access card in `src/routes/_authenticated/admin.index.tsx` (Centro de Operaciones).

### Phase 2: Live Data Connectivity for Cockpit (CR-COST-03-SURFACE-02)
- Replace `EATCLEAN_LIVE_BASELINE` fixture in `admin.cost-intelligence.tsx` with a live TanStack query that invokes `DishCostingService.listDishCostingProfiles(ctx)`.
- Connect "Guardar Escenario" to `ScenarioManagementService.createScenario(ctx, ...)`.
- Connect "Registrar Decisión" to `DecisionIntentService.createIntent(ctx, ...)`.
- Load saved scenarios and decision history directly from Supabase tables `cost_simulation_scenarios` and `cost_decision_intents`.

### Phase 3: Operational Procurement & Food Costing UI (CR-COST-01/02-SURFACE)
- Expand `admin.dishes.tsx` to display real calculated WAC food cost, labor, energy, packaging, and gross margin %.
- Provide an operational interface to create/receive purchase invoices (`admin.purchasing.tsx` or `/admin/inventory/invoices`).

---

## 10. Required Governance Gates

```
INCIDENT AUDIT
  🟢 COMPLETED (READ-ONLY)
       ↓
HUMAN AUTHORITY REVIEW
  ⏳ PENDING
       ↓
SURFACE REMEDIATION SCOPE LOCK
  🔒 BLOCKED
       ↓
UI & CONNECTIVITY IMPLEMENTATION
  🔒 BLOCKED
       ↓
REAL SURFACE CERTIFICATION (Visual + Live DB)
  🔒 BLOCKED
```

---

## 11. Final Summary

```text
WHAT WE THOUGHT WE SHIPPED:
A complete, visible, end-to-end Cost Intelligence Cockpit and Procurement system operating live in EatClean with full database persistence and UI access.

WHAT WE ACTUALLY SHIPPED:
A robust, mathematically certified E2→E9 domain engine and database schema, coupled with an orphaned, hardcoded mock page at /admin/cost-intelligence that is not connected to navigation or to Supabase.

WHAT THE USER CAN ACTUALLY USE:
- Entering eatclean.yourmealos.com/admin: Nothing visible related to Cost Intelligence, Procurement, or Escandallos.
- Typing eatclean.yourmealos.com/admin/cost-intelligence directly into URL bar: An interactive demo simulation running on 3 hardcoded dishes, with in-memory state that does not save to or read from Supabase.

ROOT CAUSE:
Domain/Engine verification was mistaken for Product Surface certification; the UI was scaffolded with mock fixtures and never integrated into the navigation shell or wired to live application services.

NEXT REQUIRED HUMAN DECISION:
Review this read-only audit and decide whether to authorize the Surface Integration Plan (wiring navigation, live data queries, and persistent mutations) to convert the certified engine into a real, visible product capability.
```
