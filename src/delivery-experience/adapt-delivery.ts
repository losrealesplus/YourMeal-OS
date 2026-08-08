/**
 * DE003 — Delivery Adaptation (Experience only).
 *
 * Adapt operational delivery-day context when reality changes.
 * Never mutate Order commitment, Customer, Menu, Production, Kitchen.
 * Never introduce route optimization, navigation, ConfirmDelivery, or durable assignment.
 * Session overlays only — explicitly marked.
 *
 * If the operator needs to reorder stops as a route → register gap for
 * Route Preparation (DE005). Do not implement route planning here.
 */

import {
  buildTodaysDeliveryDay,
  deliveryReadinessLabel,
  type DeliveryDayCard,
  type TodaysDeliveryDay,
} from "@/delivery-experience/today-delivery";
import type { DeliveryContext } from "@/delivery/DeliveryContext";
import type { OrderDetails, OrderSummary } from "@/order/OrderContext";

export type DeliveryAdaptationKind =
  | "sequence"
  | "priority"
  | "day_note"
  | "operational_instruction"
  | "address_clarification"
  | "window_note"
  | "temporary_issue"
  | "responsibility_note";

export type DeliveryEscalationTarget =
  | "customer_service"
  | "order"
  | "production"
  | "kitchen"
  | "supervisor"
  | "none";

export type DeliveryAdaptationOverlay = {
  deliveryId: string;
  /** Lower = earlier in today's delivery queue (not a route) */
  sequenceRank?: number;
  dayPriority?: "high" | "normal" | "low";
  dayNote?: string;
  operationalInstruction?: string;
  /** Session operational clarification — NOT Customer address record */
  addressClarification?: string;
  windowNote?: string;
  temporaryIssue?: string;
  responsibilityNote?: string;
  updatedAt: string;
};

export type DeliveryAdaptationImpact = {
  kind: DeliveryAdaptationKind;
  deliveryId: string;
  customerLabel: string;
  orderRef: string;
  summary: string;
  changed: string[];
  unchanged: string[];
  affectsDeliveryDay: boolean;
  escalationRequired: boolean;
  escalationReason: string | null;
  escalationTarget: DeliveryEscalationTarget;
  escalationNextAction: string | null;
  persistence: "session";
  orderCommitmentUnchanged: true;
  customerRecordUnchanged: true;
  /** Documented gap — never invent Capability */
  substrateGap: string | null;
  /** True when this is a registered Route Preparation need, not applied adaptation */
  routePreparationSignal: boolean;
};

export type DeliveryAdaptationDraft = {
  kind: DeliveryAdaptationKind;
  deliveryId: string;
  sequenceRank?: number;
  dayPriority?: "high" | "normal" | "low";
  dayNote?: string;
  operationalInstruction?: string;
  addressClarification?: string;
  windowNote?: string;
  temporaryIssue?: string;
  responsibilityNote?: string;
  /** Operator requests Order/Customer durable change → escalate, do not apply */
  requestOrderOrCustomerChange?: boolean;
  /**
   * Operator needs stop reorder as route — do NOT apply as adaptation.
   * Register Route Preparation signal.
   */
  requestRouteReorder?: boolean;
};

const ADAPT_KEY = "ymos.de.delivery_adapt.v1";

let adaptMemory: Record<string, DeliveryAdaptationOverlay> = {};

function readMap(): Record<string, DeliveryAdaptationOverlay> {
  if (typeof sessionStorage === "undefined") return { ...adaptMemory };
  try {
    const raw = sessionStorage.getItem(ADAPT_KEY);
    if (!raw) return { ...adaptMemory };
    const parsed = JSON.parse(raw) as Record<
      string,
      DeliveryAdaptationOverlay
    >;
    return parsed && typeof parsed === "object"
      ? { ...parsed }
      : { ...adaptMemory };
  } catch {
    return { ...adaptMemory };
  }
}

function writeMap(map: Record<string, DeliveryAdaptationOverlay>) {
  adaptMemory = map;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ADAPT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getDeliveryAdaptation(
  deliveryId: string,
): DeliveryAdaptationOverlay | null {
  return readMap()[deliveryId] ?? null;
}

export function listDeliveryAdaptations(): DeliveryAdaptationOverlay[] {
  return Object.values(readMap());
}

export function clearDeliveryAdaptationsForTests(): void {
  adaptMemory = {};
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(ADAPT_KEY);
  }
}

