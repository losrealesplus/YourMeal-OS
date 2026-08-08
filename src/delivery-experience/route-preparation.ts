/**
 * DE005 — Route Preparation (Experience only).
 *
 * Turn prepared deliveries + responsibility context into a clear,
 * ordered, executable delivery-day plan.
 *
 * Route Preparation ≠ Route Optimization.
 * Manual sequence only · session persistence · never invent maps,
 * navigation, distance, traffic, AssignDelivery, or ConfirmDelivery.
 */

import type { AdaptedDeliveryDayCard } from "@/delivery-experience/adapt-delivery";
import {
  deriveResponsibilityState,
  responsibilityStateLabel,
  type ResponsibilityState,
} from "@/delivery-experience/responsibility-view";
import type { DeliveryDayCard } from "@/delivery-experience/today-delivery";

export type RoutePrepReadiness =
  | "ready"
  | "ready_with_warnings"
  | "incomplete"
  | "unassigned"
  | "route_preparation_unavailable"
  | "unknown";

export type RoutePrepWarning = {
  id: string;
  code: string;
  severity: "warn" | "error" | "info";
  message: string;
  why: string;
  nextAction: string;
};

export type RouteSequenceItem = {
  deliveryId: string;
  sequenceNumber: number;
  customerLabel: string | null;
  orderRef: string;
  addressLabel: string | null;
  /** Session clarification from DE003 — never Customer record */
  addressClarification: string | null;
  zoneLabel: string | null;
  windowLabel: string | null;
  packageSummary: string | null;
  specialInstructions: string | null;
  responsibilityState: ResponsibilityState;
  driverLabel: string | null;
  sessionResponsibilityNote: string | null;
  warnings: RoutePrepWarning[];
  inPreparedSequence: boolean;
};

export type RoutePrepImpact = {
  deliveryId: string;
  customerLabel: string;
  orderRef: string;
  previousPosition: number | null;
  newPosition: number | null;
  summary: string;
  changed: string[];
  unchanged: string[];
  persistence: "session";
  responsibilityUnchanged: true;
  orderUnchanged: true;
  customerUnchanged: true;
  productionUnchanged: true;
  kitchenUnchanged: true;
  notOptimization: true;
};

export type RoutePrepDayView = {
  dayDate: string;
  dayLabel: string;
  assignmentSupported: boolean;
  /** Explicit session plan — not durable Capability route */
  persistence: "session";
  confirmedAt: string | null;
  sequence: RouteSequenceItem[];
  pool: RouteSequenceItem[];
  totals: {
    total: number;
    ready: number;
    unassigned: number;
    incomplete: number;
    remaining: number;
    warnings: number;
    preparedSequence: number;
  };
  readiness: RoutePrepReadiness;
  readinessLabel: string;
  statusSummary: string;
  nextActionHint: string;
  dayWarnings: RoutePrepWarning[];
  emptyReason: string | null;
};

const ROUTE_KEY = "ymos.de.route_prep.v1";

type StoredRouteDay = {
  dayDate: string;
  orderedIds: string[];
  /** Intentionally out of prepared sequence (still in day) */
  excludedIds: string[];
  confirmedAt: string | null;
  persistence: "session";
};

let routeMemory: Record<string, StoredRouteDay> = {};

function readStore(): Record<string, StoredRouteDay> {
  if (typeof sessionStorage === "undefined") return { ...routeMemory };
  try {
    const raw = sessionStorage.getItem(ROUTE_KEY);
    if (!raw) return { ...routeMemory };
    const parsed = JSON.parse(raw) as Record<string, StoredRouteDay>;
    return parsed && typeof parsed === "object"
      ? { ...parsed }
      : { ...routeMemory };
  } catch {
    return { ...routeMemory };
  }
}

function writeStore(map: Record<string, StoredRouteDay>) {
  routeMemory = map;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ROUTE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

export function clearRoutePreparationForTests() {
  routeMemory = {};
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(ROUTE_KEY);
  }
}

export function getPreparedRouteDay(dayDate: string): StoredRouteDay | null {
  return readStore()[dayDate] ?? null;
}

