/**
 * Recovery policy — which recommendations may run recovery.
 * Owns Capability.recover() resolution (Recommendation never imports Capability).
 */

import { getCapability, registerBuiltinCapabilities } from "../capability-engine";
import type { RuntimeRecommendation } from "../recommendation-engine";

/** Prefer first capability on the recommendation that implements recover(). */
export function resolveRecoverableCapabilityId(
  recommendation: RuntimeRecommendation,
): string | null {
  registerBuiltinCapabilities();
  for (const id of recommendation.capabilityIds ?? []) {
    const cap = getCapability(id);
    if (cap?.recover) return id;
  }
  return null;
}

/** True when Recovery Engine can orchestrate recover() for this recommendation. */
export function recommendationSupportsRecovery(
  recommendation: RuntimeRecommendation,
): boolean {
  return resolveRecoverableCapabilityId(recommendation) !== null;
}
