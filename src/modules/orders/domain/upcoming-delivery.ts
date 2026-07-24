/**
 * EP-002A.1 — Upcoming delivery view model (Customer Home).
 * Selection logic lives in UpcomingDeliveryService — not in UI.
 */

import type { OperationalOrderStatus } from "@/modules/operations/domain/operational-status";

/** Customer-facing phase for Home card (maps from DB status). */
export type UpcomingDeliveryPhase =
  | "none"
  | "scheduled"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered";

export type UpcomingDeliveryAction =
  | "program"
  | "view"
  | "modify"
  | "track"
  | "summary"
  | "repeat";

export type UpcomingDeliveryAddress = {
  label: string | null;
  line: string;
  city: string | null;
};

export type UpcomingDelivery = {
  orderId: string;
  status: OperationalOrderStatus;
  phase: UpcomingDeliveryPhase;
  /** ISO date (YYYY-MM-DD) of the next delivery day. */
  deliveryDate: string;
  /** Real window only — never invent times. */
  timeWindowLabel: string | null;
  address: UpcomingDeliveryAddress | null;
  itemCount: number;
  total: number;
  currency: string;
  actions: UpcomingDeliveryAction[];
};

export type UpcomingDeliveryResult =
  | { kind: "none" }
  | { kind: "upcoming"; delivery: UpcomingDelivery };

/** Statuses that can appear as "próxima entrega". */
export const UPCOMING_ELIGIBLE_STATUSES: ReadonlySet<string> = new Set([
  "draft",
  "confirmed",
  "in_production",
  "prepared",
  "ready_for_delivery",
  "out_for_delivery",
  "delivery_issue",
]);

export function phaseFromStatus(
  status: string,
): UpcomingDeliveryPhase | null {
  switch (status) {
    case "draft":
      return "scheduled";
    case "confirmed":
      return "confirmed";
    case "in_production":
    case "prepared":
      return "preparing";
    case "ready_for_delivery":
      return "ready";
    case "out_for_delivery":
    case "delivery_issue":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "cancelled":
      return null;
    default:
      return null;
  }
}

export function actionsForPhase(
  phase: UpcomingDeliveryPhase,
): UpcomingDeliveryAction[] {
  switch (phase) {
    case "none":
      return ["program"];
    case "scheduled":
      return ["view", "modify"];
    case "confirmed":
      return ["view", "modify"];
    case "preparing":
    case "ready":
      return ["view"];
    case "out_for_delivery":
      return ["track"];
    case "delivered":
      return ["summary", "repeat"];
    default:
      return ["view"];
  }
}

export type UpcomingCandidate = {
  id: string;
  status: string;
  weekStart: string;
  total: number;
  /** Earliest order_items.day_date or week_start. */
  deliveryDate: string;
  itemCount: number;
  address: UpcomingDeliveryAddress | null;
  timeWindowLabel: string | null;
};

/**
 * Pick the single next delivery: earliest deliveryDate among eligible statuses.
 * Cancelled and delivered are excluded (delivered → look for next pending).
 */
export function selectUpcomingDelivery(
  candidates: UpcomingCandidate[],
): UpcomingDeliveryResult {
  const eligible = candidates.filter((c) =>
    UPCOMING_ELIGIBLE_STATUSES.has(c.status),
  );
  if (eligible.length === 0) return { kind: "none" };

  eligible.sort((a, b) => {
    if (a.deliveryDate !== b.deliveryDate) {
      return a.deliveryDate.localeCompare(b.deliveryDate);
    }
    return a.id.localeCompare(b.id);
  });

  const pick = eligible[0]!;
  const phase = phaseFromStatus(pick.status);
  if (!phase || phase === "delivered") return { kind: "none" };

  return {
    kind: "upcoming",
    delivery: {
      orderId: pick.id,
      status: pick.status as OperationalOrderStatus,
      phase,
      deliveryDate: pick.deliveryDate,
      timeWindowLabel: pick.timeWindowLabel,
      address: pick.address,
      itemCount: pick.itemCount,
      total: pick.total,
      currency: "EUR",
      actions: actionsForPhase(phase),
    },
  };
}
