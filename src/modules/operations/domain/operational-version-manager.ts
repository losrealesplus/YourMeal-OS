/**
 * CR-OPS-07: Version Manager & 2-Tier Drift Detector
 * Computes deterministic planning fingerprints using 11-tuple canonical sorting,
 * generates version metadata, and performs 2-tier semantic drift comparison.
 */

import type {
  DriftDeltaResult,
  NormalizedOperationalLine,
  OperationalLineDelta,
  OperationalLineIdentity,
  VersionMetadata,
} from "./operational-engine-types";

export const FINGERPRINT_SCHEMA_VERSION = "1" as const;

/**
 * Builds a deterministic identity key for map indexing.
 */
export function buildIdentityKey(id: OperationalLineIdentity): string {
  return `${id.operationalDate}::${id.orderId}::${id.orderItemId}::${id.dishId}::${id.portionIndex}`;
}

/**
 * Sorts normalized lines deterministically by canonical 11-tuple before serialization.
 */
export function sortLinesCanonically(lines: NormalizedOperationalLine[]): NormalizedOperationalLine[] {
  return [...lines].sort((a, b) => {
    const kA = [
      a.identity.operationalDate,
      a.municipality,
      a.demandChannel,
      a.companyId ?? "",
      a.siteId ?? "",
      a.organizationalUnitId ?? "",
      a.customerId,
      a.identity.orderId,
      a.identity.orderItemId,
      a.identity.dishId,
      String(a.identity.portionIndex).padStart(4, "0"),
    ].join("|");

    const kB = [
      b.identity.operationalDate,
      b.municipality,
      b.demandChannel,
      b.companyId ?? "",
      b.siteId ?? "",
      b.organizationalUnitId ?? "",
      b.customerId,
      b.identity.orderId,
      b.identity.orderItemId,
      b.identity.dishId,
      String(b.identity.portionIndex).padStart(4, "0"),
    ].join("|");

    return kA.localeCompare(kB);
  });
}

/**
 * Serializes lines canonically into a deterministic string representation.
 */
export function canonicalSerialize(lines: NormalizedOperationalLine[]): string {
  const sorted = sortLinesCanonically(lines);
  const buffer: string[] = [`schema=${FINGERPRINT_SCHEMA_VERSION}`];

  for (const l of sorted) {
    const algs = [...l.customerAllergens].sort().join(",");
    const mods = [...l.modifications].sort().join(",");
    const lineStr = [
      l.identity.operationalDate,
      l.identity.orderId,
      l.identity.orderItemId,
      l.identity.dishId,
      l.identity.portionIndex,
      l.customerId,
      l.demandChannel,
      l.companyId ?? "",
      l.siteId ?? "",
      l.organizationalUnitId ?? "",
      l.dishName,
      algs,
      mods,
      l.itemNotes ?? "",
    ].join("|");
    buffer.push(lineStr);
  }

  return buffer.join("\n");
}

/**
 * Computes SHA-256 fingerprint from string in both Node.js and browser environments.
 */
export async function computeSHA256(text: string): Promise<string> {
  // Use Web Crypto API if available
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback to Node.js crypto module if available
  try {
    const nodeCrypto = await import("node:crypto");
    return nodeCrypto.createHash("sha256").update(text).digest("hex");
  } catch {
    // Deterministic pseudo-hash fallback for pure browser/mock testing without crypto
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, "0");
  }
}

/**
 * Builds version metadata for a set of normalized operational lines.
 */
