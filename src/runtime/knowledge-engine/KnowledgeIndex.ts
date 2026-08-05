/**
 * KnowledgeIndex — inverted indexes for fast declarative search.
 */

import type { RuntimeKnowledge } from "./knowledge.types";
import { getAllKnowledge } from "./KnowledgeRegistry";
import { normalizeTag } from "./KnowledgeTags";

export type KnowledgeIndexSnapshot = {
  byTag: Map<string, string[]>;
  byCapability: Map<string, string[]>;
  byCategory: Map<string, string[]>;
};

function push(map: Map<string, string[]>, key: string, id: string): void {
  const k = normalizeTag(key);
  if (!k) return;
  const list = map.get(k) ?? [];
  if (!list.includes(id)) list.push(id);
  map.set(k, list);
}

/** Build indexes from current registry (call after foundation register). */
export function buildKnowledgeIndex(
  articles: RuntimeKnowledge[] = getAllKnowledge(),
): KnowledgeIndexSnapshot {
  const byTag = new Map<string, string[]>();
  const byCapability = new Map<string, string[]>();
  const byCategory = new Map<string, string[]>();
  for (const a of articles) {
    for (const t of a.tags) push(byTag, t, a.id);
    for (const c of a.capabilities) push(byCapability, c, a.id);
    push(byCategory, a.category, a.id);
  }
  return { byTag, byCapability, byCategory };
}

export function searchKnowledge(
  query: string,
  articles: RuntimeKnowledge[] = getAllKnowledge(),
): RuntimeKnowledge[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles.slice();

  const scored: Array<{ article: RuntimeKnowledge; score: number }> = [];
  for (const a of articles) {
    let score = 0;
    const title = a.title.toLowerCase();
    const desc = a.description.toLowerCase();
    const cat = a.category.toLowerCase();
    if (title === q) score += 10;
    else if (title.includes(q)) score += 6;
    if (a.id.toLowerCase().includes(q)) score += 5;
    if (cat.includes(q)) score += 4;
    if (desc.includes(q)) score += 3;
    for (const t of a.tags) {
      if (t === q) score += 5;
      else if (t.includes(q)) score += 2;
    }
    for (const c of a.capabilities) {
      const cl = c.toLowerCase();
      if (cl === q) score += 5;
      else if (cl.includes(q)) score += 2;
    }
    for (const p of a.incidentPatterns) {
      if (p.toLowerCase().includes(q)) score += 2;
    }
    if (score > 0) scored.push({ article: a, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .map((s) => s.article);
}