function defaultOrder(
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): string[] {
  return [...cards]
    .filter((c) => c.readiness !== "completed")
    .sort(
      (a, b) =>
        ((a as AdaptedDeliveryDayCard).sequenceRank ?? 9999) -
          ((b as AdaptedDeliveryDayCard).sequenceRank ?? 9999) ||
        (a.customerLabel ?? a.orderRef).localeCompare(
          b.customerLabel ?? b.orderRef,
        ),
    )
    .map((c) => c.id);
}

function ensureDayOrder(
  dayDate: string,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): StoredRouteDay {
  const store = readStore();
  const existing = store[dayDate];
  const validIds = new Set(cards.map((c) => c.id));
  const completedIds = new Set(
    cards.filter((c) => c.readiness === "completed").map((c) => c.id),
  );

  if (!existing) {
    const created: StoredRouteDay = {
      dayDate,
      orderedIds: defaultOrder(cards),
      excludedIds: [],
      confirmedAt: null,
      persistence: "session",
    };
    store[dayDate] = created;
    writeStore(store);
    return created;
  }

  const excludedIds = (existing.excludedIds ?? []).filter(
    (id) => validIds.has(id) && !completedIds.has(id),
  );
  const excluded = new Set(excludedIds);
  const kept = existing.orderedIds.filter(
    (id) => validIds.has(id) && !completedIds.has(id) && !excluded.has(id),
  );
  // Only auto-append brand-new deliveries — never re-insert intentional removals
  const missing = defaultOrder(cards).filter(
    (id) => !kept.includes(id) && !excluded.has(id),
  );
  const next: StoredRouteDay = {
    ...existing,
    orderedIds: [...kept, ...missing],
    excludedIds,
    persistence: "session",
  };
  store[dayDate] = next;
  writeStore(store);
  return next;
}

function itemWarnings(
  card: DeliveryDayCard | AdaptedDeliveryDayCard,
  responsibilityState: ResponsibilityState,
  assignmentSupported: boolean,
): RoutePrepWarning[] {
  const warnings: RoutePrepWarning[] = [];
  const adapted = card as AdaptedDeliveryDayCard;

  if (!assignmentSupported || responsibilityState === "assignment_unavailable") {
    warnings.push({
      id: `${card.id}:assign-gap`,
      code: "ASSIGNMENT_UNAVAILABLE",
      severity: "info",
      message: "Driver assignment not available in this substrate",
      why: "AssignDelivery remains UNIMPLEMENTED — the plan must not imply a driver accepted it.",
      nextAction: "Preparar secuencia con honestidad · revisar gap de Delivery Capability",
    });
  } else if (responsibilityState === "unassigned") {
    warnings.push({
      id: `${card.id}:unassigned`,
      code: "UNASSIGNED",
      severity: "warn",
      message: "Entrega sin responsabilidad asignada",
      why: "Una secuencia sin dueño no está lista para ejecución confiable.",
      nextAction: "Revisar Responsibility · asignar cuando el substrate lo soporte",
    });
  }

  if (!card.addressLabel?.trim() && !adapted.addressClarification?.trim()) {
    warnings.push({
      id: `${card.id}:address`,
      code: "MISSING_ADDRESS",
      severity: "error",
      message: "Dirección ausente",
      why: "Sin dónde entregar, la secuencia no es ejecutable.",
      nextAction: "Revisar Order / Customer · aclaración operativa (sesión) en Adaptation",
    });
  }

  if (!card.windowLabel?.trim() && !adapted.windowNote?.trim()) {
    warnings.push({
      id: `${card.id}:window`,
      code: "MISSING_WINDOW",
      severity: "warn",
      message: "Ventana de entrega ausente",
      why: "Sin cuándo entregar, el conductor improvisa.",
      nextAction: "Revisar Order · nota de ventana (sesión) en Adaptation",
    });
  }

  if (card.readiness === "incomplete") {
    warnings.push({
      id: `${card.id}:incomplete`,
      code: "INCOMPLETE",
      severity: "warn",
      message: "Información de entrega incompleta",
      why: "Faltan datos operativos para preparar con confianza.",
      nextAction: "Abrir entrega · completar contexto disponible",
    });
  }

  for (const w of card.warnings) {
    if (w.severity === "info") continue;
    warnings.push({
      id: `${card.id}:card:${w.id}`,
      code: w.code,
      severity: w.severity,
      message: w.message,
      why: w.why,
      nextAction: w.nextAction,
    });
  }

  return warnings;
}

