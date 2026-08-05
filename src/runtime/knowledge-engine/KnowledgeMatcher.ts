/**
 * KnowledgeMatcher — declarative Incident / Capability → Knowledge[].
 * No AI. Pattern + capability + tag overlap only.
 */

import { getAllKnowledge, getKnowledge } from "./KnowledgeRegistry";
import type {
  KnowledgeMatch,
  KnowledgeMatchInput,
  RuntimeKnowledge,
} from "./knowledge.types";

function patternHits(pattern: string, text: string): boolean {
  const p = pattern.trim().toLowerCase();
  if (!p) return false;
  return text.toLowerCase().includes(p);
}

function blobFromInput(input: KnowledgeMatchInput): string {
  return [
    input.title,
    input.description,
    input.checkId,
    input.category,
    ...(input.tags ?? []),
  ]
    .filter(Boolean)
    .join(" \n ")
    .toLowerCase();
}

/**
 * Match an incident-shaped input to knowledge articles.
 * Score: pattern hits + capability overlap + category + tags.
 */
export function matchIncident(
  input: KnowledgeMatchInput,
  articles: RuntimeKnowledge[] = getAllKnowledge(),
): KnowledgeMatch[] {
  const blob = blobFromInput(input);
  const matches: KnowledgeMatch[] = [];

  for (const article of articles) {
    const matchedOn: string[] = [];
    let raw = 0;

    for (const pattern of article.incidentPatterns) {
      if (patternHits(pattern, blob)) {
        matchedOn.push(`pattern:${pattern}`);
        raw += 3;
      }
    }

    if (input.capability) {
      const cap = input.capability.toLowerCase();
      if (article.capabilities.some((c) => c.toLowerCase() === cap)) {
        matchedOn.push(`capability:${input.capability}`);
        raw += 2;
      }
    }

    if (input.category) {
      if (article.category.toLowerCase() === input.category.toLowerCase()) {
        matchedOn.push(`category:${input.category}`);
        raw += 1;
      }
    }

    if (input.checkId) {
      const check = input.checkId.toLowerCase();
      if (
        article.id.toLowerCase().includes(check) ||
        article.incidentPatterns.some((p) => check.includes(p.toLowerCase()))
      ) {
        matchedOn.push(`checkId:${input.checkId}`);
        raw += 2;
      }
    }

    for (const t of input.tags ?? []) {
      if (article.tags.includes(t.toLowerCase())) {
        matchedOn.push(`tag:${t}`);
        raw += 1;
      }
    }

    // Require at least one pattern OR capability/check signal — avoid flooding.
    const hasPattern = matchedOn.some((m) => m.startsWith("pattern:"));
    const hasCapOrCheck = matchedOn.some(
      (m) => m.startsWith("capability:") || m.startsWith("checkId:"),
    );
    if (!hasPattern && !hasCapOrCheck) continue;
    if (raw <= 0) continue;

    const score = Math.min(1, raw / 10);
    matches.push({ article, score, matchedOn });
  }

  return matches.sort(
    (a, b) =>
      b.score - a.score || a.article.title.localeCompare(b.article.title),
  );
}

export function matchCapability(
  capability: string,
  articles: RuntimeKnowledge[] = getAllKnowledge(),
): RuntimeKnowledge[] {
  const cap = capability.trim().toLowerCase();
  if (!cap) return [];
  return articles
    .filter((a) => a.capabilities.some((c) => c.toLowerCase() === cap))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Collect unique articles matching any of the inputs. */
export function matchManyIncidents(
  inputs: KnowledgeMatchInput[],
): KnowledgeMatch[] {
  const best = new Map<string, KnowledgeMatch>();
  for (const input of inputs) {
    for (const m of matchIncident(input)) {
      const prev = best.get(m.article.id);
      if (!prev || m.score > prev.score) best.set(m.article.id, m);
    }
  }
  return [...best.values()].sort(
    (a, b) =>
      b.score - a.score || a.article.title.localeCompare(b.article.title),
  );
}

export function resolveKnowledgeIds(ids: string[]): RuntimeKnowledge[] {
  return ids
    .map((id) => getKnowledge(id))
    .filter((a): a is RuntimeKnowledge => Boolean(a));
}