export function deliveryAdaptationKindLabel(
  kind: DeliveryAdaptationKind,
): string {
  switch (kind) {
    case "sequence":
      return "Secuencia del día";
    case "priority":
      return "Prioridad del día";
    case "day_note":
      return "Nota de jornada";
    case "operational_instruction":
      return "Instrucción operativa";
    case "address_clarification":
      return "Aclaración de dirección (operativa)";
    case "window_note":
      return "Nota de ventana";
    case "temporary_issue":
      return "Incidencia temporal";
    case "responsibility_note":
      return "Nota de responsabilidad";
  }
}

function baseUnchanged(card: DeliveryDayCard): string[] {
  return [
    `Compromiso Order · ${card.orderRef} (sin cambios)`,
    `Cliente record · ${card.customerLabel ?? "ausente"} (sin cambios silenciosos)`,
    `Estado Delivery Facade · ${card.deliveryStatus}`,
    `Readiness · ${deliveryReadinessLabel(card.readiness)}`,
    "Menú / Production / Kitchen (sin cambios)",
    "Ruta / mapa / navegación (no introducidos)",
  ];
}

/**
 * Preview impact. Never mutates Order / Customer / routes.
 */
export function previewDeliveryAdaptation(
  card: DeliveryDayCard,
  draft: DeliveryAdaptationDraft,
): DeliveryAdaptationImpact | null {
  if (draft.deliveryId !== card.id) return null;

  const persistence = "session" as const;
  const orderCommitmentUnchanged = true as const;
  const customerRecordUnchanged = true as const;
  const label = card.customerLabel ?? "Cliente ausente";

  if (draft.requestRouteReorder) {
    return {
      kind: draft.kind,
      deliveryId: card.id,
      customerLabel: label,
      orderRef: card.orderRef,
      summary:
        "Reordenar paradas como ruta → Route Preparation (registrado · no aplicado)",
      changed: [],
      unchanged: baseUnchanged(card),
      affectsDeliveryDay: false,
      escalationRequired: true,
      escalationReason:
        "Reordenar paradas de ruta no es adaptación de jornada — es frontera Route Preparation.",
      escalationTarget: "supervisor",
      escalationNextAction:
        "Registrar necesidad para DE005 Route Preparation · Observation · no inventar optimización aquí",
      persistence,
      orderCommitmentUnchanged,
      customerRecordUnchanged,
      substrateGap:
        "REGISTERED: stop reorder / route planning belongs to Route Preparation (DE005), not Delivery Adaptation. Do not implement route optimization from Experience.",
      routePreparationSignal: true,
    };
  }

  if (draft.requestOrderOrCustomerChange) {
    return {
      kind: draft.kind,
      deliveryId: card.id,
      customerLabel: label,
      orderRef: card.orderRef,
      summary:
        "Cambio requiere Order / Customer — no se aplica en Delivery (Experience)",
      changed: [],
      unchanged: baseUnchanged(card),
      affectsDeliveryDay: false,
      escalationRequired: true,
      escalationReason:
        "La variación afecta el compromiso Order o el registro Customer, no solo el contexto operativo del día.",
      escalationTarget: "order",
      escalationNextAction:
        "Revisar Order / Customer (fuera de Delivery Adaptation) · sin modificar aquí",
      persistence,
      orderCommitmentUnchanged,
      customerRecordUnchanged,
      substrateGap:
        "Durable Order/Customer mutation is out of Delivery Experience scope. Do not open Capability from Experience.",
      routePreparationSignal: false,
    };
  }

  switch (draft.kind) {
    case "sequence": {
      const rank = draft.sequenceRank;
      if (rank == null || !Number.isFinite(rank)) return null;
      return {
        kind: "sequence",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: `Secuencia de jornada → rank ${rank} (sesión · no es ruta)`,
        changed: [
          `Orden en cola del día: ${rank}`,
          "Persistencia: sesión (no Assignment durable)",
        ],
        unchanged: baseUnchanged(card),
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable delivery-day sequencing not on Facade — session only. Stop reorder as route → DE005.",
        routePreparationSignal: false,
      };
    }
    case "priority": {
      const p = draft.dayPriority;
      if (!p) return null;
      return {
        kind: "priority",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: `Prioridad de jornada → ${p} (sesión). Order intacto.`,
        changed: [`Prioridad local del día: ${p}`],
        unchanged: baseUnchanged(card),
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable delivery priority not on Facade — session only.",
        routePreparationSignal: false,
      };
    }
    case "day_note": {
      const note = (draft.dayNote ?? "").trim();
      if (!note) return null;
      return {
        kind: "day_note",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: "Nota de jornada añadida (sesión)",
        changed: [`Nota de día: ${note}`],
        unchanged: baseUnchanged(card),
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable delivery-day notes not on Facade — session only.",
        routePreparationSignal: false,
      };
    }
    case "operational_instruction": {
      const instr = (draft.operationalInstruction ?? "").trim();
      if (!instr) return null;
      return {
        kind: "operational_instruction",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: "Instrucción operativa de entrega (sesión)",
        changed: [`Instrucción: ${instr}`],
        unchanged: [
          ...baseUnchanged(card),
          "No se inventa contexto Customer/Order ausente",
        ],
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable operational delivery instructions not on Facade — session only.",
        routePreparationSignal: false,
      };
    }
    case "address_clarification": {
      const clar = (draft.addressClarification ?? "").trim();
      if (!clar) return null;
      return {
        kind: "address_clarification",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary:
          "Aclaración operativa de dirección (sesión) — Customer address record intacto",
        changed: [
          `Nota operativa de dirección: ${clar}`,
          "Distinción: nota operativa ≠ registro Customer",
        ],
        unchanged: [
          ...baseUnchanged(card),
          `Dirección substrate: ${card.addressLabel ?? "no disponible en este substrate"}`,
        ],
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable Customer address update not opened from Delivery — session clarification only; never silent Customer write.",
        routePreparationSignal: false,
      };
    }
    case "window_note": {
      const note = (draft.windowNote ?? "").trim();
      if (!note) return null;
      return {
        kind: "window_note",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: "Nota de ventana de entrega (sesión)",
        changed: [`Nota de ventana: ${note}`],
        unchanged: [
          ...baseUnchanged(card),
          `Ventana substrate: ${card.windowLabel ?? "no disponible en este substrate"}`,
        ],
        affectsDeliveryDay: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: durable delivery window mutation not on Facade — session note only.",
        routePreparationSignal: false,
      };
    }
    case "temporary_issue": {
      const issue = (draft.temporaryIssue ?? "").trim();
      if (!issue) return null;
      return {
        kind: "temporary_issue",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary: "Incidencia temporal registrada (sesión)",
        changed: [`Incidencia: ${issue}`],
        unchanged: baseUnchanged(card),
        affectsDeliveryDay: true,
        escalationRequired: true,
        escalationReason:
          "Incidencia temporal puede impedir completar la entrega sin apoyo.",
        escalationTarget: "supervisor",
        escalationNextAction:
          "Continuar si es manejable · o escalar a supervisor / Customer Service (Notify → Future)",
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: ReportDeliveryException / Notify Capability not opened from Experience — guidance only.",
        routePreparationSignal: false,
      };
    }
    case "responsibility_note": {
      const note = (draft.responsibilityNote ?? "").trim();
      if (!note) return null;
      return {
        kind: "responsibility_note",
        deliveryId: card.id,
        customerLabel: label,
        orderRef: card.orderRef,
        summary:
          "Nota de responsabilidad (sesión) — AssignDelivery no disponible",
        changed: [`Nota responsabilidad: ${note}`],
        unchanged: [
          ...baseUnchanged(card),
          "Driver assignment not available in this substrate",
        ],
        affectsDeliveryDay: true,
        escalationRequired: true,
        escalationReason:
          "AssignDelivery UNIMPLEMENTED — no se simula conductor durable.",
        escalationTarget: "supervisor",
        escalationNextAction:
          "Responsibility Experience (DE004) · no inventar AssignDelivery aquí",
        persistence,
        orderCommitmentUnchanged,
        customerRecordUnchanged,
        substrateGap:
          "GAP: AssignDelivery UNIMPLEMENTED on Delivery Facade — session note only; never invent durable driver.",
        routePreparationSignal: false,
      };
    }
  }
}

