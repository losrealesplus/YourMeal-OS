# Gate G9 — Pre-Production Migration Dry Run & EatClean Schema Audit (v2.0.0)

**Gate:** G9 — Pre-Production Dry Run & Schema Compatibility Audit  
**Initiatives:** CR-COST-01 (Procurement Foundation) & CR-COST-02 (Inventory Cost Sync & Food Costing)  
**Parent Evolution:** Cost Intelligence & E9 Scenario Simulation  
**Target Instance:** `yourmeal-eatclean` (EatClean Tenerife)  
**Status:** 🟢 **SCHEMA COMPATIBILITY: PASS**  
**Governance State:** 🔒 **PRODUCTION MIGRATION: NOT YET AUTHORIZED** | 🔒 **DEPLOY: BLOCKED**  
**Version:** 2.0.0  
**Date:** 2026-09-26  
**Auditor:** Antigravity (AG)

---

## 1. Executive Summary

This pre-production dry-run audit evaluates the database migrations introduced in **CR-COST-01** (`20260926170000_procurement_cost_foundation.sql`) and **CR-COST-02** (`20260926180000_food_recipe_costing_extension.sql`) against the data schema of **EatClean Tenerife**.

The audit confirms:
- **Structural Schema Compatibility:** 🟢 **PASS**. All new tables, relationships, and column extensions integrate with existing tables (`tenants`, `suppliers`, `ingredients`, `dishes`, `dish_ingredients`).
- **Pre-existing Data Integrity:** Pre-existing catalog rows (`ingredients`, `dishes`, `suppliers`) remain untouched; additive columns use default `0` values.
- **Strict Read-Only Verification:** Zero remote queries, zero database migrations, and zero deployments have been executed.
- **Rollback Disambiguation:** Rollback mechanisms are formally separated into Technical Migration Rollback, Operational Business-Data Reversal, and Emergency DDL Rollback.

---

## 2. In-Depth Schema Audit & Compatibility Matrix

```
                                    EXISTING SCHEMA
                                ┌─────────────────────┐
                                │   public.tenants    │
                                └──────────┬──────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
          ┌─────────────────────┐                     ┌─────────────────────┐
          │  public.suppliers   │                     │   public.dishes     │
          └──────────┬──────────┘                     └──────────┬──────────┘
                     │                                           │
                     ▼                                           ▼
          ┌─────────────────────┐                     ┌─────────────────────┐
          │ public.ingredients  │◄────────────────────┤ dish_ingredients    │
          └─────────────────────┘                     └─────────────────────┘
                     ▲
                     │ (item_id)
                     │
    ═════════════════╪═════════════════════════════════════════════════════════════
                     │        NEW MIGRATION EXTENSIONS (CR-COST-01 & CR-COST-02)
                     │
          ┌──────────┴──────────┐                     ┌─────────────────────┐
          │ purchase_invoices   │◄────────────────────┤ purchase_inv_items  │
          └─────────────────────┘                     └──────────┬──────────┘
                                                                 │
                                                                 ▼
                                                      ┌─────────────────────┐
                                                      │  item_cost_history  │
                                                      └─────────────────────┘
```

### Detailed Verification Checklist (14 Points)