export async function generateVersionMetadata(params: {
  targetDate: string;
  lines: NormalizedOperationalLine[];
  cutoffTimestamp?: string;
  generatedAt?: string;
}): Promise<VersionMetadata> {
  const {
    targetDate,
    lines,
    cutoffTimestamp = new Date().toISOString(),
    generatedAt = new Date().toISOString(),
  } = params;

  const canonicalString = canonicalSerialize(lines);
  const planningFingerprint = await computeSHA256(canonicalString);
  const hashPrefix = planningFingerprint.slice(0, 6);

  // Formatter for YYYYMMDD-HHMM
  const genDate = new Date(generatedAt);
  const yyyy = genDate.getUTCFullYear();
  const mm = String(genDate.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(genDate.getUTCDate()).padStart(2, "0");
  const hh = String(genDate.getUTCHours()).padStart(2, "0");
  const min = String(genDate.getUTCMinutes()).padStart(2, "0");

  const versionId = `PROD-${yyyy}${mm}${dd}-${hh}${min}-${hashPrefix}`;
  const distinctOrders = new Set(lines.map((l) => l.identity.orderId)).size;

  return {
    fingerprintSchemaVersion: FINGERPRINT_SCHEMA_VERSION,
    versionId,
    targetDate,
    generatedAt,
    cutoffTimestamp,
    planningFingerprint,
    totalOrdersIncluded: distinctOrders,
    totalPortionsIncluded: lines.length,
  };
}

/**
 * 2-Tier Drift Detector: Compares base version against current live state.
 */
export function detectDrift(params: {
  baseVersion: VersionMetadata;
  baseLines: NormalizedOperationalLine[];
  currentLiveVersion: VersionMetadata;
  currentLiveLines: NormalizedOperationalLine[];
}): DriftDeltaResult {
  const { baseVersion, baseLines, currentLiveVersion, currentLiveLines } = params;

  // Level 1: Binary check via Fingerprint
  const hasDrift = baseVersion.planningFingerprint !== currentLiveVersion.planningFingerprint;
  if (!hasDrift) {
    return {
      hasDrift: false,
      baseVersion,
      currentLiveVersion,
      deltaSummary: {
        addedOrdersCount: 0,
        removedOrdersCount: 0,
        addedPortionsCount: 0,
        removedPortionsCount: 0,
        alteredDietarySafetyCount: 0,
      },
      addedLines: [],
      removedLines: [],
      modifiedLines: [],
    };
  }

  // Level 2: Semantic Diff
  const baseMap = new Map<string, NormalizedOperationalLine>();
  for (const l of baseLines) {
    baseMap.set(buildIdentityKey(l.identity), l);
  }

  const liveMap = new Map<string, NormalizedOperationalLine>();
  for (const l of currentLiveLines) {
    liveMap.set(buildIdentityKey(l.identity), l);
  }

  const addedLines: NormalizedOperationalLine[] = [];
  const removedLines: NormalizedOperationalLine[] = [];
  const modifiedLines: OperationalLineDelta[] = [];
  let alteredDietarySafetyCount = 0;

  // Check for additions and modifications
  for (const [key, liveLine] of liveMap.entries()) {
    const baseLine = baseMap.get(key);
    if (!baseLine) {
      addedLines.push(liveLine);
    } else {
      const fieldChanges: OperationalLineDelta["fieldChanges"] = [];

      if (baseLine.dishName !== liveLine.dishName) {
        fieldChanges.push({ field: "dishName", before: baseLine.dishName, after: liveLine.dishName });
      }
      if (baseLine.customerName !== liveLine.customerName) {
        fieldChanges.push({ field: "customerName", before: baseLine.customerName, after: liveLine.customerName });
      }
      if (baseLine.modifications.join(",") !== liveLine.modifications.join(",")) {
        fieldChanges.push({ field: "modifications", before: baseLine.modifications, after: liveLine.modifications });
      }
      if (baseLine.criticalSafetyAllergens.join(",") !== liveLine.criticalSafetyAllergens.join(",")) {
        fieldChanges.push({
          field: "criticalSafetyAllergens",
          before: baseLine.criticalSafetyAllergens,
          after: liveLine.criticalSafetyAllergens,
        });
        alteredDietarySafetyCount++;
      }

      if (fieldChanges.length > 0) {
        modifiedLines.push({
          identity: liveLine.identity,
          previous: baseLine,
          current: liveLine,
          changeType: "modified",
          fieldChanges,
        });
      }
    }
  }

  // Check for removals
  for (const [key, baseLine] of baseMap.entries()) {
    if (!liveMap.has(key)) {
      removedLines.push(baseLine);
    }
  }

  const baseOrderIds = new Set(baseLines.map((l) => l.identity.orderId));
  const liveOrderIds = new Set(currentLiveLines.map((l) => l.identity.orderId));

  let addedOrdersCount = 0;
  for (const id of liveOrderIds) {
    if (!baseOrderIds.has(id)) addedOrdersCount++;
  }

  let removedOrdersCount = 0;
  for (const id of baseOrderIds) {
    if (!liveOrderIds.has(id)) removedOrdersCount++;
  }

  return {
    hasDrift: true,
    baseVersion,
    currentLiveVersion,
    deltaSummary: {
      addedOrdersCount,
      removedOrdersCount,
      addedPortionsCount: addedLines.length,
      removedPortionsCount: removedLines.length,
      alteredDietarySafetyCount,
    },
    addedLines,
    removedLines,
    modifiedLines,
  };
}
