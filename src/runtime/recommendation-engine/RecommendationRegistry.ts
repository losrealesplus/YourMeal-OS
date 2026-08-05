/**
 * In-memory recommendation store (built snapshots).
 */

import type { RuntimeRecommendation } from "./recommendation.types";
import { priorityRank } from "./RecommendationPriority";

const store = new Map<string, RuntimeRecommendation>();

export function putRecommendations(list: RuntimeRecommendation[]): void {
  store.clear();
  for (const r of list) store.set(r.id, r);
}

export function listRecommendations(): RuntimeRecommendation[] {
  return [...store.values()].sort((a, b) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority);
    if (pr !== 0) return pr;
    return b.confidence - a.confidence;
  });
}

export function getRecommendation(
  id: string,
): RuntimeRecommendation | undefined {
  return store.get(id);
}

export function clearRecommendationStore(): void {
  store.clear();
}
