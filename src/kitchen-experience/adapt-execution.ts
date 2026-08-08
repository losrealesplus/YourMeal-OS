/**
 * KE003 — Kitchen Execution Adaptation (Experience only).
 *
 * Adapt local execution context when kitchen reality changes.
 * Never mutate Production plans, Menu, Orders, or Capability substrate.
 * Session overlays only — explicitly marked. Durable ExecutionUnit gaps recorded.
 */

import {
  buildTodaysKitchenWork,
  listExecutionCards,
  type KitchenExecutionCard,
  type KitchenWorkStatus,
  type TodaysKitchenWork,
} from "@/kitchen-experience/today-work";

export type ExecutionAdaptationKind =
  | "quantity"
  | "sequence"
  | "prep_availability"
  | "note"
  | "special_instruction"
  | "temporary_issue"
  | "priority";

export type EscalationTarget =
  | "production"
  | "supervisor"
  | "delivery"
  | "customer_service"
  | "none";

export type ExecutionAdaptationOverlay = {
  workId: string;
  /** Local execution quantity — does not change Production commitment */
  executionQuantity?: number;
  /** Lower = earlier in today's queue */
  sequenceRank?: number;
  prepAvailable?: boolean;
  prepAvailabilityNote?: string;
  executionNote?: string;
  specialInstruction?: string;
  temporaryIssue?: string;
  priority?: "high" | "normal" | "low";
  updatedAt: string;
};

export type AdaptationImpact = {
  kind: ExecutionAdaptationKind;
  workId: string;
  dishLabel: string;
  summary: string;
  changed: string[];
  unchanged: string[];
  affectsExecutionItem: boolean;
  escalationRequired: boolean;
  escalationReason: string | null;
  escalationTarget: EscalationTarget;
  escalationNextAction: string | null;
  /** Honesty: no durable ExecutionUnit / Production write */
  persistence: "session";
  productionPlanUnchanged: true;
  /** Documented gap when durable substrate would be needed */
  substrateGap: string | null;
};

export type AdaptationDraft = {
  kind: ExecutionAdaptationKind;
  workId: string;
  executionQuantity?: number;
  sequenceRank?: number;
  prepAvailable?: boolean;
  prepAvailabilityNote?: string;
  executionNote?: string;
  specialInstruction?: string;
  temporaryIssue?: string;
  priority?: "high" | "normal" | "low";
  /** Operator requests Production-facing change → escalate, do not apply locally */
  requestProductionChange?: boolean;
};

const ADAPT_KEY = "ymos.ke.exec_adapt.v1";

let adaptMemory: Record<string, ExecutionAdaptationOverlay> = {};

function readMap(): Record<string, ExecutionAdaptationOverlay> {
  if (typeof sessionStorage === "undefined") return { ...adaptMemory };
  try {
    const raw = sessionStorage.getItem(ADAPT_KEY);
    if (!raw) return { ...adaptMemory };
    const parsed = JSON.parse(raw) as Record<
      string,
      ExecutionAdaptationOverlay
    >;
    return parsed && typeof parsed === "object"
      ? { ...parsed }
      : { ...adaptMemory };
  } catch {
    return { ...adaptMemory };
  }
}

function writeMap(map: Record<string, ExecutionAdaptationOverlay>) {
  adaptMemory = map;
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ADAPT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getExecutionAdaptation(
  workId: string,
): ExecutionAdaptationOverlay | null {
  return readMap()[workId] ?? null;
}

export function listExecutionAdaptations(): ExecutionAdaptationOverlay[] {
  return Object.values(readMap());
}

export function clearExecutionAdaptationsForTests(): void {
  adaptMemory = {};
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem(ADAPT_KEY);
  }
}

export function adaptationKindLabel(kind: ExecutionAdaptationKind): string {
  switch (kind) {
    case "quantity":
      return "Cantidad de ejecución";
    case "sequence":
      return "Secuencia de ejecución";
    case "prep_availability":
      return "Disponibilidad de prep";
    case "note":
      return "Nota de ejecución";
    case "special_instruction":
      return "Instrucción especial";
    case "temporary_issue":
      return "Incidencia temporal";
    case "priority":
      return "Prioridad de ejecución";
  }
}