/** Apply confirmed local adaptation. Never writes Order / Customer / routes. */
export function confirmDeliveryAdaptation(
  card: DeliveryDayCard,
  draft: DeliveryAdaptationDraft,
): DeliveryAdaptationImpact | null {
  const impact = previewDeliveryAdaptation(card, draft);
  if (!impact) return null;
  if (
    (impact.escalationRequired && !impact.affectsDeliveryDay) ||
    impact.routePreparationSignal
  ) {
    return impact;
  }

  const map = readMap();
  const prev = map[card.id] ?? { deliveryId: card.id, updatedAt: "" };
  const next: DeliveryAdaptationOverlay = {
    ...prev,
    deliveryId: card.id,
    updatedAt: new Date().toISOString(),
  };

  switch (draft.kind) {
    case "sequence":
      if (draft.sequenceRank != null) next.sequenceRank = draft.sequenceRank;
      break;
    case "priority":
      if (draft.dayPriority != null) next.dayPriority = draft.dayPriority;
      break;
    case "day_note":
      if (draft.dayNote != null) next.dayNote = draft.dayNote.trim();
      break;
    case "operational_instruction":
      if (draft.operationalInstruction != null)
        next.operationalInstruction = draft.operationalInstruction.trim();
      break;
    case "address_clarification":
      if (draft.addressClarification != null)
        next.addressClarification = draft.addressClarification.trim();
      break;
    case "window_note":
      if (draft.windowNote != null) next.windowNote = draft.windowNote.trim();
      break;
    case "temporary_issue":
      if (draft.temporaryIssue != null)
        next.temporaryIssue = draft.temporaryIssue.trim();
      break;
    case "responsibility_note":
      if (draft.responsibilityNote != null)
        next.responsibilityNote = draft.responsibilityNote.trim();
      break;
  }

  map[card.id] = next;
  writeMap(map);
  return impact;
}

