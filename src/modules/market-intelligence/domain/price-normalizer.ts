/**
 * CR-COST-05: Price and Unit Normalizer Engine
 * Pure economic & physical conversion functions for market observations.
 * Block 2 guarantees:
 *  - No double multiplication of packs
 *  - No silent tax rate guesses when tax_mode is unknown or inc_tax lacks documented tax_rate
 *  - No implicit volume <-> weight conversions without documented density_kg_per_l
 *  - AIEM metadata is preserved without automatic surcharge or duplication
 */

import { resolvePhysicalPack } from "./physical-format";
import type {
  AiemStatus,
  CatchWeightPolicy,
  ContentUnit,
  FreightInclusion,
  MeasurementDimension,
  NormalizationBasis,
  NormalizationStatus,
  NormalizedUnit,
  ObservedPriceBasis,
  PackPresentation,
  PricingComparisonMode,
  StandardUnit,
  TaxInclusion,
  TaxMode,
} from "./types";

export interface RawPriceInput {
  priceRaw: number;
  taxMode?: TaxMode;
  taxInclusion?: TaxInclusion;
  taxRate?: number | null; // Explicit 0 means 0%; null/undefined means unknown when inc_tax
  quantity?: number;
  unit?: string; // 'kg', 'g', 'l', 'ml', 'cl', 'unit', 'ud', 'pack'
  netDrainedQuantity?: number; // Legacy alias in `unit`
  packPresentation?: PackPresentation | null;
  packCount?: number | null;
  unitContentQty?: number | null;
  unitContentUnit?: ContentUnit | string | null;
  netContentQty?: number | null;
  netContentUnit?: ContentUnit | string | null;
  drainedWeightQty?: number | null;
  drainedWeightUnit?: string | null;
  observedPriceBasis?: ObservedPriceBasis | null;
  densityKgPerL?: number | null;
  targetDimension?: MeasurementDimension | null;
  isCatchWeight?: boolean | null;
  catchWeightPolicy?: CatchWeightPolicy | null;
  // Documentary AIEM metadata (must NOT alter priceExTax or duplicate surcharges)
  aiemStatus?: AiemStatus;
  aiemRate?: number | null;
  aiemAmountRaw?: number | null;
}

export interface NormalizedPriceResult {
  priceExTax: number | null;
  normalizedPriceExTax: number | null;
  normalizedUnit: NormalizedUnit;
  standardQuantity: number;
  standardUnit: StandardUnit;
  measurementDimension: MeasurementDimension;
  normalizationBasis: NormalizationBasis;
  normalizationStatus: NormalizationStatus;
}

export interface RawVolumeTierInput {
  minQuantity: number;
  tierQuantityUnit?: string;
  tierPriceRaw: number;
  taxMode?: TaxMode;
  taxRate?: number | null;
  parentTaxMode?: TaxMode;
  parentTaxRate?: number | null;
  parentStandardQuantity?: number;
  isCatchWeight?: boolean | null;
  catchWeightPolicy?: CatchWeightPolicy | null;
}

export interface NormalizedVolumeTierResult {
  minQuantity: number;
  tierQuantityUnit: string;
  tierPriceRaw: number;
  tierPriceExTax: number | null;
  tierNormalizedPriceExTax: number | null;
  taxMode: TaxMode;
  taxRate: number | null;
  normalizationStatus: NormalizationStatus;
}

export interface LandedCostInput {
  normalizedPriceExTax: number | null;
  freightInclusion: FreightInclusion;
  freightCostRaw?: number | null;
  freeFreightMinOrderAmount?: number | null;
  orderAmount?: number | null;
  batchQuantity?: number | null;
}

export interface LandedCostResult {
  comparisonMode: PricingComparisonMode;
  originPriceExTax: number | null;
  freightSurchargePerUnit: number | null;
  landedCostExTax: number | null;
  isFreightExempt: boolean;
  freightStatus: 'included' | 'free_threshold_reached' | 'surcharged' | 'unknown_freight';
}

function resolveEffectiveTaxMode(input: RawPriceInput): TaxMode {
  if (input.taxInclusion === "included") return "inc_tax";
  if (input.taxInclusion === "excluded") return "ex_tax";
  if (input.taxInclusion === "unknown") return "unknown";
  if (input.taxMode === "in_tax") return "inc_tax";
  if (input.taxMode === "exempt") return "ex_tax";
  return input.taxMode ?? "unknown";
}

