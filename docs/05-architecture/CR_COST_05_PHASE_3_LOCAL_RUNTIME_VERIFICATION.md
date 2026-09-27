# CR-COST-05 Phase 3 — Local PostgreSQL Runtime Verification Report

**Architecture Contract Reference:** `docs/05-architecture/CR_COST_05_PHASE_3_DDL_CONTRACT.md`  
**Migration Artifact:** `supabase/migrations/20260927120000_food_market_intelligence_foundation.sql`  
**Rollback Artifact:** `supabase/migrations/rollback/20260927120000_food_market_intelligence_foundation.rollback.sql`  
**Verification Script:** `scripts/verify-cr-cost-05-local-runtime.mjs`  
**Target Environment:** Local Supabase Runtime (OrbStack Docker Engine on macOS)  
**Database URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`  
**Date:** 2026-09-27  
**Status:** 🟢 **100% VERIFIED ON LOCAL RUNTIME (21/21 TESTS PASS)**

---

## 1. Runtime Telemetry & Environment Evidence

- **Container Engine:** OrbStack (Docker Engine `29.4.0`, context `orbstack`)
- **Supabase CLI:** `v2.109.1`
- **PostgreSQL Engine:** PostgreSQL 15.8 (Debian) via local container
- **Services Active:** Local Postgres (`127.0.0.1:54322`), GoTrue/Auth (`127.0.0.1:54321`), PostgREST, Storage, Studio (`127.0.0.1:54323`), Kong Gateway
- **Production Isolation:** **ZERO** connection to remote production project `nhirlpkuvonggctdzzad`. **ZERO** deployment to Cloudflare Workers.

---

## 2. Invariant Execution Matrix & Live Proofs

The deterministic verification test suite (`scripts/verify-cr-cost-05-local-runtime.mjs`) executed against the local PostgreSQL container and verified all 10 core architectural invariants across 21 assertions:

```text
========================================================================
CR-COST-05 PHASE 3: LOCAL POSTGRESQL RUNTIME VERIFICATION
Database target: postgresql://postgres:postgres@127.0.0.1:54322/postgres
========================================================================

--- 1. Schema & Table Structure Invariant ---
  [PASS] Test 1: All 5 CR-COST-05 tables exist in public schema
         → Found tables: market_price_observations, market_products, market_sources, market_volume_tiers, product_mappings

--- 2. Deterministic Seed Data Invariant ---
  [PASS] Test 2: 4 registered initial market sources present with correct configuration
         → Sources: src-5oceanos, src-gmcash, src-makro, src-mercadona

--- 3. Idempotency & Unique Fingerprint Invariant ---
  [PASS] Test 3: Market product insert succeeds
  [PASS] Test 4: First observation insertion succeeds
  [PASS] Test 5: Duplicate fingerprint insertion is blocked by UNIQUE constraint
         → ERROR: duplicate key value violates unique constraint "uq_market_price_obs_fingerprint"

--- 4. Append-Only Immutability Guard Invariant ---
  [PASS] Test 6: Trigger blocks DELETE on market_price_observations (strict append-only)
         → ERROR: CR-COST-05 Invariant Violation: Historical market price observations are strictly append-only and cannot be deleted.
  [PASS] Test 7: Trigger blocks UPDATE of price facts on market_price_observations
         → ERROR: CR-COST-05 Invariant Violation: Economic price facts in market_price_observations are immutable and cannot be updated.
  [PASS] Test 8: Trigger blocks UPDATE of fingerprint on market_price_observations
         → ERROR: CR-COST-05 Invariant Violation: Economic price facts in market_price_observations are immutable and cannot be updated.

--- 5. Volume Tiers Invariant ---
  [PASS] Test 9: Volume tier insert linked to observation succeeds
  [PASS] Test 10: Invalid tier quantity (<= 0) is rejected by check constraint
         → ERROR: new row for relation "market_volume_tiers" violates check constraint "check_mvt_min_qty"

--- 6. Multi-Tenant Product Mappings Invariant ---
  [PASS] Test 11: Tenants & test ingredients initialized
  [PASS] Test 12: Tenant Alpha product mapping insert succeeds
  [PASS] Test 13: Duplicate mapping for same tenant/ingredient/product is rejected by UNIQUE constraint
         → ERROR: duplicate key value violates unique constraint "uq_product_mapping_tenant_ingredient_product"

--- 7. RLS Policy & Role Access Invariant ---
  [PASS] Test 14: Anon role cannot read market_sources without authenticated session (permission denied / 0 rows)
         → ERROR: permission denied for table market_sources
  [PASS] Test 15: Authenticated role can read shared market_sources
         → Returned count: 4