function baseUnchanged(card: KitchenExecutionCard): string[] {
  return [
    `Compromiso Production · cantidad ${card.quantity}${card.quantityEstimated ? "*" : ""}`,
    `Batch ${card.batchKey}`,
    `Deadline ${card.cookingDeadline}`,
    `Día ${card.productionDay}`,
    "Plan semanal de Production (sin cambios)",
    "Menú / Orders (sin cambios)",
  ];
}

/**
 * Preview impact. Never mutates Production.
 * Escalation when local execution cannot absorb the change.
 */
export function previewExecutionAdaptation(
  card: KitchenExecutionCard,
  draft: AdaptationDraft,
): AdaptationImpact | null {
  if (draft.workId !== card.id) return null;

  const persistence = "session" as const;
  const productionPlanUnchanged = true as const;

  if (draft.requestProductionChange) {
    return {
      kind: draft.kind,
      workId: card.id,
      dishLabel: card.dishLabel,
      summary:
        "Cambio requiere Production — no se aplica en Kitchen (Experience)",
      changed: [],
      unchanged: baseUnchanged(card),
      affectsExecutionItem: false,
      escalationRequired: true,
      escalationReason:
        "La variación afecta el compromiso de Production, no solo la ejecución local.",
      escalationTarget: "production",
      escalationNextAction:
        "Revisar Production Handoff / Adaptation (fuera de Kitchen)",
      persistence,
      productionPlanUnchanged,
      substrateGap:
        "Durable Production plan mutation is out of Kitchen Experience scope. Do not open Capability from Experience.",
    };
  }

  switch (draft.kind) {
    case "quantity": {
      const next = draft.executionQuantity;
      if (next == null || !Number.isFinite(next) || next < 0) return null;
      if (next === card.quantity && !getExecutionAdaptation(card.id)?.executionQuantity)
        return null;
      const diverges = next !== card.quantity;
      return {
        kind: "quantity",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: diverges
          ? `Cantidad de ejecución ${card.quantity} → ${next} (sesión). Production permanece ${card.quantity}.`
          : `Cantidad de ejecución alineada con Production (${next})`,
        changed: [
          `Cantidad de ejecución local: ${next}`,
          "Persistencia: sesión (no ExecutionUnit durable)",
        ],
        unchanged: baseUnchanged(card).filter(
          (u) => !u.startsWith("Compromiso") || diverges,
        ),
        affectsExecutionItem: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        productionPlanUnchanged,
        substrateGap: diverges
          ? "GAP: durable ExecutionUnit quantity overlay not available — session only until Capability opens."
          : null,
      };
    }
    case "sequence": {
      const rank = draft.sequenceRank;
      if (rank == null || !Number.isFinite(rank)) return null;
      return {
        kind: "sequence",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: `Secuencia de cola → rank ${rank} (sesión)`,
        changed: [`Orden de ejecución local: ${rank}`],
        unchanged: baseUnchanged(card),
        affectsExecutionItem: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        productionPlanUnchanged,
        substrateGap:
          "GAP: durable queue sequencing on ExecutionUnit not available — session only.",
      };
    }
    case "prep_availability": {
      const available = draft.prepAvailable;
      if (available == null) return null;
      const note = (draft.prepAvailabilityNote ?? "").trim();
      const escalate = !available;
      return {
        kind: "prep_availability",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: available
          ? "Prep marcada disponible para ejecución (sesión)"
          : "Prep no disponible — puede requerir escalado",
        changed: [
          `Prep disponible: ${available ? "sí" : "no"}`,
          ...(note ? [`Nota prep: ${note}`] : []),
        ],
        unchanged: baseUnchanged(card),
        affectsExecutionItem: true,
        escalationRequired: escalate,
        escalationReason: escalate
          ? "Sin prep no se puede completar la ejecución local de forma segura."
          : null,
        escalationTarget: escalate ? "supervisor" : "none",
        escalationNextAction: escalate
          ? "Avisar supervisor / revisar Preps en Production (sin modificar plan aquí)"
          : null,
        persistence,
        productionPlanUnchanged,
        substrateGap: escalate
          ? "GAP: Notify Supervisor / Block Capability not opened — escalate as guidance only."
          : null,
      };
    }
    case "note": {
      const note = (draft.executionNote ?? "").trim();
      if (!note) return null;
      return {
        kind: "note",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: "Nota de ejecución añadida (sesión)",
        changed: [`Nota: ${note}`],
        unchanged: baseUnchanged(card),
        affectsExecutionItem: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        productionPlanUnchanged,
        substrateGap:
          "GAP: durable execution notes on ExecutionUnit not available — session only.",
      };
    }
    case "special_instruction": {
      const instr = (draft.specialInstruction ?? "").trim();
      if (!instr) return null;
      return {
        kind: "special_instruction",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: "Instrucción especial de ejecución (sesión)",
        changed: [`Instrucción: ${instr}`],
        unchanged: [
          ...baseUnchanged(card),
          "No se inventa contexto Customer/Order ausente",
        ],
        affectsExecutionItem: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        productionPlanUnchanged,
        substrateGap:
          "GAP: special instruction durable substrate missing — session overlay only; never invent Order/Customer.",
      };
    }
    case "temporary_issue": {
      const issue = (draft.temporaryIssue ?? "").trim();
      if (!issue) return null;
      return {
        kind: "temporary_issue",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: "Incidencia temporal registrada (sesión)",
        changed: [`Incidencia: ${issue}`],
        unchanged: baseUnchanged(card),
        affectsExecutionItem: true,
        escalationRequired: true,
        escalationReason:
          "Incidencia temporal puede impedir completar ejecución sin apoyo.",
        escalationTarget: "supervisor",
        escalationNextAction:
          "Continuar si es manejable · o escalar a supervisor (Notify → Future)",
        persistence,
        productionPlanUnchanged,
        substrateGap:
          "GAP: Block / Notify Supervisor Capability not opened — guidance only.",
      };
    }
    case "priority": {
      const p = draft.priority;
      if (!p) return null;
      if (p === card.priority && !getExecutionAdaptation(card.id)?.priority)
        return null;
      return {
        kind: "priority",
        workId: card.id,
        dishLabel: card.dishLabel,
        summary: `Prioridad de ejecución ${card.priority} → ${p} (sesión). Production priority intacta.`,
        changed: [`Prioridad local de cola: ${p}`],
        unchanged: baseUnchanged(card),
        affectsExecutionItem: true,
        escalationRequired: false,
        escalationReason: null,
        escalationTarget: "none",
        escalationNextAction: null,
        persistence,
        productionPlanUnchanged,
        substrateGap:
          "GAP: durable execution priority on ExecutionUnit not available — session only.",
      };
    }
  }
}