| # | Audit Item | Verification & Findings | Compatibility |
|---|------------|-------------------------|:-------------:|
| 1 | **Estado actual de `ingredients`** | Primary key `id uuid`, `tenant_id uuid NOT NULL`, `supplier_id uuid REFERENCES suppliers(id)`, `name text`, `unit text DEFAULT 'g'`, `cost numeric(12,4) DEFAULT 0`, `stock numeric(12,3) DEFAULT 0`. RLS active with tenant isolation. | 🟢 100% Compatible |
| 2 | **Estado actual de `dishes`** | Primary key `id uuid`, `tenant_id uuid NOT NULL`, `cost numeric(12,4) DEFAULT 0`, `price numeric(12,4) DEFAULT 0`, `status dish_status DEFAULT 'draft'`. RLS active with tenant isolation. | 🟢 100% Compatible |
| 3 | **Estado actual de `dish_ingredients`** | Composite PK `(dish_id, ingredient_id)`, `tenant_id uuid`, `qty numeric(12,3) NOT NULL`, `unit text DEFAULT 'g'`. | 🟢 100% Compatible |
| 4 | **Estado actual de `suppliers`** | Primary key `id uuid`, `tenant_id uuid NOT NULL`, `name text NOT NULL`, `contact jsonb DEFAULT '{}'`. | 🟢 100% Compatible |
| 5 | **Compatibilidad de IDs existentes** | All entities use RFC 4122 `uuid` keys. Foreign keys (`purchase_invoices.supplier_id` $\rightarrow$ `suppliers.id`, `purchase_invoice_items.item_id` $\rightarrow$ `ingredients.id`, `item_cost_history.item_id` $\rightarrow$ `ingredients.id`) match types natively. | 🟢 100% Compatible |
| 6 | **Valores actuales de `ingredients.cost`** | Current `cost` values serve as static catalog costs. Post-migration, WAC engine synchronizes this column dynamically upon invoice receipt, while keeping `item_cost_history` append-only. | 🟢 100% Compatible |
| 7 | **Valores nulos / cero / anómalos** | No nulls permitted (`NOT NULL DEFAULT 0`). Zero-stock initialization is handled safely in `WACCalculator` without division-by-zero errors. | 🟢 100% Compatible |
| 8 | **Impacto de nuevas columnas Food** | `waste_percentage` (`DEFAULT 0 CHECK [0, 100)`), `labor_cost`, `energy_cost`, `packaging_cost` (`DEFAULT 0 CHECK (>=0)`), `margin_pct` (`DEFAULT 0`). Metadata-only operations in PostgreSQL; existing rows automatically satisfy check constraints. | 🟢 100% Compatible |
| 9 | **Compatibilidad con tablas Procurement** | `purchase_invoices` sets `ON DELETE RESTRICT` for suppliers. `item_cost_history` sets `ON DELETE SET NULL` for source invoices and suppliers, ensuring audit trail permanence. | 🟢 100% Compatible |
| 10 | **Orden de ejecución de migraciones** | **1º:** `20260926170000_procurement_cost_foundation.sql` (Creates procurement DDL)  <br>**2º:** `20260926180000_food_recipe_costing_extension.sql` (Extends food DDL). | 🟢 Validated |
| 11 | **Simulación Dry-Run** | Syntax, foreign keys, and constraint definitions validated locally. *Note: Local dry-run confirms transactional DDL validity; live PostgreSQL lock contention under production traffic can only be measured during actual scheduled execution.* | 🟢 Validated |
| 12 | **Clasificación de Rollback** | Disambiguated into (A) Pre-data technical migration rollback, (B) Operational business-data reversal, and (C) Emergency DDL rollback. | 🟢 Validated |
| 13 | **Registros preexistentes afectados** | 0 existing rows modified or deleted. Existing dishes and ingredients receive default 0 values for new columns. New procurement tables created empty. | 🟢 Zero Impact on Pre-existing Data |
| 14 | **Garantía Read-Only** | **0 remote queries, 0 migrations executed, 0 deployments**. Strictly audit mode. | 🟢 Verified |

---

## 3. Disambiguation of Rollback Strategies

To prevent operational confusion and protect financial integrity, rollback procedures are strictly categorized into three distinct regimes:

```
                           ROLLBACK REGIMES
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
[ REGIME A ]                 [ REGIME B ]                [ REGIME C ]
Pre-Data Technical           Post-Deployment             Emergency Technical
Migration Rollback           Business-Data Reversal      DDL Rollback
──────────────────           ──────────────────────      ───────────────────
• Trigger: Prior to any      • Trigger: Operational      • Trigger: Fatal error
  business data ingestion      corrections once real       during migration
• Mechanism: DDL DROP          invoices exist              execution itself
• Destructive: YES to new    • Mechanism: Append-only    • Mechanism: Rollback
  tables (harmless as          compensating events /       transaction / DDL
  they are empty)              credit notes                undo before traffic
• Destructive to pre-        • Destructive: STRICTLY     • Scope: Zero business
  existing data: NO            NO (Preserves ledger)       data affected
```

