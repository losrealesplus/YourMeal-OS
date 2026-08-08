/**
 * KE002 — Rank Kitchen execution work for live search (Experience only).
 *
 * Search execution work — never Orders, Menus, or Production planning.
 * Operator language: dish · batch · deadline · status · prep · day.
 */

import { utcDateOnly } from "@/menu-experience/week-plan";
import {
  kitchenWorkStatusLabel,
  listExecutionCards,
  type KitchenExecutionCard,
} from "@/kitchen-experience/today-work";

const RECENT_KEY = "ymos.ke.recent_work.v1";

let recentMemory: string[] = [];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function readRecent(): string[] {
  if (typeof sessionStorage === "undefined") return [...recentMemory];
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (!raw) return [...recentMemory];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [...recentMemory];
  } catch {
    return [...recentMemory];
  }
}

function writeRecent(ids: string[]) {
  recentMemory = ids;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function rememberKitchenWorkAccess(workId: string): void {
  const next = [workId, ...readRecent().filter((id) => id !== workId)].slice(
    0,
    24,
  );
  writeRecent(next);
}

export function clearKitchenRecentForTests(): void {
  recentMemory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(RECENT_KEY);
  }
}

export type KitchenSearchHit = KitchenExecutionCard & {
  score: number;
  matchHints: string[];
};

function haystack(card: KitchenExecutionCard): string {
  return normalize(
    [
      card.dishLabel,
      card.batchKey,
      card.cookingDeadline,
      card.status,
      kitchenWorkStatusLabel(card.status),
      card.priority,
      card.requiredPreps,
      card.prepStatusSummary,
      card.productionDay,
      card.dayLabel,
      card.allergenHint ?? "",
      card.dietaryHint ?? "",
      card.operationalNotes,
    ].join(" "),
  );
}

/** Rank execution cards for a live query. Empty query → prioritized browse. */
export function rankExecutionWork(
  cards: KitchenExecutionCard[],
  query: string,
  today: string = utcDateOnly(),
): KitchenSearchHit[] {
  const q = normalize(query.trim());
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
  const recent = readRecent();
  const recentRank = new Map(recent.map((id, i) => [id, i]));

  const scored: KitchenSearchHit[] = [];

  for (const card of cards) {
    const text = haystack(card);
    const matchHints: string[] = [];
    let score = 0;

    if (tokens.length === 0) {
      score = 100;
    } else {
      let matched = 0;
      for (const t of tokens) {
        if (text.includes(t)) {
          matched += 1;
          if (normalize(card.dishLabel).includes(t)) matchHints.push("plato");
          else if (normalize(card.batchKey).includes(t)) matchHints.push("batch");
          else if (normalize(card.cookingDeadline).includes(t))
            matchHints.push("deadline");
          else if (
            normalize(card.status).includes(t) ||
            normalize(kitchenWorkStatusLabel(card.status)).includes(t)
          )
            matchHints.push("estado");
          else if (normalize(card.priority).includes(t))
            matchHints.push("prioridad");
          else if (
            normalize(card.requiredPreps).includes(t) ||
            normalize(card.prepStatusSummary).includes(t)
          )
            matchHints.push("prep");
          else if (
            normalize(card.productionDay).includes(t) ||
            normalize(card.dayLabel).includes(t)
          )
            matchHints.push("día");
          else matchHints.push("texto");
        }
      }
      if (matched === 0) continue;
      score = 40 + matched * 25;
      if (normalize(card.dishLabel).startsWith(tokens[0]!)) score += 20;
    }

    // Prioritize: today → urgent → pending → recent
    if (card.productionDay === today) score += 50;
    if (card.urgent) score += 30;
    if (card.status === "ready" || card.status === "in_progress") score += 15;
    if (card.status === "blocked") score += 10;
    if (card.priority === "high") score += 8;
    const r = recentRank.get(card.id);
    if (r !== undefined) score += Math.max(0, 20 - r);

    scored.push({
      ...card,
      score,
      matchHints: [...new Set(matchHints)],
    });
  }

  return scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.cookingDeadline.localeCompare(b.cookingDeadline) ||
      a.dishLabel.localeCompare(b.dishLabel),
  );
}

export function searchExecutionWork(
  query: string,
  today: string = utcDateOnly(),
): KitchenSearchHit[] {
  return rankExecutionWork(listExecutionCards(null, today), query, today);
}
