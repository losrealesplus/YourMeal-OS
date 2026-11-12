/**
 * CR-COST-05 Block 2: Geography, Observation Scope & Delivery Coverage Evaluation
 * Separates observed price location from documented buyer delivery availability.
 * Country-agnostic Core supporting Spain (Canarias / Peninsula) without hardcoding Spain-only assumptions.
 */

import type {
  DeliveryCoverageState,
  FulfillmentMode,
  MarketDeliveryCoverage,
  RegionCode,
} from "./types";

export interface DeliveryTargetQuery {
  countryCode: string; // ISO 3166-1 alpha-2, e.g. 'ES', 'PT'
  regionCode?: RegionCode | null;
  subdivisionCode?: string | null;
  provinceCode?: string | null;
  islandCode?: string | null;
  postalCode?: string | null;
  allowPickup?: boolean;
}

export interface DeliveryCoverageEvaluation {
  state: DeliveryCoverageState;
  isDeliverable: boolean;
  matchedCoverageId: string | null;
  fulfillmentMode: FulfillmentMode;
  reason: string;
}

/**
 * Normalizes a postal code strictly as text, preserving leading zeros (e.g. '08001', '38001').
 */
export function normalizePostalCode(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") {
    throw new Error("Postal code must be provided as text to preserve leading zeros.");
  }
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  if (!/^[A-Z0-9 -]{2,16}$/.test(trimmed)) {
    throw new Error(`Invalid postal code format "${raw}".`);
  }
  return trimmed;
}

function isCoverageActiveAt(cov: MarketDeliveryCoverage, refDate: Date): boolean {
  const refDay = refDate.toISOString().slice(0, 10);
  if (cov.validFrom && refDay < cov.validFrom) return false;
  if (cov.validTo && refDay > cov.validTo) return false;
  return true;
}

function matchesTarget(
  cov: MarketDeliveryCoverage,
  target: DeliveryTargetQuery,
): { matched: boolean; specificity: number } {
  if (cov.countryCode.toUpperCase() !== target.countryCode.trim().toUpperCase()) {
    return { matched: false, specificity: 0 };
  }
  let specificity = 1;

  if (cov.regionCode) {
    if (!target.regionCode || cov.regionCode !== target.regionCode) {
      return { matched: false, specificity: 0 };
    }
    specificity += 10;
  }

  if (cov.subdivisionCode) {
    if (
      !target.subdivisionCode ||
      cov.subdivisionCode.toUpperCase() !== target.subdivisionCode.trim().toUpperCase()
    ) {
      return { matched: false, specificity: 0 };
    }
    specificity += 20;
  }

  if (cov.provinceCode) {
    if (
      !target.provinceCode ||
      cov.provinceCode.toUpperCase() !== target.provinceCode.trim().toUpperCase()
    ) {
      return { matched: false, specificity: 0 };
    }
    specificity += 30;
  }

  if (cov.islandCode) {
    if (
      !target.islandCode ||
      cov.islandCode.toUpperCase() !== target.islandCode.trim().toUpperCase()
    ) {
      return { matched: false, specificity: 0 };
    }
    specificity += 40;
  }

  if (cov.postalCodePrefix) {
    const cleanPrefix = cov.postalCodePrefix.trim().toUpperCase();
    const targetZip = (target.postalCode || "").trim().toUpperCase();
    if (!targetZip || !targetZip.startsWith(cleanPrefix)) {
      return { matched: false, specificity: 0 };
    }
    specificity += 50 + cleanPrefix.length;
  }

  return { matched: true, specificity };
}

/**
 * Evaluates whether documented source/establishment coverages support delivery to target.
 * Invariant: absence of documented coverage NEVER implies available delivery ('unknown').
 * Invariant: an observation made in one territory (e.g. ES_PENINSULA_MAINLAND) never proves coverage in another (e.g. Canarias).
 */
export function evaluateDeliveryCoverage(input: {
  sourceId: string;
  establishmentId?: string | null;
  observationRegionCode?: RegionCode | null;
  coverages: MarketDeliveryCoverage[];
  target: DeliveryTargetQuery;
  referenceDate?: Date;
}): DeliveryCoverageEvaluation {
  const refDate = input.referenceDate ?? new Date();
  const candidates = input.coverages
    .filter((cov) => cov.sourceId === input.sourceId)
    .filter(
      (cov) =>
        !cov.establishmentId ||
        (input.establishmentId != null && cov.establishmentId === input.establishmentId),
    )
    .filter((cov) => isCoverageActiveAt(cov, refDate))
    .map((cov) => {
      const m = matchesTarget(cov, input.target);
      return {
        cov,
        matched: m.matched,
        specificity: m.specificity + (cov.establishmentId ? 5 : 0),
      };
    })
    .filter((item) => item.matched)
    .sort((a, b) => b.specificity - a.specificity);

  if (candidates.length === 0) {
    return {
      state: "unknown",
      isDeliverable: false,
      matchedCoverageId: null,
      fulfillmentMode: "unknown",
      reason: input.observationRegionCode
        ? `No documented delivery coverage for ${input.target.regionCode || input.target.countryCode}; observation at ${input.observationRegionCode} does not imply destination availability.`
        : `No documented delivery coverage for ${input.target.regionCode || input.target.countryCode}.`,
    };
  }

  const best = candidates[0].cov;
  if (best.coverageStatus === "documented_unavailable") {
    return {
      state: "unavailable_in_target",
      isDeliverable: false,
      matchedCoverageId: best.id,
      fulfillmentMode: best.fulfillmentMode,
      reason: best.evidenceNote || "Documented unavailable in target destination.",
    };
  }

  if (best.coverageStatus === "unknown") {
    return {
      state: "unknown",
      isDeliverable: false,
      matchedCoverageId: best.id,
      fulfillmentMode: best.fulfillmentMode,
      reason: best.evidenceNote || "Coverage status explicitly unknown.",
    };
  }

  if (best.fulfillmentMode === "pickup_only") {
    return {
      state: "pickup_only",
      isDeliverable: Boolean(input.target.allowPickup),
      matchedCoverageId: best.id,
      fulfillmentMode: best.fulfillmentMode,
      reason: best.evidenceNote || "Pickup only at establishment.",
    };
  }

  if (best.fulfillmentMode === "delivery" || best.fulfillmentMode === "delivery_and_pickup") {
    return {
      state: "delivery_available",
      isDeliverable: true,
      matchedCoverageId: best.id,
      fulfillmentMode: best.fulfillmentMode,
      reason: best.evidenceNote || "Documented delivery coverage matches target destination.",
    };
  }

  return {
    state: "unknown",
    isDeliverable: false,
    matchedCoverageId: best.id,
    fulfillmentMode: best.fulfillmentMode,
    reason: "Fulfillment mode unknown; cannot confirm delivery.",
  };
}
