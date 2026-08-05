/**
 * Format recommendation title / description from Knowledge.
 */

import type { RuntimeKnowledge } from "../knowledge-engine";

export function formatRecommendationTitle(article: RuntimeKnowledge): string {
  // Prefer actionable first recommendation line when short; else article title.
  const first = article.recommendations[0]?.trim();
  if (first && first.length <= 72) return first;
  return article.title.replace(/^[^·]+·\s*/, "").trim() || article.title;
}

export function formatRecommendationDescription(
  article: RuntimeKnowledge,
  incidentCount: number,
): string {
  const base = article.description;
  if (incidentCount <= 1) return base;
  return `${base} · Grouped from ${incidentCount} related incidents.`;
}
