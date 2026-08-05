/**
 * Priority ordering — Critical → High → Medium → Low.
 */

import type { RecommendationPriority } from "./recommendation.types";
import type { RuntimeSeverity } from "../runtime-core";

export const RECOMMENDATION_PRIORITY_ORDER: readonly RecommendationPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
] as const;

export function priorityRank(p: RecommendationPriority): number {
  return RECOMMENDATION_PRIORITY_ORDER.indexOf(p);
}

/** Map Knowledge / Incident severity → recommendation priority. */
export function priorityFromSeverity(
  severity: RuntimeSeverity,
): RecommendationPriority {
  switch (severity) {
    case "critical":
      return "critical";
    case "error":
      return "high";
    case "warning":
      return "medium";
    case "info":
    default:
      return "low";
  }
}

export function maxPriority(
  a: RecommendationPriority,
  b: RecommendationPriority,
): RecommendationPriority {
  return priorityRank(a) <= priorityRank(b) ? a : b;
}
