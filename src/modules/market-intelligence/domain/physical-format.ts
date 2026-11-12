/**
 * CR-COST-05 Block 2: Physical Product Format, GTIN & Dimension Resolution Engine
 * Pure domain invariants for packaging decomposition, GTIN text preservation,
 * and strict mass/volume/count dimensional isolation.
 */

import type {
  ContentUnit,
  MeasurementDimension,
  NormalizationBasis,
  NormalizedUnit,
  ObservedPriceBasis,
  PackPresentation,
  StandardUnit,
} from "./types";

export type GtinType = "EAN8" | "UPC12" | "EAN13" | "GTIN14";

export interface GtinParseResult {
  gtin: string | null;
  isValidFormat: boolean;
  gtinType: GtinType | null;
  checksumValid: boolean | null;
  error?: string;
}

export interface UnitSpec {
  dimension: MeasurementDimension;
  standardUnit: StandardUnit;
  normalizedUnit: NormalizedUnit;
  factorToStandard: number;
}

export interface PhysicalPackInput {
  quantity?: number | null;
  unit?: string | null;
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
}

export interface ResolvedPhysicalPack {
  standardQuantity: number;
  standardUnit: StandardUnit;
  normalizedUnit: NormalizedUnit;
  measurementDimension: MeasurementDimension;
  normalizationBasis: NormalizationBasis;
}

function round(val: number, decimals = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

export function verifyGs1CheckDigit(digits: string): boolean {
  if (!/^[0-9]+$/.test(digits)) return false;
  const len = digits.length;
  if (![8, 12, 13, 14].includes(len)) return false;

  const checkDigit = Number(digits[len - 1]);
  let sum = 0;
  // GS1 weights alternate 3, 1 moving right-to-left from index len-2
  for (let idx = len - 2, pos = 0; idx >= 0; idx--, pos++) {
    const d = Number(digits[idx]);
    sum += pos % 2 === 0 ? d * 3 : d;
  }
  const computed = (10 - (sum % 10)) % 10;
  return computed === checkDigit;
}

/**
 * Parses GTIN/EAN strictly from text preserving leading zeros.
 */
export function parseGtin(raw: unknown): GtinParseResult {
  if (raw === null || raw === undefined) {
    return { gtin: null, isValidFormat: true, gtinType: null, checksumValid: null };
  }
  if (typeof raw !== "string") {
    return {
      gtin: null,
      isValidFormat: false,
      gtinType: null,
      checksumValid: false,
      error: "GTIN must be provided as text to preserve leading zeros.",
    };
  }

  const trimmed = raw.trim().replace(/[\s-]+/g, "");
  if (!trimmed) {
    return { gtin: null, isValidFormat: true, gtinType: null, checksumValid: null };
  }

  if (!/^(?:[0-9]{8}|[0-9]{12}|[0-9]{13}|[0-9]{14})$/.test(trimmed)) {
    return {
      gtin: null,
      isValidFormat: false,
      gtinType: null,
      checksumValid: false,
      error: `Invalid GTIN/EAN format "${raw}": expected 8, 12, 13, or 14 digits.`,
    };
  }

  const gtinType: GtinType =
    trimmed.length === 8
      ? "EAN8"
      : trimmed.length === 12
        ? "UPC12"
        : trimmed.length === 13
          ? "EAN13"
          : "GTIN14";

  return {
    gtin: trimmed,
    isValidFormat: true,
    gtinType,
    checksumValid: verifyGs1CheckDigit(trimmed),
  };
}

export function resolveUnitSpec(rawUnit: string): UnitSpec {
  const clean = (rawUnit || "").trim().toLowerCase();
  switch (clean) {
    case "kg":
    case "kilo":
    case "kilogram":
    case "kilogramo":
    case "kilogramos":
      return {
        dimension: "mass",
        standardUnit: "kg",
        normalizedUnit: "EUR_PER_KG",
        factorToStandard: 1,
      };
    case "g":
    case "gr":
    case "gram":
    case "gramo":
    case "gramos":
      return {
        dimension: "mass",
        standardUnit: "kg",
        normalizedUnit: "EUR_PER_KG",
        factorToStandard: 0.001,
      };
    case "l":
    case "lt":
    case "liter":
    case "litro":
    case "litros":
      return {
        dimension: "volume",
        standardUnit: "l",
        normalizedUnit: "EUR_PER_L",
        factorToStandard: 1,
      };
    case "ml":
    case "milliliter":
    case "mililitro":
    case "mililitros":
      return {
        dimension: "volume",
        standardUnit: "l",
        normalizedUnit: "EUR_PER_L",
        factorToStandard: 0.001,
      };
    case "cl":
    case "centiliter":
    case "centilitro":
    case "centilitros":
      return {
        dimension: "volume",
        standardUnit: "l",
        normalizedUnit: "EUR_PER_L",
        factorToStandard: 0.01,
      };
    case "unit":
    case "ud":
    case "un":
    case "unidad":
    case "unidades":
    case "pack":
    case "pz":
    case "pieza":
    case "piezas":
      return {
        dimension: "count",
        standardUnit: "unit",
        normalizedUnit: "EUR_PER_UNIT",
        factorToStandard: 1,
      };
    default:
      throw new Error(`Unsupported measurement unit: ${rawUnit}`);
  }
}

export function convertWithinDimension(qty: number, fromUnit: string, toUnit: string): number {
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Quantity for unit conversion must be strictly greater than 0.");
  }
  const from = resolveUnitSpec(fromUnit);
  const to = resolveUnitSpec(toUnit);
  if (from.dimension !== to.dimension) {
    throw new Error(
      `Incompatible physical dimensions: cannot convert "${fromUnit}" (${from.dimension}) to "${toUnit}" (${to.dimension}) without documented density/conversion factor.`,
    );
  }
  const inStandard = qty * from.factorToStandard;
  return round(inStandard / to.factorToStandard, 6);
}

