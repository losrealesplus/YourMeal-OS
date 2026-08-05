/**
 * Recommendation Engine — build prioritized recommendations from Knowledge.
 * DEVELOPER-PLATFORM-008
 *
 * Reads: Knowledge · Incident · Evidence ids (via incidents).
 * Never imports Doctor · Host · UI.
 *
 * Path: Incident → Knowledge match → Recommendation (grouped by knowledge id).
 */

import { emitRuntimeCoreEvent } from "../runtime-core";
import {
  getOpenIncidents,
  type RuntimeIncident,
} from "../incident-engine";
import {
  matchIncident,
  registerFoundationKnowledge,
  getKnowledge,
  type KnowledgeMatch,
  type RuntimeKnowledge,
} from "../knowledge-engine";
import { buildRecommendationActions } from "./RecommendationActions";
import {
  formatRecommendationDescription,
  formatRecommendationTitle,
} from "./RecommendationFormatter";
import {
  clearRecommendationStore,
  listRecommendations,
  putRecommendations,
} from "./RecommendationRegistry";
import {
  resolveConfidence,
  resolvePriority,
} from "./RecommendationResolver";
import type { RuntimeRecommendation } from "./recommendation.types";
import { RECOMMENDATION_ENGINE_VERSION } from "./recommendation.types";

export type BuildRecommendationsOptions = {
  /** Override incident source (tests). */
  incidents?: RuntimeIncident[];
  /** Ensure foundation knowledge is registered. */
  ensureFoundation?: boolean;
};

type GroupBucket = {
  article: RuntimeKnowledge;
  incidentIds: string[];
  evidenceIds: string[];
  severities: RuntimeIncident["severity"][];
  matchScores: number[];
};

function groupByKnowledge(
  incidents: RuntimeIncident[],
): Map<string, GroupBucket> {
  const groups = new Map<string, GroupBucket>();

  for (const inc of incidents) {
    const matches: KnowledgeMatch[] = matchIncident({
      title: inc.title,
      description: inc.description,
      capability: inc.capability,
      category: inc.category,
      checkId: inc.checkId,
    });

    // Require Knowledge — never Incident → Recommendation directly.
    if (matches.length === 0) continue;

    const best = matches[0];
    const article =
      getKnowledge(best.article.id) ?? best.article;
    const existing = groups.get(article.id);
    if (existing) {
      if (!existing.incidentIds.includes(inc.id)) {
        existing.incidentIds.push(inc.id);
      }
      for (const eid of inc.evidenceIds) {
        if (!existing.evidenceIds.includes(eid)) {
          existing.evidenceIds.push(eid);
        }
      }
      existing.severities.push(inc.severity);
      existing.matchScores.push(best.score);
    } else {
      groups.set(article.id, {
        article,
        incidentIds: [inc.id],
        evidenceIds: [...inc.evidenceIds],
        severities: [inc.severity],
        matchScores: [best.score],
      });
    }
  }

  return groups;
}

function toRecommendation(bucket: GroupBucket): RuntimeRecommendation {
  const priority = resolvePriority({
    article: bucket.article,
    incidentSeverities: bucket.severities,
  });
  const confidence = resolveConfidence({
    matchScores: bucket.matchScores,
    incidentCount: bucket.incidentIds.length,
  });

  return {
    id: `rec-${bucket.article.id}`,
    title: formatRecommendationTitle(bucket.article),
    description: formatRecommendationDescription(
      bucket.article,
      bucket.incidentIds.length,
    ),
    priority,
    confidence,
    incidentIds: bucket.incidentIds,
    knowledgeIds: [bucket.article.id],
    evidenceIds: bucket.evidenceIds,
    actions: buildRecommendationActions(bucket.article),
  };
}

/**
 * Build recommendations from open incidents via Knowledge matcher.
 * Groups many incidents → one recommendation per knowledge article.
 */
export function buildRecommendations(
  options: BuildRecommendationsOptions = {},
): RuntimeRecommendation[] {
  if (options.ensureFoundation !== false) {
    registerFoundationKnowledge();
  }

  const incidents = options.incidents ?? getOpenIncidents();
  const groups = groupByKnowledge(incidents);
  const list = [...groups.values()].map(toRecommendation);

  putRecommendations(list);
  emitRuntimeCoreEvent("recommendations-built", {
    count: list.length,
    version: RECOMMENDATION_ENGINE_VERSION,
  });
  return getRecommendations();
}

export function getRecommendations(): RuntimeRecommendation[] {
  return listRecommendations();
}

export function clearRecommendations(): void {
  clearRecommendationStore();
  emitRuntimeCoreEvent("recommendations-cleared", {});
}

/** JSON export contract — array only (ZIP later). */
export function exportRecommendations(): RuntimeRecommendation[] {
  return getRecommendations();
}

export function getRecommendationEngineInfo(): {
  version: string;
  count: number;
} {
  return {
    version: RECOMMENDATION_ENGINE_VERSION,
    count: getRecommendations().length,
  };
}