function toSequenceItem(
  card: DeliveryDayCard | AdaptedDeliveryDayCard,
  sequenceNumber: number | null,
  assignmentSupported: boolean,
  inPreparedSequence: boolean,
): RouteSequenceItem {
  const adapted = card as AdaptedDeliveryDayCard;
  const responsibilityState = deriveResponsibilityState(
    card,
    assignmentSupported,
  );
  return {
    deliveryId: card.id,
    sequenceNumber: sequenceNumber ?? 0,
    customerLabel: card.customerLabel,
    orderRef: card.orderRef,
    addressLabel: card.addressLabel,
    addressClarification: adapted.addressClarification?.trim() || null,
    zoneLabel: card.zoneLabel,
    windowLabel: card.windowLabel,
    packageSummary: card.packageSummary,
    specialInstructions: card.specialInstructions,
    responsibilityState,
    driverLabel: card.driverLabel,
    sessionResponsibilityNote: adapted.responsibilityNote?.trim() || null,
    warnings: itemWarnings(card, responsibilityState, assignmentSupported),
    inPreparedSequence,
  };
}

export function routePrepReadinessLabel(r: RoutePrepReadiness): string {
  switch (r) {
    case "ready":
      return "Ready";
    case "ready_with_warnings":
      return "Ready with warnings";
    case "incomplete":
      return "Incomplete";
    case "unassigned":
      return "Unassigned";
    case "route_preparation_unavailable":
      return "Route preparation unavailable";
    case "unknown":
      return "Unknown";
  }
}

function deriveDayReadiness(
  items: RouteSequenceItem[],
  assignmentSupported: boolean,
): {
  readiness: RoutePrepReadiness;
  statusSummary: string;
  nextActionHint: string;
} {
  if (items.length === 0) {
    return {
      readiness: "route_preparation_unavailable",
      statusSummary: "No deliveries available for route preparation",
      nextActionHint:
        "Revisa Today's Deliveries · Responsibility · Orders / Kitchen hasta que haya entregas.",
    };
  }

  const hasError = items.some((i) =>
    i.warnings.some((w) => w.severity === "error"),
  );
  const hasUnassigned =
    assignmentSupported &&
    items.some((i) => i.responsibilityState === "unassigned");
  const hasWarn = items.some((i) =>
    i.warnings.some((w) => w.severity === "warn"),
  );

  if (hasUnassigned) {
    return {
      readiness: "unassigned",
      statusSummary: "Hay entregas sin responsabilidad en la secuencia",
      nextActionHint: "Revisar Responsibility · no fingir conductor aceptado.",
    };
  }
  if (hasError) {
    return {
      readiness: "incomplete",
      statusSummary: "Secuencia incompleta — faltan datos críticos (p. ej. dirección)",
      nextActionHint: "Completar avisos error · luego confirmar preparación (sesión).",
    };
  }
  if (hasWarn || !assignmentSupported) {
    return {
      readiness: "ready_with_warnings",
      statusSummary: assignmentSupported
        ? "Secuencia preparable con avisos"
        : "Secuencia preparable · Driver assignment not available in this substrate",
      nextActionHint:
        "Reordenar si hace falta · confirmar preparación de sesión · Optimize/Navigate → Future.",
    };
  }
  return {
    readiness: "ready",
    statusSummary: "Secuencia lista para jornada ejecutable (sesión)",
    nextActionHint: "Confirmar preparación · imprimir / exportar plan del día.",
  };
}

