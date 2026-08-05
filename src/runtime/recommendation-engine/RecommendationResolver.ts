/**
 * Resolve priority + confidence from Knowledge match + incident severities.
 */

import type { RuntimeKnowledge } from "../knowledge-engine";
import type { RuntimeSeverity } from "../runtime-core";
import {
  maxPriority,
  priorityFromSeverity,
} from "./RecommendationPriority";
import type { RecommendationPriority } from "./recommendation.types";

export function resolvePriority(input: {
  article: RuntimeKnowledge;
  incidentSeverities: RuntimeSeverity[];
}): RecommendationPriority {
  let p = priorityFromSeverity(input.article.severity);
  for (const s of input.incidentSeverities) {
    p = maxPriority(p, priorityFromSeverity(s));
  }
  return p;
}

export function resolveConfidence(input: {
  matchScores: number[];
  incidentCount: number;
}): number {
  const scores = input.matchScores.filter((n) => Number.isFinite(n));
  const base =
    scores.length === 0
      ? 0.5
      : scores.reduce((a, b) => a + b, 0) / scores.length;
  // Slight boost when multiple incidents corroborate the same knowledge.
  const boost = Math.min(0.15, Math.max(0, input.incidentCount - 1) * 0.05);
  return Math.min(1, Math.round((base + boost) * 100) / 100);
}
