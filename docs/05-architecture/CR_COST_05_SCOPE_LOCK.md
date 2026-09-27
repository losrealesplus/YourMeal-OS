# CR-COST-05: Scope Lock & Implementation Boundary
**Initiative:** Food Market Price Intelligence Foundation  
**Version:** v1.0.0 (Ratification Pending)  
**Parent Evolution:** Cost Intelligence & Decision Engine  
**Governance State:** 🔒 **IMPLEMENTATION BLOCKED** (Pre-Authorization Scope Definition)  
**Date:** 2026-09-27  

---

## 1. Executive Intent & Scope Statement

CR-COST-05 delivers the foundational architecture for **Market Price Intelligence** in YourMeal OS. It introduces the capability to record observable market prices from professional food distributors (Makro, GM Cash, 5 Océanos) and retail anchors (Mercadona), match them with internal kitchen ingredients, compute price variance against effective WAC, and provide actionable negotiation intelligence to human operators.

> [!IMPORTANT]
> **Scope Lock Invariant:**  
> This Scope Lock defines the exact implementation boundary for CR-COST-05. **No implementation, coding, migration, or deployment may begin until this document is explicitly ratified and authorized by the Sovereign Human Product Authority.**

---

## 2. IN SCOPE

### A. Core Domain & Mathematical Engines (`src/modules/market-intelligence/`)
1. **Domain Types (`domain/types.ts`):**
   * `MarketSource`, `MarketSourceType` (`b2b_wholesale`, `cash_carry`, `regional_specialist`, `retail_ceiling`).
   * `MarketProduct`, `ThermalState`, `CulinaryUnit`.
   * `MarketPriceObservation`, `TaxMode`, `QualityStatus` (`VERIFIED`, `OBSERVED`, `ESTIMATED`, `STALE`).
   * `MarketVolumeTier`.
   * `ProductMapping`, `MatchConfidence`, `ComparabilityGrade` (`HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`).
   * `NegotiationBrief`, `MarketVarianceResult`.
2. **Product Matching Engine (`domain/product-matcher.ts`):**
   * Multi-factor scoring ($S_{\text{name}} + S_{\text{state}} + S_{\text{unit}} + S_{\text{spec}} + S_{\text{grade}}$).
   * Confidence categorization ($\ge 90\%$ High, $70\%-89\%$ Medium, $50\%-69\%$ Low, $<50\%$ Unmatched).
3. **Economic Normalization Engine (`domain/price-normalizer.ts`):**
   * Strict denominator normalization to `€/kg`, `€/L`, `€/unit`.
   * Tax isolation (Ex-Tax base conversion for IGIC 0%/3%/7% and IVA 0%/4%/10%/21%).
4. **Market Benchmark Engine (`domain/benchmark-calculator.ts`):**
   * Comparability-weighted median pricing.
   * Variance calculation against tenant effective WAC.

### B. Application Services & Ingestion Adapters (`application/`)
1. **`MarketPriceObservationService`:** Record, list, query time-series price observations.
2. **`ProductMappingService`:** Create, confirm, and update tenant ingredient mappings.
3. **`MarketBenchmarkService`:** Calculate price gaps, annual spend at risk, and generate structured `NegotiationBrief`.
4. **Ingestion Adapters (`infrastructure/adapters/`):**
   * `ManualAssistedAdapter` (MVP 0: direct operator input).
   * `StructuredCatalogImportAdapter` (MVP 1: CSV/Excel price sheet parser).

### C. Database Schema & RLS Migrations (`supabase/migrations/`)
1. **Shared Core Tables:**
   * `public.market_sources` (Registry of vendors/retailers).
   * `public.market_products` (Standardized external SKUs).
   * `public.market_price_observations` (Time-series pricing facts).
   * `public.market_volume_tiers` (Volume break discounts).
2. **Private Tenant Tables:**
   * `public.product_mappings` (Tenant Ingredient $\leftrightarrow$ Market Product links with RLS).
3. **RLS Policies:**
   * Public/shared read access for market reference tables.
   * Strict `tenant_id` isolation for `product_mappings`.

