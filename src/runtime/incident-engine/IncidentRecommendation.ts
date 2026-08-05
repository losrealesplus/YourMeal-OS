/**
 * Recommendation helpers for incidents.
 */

import type { RuntimeIncident } from "./incident.types";

export function withRecommendation(
  incident: RuntimeIncident,
  recommendation: string,
): RuntimeIncident {
  const trimmed = recommendation.trim();
  if (!trimmed) return incident;
  if (incident.recommendation?.includes(trimmed)) return incident;
  return {
    ...incident,
    recommendation: incident.recommendation
      ? `${incident.recommendation}\n${trimmed}`
      : trimmed,
  };
}
