/**
 * Build actions from Knowledge — recovery supported when a linked Capability has recover().
 */

import {
  getCapability,
  registerBuiltinCapabilities,
} from "../capability-engine";
import type { RuntimeKnowledge } from "../knowledge-engine";
import type { RuntimeRecommendationAction } from "./recommendation.types";

export function knowledgeHasRecoverableCapability(
  article: RuntimeKnowledge,
): boolean {
  registerBuiltinCapabilities();
  return article.capabilities.some((id) => {
    const cap = getCapability(id);
    return typeof cap?.recover === "function";
  });
}

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

  const recoverySupported = knowledgeHasRecoverableCapability(article);
  actions.push({
    id: `recovery-${article.id}`,
    label: recoverySupported ? "Run Recovery" : "Manual Action",
    type: "recovery",
    supported: recoverySupported,
  });

  return actions;
}