export class PriceNormalizer {
  /**
   * Normalizes raw price, tax, and physical measurement into canonical €/kg, €/L or €/unit (Ex-Tax),
   * keeping normalized values strictly null when tax exclusion basis or rate is undetermined.
   */
  public static normalize(input: RawPriceInput): NormalizedPriceResult {
    if (!Number.isFinite(input.priceRaw) || input.priceRaw < 0) {
      throw new Error("Raw price cannot be negative");
    }

    if (input.taxRate !== undefined && input.taxRate !== null) {
      if (!Number.isFinite(input.taxRate) || input.taxRate < 0 || input.taxRate > 1.0) {
        throw new Error("Tax rate must be between 0.0 and 1.0 (e.g. 0.07 for 7%)");
      }
    }

    // 1. Resolve physical dimension and non-doubled denominator first
    const legacyDrainedQty =
      input.drainedWeightQty ??
      (input.netDrainedQuantity && input.netDrainedQuantity > 0
        ? input.netDrainedQuantity
        : undefined);
    const legacyDrainedUnit =
      input.drainedWeightUnit ??
      (input.netDrainedQuantity && input.netDrainedQuantity > 0 ? input.unit : undefined);

    const physical = resolvePhysicalPack({
      quantity: input.quantity,
      unit: input.unit,
      packPresentation: input.packPresentation,
      packCount: input.packCount,
      unitContentQty: input.unitContentQty,
      unitContentUnit: input.unitContentUnit,
      netContentQty: input.netContentQty,
      netContentUnit: input.netContentUnit,
      drainedWeightQty: legacyDrainedQty,
      drainedWeightUnit: legacyDrainedUnit,
      observedPriceBasis: input.observedPriceBasis ?? "unknown",
      densityKgPerL: input.densityKgPerL,
      targetDimension: input.targetDimension,
      isCatchWeight: input.isCatchWeight,
      catchWeightPolicy: input.catchWeightPolicy,
    });

    // 2. Resolve tax exclusion without fabricating unknown tax rates
    const taxMode = resolveEffectiveTaxMode(input);

    if (taxMode === "unknown") {
      return {
        priceExTax: null,
        normalizedPriceExTax: null,
        normalizedUnit: physical.normalizedUnit,
        standardQuantity: physical.standardQuantity,
        standardUnit: physical.standardUnit,
        measurementDimension: physical.measurementDimension,
        normalizationBasis: physical.normalizationBasis,
        normalizationStatus: "tax_unknown",
      };
    }

    if (taxMode === "inc_tax" && (input.taxRate === undefined || input.taxRate === null)) {
      return {
        priceExTax: null,
        normalizedPriceExTax: null,
        normalizedUnit: physical.normalizedUnit,
        standardQuantity: physical.standardQuantity,
        standardUnit: physical.standardUnit,
        measurementDimension: physical.measurementDimension,
        normalizationBasis: physical.normalizationBasis,
        normalizationStatus: "tax_rate_missing",
      };
    }

    const priceExTax =
      taxMode === "inc_tax" ? input.priceRaw / (1 + (input.taxRate as number)) : input.priceRaw;

    const normalizedPriceExTax = priceExTax / physical.standardQuantity;

    return {
      priceExTax: this.round(priceExTax, 4),
      normalizedPriceExTax: this.round(normalizedPriceExTax, 4),
      normalizedUnit: physical.normalizedUnit,
      standardQuantity: physical.standardQuantity,
      standardUnit: physical.standardUnit,
      measurementDimension: physical.measurementDimension,
      normalizationBasis: physical.normalizationBasis,
      normalizationStatus: "computed",
    };
  }

