/**
 * Recovery policy — which recommendations may run recovery.
 */

import { getCapability } from "../capability-engine";
import type { RuntimeRecommendation } from "../recommendation-engine";

/** Prefer first capability on the recommendation that implements recover(). */
export function resolveRecoverableCapabilityId(
  recommendation: RuntimeRecommendation,
): string | null {
  for (const id of recommendation.capabilityIds ?? []) {
    const cap = getCapability(id);
    if (cap?.recover) return id;
  }
  return null;
}

export function recommendationSupportsRecovery(
  recommendation: RuntimeRecommendation,
): boolean {
  return recommendation.actions.some(
    (a) => a.type === "recovery" && a.supported,
  );
}
