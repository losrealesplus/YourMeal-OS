import type {
  ItemIdentity,
  AllergenSnapshotState,
} from "@/modules/orders/domain/order-item-read-model";
/**
 * CR-OPS-07: Kitchen, Packing & Dispatch Operations Engine Domain Types
 * Defines the canonical DTOs, safety classifications, hierarchical tree nodes,
 * versioning metadata, and 2-tier drift detection models.
 */

export type OperationalTemporalMode = "historical" | "present" | "future";

export type HistoricalResolutionStatus =
  | "COMPLETE" // All frozen snapshots present and verified
  | "INCOMPLETE_SNAPSHOT" // Missing address or dietary snapshot; explicit warning emitted
  | "UNRESOLVED"; // Order state unresolvable

export interface DateResolverQuery {
  targetDate: string; // ISO YYYY-MM-DD
  tenantId: string;
  tenantTimezone?: string; // Default: "Europe/Madrid"
  cutoffTimestamp?: string; // ISO DateTime UTC for historical re-evaluation or future freeze
  companyId?: string | null;
  siteId?: string | null;
  deliveryGroupId?: string | null;
}

/** Immutable anchor for operational line tracking and semantic drift comparison */
export interface OperationalLineIdentity {
  operationalDate: string; // YYYY-MM-DD
  orderId: string;
  orderItemId: string;
  dishId: string | null;
  itemIdentity?: ItemIdentity;
  itemKind?: "dish" | "custom";
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
  allergenSnapshotState?: AllergenSnapshotState;
  metadataSource?: "snapshot" | "current_catalogue" | "unavailable";
  dishAllergens: string[]; // Standard EU 14 IDs from catalog or snapshot
  customerAllergens: string[]; // Declared in customer dietary profile
  customAllergens: string[]; // e.g. "kiwi", "fresa"
  criticalSafetyAllergens: string[]; // Intersection: dish contains allergen customer is allergic to OR explicit override
  modifications: string[]; // e.g. "Sin cebolla", "Salsa aparte" (from order_items.comment)
  preferences: string[]; // Lifestyle/Dietary (e.g. "vegano", "keto")
  itemNotes: string | null; // Operational general observations

  // Metadata & Snapshot Origin
  isHistoricalSnapshot: boolean;
  snapshotCapturedAt: string | null;
  resolutionStatus: HistoricalResolutionStatus;
  resolutionWarnings: string[];
}

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
  itemIdentity?: ItemIdentity;
  itemKind?: "dish" | "custom";
  allergenState?: AllergenSnapshotState;
  recipeState?: "CATALOGUE_LINKED" | "NOT_AVAILABLE";
  dishId: string | null;
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

export interface PackingDishSummaryItem {
  itemIdentity?: ItemIdentity;
  itemKind?: "dish" | "custom";
  allergenState?: AllergenSnapshotState;
  dishId: string | null;
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

export interface VersionMetadata {
  fingerprintSchemaVersion: "1" | "2";
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
