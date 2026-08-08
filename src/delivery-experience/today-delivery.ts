/**
 * DE001 — Today's Delivery Day (Experience only).
 *
 * Delivery receives completed operational work and prepares controlled transfer.
 * Delivery does not create the commitment. Delivery does not invent routes,
 * maps, navigation, durable driver assignment, or confirmation UX here.
 */

import { dayLabel, utcDateOnly } from "@/menu-experience/week-plan";
import type {
  DeliveryAssignment,
  DeliveryContext,
  DeliveryStatus,
} from "@/delivery/DeliveryContext";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";

export type DeliveryReadiness =
  | "ready"
  | "ready_with_warnings"
  | "incomplete"
  | "unassigned"
  | "completed"
  | "unknown";

export type DeliveryDayFilter =
  | "all"
  | "ready"
  | "warnings"
  | "incomplete"
  | "remaining"
  | "completed";

export type DeliveryDayWarning = {
  id: string;
  code: string;
  severity: "warn" | "error" | "info";
  /** What is wrong */
  message: string;
  /** Why it matters */
  why: string;
  /** What the operator can do next */
  nextAction: string;
  nextHref?:
    | "order-capture"
    | "kitchen-today"
    | "production-handoff"
    | "customer-workspace"
    | "delivery-workspace";
};

export type DeliveryDayCard = {
  id: string;
  commitmentRef: string;
  customerLabel: string | null;
  orderRef: string;
  addressLabel: string | null;
  zoneLabel: string | null;
  contactLabel: string | null;
  windowLabel: string | null;
  packageSummary: string | null;
  dietaryInfo: string | null;
  specialInstructions: string | null;
  deliveryStatus: DeliveryStatus;
  readiness: DeliveryReadiness;
  /** Always null until AssignDelivery substrate exists */
  driverLabel: string | null;
  assignmentSupported: boolean;
  warnings: DeliveryDayWarning[];
};

export type TodaysDeliveryDay = {
  dayDate: string;
  dayLabel: string;
  cards: DeliveryDayCard[];
  warnings: DeliveryDayWarning[];
  totals: {
    total: number;
    ready: number;
    readyWithWarnings: number;
    incomplete: number;
    unassigned: number;
    completed: number;
    remaining: number;
  };
  /** Explicit honesty — AssignDelivery is UNIMPLEMENTED on Facade */
  assignmentAvailable: boolean;
  emptyReason: string | null;
  nextActionHint: string;
  loadError: string | null;
  dayReady: boolean;
};

const SUBSTRATE_ABSENT = "no disponible en este substrate";

export { SUBSTRATE_ABSENT as deliverySubstrateAbsentLabel };

export function deliveryReadinessLabel(r: DeliveryReadiness): string {
  switch (r) {
    case "ready":
      return "Ready";
    case "ready_with_warnings":
      return "Ready with warnings";
    case "incomplete":
      return "Incomplete";
    case "unassigned":
      return "Unassigned";
    case "completed":
      return "Completed";
    case "unknown":
      return "Unknown";
  }
}

export function deliveryStatusLabel(s: DeliveryStatus): string {
  switch (s) {
    case "Planned":
      return "Planned";
    case "Assigned":
      return "Assigned";
    case "InTransit":
      return "In transit";
    case "Delivered":
      return "Delivered";
    case "Confirmed":
      return "Confirmed";
  }
}

function isCompletedStatus(status: DeliveryStatus): boolean {
  return status === "Confirmed" || status === "Delivered";
}

function resolveAddress(
  details: OrderDetails | undefined,
): string | null {
  if (!details) return null;
  const slot = details.deliverySlots[0];
  if (!slot) return null;
  const loc = slot.deliveryLocation;
  if (loc.kind === "company_site") {
    return `Sitio · ${loc.siteId}`;
  }
  if (loc.kind === "customer_address") {
    return `Dirección · ${loc.addressId}`;
  }
  return null;
}