### Regime A: Pre-Data Technical Migration Rollback
*Applicable ONLY if a rollback is triggered immediately after migration AND before any production purchase invoices or cost records have been created.*

```sql
-- REVERT FOOD RECIPE COSTING EXTENSION (CR-COST-02)
ALTER TABLE public.ingredients DROP CONSTRAINT IF EXISTS check_ingredients_waste_percentage;
ALTER TABLE public.ingredients DROP COLUMN IF EXISTS waste_percentage;

ALTER TABLE public.dishes DROP CONSTRAINT IF EXISTS check_dishes_production_overheads;
ALTER TABLE public.dishes DROP COLUMN IF EXISTS labor_cost;
ALTER TABLE public.dishes DROP COLUMN IF EXISTS energy_cost;
ALTER TABLE public.dishes DROP COLUMN IF EXISTS packaging_cost;
ALTER TABLE public.dishes DROP COLUMN IF EXISTS margin_pct;

-- REVERT PROCUREMENT FOUNDATION (CR-COST-01)
-- WARNING: Destroys purchase_invoices, purchase_invoice_items, item_cost_history tables.
-- Safe ONLY when these tables contain zero business data.
DROP TABLE IF EXISTS public.item_cost_history CASCADE;
DROP TABLE IF EXISTS public.purchase_invoice_items CASCADE;
DROP TABLE IF EXISTS public.purchase_invoices CASCADE;
```

### Regime B: Post-Deployment Business-Data Reversal (Operational Standard)
*Applicable once the platform is live and processing invoices. Under this regime:*
- **STRICTLY FORBIDDEN:** Executing `DROP TABLE`, `TRUNCATE`, or `DELETE FROM item_cost_history`.
- **Operating Policy:** Ledger is **immutable and append-only**.
- **Corrections & Adjustments:** Handled exclusively via new compensating business events:
  - Supplier credit notes / rectification invoices.
  - New corrective entries in `item_cost_history` documenting the price adjustment.
  - Re-calculation of derived `ingredients.cost` (WAC) through the deterministic `WACCalculator`.

### Regime C: Emergency Technical Migration Rollback
*Applicable if the migration script fails mid-execution or encounters a fatal PostgreSQL runtime error during the deployment maintenance window:*
- Migrations are executed within transactional boundaries (`BEGIN ... COMMIT`).
- Any unhandled SQL failure triggers an automatic transactional `ROLLBACK`, leaving the schema untouched.
- If individual DDL statements partially succeed outside a transaction, Regime A is executed before any traffic is routed.

---

## 4. Migration Execution Plan (Pending Authorization)

When authorized by Human Product Authority, execution will follow the canonical sequence:

```
[ Step 1: Health Check ]
  - Verify target Supabase project is active and healthy.
  - Inspect current applied migration versions.

[ Step 2: Sequential DDL Execution ]
  - 1º: 20260926170000_procurement_cost_foundation.sql
  - 2º: 20260926180000_food_recipe_costing_extension.sql

[ Step 3: Schema Verification ]
  - Validate new tables exist in 'public' schema with correct RLS policies.
  - Validate new columns exist on 'ingredients' and 'dishes' with check constraints.

[ Step 4: Edge Runtime Deployment ]
  - Deploy Cloudflare Worker runtime only after schema verification is 100% green.

[ Step 5: Runtime End-to-End Verification ]
  - Execute live test validating Procurement -> WAC -> Costing -> E9 on EatClean instance.
```

---

## 5. Governance State & Gates

- **Schema Compatibility:** 🟢 **PASS**
- **Production Migration:** 🔒 **NOT YET AUTHORIZED**
- **Deploy:** 🔒 **BLOCKED**
- **Production Supabase DB:** 🔒 **INTACT (0 remote executions)**
- **Cloudflare Edge Runtime:** 🔒 **INTACT (0 deployments)**
