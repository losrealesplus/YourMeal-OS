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
  ContentUnit,
  MeasurementDimension,
  NormalizationBasis,
  NormalizationStatus,
  NormalizedUnit,
  ObservedPriceBasis,
  PackPresentation,
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

function resolveEffectiveTaxMode(input: RawPriceInput): TaxMode {
  if (input.taxInclusion === "included") return "inc_tax";
  if (input.taxInclusion === "excluded") return "ex_tax";
  if (input.taxInclusion === "unknown") return "unknown";
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
   * Helper to round float values to specified decimal precision.
   */
  public static round(value: number, decimals: number = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