export type AdaptedDeliveryDayCard = DeliveryDayCard & {
  sequenceRank?: number | null;
  dayPriority?: "high" | "normal" | "low" | null;
  dayNote?: string | null;
  operationalInstruction?: string | null;
  addressClarification?: string | null;
  windowNote?: string | null;
  temporaryIssue?: string | null;
  responsibilityNote?: string | null;
  deliveryAdapted?: boolean;
};

export function applyDeliveryAdaptation(
  card: DeliveryDayCard,
): AdaptedDeliveryDayCard {
  const overlay = getDeliveryAdaptation(card.id);
  if (!overlay) return { ...card, deliveryAdapted: false };

  const specialParts = [
    card.specialInstructions,
    overlay.operationalInstruction,
    overlay.dayNote ? `Día: ${overlay.dayNote}` : null,
    overlay.temporaryIssue ? `Incidencia: ${overlay.temporaryIssue}` : null,
    overlay.responsibilityNote
      ? `Responsabilidad (sesión): ${overlay.responsibilityNote}`
      : null,
  ].filter(Boolean);

  return {
    ...card,
    sequenceRank: overlay.sequenceRank ?? null,
    dayPriority: overlay.dayPriority ?? null,
    dayNote: overlay.dayNote ?? null,
    operationalInstruction: overlay.operationalInstruction ?? null,
    addressClarification: overlay.addressClarification ?? null,
    windowNote: overlay.windowNote ?? null,
    temporaryIssue: overlay.temporaryIssue ?? null,
    responsibilityNote: overlay.responsibilityNote ?? null,
    specialInstructions: specialParts.length
      ? specialParts.join(" · ")
      : card.specialInstructions,
    deliveryAdapted: true,
  };
}

export function buildAdaptedTodaysDeliveryDay(input: {
  dayDate?: string;
  context: DeliveryContext | null;
  completedContext?: DeliveryContext | null;
  summariesById?: Record<string, OrderSummary>;
  detailsById?: Record<string, OrderDetails>;
  loadError?: string | null;
  assignmentSupported?: boolean;
}): Omit<TodaysDeliveryDay, "cards"> & { cards: AdaptedDeliveryDayCard[] } {
  const base = buildTodaysDeliveryDay(input);
  const cards = base.cards
    .map(applyDeliveryAdaptation)
    .sort(
      (a, b) =>
        (a.sequenceRank ?? 9999) - (b.sequenceRank ?? 9999) ||
        priorityRank(a.dayPriority) - priorityRank(b.dayPriority) ||
        (a.customerLabel ?? a.orderRef).localeCompare(
          b.customerLabel ?? b.orderRef,
        ),
    );
  return { ...base, cards };
}

function priorityRank(p: "high" | "normal" | "low" | null | undefined): number {
  if (p === "high") return 0;
  if (p === "normal") return 1;
  if (p === "low") return 2;
  return 3;
}