/** Apply confirmed local adaptation. Never writes Production. */
export function confirmExecutionAdaptation(
  card: KitchenExecutionCard,
  draft: AdaptationDraft,
): AdaptationImpact | null {
  const impact = previewExecutionAdaptation(card, draft);
  if (!impact) return null;
  if (impact.escalationRequired && !impact.affectsExecutionItem) {
    // Pure escalation — do not write overlay
    return impact;
  }

  const map = readMap();
  const prev = map[card.id] ?? { workId: card.id, updatedAt: "" };
  const next: ExecutionAdaptationOverlay = {
    ...prev,
    workId: card.id,
    updatedAt: new Date().toISOString(),
  };

  switch (draft.kind) {
    case "quantity":
      if (draft.executionQuantity != null)
        next.executionQuantity = draft.executionQuantity;
      break;
    case "sequence":
      if (draft.sequenceRank != null) next.sequenceRank = draft.sequenceRank;
      break;
    case "prep_availability":
      if (draft.prepAvailable != null) next.prepAvailable = draft.prepAvailable;
      if (draft.prepAvailabilityNote != null)
        next.prepAvailabilityNote = draft.prepAvailabilityNote.trim();
      break;
    case "note":
      if (draft.executionNote != null)
        next.executionNote = draft.executionNote.trim();
      break;
    case "special_instruction":
      if (draft.specialInstruction != null)
        next.specialInstruction = draft.specialInstruction.trim();
      break;
    case "temporary_issue":
      if (draft.temporaryIssue != null)
        next.temporaryIssue = draft.temporaryIssue.trim();
      break;
    case "priority":
      if (draft.priority != null) next.priority = draft.priority;
      break;
  }

  map[card.id] = next;
  writeMap(map);
  return impact;
}

