/**
 * DE004 — Delivery Responsibility view model (Experience only).
 *
 * Understand who is responsible · which are unassigned · what is unavailable.
 * Never invent durable AssignDelivery. Never simulate a driver.
 * Session responsibility notes (DE003) are labeled session — not assignment.
 */

import type { AdaptedDeliveryDayCard } from "@/delivery-experience/adapt-delivery";
import type { DeliveryDayCard } from "@/delivery-experience/today-delivery";

export type ResponsibilityState =
  | "assigned"
  | "unassigned"
  | "assignment_unavailable"
  | "completed"
  | "unknown";

export type ResponsibilityFilter =
  | "all"
  | "assigned"
  | "unassigned"
  | "unavailable"
  | "completed"
  | "remaining";

export type ResponsibilityCard = DeliveryDayCard & {
  responsibilityState: ResponsibilityState;
  /** Session note from DE003 — never presented as durable driver */
  sessionResponsibilityNote: string | null;
  dayPriority?: AdaptedDeliveryDayCard["dayPriority"];
  deliveryAdapted?: boolean;
};

export type ResponsibilityDayView = {
  dayDate: string;
  dayLabel: string;
  cards: ResponsibilityCard[];
  totals: {
    total: number;
    assigned: number;
    unassigned: number;
    assignmentUnavailable: number;
    completed: number;
    remaining: number;
    warnings: number;
  };
  /** Facades: AssignDelivery supported? Today: false */
  assignmentSupported: boolean;
  /**
   * True only when assignment substrate exists AND every remaining
   * delivery has an assigned responsible person.
   */
  allResponsibilitiesAccountedFor: boolean;
  /**
   * Honesty when we cannot conclude "all accounted for"
   * because assignment substrate is missing.
   */
  responsibilityStatusSummary: string;
  nextActionHint: string;
  routePreparationEligible: boolean;
  emptyReason: string | null;
};

export function responsibilityStateLabel(s: ResponsibilityState): string {
  switch (s) {
    case "assigned":
      return "Assigned";
    case "unassigned":
      return "Unassigned";
    case "assignment_unavailable":
      return "Assignment unavailable";
    case "completed":
      return "Completed";
    case "unknown":
      return "Unknown";
  }
}

function isCompletedCard(card: DeliveryDayCard): boolean {
  return (
    card.readiness === "completed" ||
    card.deliveryStatus === "Confirmed" ||
    card.deliveryStatus === "Delivered"
  );
}

/**
 * Derive responsibility state from substrate — never invent drivers.
 */
export function deriveResponsibilityState(
  card: DeliveryDayCard,
  assignmentSupported: boolean,
): ResponsibilityState {
  if (isCompletedCard(card)) return "completed";

  if (!assignmentSupported) {
    return "assignment_unavailable";
  }

  if (card.driverLabel?.trim()) return "assigned";

  // Substrate can assign but no responsible person recorded
  if (card.deliveryStatus === "Assigned" && !card.driverLabel?.trim()) {
    // Status alone without actor is not enough — treat as unassigned honesty
    return "unassigned";
  }

  if (
    card.deliveryStatus === "Planned" ||
    card.deliveryStatus === "InTransit" ||
    card.readiness === "unassigned"
  ) {
    return "unassigned";
  }

  return "unknown";
}

export function toResponsibilityCard(
  card: DeliveryDayCard | AdaptedDeliveryDayCard,
  assignmentSupported: boolean,
): ResponsibilityCard {
  const adapted = card as AdaptedDeliveryDayCard;
  return {
    ...card,
    responsibilityState: deriveResponsibilityState(card, assignmentSupported),
    sessionResponsibilityNote: adapted.responsibilityNote?.trim() || null,
    dayPriority: adapted.dayPriority ?? null,
    deliveryAdapted: adapted.deliveryAdapted ?? false,
  };
}