export function buildRoutePrepDayView(input: {
  dayDate: string;
  dayLabel: string;
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>;
  assignmentSupported: boolean;
  emptyReason: string | null;
}): RoutePrepDayView {
  const { dayDate, dayLabel, assignmentSupported, emptyReason } = input;
  const activeCards = input.cards.filter((c) => c.readiness !== "completed");
  const byId = new Map(input.cards.map((c) => [c.id, c]));

  if (activeCards.length === 0) {
    return {
      dayDate,
      dayLabel,
      assignmentSupported,
      persistence: "session",
      confirmedAt: null,
      sequence: [],
      pool: [],
      totals: {
        total: input.cards.length,
        ready: 0,
        unassigned: 0,
        incomplete: 0,
        remaining: 0,
        warnings: 0,
        preparedSequence: 0,
      },
      readiness: "route_preparation_unavailable",
      readinessLabel: routePrepReadinessLabel("route_preparation_unavailable"),
      statusSummary: "No deliveries available for route preparation",
      nextActionHint:
        emptyReason ??
        "Revisa Today's Deliveries · incomplete · Responsibility · Production Handoff.",
      dayWarnings: [
        {
          id: "empty",
          code: "NO_DELIVERIES",
          severity: "info",
          message: "No hay entregas activas para preparar secuencia",
          why: "Sin entregas, no hay jornada ejecutable que ordenar.",
          nextAction:
            "Volver a Today's Deliveries · revisar Responsibility · Orders / Kitchen",
        },
      ],
      emptyReason:
        emptyReason ?? "No hay entregas activas para Route Preparation.",
    };
  }

  const stored = ensureDayOrder(dayDate, input.cards);
  const orderedIds = stored.orderedIds.filter((id) => byId.has(id));
  const inSeq = new Set(orderedIds);
  const sequence = orderedIds.map((id, idx) =>
    toSequenceItem(byId.get(id)!, idx + 1, assignmentSupported, true),
  );
  const pool = activeCards
    .filter((c) => !inSeq.has(c.id))
    .map((c) => toSequenceItem(c, null, assignmentSupported, false));

  const allItems = [...sequence, ...pool];
  const { readiness, statusSummary, nextActionHint } = deriveDayReadiness(
    sequence.length ? sequence : allItems,
    assignmentSupported,
  );

  const dayWarnings: RoutePrepWarning[] = [
    {
      id: "session-only",
      code: "SESSION_PLAN",
      severity: "info",
      message: "Route Preparation es plan de sesión — no optimización ni navegación",
      why: "Manual sequence ≠ automatic route optimization or navigation.",
      nextAction: "Observar si zona→conductor→ventana→prioridad aparece en campo",
    },
  ];
  if (!assignmentSupported) {
    dayWarnings.push({
      id: "assign-gap",
      code: "ASSIGNMENT_UNAVAILABLE",
      severity: "info",
      message: "Driver assignment not available in this substrate",
      why: "No inventar conductor ni aceptación de ruta.",
      nextAction: "Mantener honesty · Capability gap registrado",
    });
  }

  return {
    dayDate,
    dayLabel,
    assignmentSupported,
    persistence: "session",
    confirmedAt: stored.confirmedAt,
    sequence,
    pool,
    totals: {
      total: input.cards.length,
      ready: input.cards.filter(
        (c) =>
          c.readiness === "ready" || c.readiness === "ready_with_warnings",
      ).length,
      unassigned: sequence.filter((i) => i.responsibilityState === "unassigned")
        .length,
      incomplete: input.cards.filter((c) => c.readiness === "incomplete")
        .length,
      remaining: activeCards.length,
      warnings: sequence.reduce(
        (n, i) => n + i.warnings.filter((w) => w.severity !== "info").length,
        0,
      ),
      preparedSequence: sequence.length,
    },
    readiness,
    readinessLabel: routePrepReadinessLabel(readiness),
    statusSummary,
    nextActionHint,
    dayWarnings,
    emptyReason: null,
  };
}

function unchangedImpact(): Pick<
  RoutePrepImpact,
  | "unchanged"
  | "responsibilityUnchanged"
  | "orderUnchanged"
  | "customerUnchanged"
  | "productionUnchanged"
  | "kitchenUnchanged"
  | "notOptimization"
  | "persistence"
> {
  return {
    unchanged: [
      "Responsibility",
      "Order",
      "Customer",
      "Production",
      "Kitchen",
      "Address record",
      "No optimization / maps / navigation",
    ],
    responsibilityUnchanged: true,
    orderUnchanged: true,
    customerUnchanged: true,
    productionUnchanged: true,
    kitchenUnchanged: true,
    notOptimization: true,
    persistence: "session",
  };
}

