/**
 * OE002 — Experience-layer ranking for order search hits.
 * Operator language: people · days · situations — never IDs.
 */

import type { OrderStatus } from "@/order/OrderContext";

export type RankableOrderHit = {
  id: string;
  customerName: string;
  organizationLabel?: string | null;
  phone?: string | null;
  area?: string | null;
  deliveryDay: string | null;
  status: OrderStatus | "session_commitment";
  itemCount: number;
  hasInstructions: boolean;
  source: "facade" | "session";
  createdAt?: string | null;
  recentAccessBoost?: number;
};

function digits(s: string) {
  return s.replace(/\D/g, "");
}

const PENDING_DELIVERY: Array<OrderStatus | "session_commitment"> = [
  "confirmed",
  "in_production",
  "prepared",
  "ready_for_delivery",
  "out_for_delivery",
  "session_commitment",
];

export function scoreOrderHit(hit: RankableOrderHit, rawQuery: string): number {
  const q = rawQuery.trim().toLowerCase();
  let score = 0;

  if (!q) {
    score += hit.recentAccessBoost ?? 0;
    if (PENDING_DELIVERY.includes(hit.status)) score += 80;
    if (hit.source === "session") score += 40;
    if (hit.createdAt) {
      const age = Date.now() - Date.parse(hit.createdAt);
      if (!Number.isNaN(age) && age < 1000 * 60 * 60 * 24) score += 30;
    }
    return score;
  }

  const name = hit.customerName.toLowerCase();
  const org = (hit.organizationLabel ?? "").toLowerCase();
  const area = (hit.area ?? "").toLowerCase();
  const day = (hit.deliveryDay ?? "").toLowerCase();
  const status = String(hit.status).toLowerCase().replace(/_/g, " ");
  const phoneDigits = digits(hit.phone ?? "");
  const qDigits = digits(q);

  if (name === q) score += 500;
  else if (name.startsWith(q)) score += 320;
  else if (name.includes(q)) score += 180;

  if (org && org.includes(q)) score += 160;
  if (area && area.includes(q)) score += 140;
  if (day.includes(q)) score += 200;
  if (status.includes(q)) score += 90;
  if (qDigits.length >= 3 && phoneDigits.includes(qDigits)) score += 280;

  if (PENDING_DELIVERY.includes(hit.status)) score += 50;
  score += hit.recentAccessBoost ?? 0;

  return score;
}

export function rankOrderHits<T extends RankableOrderHit>(
  hits: T[],
  query: string,
): T[] {
  return [...hits].sort(
    (a, b) => scoreOrderHit(b, query) - scoreOrderHit(a, query),
  );
}

export function statusLabel(status: RankableOrderHit["status"]): string {
  const map: Record<string, string> = {
    draft: "Borrador",
    confirmed: "Confirmado",
    in_production: "En producción",
    prepared: "Preparado",
    ready_for_delivery: "Listo reparto",
    out_for_delivery: "En ruta",
    delivered: "Entregado",
    delivery_issue: "Incidencia",
    cancelled: "Cancelado",
    session_commitment: "Sesión",
  };
  return map[status] ?? status;
}

export function statusTone(
  status: RankableOrderHit["status"],
): "positive" | "warning" | "danger" | "neutral" | "info" {
  if (status === "delivered") return "positive";
  if (status === "cancelled" || status === "delivery_issue") return "danger";
  if (status === "session_commitment") return "warning";
  if (status === "draft") return "neutral";
  if (
    status === "confirmed" ||
    status === "in_production" ||
    status === "prepared" ||
    status === "ready_for_delivery" ||
    status === "out_for_delivery"
  ) {
    return "info";
  }
  return "neutral";
}
