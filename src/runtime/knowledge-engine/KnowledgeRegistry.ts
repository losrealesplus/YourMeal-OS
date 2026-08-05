/**
 * Knowledge Registry — articles self-register; Engine never hard-codes domain.
 */

import type { RuntimeKnowledge } from "./knowledge.types";
import { normalizeTags } from "./KnowledgeTags";
import { emitRuntimeCoreEvent } from "../runtime-core";

const articles = new Map<string, RuntimeKnowledge>();

export function registerKnowledge(article: RuntimeKnowledge): void {
  if (!article?.id) {
    throw new Error("KnowledgeRegistry: article.id is required");
  }
  const normalized: RuntimeKnowledge = {
    ...article,
    tags: normalizeTags(article.tags ?? []),
    capabilities: [...new Set((article.capabilities ?? []).map((c) => c.trim()).filter(Boolean))],
    incidentPatterns: [...(article.incidentPatterns ?? [])],
    recommendations: [...(article.recommendations ?? [])],
    references: article.references ? [...article.references] : undefined,
  };
  articles.set(normalized.id, normalized);
  emitRuntimeCoreEvent("knowledge-registered", { id: normalized.id });
}

export function unregisterKnowledge(id: string): void {
  articles.delete(id);
}

export function getKnowledge(id: string): RuntimeKnowledge | undefined {
  return articles.get(id);
}

export function getAllKnowledge(): RuntimeKnowledge[] {
  return [...articles.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export function resetKnowledgeRegistry(): void {
  articles.clear();
}
