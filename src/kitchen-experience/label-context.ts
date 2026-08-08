/**
 * KE004 — Kitchen Labels & Special Information (Experience only).
 *
 * Kitchen consumes identification / special info for correct execution.
 * Does not create Customer / Order / Menu data.
 * Does not invent unavailable substrate.
 * Physical label generation → Future (gap registered).
 */

import {
  effectiveExecutionQuantity,
  getExecutionAdaptation,
  listAdaptedExecutionCards,
} from "@/kitchen-experience/adapt-execution";
import type { KitchenExecutionCard } from "@/kitchen-experience/today-work";

export type LabelFieldSeverity = "normal" | "important" | "critical";

export type LabelFieldAvailability = "present" | "absent" | "session";

export type LabelField = {
  id: string;
  label: string;
  value: string;
  severity: LabelFieldSeverity;
  availability: LabelFieldAvailability;
  /** Honest empty copy when absent */
  absentCopy: string;
};

export type SpecialInfoItem = {
  id: string;
  kind:
    | "allergen"
    | "dietary"
    | "instruction"
    | "prep"
    | "packaging"
    | "label"
    | "operational"
    | "issue";
  title: string;
  detail: string;
  severity: LabelFieldSeverity;
  source: "handoff" | "session" | "none";
};

export type KitchenLabelContext = {
  workId: string;
  productionDay: string;
  dayLabel: string;
  dishLabel: string;
  batchKey: string;
  cookingDeadline: string;
  productionQuantity: number;
  executionQuantity: number;
  quantityEstimated: boolean;
  /** Identification fields for label / execution */
  identity: LabelField[];
  /** Special information that can affect safe/correct execution */
  special: SpecialInfoItem[];
  hasCritical: boolean;
  hasImportant: boolean;
  hasAnySpecial: boolean;
  /** Gaps that Experience must not fake */
  substrateGaps: string[];
};

const ABSENT = "Not available in this substrate";
const NO_SPECIAL = "No special information recorded";

export { ABSENT as LABEL_ABSENT_COPY, NO_SPECIAL as LABEL_NO_SPECIAL_COPY };

function field(
  id: string,
  label: string,
  raw: string | null | undefined,
  severity: LabelFieldSeverity,
  options?: { session?: boolean; absentCopy?: string },
): LabelField {
  const value = (raw ?? "").trim();
  if (!value) {
    return {
      id,
      label,
      value: "",
      severity,
      availability: "absent",
      absentCopy: options?.absentCopy ?? ABSENT,
    };
  }
  return {
    id,
    label,
    value,
    severity,
    availability: options?.session ? "session" : "present",
    absentCopy: options?.absentCopy ?? ABSENT,
  };
}