export function buildResponsibilityDayView(input: {
  dayDate: string;
  dayLabel: string;
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>;
  assignmentSupported: boolean;
  emptyReason: string | null;
}): ResponsibilityDayView {
  const { dayDate, dayLabel, assignmentSupported, emptyReason } = input;
  const cards = input.cards
    .map((c) => toResponsibilityCard(c, assignmentSupported))
    .sort(
      (a, b) =>
        stateRank(a.responsibilityState) - stateRank(b.responsibilityState) ||
        (a.customerLabel ?? a.orderRef).localeCompare(
          b.customerLabel ?? b.orderRef,
        ),
    );

  const totals = {
    total: cards.length,
    assigned: cards.filter((c) => c.responsibilityState === "assigned").length,
    unassigned: cards.filter((c) => c.responsibilityState === "unassigned")
      .length,
    assignmentUnavailable: cards.filter(
      (c) => c.responsibilityState === "assignment_unavailable",
    ).length,
    completed: cards.filter((c) => c.responsibilityState === "completed")
      .length,
    remaining: cards.filter((c) => c.responsibilityState !== "completed")
      .length,
    warnings: cards.reduce(
      (n, c) =>
        n + c.warnings.filter((w) => w.severity !== "info").length,
      0,
    ),
  };

  const remainingCards = cards.filter(
    (c) => c.responsibilityState !== "completed",
  );
  const accounted =
    assignmentSupported &&
    remainingCards.length > 0 &&
    remainingCards.every((c) => c.responsibilityState === "assigned");

  let responsibilityStatusSummary: string;
  let nextActionHint: string;
  let routePreparationEligible = false;

  if (cards.length === 0) {
    responsibilityStatusSummary = "Responsibility status unavailable";
    nextActionHint =
      "Abre Today's Deliveries · revisa Orders / Kitchen hasta que haya entregas.";
  } else if (!assignmentSupported) {
    responsibilityStatusSummary =
      "Responsibility status unavailable for durable assignment · Driver assignment not available in this substrate";
    nextActionHint =
      "Comprende la jornada y avisos · AssignDelivery → Future (no simular conductor) · Route Preparation puede abrir con esta honestidad.";
    // Operator can still proceed to prepare the day conceptually, but not claim assigned readiness
    routePreparationEligible = totals.remaining > 0;
  } else if (accounted) {
    responsibilityStatusSummary =
      "All delivery responsibilities are accounted for";
    nextActionHint = "Continuar a Route Preparation (siguiente Experience).";
    routePreparationEligible = true;
  } else if (totals.unassigned > 0) {
    responsibilityStatusSummary = `${totals.unassigned} delivery(ies) unassigned`;
    nextActionHint = "Asignar responsabilidad en las entregas sin dueño.";
    routePreparationEligible = false;
  } else {
    responsibilityStatusSummary = "Responsibility status partially known";
    nextActionHint = "Revisa estados Unknown / avisos antes de Route Preparation.";
    routePreparationEligible = false;
  }

  return {
    dayDate,
    dayLabel,
    cards,
    totals: {
      total: totals.total,
      assigned: totals.assigned,
      unassigned: totals.unassigned,
      assignmentUnavailable: totals.assignmentUnavailable,
      completed: totals.completed,
      remaining: totals.remaining,
      warnings: totals.warnings,
    },
    assignmentSupported,
    allResponsibilitiesAccountedFor: accounted,
    responsibilityStatusSummary,
    nextActionHint,
    routePreparationEligible,
    emptyReason,
  };
}

function stateRank(s: ResponsibilityState): number {
  switch (s) {
    case "unassigned":
      return 0;
    case "assignment_unavailable":
      return 1;
    case "unknown":
      return 2;
    case "assigned":
      return 3;
    case "completed":
      return 4;
  }
}

export function filterResponsibilityCards(
  cards: ResponsibilityCard[],
  filter: ResponsibilityFilter,
): ResponsibilityCard[] {
  switch (filter) {
    case "assigned":
      return cards.filter((c) => c.responsibilityState === "assigned");
    case "unassigned":
      return cards.filter((c) => c.responsibilityState === "unassigned");
    case "unavailable":
      return cards.filter(
        (c) => c.responsibilityState === "assignment_unavailable",
      );
    case "completed":
      return cards.filter((c) => c.responsibilityState === "completed");
    case "remaining":
      return cards.filter((c) => c.responsibilityState !== "completed");
    default:
      return cards;
  }
}