--- 8. Multi-Tenant Cross-Tenant Isolation Invariant ---
  [PASS] Test 16: Tenant Alpha user can read Tenant Alpha mappings (RLS read PASS)
         → Count: 1
  [PASS] Test 17: Tenant Beta user CANNOT read Tenant Alpha mappings (RLS Cross-Tenant Isolation PASS: 0 rows)
         → Cross-tenant visible rows: 0

--- 9. Rollback Artifact Execution Invariant ---
  [PASS] Test 18: Rollback SQL executes cleanly without error
  [PASS] Test 19: All 5 CR-COST-05 tables successfully dropped after rollback
         → Remaining tables: (none)

--- 10. Re-applying Migration to Operational State ---
  [PASS] Test 20: Migration re-applies cleanly from scratch
  [PASS] Test 21: Seed data and tables restored to clean operational state
         → Source count: 4

========================================================================
VERIFICATION SUMMARY: 21/21 TESTS PASSED (100%)
========================================================================
```

---

## 3. Detailed Architectural Evidence

### 3.1 Idempotency vs. Append-Only Distinction
1. **Idempotency Proof (`UNIQUE (fingerprint)`):**
   - Inserting an observation with identical fingerprint `SHA256(source_id + sku + date + region + location + promo + normalized_price)` is deterministically rejected with error `duplicate key value violates unique constraint "uq_market_price_obs_fingerprint"`.
2. **Append-Only Immutability Proof (`trg_guard_market_observation_immutability`):**
   - Attempting `DELETE` throws error: `CR-COST-05 Invariant Violation: Historical market price observations are strictly append-only and cannot be deleted.` (SQLSTATE `restrict_violation`).
   - Attempting `UPDATE` of `price_raw`, `tax_rate`, `fingerprint`, etc., throws error: `CR-COST-05 Invariant Violation: Economic price facts in market_price_observations are immutable and cannot be updated.`

### 3.2 Access Semantics & Tenant Isolation
1. **Shared Core Market Data (`market_sources`, `market_products`, `market_price_observations`, `market_volume_tiers`):**
   - Anonymous HTTP / `anon` role is strictly **denied** (`ERROR: permission denied for table market_sources`).
   - Authenticated JWT session (`authenticated` role) has `SELECT` permission across shared benchmark data.
   - Core ingestion write requires active `tenant_members` membership.
2. **Private Tenant Data (`product_mappings`):**
   - Strictly protected by RLS `public.is_tenant_member(tenant_id)`.
   - Verified that User Alpha (`tenant-alpha`) sees 1 mapping, while User Beta (`tenant-beta`) querying the exact same table sees 0 rows (`Cross-tenant visible rows: 0`).

### 3.3 Rollback & Re-apply Lifecycle
1. Executing `supabase/migrations/rollback/20260927120000_food_market_intelligence_foundation.rollback.sql` cleanly drops all 5 tables, triggers, helper functions, and policies without foreign key conflicts or orphan metadata.
2. Re-applying `supabase/migrations/20260927120000_food_market_intelligence_foundation.sql` restores the tables, constraints, triggers, and the 4 seed sources (`Makro`, `GM Cash`, `5 Océanos`, `Mercadona`) into a healthy operational state.

---

## 4. Full Quality & Regression Suite Status

| Verification Gate | Result | Details |
| :--- | :--- | :--- |
| **Local DB Runtime Suite** | 🟢 **21 / 21 PASS** | `scripts/verify-cr-cost-05-local-runtime.mjs` executed against local PostgreSQL |
| **Static DDL Contract Spec** | 🟢 **6 / 6 PASS** | `src/modules/market-intelligence/infrastructure/cr-cost-05-ddl-contract.spec.ts` |
| **Full Vitest Test Suite** | 🟢 **1,257 / 1,257 PASS** | 238 test files, 0 errors, 0 flaky failures |
| **TypeScript Strict Compilation** | 🟢 **0 Errors** | `tsc --noEmit` clean |
| **Vite Production Build** | 🟢 **PASS** | `npm run build` bundled successfully |

---

## 5. Governance Boundary Compliance

- [x] **Local Runtime Verification:** Verified against PostgreSQL container running on host Mac via OrbStack.
- [x] **Production Database:** Untouched (`nhirlpkuvonggctdzzad` was NEVER accessed).
- [x] **Cloudflare Worker Deploy:** Zero deploys performed.
- [x] **UI Layer:** Zero UI files created or modified. Phase 4 UI remains **LOCKED**.
