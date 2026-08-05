/**
 * Build actions from Knowledge — Recovery unsupported for now.
 */

import type { RuntimeKnowledge } from "../knowledge-engine";
import type { RuntimeRecommendationAction } from "./recommendation.types";

export function buildRecommendationActions(
  article: RuntimeKnowledge,
): RuntimeRecommendationAction[] {
  const actions: RuntimeRecommendationAction[] = [];

  article.recommendations.forEach((label, i) => {
    actions.push({
      id: `manual-${article.id}-${i}`,
      label,
      type: "manual",
      supported: true,
    });
  });

  if (article.references?.length) {
    actions.push({
      id: `docs-${article.id}`,
      label: `Open documentation · ${article.references[0]}`,
      type: "documentation",
      supported: true,
    });
  }

  actions.push({
    id: `knowledge-${article.id}`,
    label: "Open Knowledge",
    type: "documentation",
    supported: true,
  });

  actions.push({
    id: `incident-${article.id}`,
    label: "View Incident",
    type: "manual",
    supported: true,
  });

  actions.push({
    id: `recovery-${article.id}`,
    label: "Run Recovery",
    type: "recovery",
    supported: false,
  });

  return actions;
}