function resolveZone(details: OrderDetails | undefined): string | null {
  if (!details) return null;
  const slot = details.deliverySlots[0];
  if (!slot) return null;
  const loc = slot.deliveryLocation;
  if (loc.kind === "company_site" && loc.deliveryGroupId) {
    return `Grupo · ${loc.deliveryGroupId}`;
  }
  return null;
}

function resolveWindow(
  assignment: DeliveryAssignment,
  details: OrderDetails | undefined,
): string | null {
  if (assignment.windowStart || assignment.windowEnd) {
    return [assignment.windowStart, assignment.windowEnd]
      .filter(Boolean)
      .join(" – ");
  }
  const label = details?.deliverySlots[0]?.timeWindowLabel;
  return label?.trim() ? label : null;
}

function resolveDietary(details: OrderDetails | undefined): string | null {
  if (!details) return null;
  const allergens = details.constraints.allergens.filter(Boolean);
  if (allergens.length === 0) return null;
  return allergens.join(", ");
}

function resolveSpecial(details: OrderDetails | undefined): string | null {
  if (!details) return null;
  const mods = details.constraints.modifications.filter(Boolean);
  const lineNotes = details.lines.flatMap((l) => l.modifications ?? []);
  const all = [...mods, ...lineNotes].filter(Boolean);
  return all.length ? all.join(" · ") : null;
}

function resolvePackage(
  summary: OrderSummary | undefined,
  details: OrderDetails | undefined,
): string | null {
  if (details && details.lines.length > 0) {
    const parts = details.lines.map(
      (l) => `${l.quantity}× ${l.dishName}`,
    );
    return parts.slice(0, 4).join(", ") + (parts.length > 4 ? "…" : "");
  }
  if (summary && summary.itemCount > 0) {
    return `${summary.itemCount} ítem(s)`;
  }
  return null;
}

function buildCardWarnings(
  card: Omit<DeliveryDayCard, "warnings" | "readiness">,
  options: {
    assignmentSupported: boolean;
    /** True when Order details were loaded for this commitment */
    detailsLoaded: boolean;
  },
): { warnings: DeliveryDayWarning[]; readiness: DeliveryReadiness } {
  const warnings: DeliveryDayWarning[] = [];
  const { assignmentSupported, detailsLoaded } = options;

  if (isCompletedStatus(card.deliveryStatus)) {
    return { warnings, readiness: "completed" };
  }

  if (!card.customerLabel) {
    warnings.push({
      id: `${card.id}:missing-customer`,
      code: "missing_customer",
      severity: "error",
      message: "Falta información de cliente",
      why: "Sin cliente no se puede preparar la entrega con confianza.",
      nextAction: "Revisar Customer / Order del compromiso.",
      nextHref: "customer-workspace",
    });
  }

  if (!card.addressLabel) {
    warnings.push({
      id: `${card.id}:missing-address`,
      code: "missing_address",
      severity: detailsLoaded ? "error" : "warn",
      message: detailsLoaded
        ? "Dirección de entrega ausente o unresolved en Order"
        : "Dirección de entrega no disponible en este substrate",
      why: "El operador necesita saber dónde entregar antes de salir.",
      nextAction: "Revisar Order / dirección del cliente.",
      nextHref: "order-capture",
    });
  }

  if (!card.packageSummary) {
    warnings.push({
      id: `${card.id}:incomplete-order`,
      code: "incomplete_order",
      severity: "warn",
      message: "Resumen del pedido incompleto o ausente",
      why: "Sin paquete/ítems es difícil verificar qué debe salir.",
      nextAction: "Revisar Order.",
      nextHref: "order-capture",
    });
  }

  if (!card.windowLabel) {
    warnings.push({
      id: `${card.id}:missing-window`,
      code: "missing_delivery_info",
      severity: "info",
      message: "Ventana de entrega no disponible en este substrate",
      why: "Ayuda a priorizar la jornada; no bloquea la comprensión base.",
      nextAction:
        "Continuar con el resto de la jornada · Observation puede evidenciar necesidad.",
    });
  }

  if (assignmentSupported && !card.driverLabel) {
    warnings.push({
      id: `${card.id}:unassigned`,
      code: "unassigned",
      severity: "warn",
      message: "Entrega sin responsabilidad asignada",
      why: "Alguien debe salir con este compromiso.",
      nextAction: "Asignar responsabilidad cuando el substrate lo permita.",
    });
  }

  const hasBlocking = warnings.some((w) => w.severity === "error");
  const hasWarn = warnings.some((w) => w.severity === "warn");

  if (hasBlocking) {
    return { warnings, readiness: "incomplete" };
  }
  if (assignmentSupported && !card.driverLabel) {
    return { warnings, readiness: "unassigned" };
  }
  if (hasWarn) {
    return { warnings, readiness: "ready_with_warnings" };
  }
  return { warnings, readiness: "ready" };
}

