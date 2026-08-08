/**
 * DE006 — Delivery Completion view model (Experience only).
 *
 * Understand completed / remaining / failed / next responsibility.
 * ConfirmDelivery exists on Delivery Facade — expose it; do not invent POD,
 * ReportDeliveryException, Billing, or fake customer acceptance.
 * Session unresolved notes are labeled session — never durable exceptions.
 */

import type { AdaptedDeliveryDayCard } from "@/delivery-experience/adapt-delivery";
import {
  deriveResponsibilityState,
  responsibilityStateLabel,
  type ResponsibilityState,
} from "@/delivery-experience/responsibility-view";
import { getPreparedRouteDay } from "@/delivery-experience/route-preparation";
import type { DeliveryDayCard } from "@/delivery-experience/today-delivery";

export type DeliveryCompletionState =
  | "completed"
  | "remaining"
  | "failed"
  | "blocked"
  | "unknown"
  | "completion_unavailable";

export type CompletionFilter =
  | "all"
  | "completed"
  | "remaining"
  | "failed"
  | "blocked"
  | "unknown"
  | "unassigned";

export type CompletionWarning = {
  id: string;
  code: string;
  severity: "warn" | "error" | "info";
  message: string;
  why: string;
  nextAction: string;
};

export type CompletionNextResponsibility =
  | "billing"
  | "customer_service"
  | "operations"
  | "continue_delivery_day"
  | "unavailable";

export type DeliveryCompletionCard = {
  deliveryId: string;
  customerLabel: string | null;
  orderRef: string;
  addressLabel: string | null;
  addressClarification: string | null;
  windowLabel: string | null;
  zoneLabel: string | null;
  packageSummary: string | null;
  specialInstructions: string | null;
  deliveryStatus: DeliveryDayCard["deliveryStatus"];
  responsibilityState: ResponsibilityState;
  driverLabel: string | null;
  routePosition: number | null;
  completionState: DeliveryCompletionState;
  /** True when confirmed via ConfirmDelivery in this browser session */
  completedInSession: boolean;
  /** Session unresolved note — never ReportDeliveryException invent */
  sessionUnresolvedNote: string | null;
  sessionUnresolvedKind: SessionUnresolvedKind | null;
  warnings: CompletionWarning[];
  nextResponsibility: CompletionNextResponsibility;
  nextResponsibilityLabel: string;
  billingOutcomeLabel: string;
};

export type SessionUnresolvedKind =
  | "customer_unavailable"
  | "address_issue"
  | "delivery_issue"
  | "operational_issue";

export type DeliveryCompletionDayView = {
  dayDate: string;
  dayLabel: string;
  confirmDeliverySupported: boolean;
  reportExceptionSupported: boolean;
  billingSupported: boolean;
  cards: DeliveryCompletionCard[];
  totals: {
    total: number;
    completed: number;
    remaining: number;
    failed: number;
    blocked: number;
    unknown: number;
    unassigned: number;
    warnings: number;
    completedInSession: number;
  };
  dayCompleteTrustworthy: boolean;
  statusSummary: string;
  nextActionHint: string;
  emptyReason: string | null;
  dayWarnings: CompletionWarning[];
};

const SESSION_KEY = "ymos.de.completion_session.v1";

type SessionCompletionStore = {
  confirmedIds: string[];
  unresolved: Record<
    string,
    { kind: SessionUnresolvedKind; note: string; updatedAt: string }
  >;
};

let memory: SessionCompletionStore = { confirmedIds: [], unresolved: {} };

function readSession(): SessionCompletionStore {
  if (typeof sessionStorage === "undefined") {
    return {
      confirmedIds: [...memory.confirmedIds],
      unresolved: { ...memory.unresolved },
    };
  }
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { confirmedIds: [...memory.confirmedIds], unresolved: { ...memory.unresolved } };
    const parsed = JSON.parse(raw) as SessionCompletionStore;
    return {
      confirmedIds: Array.isArray(parsed.confirmedIds)
        ? [...parsed.confirmedIds]
        : [],
      unresolved:
        parsed.unresolved && typeof parsed.unresolved === "object"
          ? { ...parsed.unresolved }
          : {},
    };
  } catch {
    return { confirmedIds: [...memory.confirmedIds], unresolved: { ...memory.unresolved } };
  }
}