### D. User Interface Surfaces (`src/routes/_authenticated/`)
1. **Cost Intelligence Cockpit (`admin.cost-intelligence.tsx`):**
   * Tab 5: **Market Intelligence & Benchmarks** (Variance matrix, mapping manager, negotiation briefs).
2. **Purchasing Surface (`admin.purchasing.tsx`):**
   * Contextual Benchmark Badge on invoice line items (comparing unit price vs market wholesale reference).

---

## 3. OUT OF SCOPE (Strictly Prohibited in CR-COST-05)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CR-COST-05 OUT OF SCOPE                         │
├────────────────────────────────────────────────────────────────────────┤
│ ❌ Web scrapers / crawlers against authenticated portal websites        │
│ ❌ Automated purchasing / supplier re-routing                          │
│ ❌ Automated negotiation bots or email dispatch                       │
│ ❌ Real-time Alert Center / Notification Bell UI (🔔)                   │
│ ❌ EDI integrations / automated vendor billing reconciliation         │
│ ❌ Cross-tenant crowdsourced private invoice data sharing              │
│ ❌ Modifications to certified E2→E9 calculation logic                  │
│ ❌ Changes to existing DDL tables (dishes, ingredients, invoices)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Multi-Tier Boundary Allocation

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        RESPONSIBILITY BOUNDARY                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PLATFORM CORE:                                                      │
│    - Market sources, raw observations, volume tiers                    │
│    - Normalization engine (€/kg, €/L) and currency handling            │
│    - Statistical time-series engines (trend, median, volatility)       │
├────────────────────────────────────────────────────────────────────────┤
│ 2. FOOD VERTICAL:                                                      │
│    - Food categorization (Meat, Fish, Produce, Dairy, Dry Goods)       │
│    - Cut, thermal state, and yield shrinkage metadata                  │
│    - Culinary volume-to-weight density tables                          │
├────────────────────────────────────────────────────────────────────────┤
│ 3. TENANT INSTANCE:                                                    │
│    - Private ingredient mappings (ProductMapping)                      │
│    - Private supplier contracts, payment terms, and negotiated rates   │
│    - Private WAC comparison and exportable Negotiation Briefs          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Security, Privacy & Multi-Tenant Rules

1. **Public Market Isolation:** Market observations (e.g., Makro chicken price in Tenerife on 2026-09-27) are public reference data accessible to any food tenant.
2. **Strict Tenant Data Shielding:**
   * A tenant's private WAC, purchase volumes, negotiated supplier identities, and product mapping configurations are strictly protected by `tenant_id` RLS policies.
   * Tenant $A$ can never observe whether Tenant $B$ mapped an ingredient or what Tenant $B$ pays for it.

---

## 6. Pre-Implementation Quality & Test Gates

Before requesting the **Merge & Production Deploy Gate**, implementation must fulfill:

1. **0 TypeScript Errors:** `npm run typecheck` exits with 0.
2. **Unit Test Coverage:** 100% test pass on:
   * Multi-factor matching scoring algorithm (`product-matcher.spec.ts`).
   * Unit and tax normalization (`price-normalizer.spec.ts`).
   * Comparability-weighted benchmark calculator (`benchmark-calculator.spec.ts`).
   * CSV/Excel catalog importer (`catalog-importer.spec.ts`).
3. **Regression Gate:** All 231 existing test suites (1,218 tests) must pass without regression.
4. **Clean Production Build:** `npm run build` succeeds without SSR or bundling errors.

---

## 7. Governance Gate Status

```text
╔══════════════════════════════════════════════════════════════════════╗
║                    CR-COST-05 GOVERNANCE GATE                        ║
╠══════════════════════════════════════════════════════════════════════╣
║ Product Discovery                       🟢 COMPLETE                  ║
║ Architectural Blueprint                 🟢 SPECIFIED                 ║
║ Scope Lock v1.0.0                       🟢 SPECIFIED                 ║
║                                                                      ║
║ Implementation Gate                     🔴 LOCKED                    ║
║ QA & Regression Gate                    🔴 LOCKED                    ║
║ Production Migration Gate               🔴 LOCKED                    ║
║ Production Deploy Gate                  🔴 LOCKED                    ║
║ Product Capability Certification        🔴 LOCKED                    ║
╚══════════════════════════════════════════════════════════════════════╝
```