export function mapAssignmentToCard(
  assignment: DeliveryAssignment,
  options: {
    summary?: OrderSummary;
    details?: OrderDetails;
    /** AssignDelivery supported? Facade today: false */
    assignmentSupported?: boolean;
  } = {},
): DeliveryDayCard {
  const assignmentSupported = options.assignmentSupported ?? false;
  const summary = options.summary;
  const details = options.details;

  const customerLabel =
    summary?.partyRef.displayName?.trim() ||
    assignment.destinationLabel?.trim() ||
    null;
  const contactLabel = null; // not on Delivery / Order summary substrate
  const addressLabel = resolveAddress(details);
  const zoneLabel = resolveZone(details);
  const windowLabel = resolveWindow(assignment, details);
  const packageSummary = resolvePackage(summary, details);
  const dietaryInfo = resolveDietary(details);
  const specialInstructions = resolveSpecial(details);

  const base = {
    id: assignment.id,
    commitmentRef: assignment.commitmentRef,
    customerLabel,
    orderRef: assignment.commitmentRef,
    addressLabel,
    zoneLabel,
    contactLabel,
    windowLabel,
    packageSummary,
    dietaryInfo,
    specialInstructions,
    deliveryStatus: assignment.status,
    driverLabel: null as string | null,
    assignmentSupported,
  };

  const { warnings, readiness } = buildCardWarnings(base, {
    assignmentSupported,
    detailsLoaded: Boolean(details),
  });
  return { ...base, warnings, readiness };
}

/**
 * Build Today's Delivery Day from Delivery Facade context (+ optional Order enrichment).
 * Pure — no Capability writes · no route invent · no fake assignment.
 */