function writeSession(store: SessionCompletionStore) {
  memory = {
    confirmedIds: [...store.confirmedIds],
    unresolved: { ...store.unresolved },
  };
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function clearDeliveryCompletionSessionForTests() {
  memory = { confirmedIds: [], unresolved: {} };
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function markConfirmedInSession(deliveryId: string) {
  const s = readSession();
  if (!s.confirmedIds.includes(deliveryId)) s.confirmedIds.push(deliveryId);
  delete s.unresolved[deliveryId];
  writeSession(s);
}

export function setSessionUnresolved(
  deliveryId: string,
  kind: SessionUnresolvedKind,
  note: string,
) {
  const s = readSession();
  const trimmed = note.trim();
  if (!trimmed) {
    delete s.unresolved[deliveryId];
  } else {
    s.unresolved[deliveryId] = {
      kind,
      note: trimmed,
      updatedAt: new Date().toISOString(),
    };
  }
  writeSession(s);
}

export function completionStateLabel(s: DeliveryCompletionState): string {
  switch (s) {
    case "completed":
      return "Completed";
    case "remaining":
      return "Remaining";
    case "failed":
      return "Failed";
    case "blocked":
      return "Blocked";
    case "unknown":
      return "Unknown";
    case "completion_unavailable":
      return "Completion unavailable";
  }
}

export function unresolvedKindLabel(k: SessionUnresolvedKind): string {
  switch (k) {
    case "customer_unavailable":
      return "Customer unavailable";
    case "address_issue":
      return "Address issue";
    case "delivery_issue":
      return "Delivery issue";
    case "operational_issue":
      return "Operational issue";
  }
}

function isSubstrateCompleted(card: DeliveryDayCard): boolean {
  return (
    card.readiness === "completed" ||
    card.deliveryStatus === "Confirmed" ||
    card.deliveryStatus === "Delivered"
  );
}

function nextResponsibilityFor(
  state: DeliveryCompletionState,
): { next: CompletionNextResponsibility; label: string } {
  if (state === "completed") {
    return {
      next: "unavailable",
      label:
        "Billing outcome unavailable in this substrate · no auto-handoff to Billing / CS / Operations",
    };
  }
  if (state === "failed" || state === "blocked") {
    return {
      next: "operations",
      label:
        "Atención operativa en Delivery day · ReportDeliveryException UNIMPLEMENTED (nota sesión si aplica)",
    };
  }
  if (state === "remaining") {
    return {
      next: "continue_delivery_day",
      label: "Continuar jornada · siguiente entrega en secuencia / Remaining",
    };
  }
  return {
    next: "unavailable",
    label: "Next responsibility unavailable in this substrate",
  };
}

function deriveCompletionState(
  card: DeliveryDayCard,
  session: SessionCompletionStore,
  confirmSupported: boolean,
): DeliveryCompletionState {
  if (isSubstrateCompleted(card) || session.confirmedIds.includes(card.id)) {
    return "completed";
  }
  const unresolved = session.unresolved[card.id];
  if (unresolved) {
    if (
      unresolved.kind === "customer_unavailable" ||
      unresolved.kind === "delivery_issue"
    ) {
      return "failed";
    }
    if (
      unresolved.kind === "address_issue" ||
      unresolved.kind === "operational_issue"
    ) {
      return "blocked";
    }
  }
  if (!confirmSupported) return "completion_unavailable";

  if (
    card.deliveryStatus === "Planned" ||
    card.deliveryStatus === "Assigned" ||
    card.deliveryStatus === "InTransit" ||
    card.readiness === "ready" ||
    card.readiness === "ready_with_warnings" ||
    card.readiness === "incomplete" ||
    card.readiness === "unassigned"
  ) {
    return "remaining";
  }
  return "unknown";
}

function cardWarnings(
  card: DeliveryDayCard | AdaptedDeliveryDayCard,
  state: DeliveryCompletionState,
  responsibility: ResponsibilityState,
  confirmSupported: boolean,
): CompletionWarning[] {
  const warnings: CompletionWarning[] = [];
  const adapted = card as AdaptedDeliveryDayCard;

  if (!confirmSupported && state !== "completed") {
    warnings.push({
      id: `${card.id}:confirm-gap`,
      code: "CONFIRM_UNAVAILABLE",
      severity: "info",
      message: "Delivery confirmation not available in this substrate",
      why: "Sin ConfirmDelivery no hay cierre durable confiable.",
      nextAction: "Documentar gap · no fingir confirmación",
    });
  }

  if (state === "failed" || state === "blocked") {
    warnings.push({
      id: `${card.id}:unresolved`,
      code: "UNRESOLVED",
      severity: "warn",
      message: "Entrega sin resolver (sesión o contexto)",
      why: "ReportDeliveryException permanece UNIMPLEMENTED — la nota no es incidente durable.",
      nextAction: "Revisar nota · continuar jornada · no inventar POD",
    });
  }

  if (responsibility === "assignment_unavailable") {
    warnings.push({
      id: `${card.id}:assign`,
      code: "ASSIGNMENT_UNAVAILABLE",
      severity: "info",
      message: "Driver assignment not available in this substrate",
      why: "AssignDelivery UNIMPLEMENTED — no fingir conductor.",
      nextAction: "Revisar Responsibility",
    });
  } else if (responsibility === "unassigned" && state === "remaining") {
    warnings.push({
      id: `${card.id}:unassigned`,
      code: "UNASSIGNED",
      severity: "warn",
      message: "Missing responsibility",
      why: "Cerrar sin dueño aumenta riesgo operativo.",
      nextAction: "Revisar Responsibility antes de confirmar",
    });
  }

  if (!card.addressLabel?.trim() && !adapted.addressClarification?.trim()) {
    warnings.push({
      id: `${card.id}:address`,
      code: "MISSING_ADDRESS",
      severity: "error",
      message: "Missing address",
      why: "Sin dirección, el outcome es dudoso.",
      nextAction: "Revisar Order / Customer · aclaración sesión en Adaptation",
    });
  }

  if (state === "remaining" && card.readiness === "incomplete") {
    warnings.push({
      id: `${card.id}:info`,
      code: "MISSING_INFO",
      severity: "warn",
      message: "Missing delivery information",
      why: "Faltan datos para cerrar con confianza.",
      nextAction: "Abrir entrega · completar contexto disponible",
    });
  }

  return warnings;
}

export function buildDeliveryCompletionDayView(input: {
  dayDate: string;
  dayLabel: string;
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>;
  assignmentSupported: boolean;
  /** Facade reality: ConfirmDelivery composed today */
  confirmDeliverySupported?: boolean;
  emptyReason: string | null;
}): DeliveryCompletionDayView {
  const confirmDeliverySupported = input.confirmDeliverySupported ?? true;
  const reportExceptionSupported = false;
  const billingSupported = false;
  const session = readSession();
  const route = getPreparedRouteDay(input.dayDate);
  const positionById = new Map<string, number>();
  if (route) {
    route.orderedIds.forEach((id, idx) => positionById.set(id, idx + 1));
  }

  const cards: DeliveryCompletionCard[] = input.cards.map((card) => {
    const adapted = card as AdaptedDeliveryDayCard;
    const responsibilityState = deriveResponsibilityState(
      card,
      input.assignmentSupported,
    );
    const completionState = deriveCompletionState(
      card,
      session,
      confirmDeliverySupported,
    );
    const unresolved = session.unresolved[card.id] ?? null;
    const { next, label } = nextResponsibilityFor(completionState);
    return {
      deliveryId: card.id,
      customerLabel: card.customerLabel,
      orderRef: card.orderRef,
      addressLabel: card.addressLabel,
      addressClarification: adapted.addressClarification?.trim() || null,
      windowLabel: card.windowLabel,
      zoneLabel: card.zoneLabel,
      packageSummary: card.packageSummary,
      specialInstructions: card.specialInstructions,
      deliveryStatus: card.deliveryStatus,
      responsibilityState,
      driverLabel: card.driverLabel,
      routePosition: positionById.get(card.id) ?? null,
      completionState,
      completedInSession: session.confirmedIds.includes(card.id),
      sessionUnresolvedNote: unresolved?.note ?? null,
      sessionUnresolvedKind: unresolved?.kind ?? null,
      warnings: cardWarnings(
        card,
        completionState,
        responsibilityState,
        confirmDeliverySupported,
      ),
      nextResponsibility: next,
      nextResponsibilityLabel: label,
      billingOutcomeLabel: billingSupported
        ? "Ready for Billing"
        : "Billing outcome unavailable in this substrate",
    };
  });

  cards.sort(
    (a, b) =>
      stateRank(a.completionState) - stateRank(b.completionState) ||
      (a.routePosition ?? 9999) - (b.routePosition ?? 9999) ||
      (a.customerLabel ?? a.orderRef).localeCompare(
        b.customerLabel ?? b.orderRef,
      ),
  );

  const totals = {
    total: cards.length,
    completed: cards.filter((c) => c.completionState === "completed").length,
    remaining: cards.filter((c) => c.completionState === "remaining").length,
    failed: cards.filter((c) => c.completionState === "failed").length,
    blocked: cards.filter((c) => c.completionState === "blocked").length,
    unknown: cards.filter(
      (c) =>
        c.completionState === "unknown" ||
        c.completionState === "completion_unavailable",
    ).length,
    unassigned: cards.filter(
      (c) =>
        c.responsibilityState === "unassigned" ||
        c.responsibilityState === "assignment_unavailable",
    ).length,
    warnings: cards.reduce(
      (n, c) => n + c.warnings.filter((w) => w.severity !== "info").length,
      0,
    ),
    completedInSession: cards.filter((c) => c.completedInSession).length,
  };

  const dayWarnings: CompletionWarning[] = [
    {
      id: "pod",
      code: "POD_FUTURE",
      severity: "info",
      message: "Proof of Delivery → Future (no simular aceptación del cliente)",
      why: "Photo/signature kinds no se inventan en Experience.",
      nextAction: "Usar ConfirmDelivery del Facade cuando proceda",
    },
    {
      id: "billing",
      code: "BILLING_UNAVAILABLE",
      severity: "info",
      message: "Billing outcome unavailable in this substrate",
      why: "Delivery no crea facturas ni pagos.",
      nextAction: "Billing Capability permanece separada",
    },
  ];
  if (!reportExceptionSupported) {
    dayWarnings.push({
      id: "exception",
      code: "EXCEPTION_UNIMPLEMENTED",
      severity: "info",
      message: "ReportDeliveryException UNIMPLEMENTED",
      why: "Issues sin resolver solo como nota de sesión si hace falta.",
      nextAction: "Etiquetar nota como sesión · no incidente durable",
    });
  }

  let statusSummary: string;
  let nextActionHint: string;
  let dayCompleteTrustworthy = false;

  if (cards.length === 0) {
    statusSummary = "Delivery completion status unavailable";
    nextActionHint =
      input.emptyReason ??
      "Revisa Today's Deliveries · Orders / Kitchen hasta que haya entregas.";
  } else if (
    totals.remaining === 0 &&
    totals.failed === 0 &&
    totals.blocked === 0 &&
    totals.unknown === 0 &&
    totals.completed === totals.total
  ) {
    dayCompleteTrustworthy = true;
    statusSummary = "Delivery day complete";
    nextActionHint =
      "Imprimir / exportar resumen · Billing/CS no aceptan responsabilidad automáticamente.";
  } else if (totals.remaining > 0 || totals.failed > 0 || totals.blocked > 0) {
    statusSummary = `${totals.completed} completed · ${totals.remaining} remaining · ${totals.failed + totals.blocked} unresolved`;
    nextActionHint =
      "Identificar Remaining / Failed · ConfirmDelivery cuando proceda · siguiente acción <10s.";
  } else {
    statusSummary = "Delivery completion status partially known";
    nextActionHint = "Revisar Unknown · no afirmar cierre del día.";
  }

  return {
    dayDate: input.dayDate,
    dayLabel: input.dayLabel,
    confirmDeliverySupported,
    reportExceptionSupported,
    billingSupported,
    cards,
    totals,
    dayCompleteTrustworthy,
    statusSummary,
    nextActionHint,
    emptyReason: cards.length === 0 ? input.emptyReason : null,
    dayWarnings,
  };
}

function stateRank(s: DeliveryCompletionState): number {
  switch (s) {
    case "failed":
      return 0;
    case "blocked":
      return 1;
    case "remaining":
      return 2;
    case "unknown":
    case "completion_unavailable":
      return 3;
    case "completed":
      return 4;
  }
}

export function filterCompletionCards(
  cards: DeliveryCompletionCard[],
  filter: CompletionFilter,
): DeliveryCompletionCard[] {
  switch (filter) {
    case "completed":
      return cards.filter((c) => c.completionState === "completed");
    case "remaining":
      return cards.filter((c) => c.completionState === "remaining");
    case "failed":
      return cards.filter((c) => c.completionState === "failed");
    case "blocked":
      return cards.filter((c) => c.completionState === "blocked");
    case "unknown":
      return cards.filter(
        (c) =>
          c.completionState === "unknown" ||
          c.completionState === "completion_unavailable",
      );
    case "unassigned":
      return cards.filter(
        (c) =>
          c.responsibilityState === "unassigned" ||
          c.responsibilityState === "assignment_unavailable",
      );
    default:
      return cards;
  }
}

export { responsibilityStateLabel };