/** Merge session adaptation onto handoff-derived card. Never mutates Production qty. */
export function applyExecutionAdaptation(
  card: KitchenExecutionCard,
): KitchenExecutionCard {
  const overlay = getExecutionAdaptation(card.id);
  if (!overlay) return { ...card, executionAdapted: false };

  const notes = [
    card.operationalNotes,
    overlay.executionNote ? `Ejecución: ${overlay.executionNote}` : null,
    overlay.temporaryIssue ? `Incidencia: ${overlay.temporaryIssue}` : null,
    overlay.prepAvailabilityNote
      ? `Prep: ${overlay.prepAvailabilityNote}`
      : null,
    overlay.prepAvailable === false ? "Prep no disponible (sesión)" : null,
    overlay.executionQuantity != null &&
    overlay.executionQuantity !== card.quantity
      ? `Cantidad ejecución ${overlay.executionQuantity} · Production ${card.quantity}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    ...card,
    executionQuantity: overlay.executionQuantity ?? null,
    priority: overlay.priority ?? card.priority,
    operationalNotes: notes || card.operationalNotes,
    specialInstruction:
      overlay.specialInstruction ?? card.specialInstruction,
    urgent:
      card.urgent ||
      overlay.priority === "high" ||
      Boolean(overlay.temporaryIssue) ||
      overlay.prepAvailable === false,
    executionAdapted: true,
  };
}

/** Quantity the operator should cook now (session overlay or Production). */
export function effectiveExecutionQuantity(card: KitchenExecutionCard): number {
  return card.executionQuantity != null ? card.executionQuantity : card.quantity;
}

export function listAdaptedExecutionCards(
  dayDate?: string | null,
  today?: string,
): KitchenExecutionCard[] {
  const cards = listExecutionCards(dayDate, today).map(applyExecutionAdaptation);
  cards.sort((a, b) => {
    const ra = getExecutionAdaptation(a.id)?.sequenceRank;
    const rb = getExecutionAdaptation(b.id)?.sequenceRank;
    if (ra != null || rb != null) {
      const cmp = (ra ?? 9999) - (rb ?? 9999);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
  return cards;
}

export function buildAdaptedTodaysKitchenWork(
  dayDate?: string,
): TodaysKitchenWork {
  const view = buildTodaysKitchenWork(dayDate);
  const adapted = view.cards.map(applyExecutionAdaptation);
  adapted.sort((a, b) => {
    const ra = getExecutionAdaptation(a.id)?.sequenceRank;
    const rb = getExecutionAdaptation(b.id)?.sequenceRank;
    if (ra != null || rb != null) {
      const cmp = (ra ?? 9999) - (rb ?? 9999);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
  return { ...view, cards: adapted };
}

export function adaptedCardHasOverlay(workId: string): boolean {
  return getExecutionAdaptation(workId) != null;
}

export function clearExecutionAdaptation(workId: string): void {
  const map = readMap();
  delete map[workId];
  writeMap(map);
}

/** Status remains KE001 session overlay — adaptation does not invent Capability Start. */
export type { KitchenWorkStatus };