export function buildTodaysDeliveryDay(input: {
  dayDate?: string;
  context: DeliveryContext | null;
  /** Completed assignments for the day when GetCompletedDeliveries succeeds */
  completedContext?: DeliveryContext | null;
  summariesById?: Record<string, OrderSummary>;
  detailsById?: Record<string, OrderDetails>;
  loadError?: string | null;
  /** Explicit: AssignDelivery UNIMPLEMENTED → false */
  assignmentSupported?: boolean;
}): TodaysDeliveryDay {
  const dayDate = input.dayDate ?? utcDateOnly();
  const assignmentSupported = input.assignmentSupported ?? false;
  const summariesById = input.summariesById ?? {};
  const detailsById = input.detailsById ?? {};
  const loadError = input.loadError ?? null;

  const readyAssignments = input.context?.assignments ?? [];
  const completedAssignments = input.completedContext?.assignments ?? [];

  const byId = new Map<string, DeliveryAssignment>();
  for (const a of readyAssignments) byId.set(a.id, a);
  for (const a of completedAssignments) {
    if (!byId.has(a.id)) byId.set(a.id, a);
  }

  const cards = [...byId.values()]
    .map((a) =>
      mapAssignmentToCard(a, {
        summary: summariesById[a.commitmentRef],
        details: detailsById[a.commitmentRef],
        assignmentSupported,
      }),
    )
    .sort(
      (a, b) =>
        readinessRank(a.readiness) - readinessRank(b.readiness) ||
        (a.customerLabel ?? a.orderRef).localeCompare(
          b.customerLabel ?? b.orderRef,
        ),
    );

  const dayWarnings: DeliveryDayWarning[] = [];
  if (!assignmentSupported && cards.some((c) => c.readiness !== "completed")) {
    dayWarnings.push({
      id: "day:assignment-unavailable",
      code: "assignment_unavailable",
      severity: "info",
      message: "Driver assignment not available in this substrate",
      why: "AssignDelivery no está implementado en Delivery Facade — no se simula conductor.",
      nextAction: "Comprender la jornada · Responsibility Experience → Future.",
    });
  }
  dayWarnings.push({
    id: "day:routes-future",
    code: "routes_future",
    severity: "info",
    message: "Rutas / mapas / navegación → Future",
    why: "DE001 establece la jornada antes de diseñar rutas.",
    nextAction: "Confirmar comprensión del día · Route Preparation → Experience posterior.",
  });

  for (const c of cards) {
    for (const w of c.warnings) {
      if (w.severity === "error" || w.severity === "warn") {
        dayWarnings.push(w);
      }
    }
  }

  const totals = {
    total: cards.length,
    ready: cards.filter((c) => c.readiness === "ready").length,
    readyWithWarnings: cards.filter(
      (c) => c.readiness === "ready_with_warnings",
    ).length,
    incomplete: cards.filter((c) => c.readiness === "incomplete").length,
    unassigned: cards.filter((c) => c.readiness === "unassigned").length,
    completed: cards.filter((c) => c.readiness === "completed").length,
    remaining: cards.filter((c) => c.readiness !== "completed").length,
  };

  let emptyReason: string | null = null;
  let nextActionHint =
    "Revisa avisos, abre entregas prioritarias y confirma que la jornada es comprensible.";

  if (loadError) {
    emptyReason = loadError;
    nextActionHint = "Reintentar carga o revisar permisos logistics.operate";
  } else if (cards.length === 0) {
    emptyReason =
      "No hay entregas listas para hoy. Delivery recibe trabajo ready_for_delivery (y entregas completadas del día cuando existan).";
    nextActionHint =
      "Revisar Kitchen · Orders · Production Handoff — el compromiso debe estar listo para salir.";
  }

  const dayReady =
    !loadError &&
    cards.length > 0 &&
    totals.incomplete === 0 &&
    totals.remaining > 0;

  return {
    dayDate,
    dayLabel: dayLabel(dayDate),
    cards,
    warnings: dedupeWarnings(dayWarnings),
    totals,
    assignmentAvailable: assignmentSupported,
    emptyReason,
    nextActionHint,
    loadError,
    dayReady,
  };
}

function readinessRank(r: DeliveryReadiness): number {
  switch (r) {
    case "incomplete":
      return 0;
    case "unassigned":
      return 1;
    case "ready_with_warnings":
      return 2;
    case "ready":
      return 3;
    case "unknown":
      return 4;
    case "completed":
      return 5;
  }
}

function dedupeWarnings(list: DeliveryDayWarning[]): DeliveryDayWarning[] {
  const byId = new Map<string, DeliveryDayWarning>();
  for (const w of list) {
    if (!byId.has(w.id)) byId.set(w.id, w);
  }
  return [...byId.values()];
}

export function filterDeliveryCards<T extends DeliveryDayCard>(
  cards: T[],
  filter: DeliveryDayFilter,
): T[] {
  switch (filter) {
    case "ready":
      return cards.filter(
        (c) => c.readiness === "ready" || c.readiness === "ready_with_warnings",
      );
    case "warnings":
      return cards.filter(
        (c) =>
          c.readiness === "ready_with_warnings" ||
          c.readiness === "incomplete" ||
          c.warnings.some((w) => w.severity !== "info"),
      );
    case "incomplete":
      return cards.filter((c) => c.readiness === "incomplete");
    case "remaining":
      return cards.filter((c) => c.readiness !== "completed");
    case "completed":
      return cards.filter((c) => c.readiness === "completed");
    default:
      return cards;
  }
}

export function absentOr(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? t : SUBSTRATE_ABSENT;
}
