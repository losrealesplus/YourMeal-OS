# CR-OPS-07 — ARCHITECTURE BLUEPRINT (HARDENED v1.1)
**Document ID:** `YOURMEAL_OS_CR_OPS_07_ARCHITECTURE_BLUEPRINT.md`  
**Classification:** Core Operations Engine Architecture & Data Projection Blueprint  
**Author:** Antigravity / Product & Security Architecture  
**Human Product Authority:** Alexander Hernández  
**Date:** 2026-10-03  
**Status:** 🟢 FASE 3 ARCHITECTURE BLUEPRINT v1.1 HARDENED & CERTIFIED · IMPLEMENTATION GATED (STOP HARD)  

---

## 1. Executive Summary & Architectural Overview

`CR-OPS-07` establishes the **Kitchen, Packing & Dispatch Operations Engine** for YourMeal OS. It transitions the platform from a flat, live-only kitchen list to a **temporal, deterministic, and multi-tier projection engine** designed to eliminate operational human errors in food preparation, order packing, and dispatch routing.

### 1.1 Core Constitutional Invariants
1. **Single Source of Truth:** `orders` + `order_items` + frozen snapshots (`dietary_snapshot`, `delivery_address_snapshot`, `customer_contact_snapshot`). Zero redundant secondary master tables.
2. **Deterministic Projections:** All operational sheets (Kitchen, Packing, Dispatch, Labels, Exports) are pure, reproducible mathematical transformations over the source of truth at a given cut-off timestamp.
3. **Strict Safety Semantic Isolation:**
   $$\text{🔴 Food Safety / Allergens} \neq \text{🟡 Recipe Modifications} \neq \text{🔵 Dietary Preferences} \neq \text{📝 Operational Notes}$$
4. **Zero Heuristic Parsing:** No natural language string-splitting (regex/commas) to guess allergens or modifications. All semantics derive strictly from structured models.
5. **Historical Immutability & No Silent Fallback:** Historical operational queries ($T < \text{Today}$) are strictly resolved against frozen snapshots. If a historical snapshot is absent, the system emits an explicit `INCOMPLETE_SNAPSHOT` resolution status rather than falling back silently to mutable live entities.

---

## 2. End-to-End Pipeline & Data Flow Architecture

```text
                               ┌──────────────────────────────────────────────┐
                               │            TRANSACTIONAL TRUTH               │
                               │  orders + order_items + frozen snapshots     │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │        1. OPERATIONAL DATE RESOLVER          │
                               │    (Timezone: Europe/Madrid + Cut-off)       │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
         [ Historical: T < Today ]                                     [ Dynamic: T >= Today ]
     • Terminal statuses included                                  • Active kitchen queue statuses
     • Frozen snapshots mandatory                                  • Live catalog joins permitted
     • HistoricalResolutionStatus                                  • Cut-off timestamp & version ID
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │       2. NORMALIZED INTERMEDIATE MODEL       │
                               │           NormalizedOperationalLine[]        │
                               │       + OperationalLineIdentity              │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┼──────────────────────────────┐
                       ▼                              ▼                              ▼
        ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
        │  3. KITCHEN ENGINE (P1)     ││   4. PACKING ENGINE (P2)    ││   5. DISPATCH ENGINE (P3)   │
        │ • Consolidated Dishes       ││ • Hierarchical Tree:        ││ • Geographic Clustered      │
        │ • Safety Breakdown (🔴/🟡)  ││   Municipio ➔ Channel ➔     ││ • Zone ➔ Route ➔ Stop       │
        │ • Kettle Totals & Warnings  ││   Company ➔ Site ➔ Floor    ││ • Driver Manifests          │
        └──────────────┬──────────────┘└──────────────┬──────────────┘└──────────────┬──────────────┘
                       │                              │                              │
                       └──────────────────────────────┼──────────────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │   6. VERSION MANAGER & 2-TIER DRIFT DETECTOR │
                               │ • Level 1: Canonical SHA-256 Fingerprint     │
                               │ • Level 2: Semantic Diff (Added/Removed/Mod) │
                               └──────────────────────┬───────────────────────┘
                                                      │
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │        7. DUAL EXPORTER SUBSYSTEM            │
                               │  • PDF: High-contrast workshop printable     │
                               │  • Excel: Flat granular 14-col analytic      │
                               │  • Labels: Unit & Master Bag Thermal Feeds   │
                               └──────────────────────────────────────────────┘
```