/** Classify special info for visual hierarchy. */
export function buildLabelContext(
  card: KitchenExecutionCard,
): KitchenLabelContext {
  const overlay = getExecutionAdaptation(card.id);
  const execQty = effectiveExecutionQuantity(card);

  const identity: LabelField[] = [
    field("dish", "Plato / Trabajo", card.dishLabel, "normal"),
    field(
      "quantity",
      "Cantidad",
      `${execQty}${card.quantityEstimated ? "*" : ""}${
        card.executionQuantity != null &&
        card.executionQuantity !== card.quantity
          ? ` (Production ${card.quantity})`
          : ""
      }`,
      "normal",
    ),
    field("batch", "Batch", card.batchKey, "normal"),
    field("deadline", "Deadline", card.cookingDeadline, "normal"),
    field("customer", "Cliente", card.customerLabel, "important"),
    field("order", "Pedido", card.orderRef, "important"),
    field("delivery", "Entrega", null, "normal"),
  ];

  const special: SpecialInfoItem[] = [];

  if (card.allergenHint?.trim()) {
    special.push({
      id: "allergen",
      kind: "allergen",
      title: "Alérgenos",
      detail: card.allergenHint.trim(),
      severity: "critical",
      source: "handoff",
    });
  }

  if (card.dietaryHint?.trim()) {
    special.push({
      id: "dietary",
      kind: "dietary",
      title: "Dietario / macros",
      detail: card.dietaryHint.trim(),
      severity: "important",
      source: "handoff",
    });
  }

  if (card.specialInstruction?.trim()) {
    const fromSession = Boolean(overlay?.specialInstruction);
    special.push({
      id: "instruction",
      kind: "instruction",
      title: "Instrucción especial",
      detail: card.specialInstruction.trim(),
      severity: "important",
      source: fromSession ? "session" : "handoff",
    });
  }

  if (
    card.prepStatusSummary &&
    (card.prepStatusSummary === "Bloqueada" ||
      card.prepStatusSummary === "Vencida" ||
      overlay?.prepAvailable === false)
  ) {
    special.push({
      id: "prep",
      kind: "prep",
      title: "Preparación",
      detail:
        overlay?.prepAvailable === false
          ? overlay.prepAvailabilityNote?.trim() ||
            "Prep no disponible (sesión)"
          : `${card.requiredPreps} · ${card.prepStatusSummary}`,
      severity: "critical",
      source: overlay?.prepAvailable === false ? "session" : "handoff",
    });
  } else if (card.requiredPreps && card.requiredPreps !== "—") {
    special.push({
      id: "prep",
      kind: "prep",
      title: "Preparación",
      detail: `${card.requiredPreps} · ${card.prepStatusSummary}`,
      severity: "normal",
      source: "handoff",
    });
  }

  if (overlay?.temporaryIssue?.trim()) {
    special.push({
      id: "issue",
      kind: "issue",
      title: "Incidencia temporal",
      detail: overlay.temporaryIssue.trim(),
      severity: "critical",
      source: "session",
    });
  }

  if (overlay?.executionNote?.trim()) {
    special.push({
      id: "exec-note",
      kind: "operational",
      title: "Nota de ejecución",
      detail: overlay.executionNote.trim(),
      severity: "important",
      source: "session",
    });
  }

  if (
    card.operationalNotes &&
    card.operationalNotes !== "—" &&
    !overlay?.executionNote
  ) {
    special.push({
      id: "ops-notes",
      kind: "operational",
      title: "Notas operativas",
      detail: card.operationalNotes,
      severity: "normal",
      source: "handoff",
    });
  }

  // Packaging / label instructions — no substrate on handoff today
  // Intentionally absent (not invented).

  const substrateGaps: string[] = [];
  if (!card.customerLabel) {
    substrateGaps.push(
      "GAP: Customer identity not on Kitchen handoff substrate — do not infer.",
    );
  }
  if (!card.orderRef) {
    substrateGaps.push(
      "GAP: Order reference not on Kitchen handoff substrate — do not invent.",
    );
  }
  if (!card.specialInstruction && !overlay?.specialInstruction) {
    substrateGaps.push(
      "GAP: Special instruction from Order/Customer not wired into handoff — absent unless session adaptation.",
    );
  }
  substrateGaps.push(
    "GAP: Delivery information not available on Kitchen execution substrate.",
  );
  substrateGaps.push(
    "GAP: Packaging / physical label instructions not available — Generate physical labels → Future.",
  );

  const hasCritical = special.some((s) => s.severity === "critical");
  const hasImportant = special.some((s) => s.severity === "important");

  return {
    workId: card.id,
    productionDay: card.productionDay,
    dayLabel: card.dayLabel,
    dishLabel: card.dishLabel,
    batchKey: card.batchKey,
    cookingDeadline: card.cookingDeadline,
    productionQuantity: card.quantity,
    executionQuantity: execQty,
    quantityEstimated: card.quantityEstimated,
    identity,
    special,
    hasCritical,
    hasImportant,
    hasAnySpecial: special.length > 0,
    substrateGaps,
  };
}

export function listLabelContexts(
  dayDate?: string | null,
  today?: string,
): KitchenLabelContext[] {
  return listAdaptedExecutionCards(dayDate, today).map(buildLabelContext);
}

export function getLabelContext(
  workId: string,
  dayDate?: string | null,
  today?: string,
): KitchenLabelContext | null {
  const card = listAdaptedExecutionCards(dayDate, today).find(
    (c) => c.id === workId,
  );
  return card ? buildLabelContext(card) : null;
}

export function specialSeverityRank(s: LabelFieldSeverity): number {
  if (s === "critical") return 0;
  if (s === "important") return 1;
  return 2;
}

export function sortedSpecial(items: SpecialInfoItem[]): SpecialInfoItem[] {
  return [...items].sort(
    (a, b) =>
      specialSeverityRank(a.severity) - specialSeverityRank(b.severity) ||
      a.title.localeCompare(b.title),
  );
}

export function labelFieldDisplay(f: LabelField): string {
  if (f.availability === "absent") return f.absentCopy;
  if (f.availability === "session") return `${f.value} (sesión)`;
  return f.value;
}