  /**
   * Normalizes a volume tier respecting D-010:
   * If tax_mode is unknown or inc_tax lacks tax_rate, tier_normalized_price_ex_tax is strictly null.
   */
  public static normalizeVolumeTier(input: RawVolumeTierInput): NormalizedVolumeTierResult {
    if (!Number.isFinite(input.tierPriceRaw) || input.tierPriceRaw < 0) {
      throw new Error("Tier price raw cannot be negative");
    }
    if (!Number.isFinite(input.minQuantity) || input.minQuantity <= 0) {
      throw new Error("Tier minQuantity must be strictly greater than 0");
    }

    const effectiveTaxMode: TaxMode =
      input.taxMode && input.taxMode !== "unknown"
        ? input.taxMode === "in_tax"
          ? "inc_tax"
          : input.taxMode === "exempt"
            ? "ex_tax"
            : input.taxMode
        : input.parentTaxMode === "in_tax"
          ? "inc_tax"
          : input.parentTaxMode === "exempt"
            ? "ex_tax"
            : (input.parentTaxMode ?? "unknown");

    const effectiveTaxRate =
      input.taxRate !== undefined && input.taxRate !== null
        ? input.taxRate
        : (input.parentTaxRate ?? null);

    const quantityDenominator =
      input.parentStandardQuantity && input.parentStandardQuantity > 0
        ? input.parentStandardQuantity
        : 1.0;

    if (effectiveTaxMode === "unknown") {
      return {
        minQuantity: input.minQuantity,
        tierQuantityUnit: input.tierQuantityUnit || "unit",
        tierPriceRaw: input.tierPriceRaw,
        tierPriceExTax: null,
        tierNormalizedPriceExTax: null,
        taxMode: "unknown",
        taxRate: null,
        normalizationStatus: "tax_unknown",
      };
    }

    if (
      effectiveTaxMode === "inc_tax" &&
      (effectiveTaxRate === null || effectiveTaxRate === undefined)
    ) {
      return {
        minQuantity: input.minQuantity,
        tierQuantityUnit: input.tierQuantityUnit || "unit",
        tierPriceRaw: input.tierPriceRaw,
        tierPriceExTax: null,
        tierNormalizedPriceExTax: null,
        taxMode: "inc_tax",
        taxRate: null,
        normalizationStatus: "tax_rate_missing",
      };
    }

    const tierPriceExTax =
      effectiveTaxMode === "inc_tax"
        ? input.tierPriceRaw / (1 + (effectiveTaxRate as number))
        : input.tierPriceRaw;

    const tierNormalizedPriceExTax = tierPriceExTax / quantityDenominator;

    return {
      minQuantity: input.minQuantity,
      tierQuantityUnit: input.tierQuantityUnit || "unit",
      tierPriceRaw: input.tierPriceRaw,
      tierPriceExTax: this.round(tierPriceExTax, 4),
      tierNormalizedPriceExTax: this.round(tierNormalizedPriceExTax, 4),
      taxMode: effectiveTaxMode,
      taxRate: effectiveTaxRate,
      normalizationStatus: "computed",
    };
  }

  /**
   * Evaluates comparison between Landed Cost and Origin Price (CR-COST-05 Block 2 / 3 Contract).
   */
  public static calculateLandedCost(
    input: LandedCostInput,
    comparisonMode: PricingComparisonMode = "landed_cost",
  ): LandedCostResult {
    if (input.normalizedPriceExTax === null) {
      return {
        comparisonMode,
        originPriceExTax: null,
        freightSurchargePerUnit: null,
        landedCostExTax: null,
        isFreightExempt: false,
        freightStatus: "unknown_freight",
      };
    }

    if (comparisonMode === "origin_price") {
      return {
        comparisonMode: "origin_price",
        originPriceExTax: input.normalizedPriceExTax,
        freightSurchargePerUnit: 0,
        landedCostExTax: input.normalizedPriceExTax,
        isFreightExempt: false,
        freightStatus: input.freightInclusion === "included" ? "included" : "surcharged",
      };
    }

    if (input.freightInclusion === "included") {
      return {
        comparisonMode: "landed_cost",
        originPriceExTax: input.normalizedPriceExTax,
        freightSurchargePerUnit: 0,
        landedCostExTax: input.normalizedPriceExTax,
        isFreightExempt: true,
        freightStatus: "included",
      };
    }

    if (
      input.freightInclusion === "free_above_threshold" &&
      input.freeFreightMinOrderAmount != null &&
      input.orderAmount != null &&
      input.orderAmount >= input.freeFreightMinOrderAmount
    ) {
      return {
        comparisonMode: "landed_cost",
        originPriceExTax: input.normalizedPriceExTax,
        freightSurchargePerUnit: 0,
        landedCostExTax: input.normalizedPriceExTax,
        isFreightExempt: true,
        freightStatus: "free_threshold_reached",
      };
    }

    if (input.freightCostRaw != null && input.batchQuantity != null && input.batchQuantity > 0) {
      const surcharge = input.freightCostRaw / input.batchQuantity;
      return {
        comparisonMode: "landed_cost",
        originPriceExTax: input.normalizedPriceExTax,
        freightSurchargePerUnit: this.round(surcharge, 4),
        landedCostExTax: this.round(input.normalizedPriceExTax + surcharge, 4),
        isFreightExempt: false,
        freightStatus: "surcharged",
      };
    }

    // Freight excluded or unknown without sufficient data to apportion
    return {
      comparisonMode: "landed_cost",
      originPriceExTax: input.normalizedPriceExTax,
      freightSurchargePerUnit: null,
      landedCostExTax: input.normalizedPriceExTax,
      isFreightExempt: false,
      freightStatus: "unknown_freight",
    };
  }

  /**
   * Helper to round float values to specified decimal precision.
   */
  public static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
