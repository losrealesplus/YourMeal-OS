/**
 * CX002 — Experience-layer ranking for search hits (no Facade change).
 * Exact / prefix / recent-session boosts over raw Facade order.
 */

import type { CustomerSummary } from "@/customer/CustomerContext";

export type RankableHit = {
  summary: CustomerSummary;
  phone?: string | null;
  area?: string | null;
  companyLabel?: string | null;
};

function digits(s: string) {
  return s.replace(/\D/g, "");
}

function scoreHit(hit: RankableHit, rawQuery: string, recentIds: Set<string>): number {
  const q = rawQuery.trim().toLowerCase();
  if (!q) {
    return recentIds.has(`${hit.summary.partyKind}:${hit.summary.id}`) ? 1000 : 0;
  }

  let score = 0;
  const name = hit.summary.displayName.toLowerCase();
  const phone = (hit.phone ?? "").toLowerCase();
  const company = (hit.companyLabel ?? "").toLowerCase();
  const area = (hit.area ?? "").toLowerCase();
  const qDigits = digits(q);
  const phoneDigits = digits(phone);

  if (name === q) score += 500;
  else if (name.startsWith(q)) score += 300;
  else if (name.includes(q)) score += 150;

  if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) score += 280;
  if (company && company.includes(q)) score += 120;
  if (area && area.includes(q)) score += 80;

  if (recentIds.has(`${hit.summary.partyKind}:${hit.summary.id}`)) score += 40;

  return score;
}

export function rankSearchHits<T extends RankableHit>(
  hits: T[],
  query: string,
  recentIds: Iterable<string> = [],
): T[] {
  const recent = new Set(recentIds);
  return [...hits].sort(
    (a, b) => scoreHit(b, query, recent) - scoreHit(a, query, recent),
  );
}

export function customerTypeLabel(summary: CustomerSummary): string {
  if (summary.partyKind === "company_account") return "Empresa";
  if (summary.tags.some((t) => t.includes("company_employee"))) {
    return "Empleado";
  }
  return "Particular";
}

export function companyCodeFromTags(summary: CustomerSummary): string | null {
  const tag = summary.tags.find((t) => t.startsWith("code:"));
  return tag ? tag.replace("code:", "") : null;
}