export function convertVolumeToMassWithDensity(
  volumeQty: number,
  volumeUnit: string,
  densityKgPerL: number | null | undefined,
): number {
  if (!Number.isFinite(volumeQty) || volumeQty <= 0) {
    throw new Error("Volume quantity must be strictly greater than 0.");
  }
  const spec = resolveUnitSpec(volumeUnit);
  if (spec.dimension !== "volume") {
    throw new Error(`Expected volume unit for density conversion, got "${volumeUnit}".`);
  }
  if (
    densityKgPerL === null ||
    densityKgPerL === undefined ||
    !Number.isFinite(densityKgPerL) ||
    densityKgPerL <= 0
  ) {
    throw new Error(
      "Density (kg/L) is required and must be > 0 to convert volume to mass; never assume 1.0.",
    );
  }
  const liters = volumeQty * spec.factorToStandard;
  return round(liters * densityKgPerL, 6);
}

/**
 * Resolves total normalizable quantity for a trade item / observation without double-multiplying packs.
 */
export function resolvePhysicalPack(input: PhysicalPackInput): ResolvedPhysicalPack {
  if (input.packCount !== undefined && input.packCount !== null) {
    if (!Number.isInteger(input.packCount) || input.packCount < 1) {
      throw new Error("packCount must be a positive integer (>= 1) when provided.");
    }
  }
  if (
    input.unitContentQty !== undefined &&
    input.unitContentQty !== null &&
    (!Number.isFinite(input.unitContentQty) || input.unitContentQty <= 0)
  ) {
    throw new Error("unitContentQty must be strictly greater than 0 when provided.");
  }
  if (
    input.netContentQty !== undefined &&
    input.netContentQty !== null &&
    (!Number.isFinite(input.netContentQty) || input.netContentQty <= 0)
  ) {
    throw new Error("netContentQty must be strictly greater than 0 when provided.");
  }
  if (
    input.drainedWeightQty !== undefined &&
    input.drainedWeightQty !== null &&
    (!Number.isFinite(input.drainedWeightQty) || input.drainedWeightQty <= 0)
  ) {
    throw new Error("drainedWeightQty must be strictly greater than 0 when provided.");
  }

  // Validate pack consistency if packCount, unitContent, and netContent are all specified
  if (
    input.packCount != null &&
    input.unitContentQty != null &&
    input.unitContentUnit &&
    input.netContentQty != null &&
    input.netContentUnit
  ) {
    const innerSpec = resolveUnitSpec(input.unitContentUnit);
    const netSpec = resolveUnitSpec(input.netContentUnit);
    if (innerSpec.dimension !== netSpec.dimension) {
      throw new Error(
        `Incompatible pack dimensions: unitContentUnit "${input.unitContentUnit}" (${innerSpec.dimension}) vs netContentUnit "${input.netContentUnit}" (${netSpec.dimension}).`,
      );
    }
    const expectedNetStd = input.packCount * input.unitContentQty * innerSpec.factorToStandard;
    const declaredNetStd = input.netContentQty * netSpec.factorToStandard;
    if (Math.abs(expectedNetStd - declaredNetStd) > 0.01) {
      throw new Error(
        `Pack consistency mismatch: ${input.packCount} x ${input.unitContentQty} ${input.unitContentUnit} (${round(expectedNetStd, 4)} ${innerSpec.standardUnit}) contradicts netContent (${round(declaredNetStd, 4)} ${netSpec.standardUnit}).`,
      );
    }
  }

  const basis: ObservedPriceBasis = input.observedPriceBasis || "unknown";

  // Resolve primary standard quantity & dimension
  let rawStdQty: number | null = null;
  let spec: UnitSpec | null = null;
  let normalizationBasis: NormalizationBasis = "unknown";

  if (basis === "per_base_unit") {
    const refUnit = input.netContentUnit || input.unitContentUnit || input.unit;
    if (!refUnit) {
      throw new Error("Cannot resolve base unit without a declared unit.");
    }
    spec = resolveUnitSpec(refUnit);
    rawStdQty = 1;
    normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
  } else if (basis === "per_inner_unit") {
    if (input.drainedWeightQty != null && input.drainedWeightUnit && input.packCount != null) {
      spec = resolveUnitSpec(input.drainedWeightUnit);
      if (spec.dimension !== "mass") {
        throw new Error(
          `Drained weight must be a mass unit, received "${input.drainedWeightUnit}".`,
        );
      }
      // drainedWeightQty is pack-total when packCount > 1 -> divide once by packCount for single inner unit
      rawStdQty = (input.drainedWeightQty * spec.factorToStandard) / input.packCount;
      normalizationBasis = "drained_weight";
    } else if (input.unitContentQty != null && input.unitContentUnit) {
      spec = resolveUnitSpec(input.unitContentUnit);
      // NEVER multiply by packCount when observedPriceBasis is per_inner_unit
      rawStdQty = input.unitContentQty * spec.factorToStandard;
      normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
    } else if (input.quantity != null && input.quantity > 0 && input.unit) {
      spec = resolveUnitSpec(input.unit);
      rawStdQty = input.quantity * spec.factorToStandard;
      normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
    } else {
      throw new Error(
        "observedPriceBasis 'per_inner_unit' requires unitContentQty + unitContentUnit.",
      );
    }
  } else {
    // 'per_pack' or legacy 'unknown'
    if (input.drainedWeightQty != null) {
      const drainedUnit = input.drainedWeightUnit || input.unit;
      if (!drainedUnit) {
        throw new Error("Drained weight requires a mass unit (kg or g).");
      }
      spec = resolveUnitSpec(drainedUnit);
      if (spec.dimension !== "mass") {
        throw new Error(`Drained weight must use mass unit (kg/g), got "${drainedUnit}".`);
      }
      rawStdQty = input.drainedWeightQty * spec.factorToStandard;
      normalizationBasis = "drained_weight";
    } else if (input.netContentQty != null && input.netContentUnit) {
      // Total pack net content is already full-pack quantity -> DO NOT multiply by packCount again
      spec = resolveUnitSpec(input.netContentUnit);
      rawStdQty = input.netContentQty * spec.factorToStandard;
      normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
    } else if (input.packCount != null && input.unitContentQty != null && input.unitContentUnit) {
      spec = resolveUnitSpec(input.unitContentUnit);
      rawStdQty = input.packCount * input.unitContentQty * spec.factorToStandard;
      normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
    } else if (input.quantity != null && input.unit) {
      if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
        throw new Error("Effective quantity must be strictly greater than 0");
      }
      spec = resolveUnitSpec(input.unit);
      // If caller passes legacy quantity + unit PLUS packCount (without unitContentQty), treat quantity as inner unit?
      // NO: to prevent accidental double multiplication, legacy quantity+unit is only scaled when packCount is omitted or 1,
      // unless unitContentQty is explicitly provided.
      if (input.packCount != null && input.packCount > 1 && basis === "per_pack") {
        throw new Error(
          "Ambiguous pack specification: provide unitContentQty + unitContentUnit or netContentQty + netContentUnit when packCount > 1.",
        );
      }
      rawStdQty = input.quantity * spec.factorToStandard;
      normalizationBasis = spec.dimension === "count" ? "unit_count" : "net_content";
    } else {
      throw new Error("Effective quantity must be strictly greater than 0");
    }
  }

  if (rawStdQty === null || !spec || rawStdQty <= 0) {
    throw new Error("Effective quantity must be strictly greater than 0");
  }

  // Handle explicit cross-dimension target (volume -> mass ONLY with explicit documented density)
  if (input.targetDimension && input.targetDimension !== spec.dimension) {
    if (spec.dimension === "volume" && input.targetDimension === "mass") {
      const kg = convertVolumeToMassWithDensity(rawStdQty, spec.standardUnit, input.densityKgPerL);
      return {
        standardQuantity: round(kg, 4),
        standardUnit: "kg",
        normalizedUnit: "EUR_PER_KG",
        measurementDimension: "mass",
        normalizationBasis,
      };
    }
    throw new Error(
      `Incompatible physical conversion from ${spec.dimension} to ${input.targetDimension}.`,
    );
  }

  return {
    standardQuantity: round(rawStdQty, 4),
    standardUnit: spec.standardUnit,
    normalizedUnit: spec.normalizedUnit,
    measurementDimension: spec.dimension,
    normalizationBasis,
  };
}
