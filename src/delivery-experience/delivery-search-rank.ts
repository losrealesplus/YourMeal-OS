/**
 * DE002 — Rank deliveries for live search (Experience only).
 *
 * Search deliveries — never Customer management, Order management,
 * route planning, navigation, or confirmation.
 * Operator language: customer · order · address · zone · window · status · driver · day.
 */

import {
  deliveryReadinessLabel,
  deliveryStatusLabel,
  type DeliveryDayCard,
} from "@/delivery-experience/today-delivery";

const RECENT_KEY = "ymos.de.recent_delivery.v1";

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

export function rememberDeliveryAccess(deliveryId: string): void {
  const next = [
    deliveryId,
    ...readRecent().filter((id) => id !== deliveryId),
  ].slice(0, 24);
  writeRecent(next);
}

export function clearDeliveryRecentForTests(): void {
  recentMemory = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(RECENT_KEY);
  }
}

export type DeliverySearchHit = DeliveryDayCard & {
  score: number;
  matchHints: string[];
};

function haystack(card: DeliveryDayCard, dayDate: string): string {
  return normalize(
    [
      card.customerLabel ?? "",
      card.orderRef,
      card.addressLabel ?? "",
      card.zoneLabel ?? "",
      card.windowLabel ?? "",
      card.packageSummary ?? "",
      card.dietaryInfo ?? "",
      card.specialInstructions ?? "",
      card.deliveryStatus,
      deliveryStatusLabel(card.deliveryStatus),
      card.readiness,
      deliveryReadinessLabel(card.readiness),
      card.driverLabel ?? "",
      dayDate,
      ...card.warnings.map((w) => w.message),
    ].join(" "),
  );
}

/**
 * Rank delivery cards for a live query.
 * Empty query → prioritized browse of the day workload.
 */
export function rankDeliveries(
  cards: DeliveryDayCard[],
  query: string,
  dayDate: string,
): DeliverySearchHit[] {
  const q = normalize(query.trim());
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
  const recent = readRecent();
  const recentRank = new Map(recent.map((id, i) => [id, i]));

  const scored: DeliverySearchHit[] = [];

  for (const card of cards) {
    const text = haystack(card, dayDate);
    const matchHints: string[] = [];
    let score = 0;

    if (tokens.length === 0) {
      score = 100;
    } else {
      let matched = 0;
      for (const t of tokens) {
        if (!text.includes(t)) continue;
        matched += 1;
        if (normalize(card.customerLabel ?? "").includes(t))
          matchHints.push("cliente");
        else if (normalize(card.orderRef).includes(t)) matchHints.push("order");
        else if (normalize(card.addressLabel ?? "").includes(t))
          matchHints.push("dirección");
        else if (normalize(card.zoneLabel ?? "").includes(t))
          matchHints.push("zona");
        else if (normalize(card.windowLabel ?? "").includes(t))
          matchHints.push("ventana");
        else if (
          normalize(card.deliveryStatus).includes(t) ||
          normalize(deliveryStatusLabel(card.deliveryStatus)).includes(t) ||
          normalize(card.readiness).includes(t) ||
          normalize(deliveryReadinessLabel(card.readiness)).includes(t)
        )
          matchHints.push("estado");
        else if (normalize(card.driverLabel ?? "").includes(t))
          matchHints.push("conductor");
        else if (normalize(dayDate).includes(t)) matchHints.push("día");
        else if (normalize(card.packageSummary ?? "").includes(t))
          matchHints.push("paquete");
        else matchHints.push("texto");
      }
      if (matched === 0) continue;
      score = 40 + matched * 25;
      const customer = normalize(card.customerLabel ?? "");
      if (tokens[0] && customer.startsWith(tokens[0])) score += 20;
    }

    // Prioritize: today's day context · ready · unresolved · incomplete · recent
    score += 50; // already scoped to day workload
    if (card.readiness === "ready") score += 30;
    if (card.readiness === "ready_with_warnings") score += 28;
    if (card.readiness === "incomplete" || card.readiness === "unassigned")
      score += 22;
    if (card.readiness !== "completed") score += 15;
    if (card.warnings.some((w) => w.severity === "error")) score += 8;
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
      (a.customerLabel ?? a.orderRef).localeCompare(
        b.customerLabel ?? b.orderRef,
      ),
  );
}

export function searchDeliveries(
  cards: DeliveryDayCard[],
  query: string,
  dayDate: string,
): DeliverySearchHit[] {
  return rankDeliveries(cards, query, dayDate);
}