---

## 3. Detailed Component Contracts & TypeScript Specifications

### 3.1 Component A & D — `OperationalDateResolver` & `OperationalSnapshotContract`

```typescript
export type OperationalTemporalMode = "historical" | "present" | "future";

export type HistoricalResolutionStatus = 
  | "COMPLETE"             // All frozen snapshots present and verified
  | "INCOMPLETE_SNAPSHOT"  // Missing address or dietary snapshot; explicit warning emitted
  | "UNRESOLVED";          // Order state unresolvable

export interface DateResolverQuery {
  targetDate: string; // ISO YYYY-MM-DD
  tenantId: string;
  tenantTimezone?: string; // Default: "Europe/Madrid"
  cutoffTimestamp?: string; // ISO DateTime UTC for historical re-evaluation or future freeze
  companyId?: string | null;
  siteId?: string | null;
}

/** Immutable anchor for operational line tracking and semantic drift comparison */
export interface OperationalLineIdentity {
  operationalDate: string; // YYYY-MM-DD
  orderId: string;
  orderItemId: string;
  dishId: string;
  portionIndex: number; // 0..N-1 for multi-qty line items
}

export interface NormalizedOperationalLine {
  identity: OperationalLineIdentity;
  orderStatus: string;
  demandChannel: "individual" | "company";
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  
  // Destination Hierarchy (Location != Logistic Route)
  municipality: string; // Physical location (e.g. "Adeje")
  deliveryAddress: {
    street: string;
    city: string;
    zip: string;
    floorDoor?: string | null;
    fullFormatted: string;
  };
  companyId: string | null;
  companyName: string | null;
  siteId: string | null;
  siteName: string | null;
  organizationalUnitId: string | null;
  organizationalUnitName: string | null;
  deliveryGroupId: string | null;

  // Dish & Production Data
  dishName: string;
  qty: number;
  unitPrice: number | null;
  
  // Strict Safety & Customization Segregation
  dishAllergens: string[]; // Standard EU 14 IDs from catalog or snapshot
  customerAllergens: string[]; // Declared in customer dietary profile
  customAllergens: string[]; // e.g. "kiwi", "fresa"
  criticalSafetyAllergens: string[]; // Intersection: dish contains allergen customer is allergic to OR explicit allergen override
  modifications: string[]; // e.g. "Sin cebolla", "Salsa aparte" (from order_items.comment)
  preferences: string[]; // Lifestyle/Dietary (e.g. "vegano", "keto")
  itemNotes: string | null; // Operational general observations
  
  // Metadata & Snapshot Origin
  isHistoricalSnapshot: boolean;
  snapshotCapturedAt: string | null;
  resolutionStatus: HistoricalResolutionStatus;
  resolutionWarnings: string[];
}
```

---

### 3.2 Component B — `ProductionKitchenEngine` (P1 Cocina)

```typescript
export type SafetySeverity = "critical_allergy" | "modification" | "standard";

export interface ProductionPortionVariant {
  variantKey: string; // e.g., "STD", "ALG:gluten", "MOD:sin_cebolla"
  variantLabel: string;
  severity: SafetySeverity;
  qty: number;
  allergensAffected: string[];
  modifications: string[];
  customerLines: Array<{
    identity: OperationalLineIdentity;
    customerId: string;
    customerName: string;
    orderId: string;
    qty: number;
    notes: string | null;
  }>;
}

export interface KitchenDishConsolidatedBlock {
  dishId: string;
  dishName: string;
  totalQty: number;
  catalogAllergens: string[];
  prepMinutesEstimated: number | null;
  totalWeightGramsEstimated: number | null;
  
  // Segmented Production Batches
  standardPortionsCount: number;
  safetyAllergyPortionsCount: number;
  modifiedPortionsCount: number;
  
  variants: ProductionPortionVariant[];
}

export interface KitchenSafetyAlertBanner {
  totalAllergyAlertCount: number;
  totalModificationCount: number;
  criticalAllergensPresent: Array<{
    allergenId: string;
    allergenLabel: string;
    affectedPortions: number;
    affectedDishes: string[];
  }>;
}

export interface KitchenProductionSheetModel {
  targetDate: string;
  temporalMode: OperationalTemporalMode;
  resolutionStatus: HistoricalResolutionStatus;
  versionMetadata: VersionMetadata;
  safetySummary: KitchenSafetyAlertBanner;
  dishes: KitchenDishConsolidatedBlock[];
  totalPortions: number;
  totalOrders: number;
}
```