export function previewReorder(
  dayDate: string,
  deliveryId: string,
  newIndexZeroBased: number,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): RoutePrepImpact | null {
  const card = cards.find((c) => c.id === deliveryId);
  if (!card) return null;
  const stored = ensureDayOrder(dayDate, cards);
  const ids = [...stored.orderedIds];
  const prev = ids.indexOf(deliveryId);
  if (prev < 0) {
    return {
      deliveryId,
      customerLabel: card.customerLabel ?? "Cliente ausente",
      orderRef: card.orderRef,
      previousPosition: null,
      newPosition: Math.min(Math.max(newIndexZeroBased, 0), ids.length) + 1,
      summary: "Insertar entrega en la secuencia preparada (sesión)",
      changed: ["Prepared sequence membership", "Sequence position"],
      ...unchangedImpact(),
    };
  }
  const clamped = Math.min(Math.max(newIndexZeroBased, 0), ids.length - 1);
  return {
    deliveryId,
    customerLabel: card.customerLabel ?? "Cliente ausente",
    orderRef: card.orderRef,
    previousPosition: prev + 1,
    newPosition: clamped + 1,
    summary: `Mover en secuencia: posición ${prev + 1} → ${clamped + 1} (sesión · no optimización)`,
    changed: ["Sequence position"],
    ...unchangedImpact(),
  };
}

export function applyReorder(
  dayDate: string,
  deliveryId: string,
  newIndexZeroBased: number,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): RoutePrepImpact | null {
  const impact = previewReorder(dayDate, deliveryId, newIndexZeroBased, cards);
  if (!impact) return null;
  const store = readStore();
  const stored = ensureDayOrder(dayDate, cards);
  const ids = [...stored.orderedIds];
  const prev = ids.indexOf(deliveryId);
  if (prev >= 0) ids.splice(prev, 1);
  const insertAt = Math.min(Math.max(newIndexZeroBased, 0), ids.length);
  ids.splice(insertAt, 0, deliveryId);
  store[dayDate] = {
    ...stored,
    orderedIds: ids,
    excludedIds: (stored.excludedIds ?? []).filter((id) => id !== deliveryId),
    confirmedAt: null,
    persistence: "session",
  };
  writeStore(store);
  return impact;
}

export function previewRemoveFromSequence(
  dayDate: string,
  deliveryId: string,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): RoutePrepImpact | null {
  const card = cards.find((c) => c.id === deliveryId);
  if (!card) return null;
  const stored = ensureDayOrder(dayDate, cards);
  const prev = stored.orderedIds.indexOf(deliveryId);
  return {
    deliveryId,
    customerLabel: card.customerLabel ?? "Cliente ausente",
    orderRef: card.orderRef,
    previousPosition: prev >= 0 ? prev + 1 : null,
    newPosition: null,
    summary: "Quitar de la secuencia preparada (sigue en jornada · sesión)",
    changed: ["Prepared sequence membership"],
    ...unchangedImpact(),
  };
}

export function applyRemoveFromSequence(
  dayDate: string,
  deliveryId: string,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): RoutePrepImpact | null {
  const impact = previewRemoveFromSequence(dayDate, deliveryId, cards);
  if (!impact) return null;
  const store = readStore();
  const stored = ensureDayOrder(dayDate, cards);
  const excludedIds = [
    ...(stored.excludedIds ?? []).filter((id) => id !== deliveryId),
    deliveryId,
  ];
  store[dayDate] = {
    ...stored,
    orderedIds: stored.orderedIds.filter((id) => id !== deliveryId),
    excludedIds,
    confirmedAt: null,
    persistence: "session",
  };
  writeStore(store);
  return impact;
}

export function applyMoveRelative(
  dayDate: string,
  deliveryId: string,
  delta: -1 | 1,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): RoutePrepImpact | null {
  const stored = ensureDayOrder(dayDate, cards);
  const prev = stored.orderedIds.indexOf(deliveryId);
  if (prev < 0) return null;
  return applyReorder(dayDate, deliveryId, prev + delta, cards);
}

export function confirmRoutePreparation(
  dayDate: string,
  cards: Array<DeliveryDayCard | AdaptedDeliveryDayCard>,
): { confirmedAt: string; persistence: "session"; summary: string } {
  const store = readStore();
  const stored = ensureDayOrder(dayDate, cards);
  const confirmedAt = new Date().toISOString();
  store[dayDate] = {
    ...stored,
    confirmedAt,
    persistence: "session",
  };
  writeStore(store);
  return {
    confirmedAt,
    persistence: "session",
    summary: `Preparación de jornada confirmada (sesión) · ${stored.orderedIds.length} paradas · no implica conductor aceptado · no navegación`,
  };
}

export { responsibilityStateLabel };
