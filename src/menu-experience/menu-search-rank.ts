/**
 * ME002 — Experience-layer ranking for menu planning search.
 *
 * Temporal hierarchy: Week → Day → Menu → Dishes.
 * Operator language: dish · day · week · status — never IDs.
 */

import {
  dayLabel,
  formatWeekLabel,
  mondayIso,
  type WeekPlanStatus,
} from "@/menu-experience/week-plan";

export type MenuSearchScope = "week" | "day" | "dish";

export type MenuSearchHit = {
  id: string;
  scope: MenuSearchScope;
  weekStart: string;
  dayDate: string | null;
  menuName: string;
  dishLabel: string | null;
  dishCount: number;
  status: WeekPlanStatus | "durable_draft" | "durable_published";
  publication: "draft" | "preview" | "published" | "session";
  allergenStatus: "known" | "partial" | "unknown";
  macroStatus: "known" | "partial" | "unknown";
  source: "session" | "durable";
  updatedAt: string | null;
  recentBoost?: number;
};

export function publicationLabel(p: MenuSearchHit["publication"]): string {
  switch (p) {
    case "published":
      return "Publicado";
    case "preview":
      return "Vista previa";
    case "session":
      return "Sesión";
    default:
      return "Borrador";
  }
}

export function publicationTone(
  p: MenuSearchHit["publication"],
): "positive" | "warning" | "info" | "neutral" {
  if (p === "published") return "positive";
  if (p === "session" || p === "preview") return "warning";
  return "info";
}

export function allergenLabel(s: MenuSearchHit["allergenStatus"]): string {
  if (s === "known") return "Alérgenos OK";
  if (s === "partial") return "Alérgenos parcial";
  return "Alérgenos sin datos";
}

export function macroLabel(s: MenuSearchHit["macroStatus"]): string {
  if (s === "known") return "Macros OK";
  if (s === "partial") return "Macros parcial";
  return "Macros sin datos";
}

export function hitGlance(hit: MenuSearchHit): string {
  const week = formatWeekLabel(hit.weekStart);
  const day = hit.dayDate ? ` · ${dayLabel(hit.dayDate)}` : "";
  const dish = hit.dishLabel ? ` · ${hit.dishLabel}` : "";
  return `${week}${day}${dish}`;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function scoreMenuHit(hit: MenuSearchHit, rawQuery: string): number {
  const q = normalize(rawQuery.trim());
  const current = mondayIso();
  let score = 0;

  // Temporal priority — planning-first
  if (hit.weekStart === current) score += 120;
  else if (hit.weekStart > current) score += 70;
  else score += 20;

  if (hit.publication === "published") score += 80;
  else if (hit.publication === "session") score += 40;
  else if (hit.publication === "preview") score += 35;

  if (hit.updatedAt) {
    const age = Date.now() - Date.parse(hit.updatedAt);
    if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24 * 7) score += 40;
    if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24) score += 30;
  }

  score += hit.recentBoost ?? 0;

  if (!q) {
    if (hit.scope === "week") score += 25;
    return score;
  }

  const week = normalize(hit.weekStart);
  const day = normalize(hit.dayDate ?? "");
  const dayEs = hit.dayDate ? normalize(dayLabel(hit.dayDate)) : "";
  const menu = normalize(hit.menuName);
  const dish = normalize(hit.dishLabel ?? "");
  const pub = normalize(publicationLabel(hit.publication));
  const status = normalize(String(hit.status));

  if (dish && dish === q) score += 520;
  else if (dish && dish.startsWith(q)) score += 340;
  else if (dish && dish.includes(q)) score += 220;

  if (dayEs && dayEs.startsWith(q)) score += 280;
  else if (dayEs && dayEs.includes(q)) score += 160;
  if (day.includes(q)) score += 200;

  if (week.includes(q)) score += 180;
  if (menu.includes(q)) score += 150;
  if (pub.includes(q) || status.includes(q)) score += 90;

  // Soft categories from dish words
  const categories = ["poke", "bowl", "ensalada", "wrap", "quinoa", "smoothie", "sopa"];
  for (const c of categories) {
    if (q.includes(c) && dish.includes(c)) score += 120;
  }

  if (hit.scope === "dish" && dish) score += 40;
  if (hit.scope === "day" && day) score += 20;

  return score;
}

export function rankMenuHits<T extends MenuSearchHit>(
  hits: T[],
  query: string,
): T[] {
  return [...hits].sort(
    (a, b) => scoreMenuHit(b, query) - scoreMenuHit(a, query),
  );
}