---

### 3.3 Component C — `PackingHierarchyEngine` (P2 Packing)

```typescript
export interface PackingDishSummaryItem {
  dishId: string;
  dishName: string;
  qty: number;
  safetyTag?: string | null; // e.g., "🔴 SIN GLUTEN", "🟡 SIN CEBOLLA"
}

export interface PackingCustomerOrderUnit {
  orderId: string;
  customerId: string;
  customerName: string;
  totalPortions: number;
  items: PackingDishSummaryItem[];
  specialInstructions: string | null;
  dietaryBadges: string[];
}

export interface PackingOrganizationalUnitNode {
  unitId: string | "default_unit";
  unitName: string; // e.g., "Planta 2 - Finanzas" or "General"
  totalPortions: number;
  totalOrders: number;
  customers: PackingCustomerOrderUnit[];
}

export interface PackingSiteNode {
  siteId: string;
  siteName: string;
  siteAddress: string;
  totalPortions: number;
  totalOrders: number;
  units: PackingOrganizationalUnitNode[];
}

export interface PackingCompanyNode {
  companyId: string;
  companyName: string;
  totalPortions: number;
  totalOrders: number;
  sites: PackingSiteNode[];
}

export interface PackingMunicipalityCluster {
  municipality: string; // e.g., "Adeje", "Arona", "Santa Cruz"
  totalPortions: number;
  totalOrders: number;
  b2cIndividuals: PackingCustomerOrderUnit[];
  b2bCompanies: PackingCompanyNode[];
}

export interface PackingSheetModel {
  targetDate: string;
  temporalMode: OperationalTemporalMode;
  resolutionStatus: HistoricalResolutionStatus;
  versionMetadata: VersionMetadata;
  municipalities: PackingMunicipalityCluster[];
  totals: {
    municipalityCount: number;
    b2bCompanyCount: number;
    b2bPortionsCount: number;
    b2cIndividualCount: number;
    b2cPortionsCount: number;
    grandTotalPortions: number;
    grandTotalOrders: number;
  };
}
```

---

### 3.4 Component E — `OperationalSheetExporter`

#### 3.4.1 PDF Formatting Specifications (Workshop / Taller)
- **Grid Layout:** 2-column responsive layout optimized for A4 Landscape / DIN A3.
- **Typography:** High legibility sans-serif (`Inter`, `Helvetica Neue`), 12pt minimum for quantities, 16pt for dish headers, 24pt for total kettle counts.
- **Visual Safety Codes:**
  - 🔴 Red High-Contrast Badge (`#DC2626` background, `#FFFFFF` text, bold uppercase): Mandatory for all allergen alerts.
  - 🟡 Amber Warning Badge (`#D97706` background, `#FFFFFF` text): Mandatory for kitchen recipe modifications.
  - 🟢 Green Status (`#059669`): Standard unchanged portions.
- **Thermal Label Feed Layout:** Standard 100mm × 50mm / 60mm × 40mm thermal label layout with barcode (Code 128 / QR Code) encoding `ORDER_ID:ITEM_ID:PORTION_INDEX`.

#### 3.4.2 Excel Tabular Matrix Specifications
The Excel export (`.xlsx`) mandates a **flat 14-column canonical layout with 0 merged cells in the data rows** to ensure native spreadsheet slicing, sorting, filtering, and pivot table execution:

| Column | Header | Type | Description |
| :---: | :--- | :---: | :--- |
| **A** | `FECHA_ENTREGA` | Date (`YYYY-MM-DD`) | Target delivery date |
| **B** | `MUNICIPIO` | String | Resolved municipality / locality |
| **C** | `CANAL` | Enum (`B2B_EMPRESA`, `B2C_PARTICULAR`) | Demand channel |
| **D** | `EMPRESA` | String | Company name (or "—" for B2C) |
| **E** | `SEDE` | String | Physical site location |
| **F** | `UNIDAD_DEPARTAMENTO` | String | Department / floor / org unit |
| **G** | `CLIENTE` | String | Customer display name |
| **H** | `ID_PEDIDO` | String | Unique Order Reference (#ID) |
| **I** | `PLATO` | String | Full dish title |
| **J** | `CANTIDAD` | Number | Quantity of portions |
| **K** | `ALERGIAS_SEGURIDAD` | String | Comma-separated critical allergen alerts (🔴) |
| **L** | `MODIFICACIONES` | String | Custom recipe modifications (🟡) |
| **M** | `PREFERENCIAS` | String | Customer preferences (e.g. keto, vegetariano) |
| **N** | `NOTAS_OPERATIVAS` | String | General delivery / kitchen notes |

---

### 3.5 Component F — `VersionManager & DriftDetector`

#### 3.5.1 Canonical Serialization & Fingerprint Formulation
To eliminate ordering artifacts across database queries, all lines are sorted strictly by their canonical identity tuple before serialization:

$$\text{SortKey}_i = \langle \texttt{operationalDate}, \texttt{municipality}, \texttt{demandChannel}, \texttt{companyId}, \texttt{siteId}, \texttt{unitId}, \texttt{customerId}, \texttt{orderId}, \texttt{orderItemId}, \texttt{dishId}, \texttt{portionIndex} \rangle$$

$$\text{CanonicalString} = \texttt{"schema=1\n"} + \sum_{i=1}^{N} \text{CanonicalSerialize}(\text{NormalizedLine}_i)$$

$$\text{PlanningFingerprint} = \text{SHA256}(\text{CanonicalString})$$

#### 3.5.2 Version Identification Structure
$$\texttt{PROD-YYYYMMDD-HHMM-}\{\text{Fingerprint}_{0..5}\}$$
$$\text{Example: } \texttt{PROD-20261007-1542-a8f3d1}$$

```typescript
export interface VersionMetadata {
  fingerprintSchemaVersion: "1";
  versionId: string;
  targetDate: string;
  generatedAt: string; // ISO Timestamp UTC
  cutoffTimestamp: string;
  planningFingerprint: string; // SHA-256
  totalOrdersIncluded: number;
  totalPortionsIncluded: number;
}

export interface OperationalLineDelta {
  identity: OperationalLineIdentity;
  previous: NormalizedOperationalLine | null;
  current: NormalizedOperationalLine | null;
  changeType: "added" | "removed" | "modified";
  fieldChanges: Array<{
    field: string;
    before: unknown;
    after: unknown;
  }>;
}

export interface DriftDeltaResult {
  hasDrift: boolean;
  baseVersion: VersionMetadata;
  currentLiveVersion: VersionMetadata;
  
  // High-level Metric Deltas
  deltaSummary: {
    addedOrdersCount: number;
    removedOrdersCount: number;
    addedPortionsCount: number;
    removedPortionsCount: number;
    alteredDietarySafetyCount: number;
  };
  
  // Semantic Granular Deltas
  addedLines: NormalizedOperationalLine[];
  removedLines: NormalizedOperationalLine[];
  modifiedLines: OperationalLineDelta[];
}
```

---

## 4. Verification Matrix & Quality Gates Plan

```text
╔══════════════════════════════════════════════════════════════════════════════╗
║ CR-OPS-07 QUALITY GATES & VERIFICATION HARNESS                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Gate 3.1: Type Completeness       │ Zero any, full TypeScript strictness     ║
║ Gate 3.2: Historical Isolation    │ Verify past date unaffected by mutations ║
║ Gate 3.3: Safety Segregation      │ 🔴 Allergens distinct from 🟡 Modifs     ║
║ Gate 3.4: Hierarchical Packing    │ Full 6-level collapsible tree parity     ║
║ Gate 3.5: Drift Determinism       │ 2-Tier Fingerprint + Semantic Diff       ║
║ Gate 3.6: Export Conformance      │ Printable PDF + Unmerged 14-col Excel    ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

🛑 **STRICT STOP MAINTAINED.**  
Este Blueprint Hardened (v1.1) constituye la especificación arquitectónica definitiva de **CR-OPS-07**.  
Cero mutaciones de DB, cero modificaciones de código y cero despliegues ejecutados. Quedo en espera de la validación y autorización humana para la Fase de Implementación.
