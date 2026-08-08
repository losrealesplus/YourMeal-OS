/**
 * KE006 — Kitchen Completion & Handoff (Experience only).
 *
 * Understand what is complete, what remains, what happens next.
 * Never invent durable Complete / Delivery acceptance.
 * Session completion labeled as session. Delivery → Future.
 */

import {
  buildExecutionProgress,
  progressProvenanceLabel,
  quantityLabel,
  type ExecutionProgressLine,
  type ExecutionProgressSummary,
} from "@/kitchen-experience/execution-progress";

export type DayCompletionReadiness =
  | "empty"
  | "session_complete"
  | "partial_session"
  | "blocked_attention"
  | "durable_unavailable";

export type CompletionNextAction =
  | "continue_remaining"
  | "review_blocked"
  | "review_warnings"
  | "return_today"
  | "review_production_handoff"
  | "future_delivery";

export type CompletionWarning = {
  id: string;
  severity: "critical" | "important" | "info";
  message: string;
  nextAction: CompletionNextAction;
};

export type CompletionCard = {
  line: ExecutionProgressLine;
  completionStatus: string;
  nextAction: CompletionNextAction;
  nextActionLabel: string;
};

export type KitchenCompletionView = {
  dayDate: string;
  dayLabel: string;
  readiness: DayCompletionReadiness;
  readinessLabel: string;
  readinessDetail: string;
  total: number;
  completedSession: number;
  remaining: number;
  blocked: number;
  pending: number;
  inProgressSession: number;
  warningCount: number;
  /** Honest — never durable Capability Complete */
  completionSummary: string;
  durableCompletionAvailable: false;
  durableCompletionGap: string;
  nextResponsibility: string;
  nextActions: { id: CompletionNextAction; label: string; primary?: boolean }[];
  warnings: CompletionWarning[];
  cards: CompletionCard[];
  progress: ExecutionProgressSummary;
};

function nextForLine(line: ExecutionProgressLine): {
  action: CompletionNextAction;
  label: string;
} {
  if (line.bucket === "completed_session") {
    return {
      action: "future_delivery",
      label: "Completado (sesión) · Delivery → Future",
    };
  }
  if (line.bucket === "blocked") {
    return {
      action: "review_blocked",
      label: "Revisar bloqueo / avisos",
    };
  }
  if (line.bucket === "in_progress_session") {
    return {
      action: "continue_remaining",
      label: "Continuar trabajo restante",
    };
  }
  return {
    action: "continue_remaining",
    label: "Continuar ejecución · progreso durable no disponible",
  };
}

function completionStatusFor(line: ExecutionProgressLine): string {
  if (line.bucket === "completed_session") {
    return "Session completion";
  }
  if (line.bucket === "blocked") {
    return "Blocked";
  }
  if (line.bucket === "in_progress_session") {
    return "Pending · in progress (sesión)";
  }
  if (line.provenance === "available_unknown") {
    return "Completion state unavailable";
  }
  return "Remaining";
}

/** Build day completion / next-step view. No Delivery behaviour. */
export function buildKitchenCompletion(
  dayDate?: string,
): KitchenCompletionView {
  const progress = buildExecutionProgress(dayDate);
  const {
    total,
    completedSession,
    remaining,
    blocked,
    available,
    inProgressSession,
    warningCount,
    view,
  } = progress;

  const cards: CompletionCard[] = progress.lines.map((line) => {
    const next = nextForLine(line);
    return {
      line,
      completionStatus: completionStatusFor(line),
      nextAction: next.action,
      nextActionLabel: next.label,
    };
  });

  const warnings: CompletionWarning[] = [];

  for (const w of view.warnings) {
    warnings.push({
      id: `handoff:${w.id}`,
      severity: w.severity === "block" ? "critical" : "important",
      message: w.message,
      nextAction:
        w.code === "incomplete_handoff"
          ? "review_production_handoff"
          : "review_warnings",
    });
  }

  if (blocked > 0) {
    warnings.push({
      id: "blocked-work",
      severity: "critical",
      message: `${blocked} trabajo(s) bloqueado(s) requieren atención`,
      nextAction: "review_blocked",
    });
  }

  if (remaining > 0 && completedSession > 0) {
    warnings.push({
      id: "incomplete-session",
      severity: "important",
      message: `Quedan ${remaining} ítem(s) sin completar en sesión`,
      nextAction: "continue_remaining",
    });
  }

  if (total > 0) {
    warnings.push({
      id: "durable-unavailable",
      severity: "info",
      message:
        "Durable ExecutionUnit completion unavailable — session marks only",
      nextAction: "return_today",
    });
  }

  let readiness: DayCompletionReadiness;
  let readinessLabel: string;
  let readinessDetail: string;
  let nextResponsibility: string;
  const nextActions: KitchenCompletionView["nextActions"] = [];

  if (progress.emptyReason || total === 0) {
    readiness = "empty";
    readinessLabel = "Sin trabajo de Kitchen";
    readinessDetail =
      progress.emptyReason ??
      "No hay trabajo transferido para este día.";
    nextResponsibility = "Revisar Production Handoff";
    nextActions.push(
      {
        id: "review_production_handoff",
        label: "Revisar Production Handoff",
        primary: true,
      },
      { id: "return_today", label: "Volver a Today's Work" },
    );
  } else if (blocked > 0 && completedSession < total) {
    readiness = "blocked_attention";
    readinessLabel = "Atención requerida";
    readinessDetail =
      "Hay trabajo bloqueado o avisos. No hay cierre durable de Capability.";
    nextResponsibility = "Resolver bloqueos / continuar restantes";
    nextActions.push(
      {
        id: "review_blocked",
        label: "Revisar bloqueados",
        primary: true,
      },
      { id: "continue_remaining", label: "Continuar restantes" },
      { id: "return_today", label: "Volver a Today's Work" },
    );
  } else if (completedSession === total && total > 0) {
    readiness = "session_complete";
    readinessLabel = "Kitchen work complete (sesión)";
    readinessDetail =
      "Todos los ítems marcados completados en sesión. No implica CompleteExecutionUnit ni aceptación de Delivery.";
    nextResponsibility =
      "Next: Delivery (Future) — Delivery has not accepted responsibility";
    nextActions.push(
      {
        id: "future_delivery",
        label: "Next: Delivery → Future",
        primary: true,
      },
      { id: "return_today", label: "Volver a Today's Work" },
      {
        id: "review_production_handoff",
        label: "Revisar Production Handoff",
      },
    );
  } else if (completedSession > 0) {
    readiness = "partial_session";
    readinessLabel = "Cierre parcial (sesión)";
    readinessDetail = `${completedSession} de ${total} marcados en sesión · ${remaining} restantes`;
    nextResponsibility = "Continuar trabajo restante";
    nextActions.push(
      {
        id: "continue_remaining",
        label: "Continuar restantes",
        primary: true,
      },
      { id: "return_today", label: "Volver a Today's Work" },
    );
  } else {
    readiness = "durable_unavailable";
    readinessLabel = "Completion state unavailable";
    readinessDetail =
      "Hay trabajo disponible, pero no hay Complete durable de Capability. Las marcas de sesión en Today's Work son opcionales y no sustituyen ExecutionUnit.";
    nextResponsibility = "Continuar ejecución / marcar sesión si aplica";
    nextActions.push(
      {
        id: "continue_remaining",
        label: "Continuar trabajo restante",
        primary: true,
      },
      { id: "return_today", label: "Volver a Today's Work" },
      {
        id: "review_production_handoff",
        label: "Revisar Production Handoff",
      },
    );
  }

  if (view.warnings.length > 0 && !nextActions.some((a) => a.id === "review_warnings")) {
    nextActions.push({
      id: "review_warnings",
      label: "Revisar avisos",
    });
  }

  const completionSummary =
    total === 0
      ? "Sin trabajo"
      : `Completados (sesión) ${completedSession} / ${total} · Restantes ${remaining} · Bloqueados ${blocked}`;

  return {
    dayDate: progress.dayDate,
    dayLabel: progress.dayLabel,
    readiness,
    readinessLabel,
    readinessDetail,
    total,
    completedSession,
    remaining,
    blocked,
    pending: available + inProgressSession,
    inProgressSession,
    warningCount: warnings.length,
    completionSummary,
    durableCompletionAvailable: false,
    durableCompletionGap:
      "GAP: CompleteExecutionUnit / durable Kitchen Complete not opened — session completion only. Delivery handoff → Future. Do not invent Delivery acceptance.",
    nextResponsibility,
    nextActions,
    warnings,
    cards,
    progress,
  };
}

export function filterCompletionCards(
  cards: CompletionCard[],
  filter: "all" | "completed" | "remaining" | "blocked" | "unavailable",
): CompletionCard[] {
  switch (filter) {
    case "completed":
      return cards.filter((c) => c.line.bucket === "completed_session");
    case "remaining":
      return cards.filter((c) => c.line.bucket !== "completed_session");
    case "blocked":
      return cards.filter((c) => c.line.bucket === "blocked");
    case "unavailable":
      return cards.filter(
        (c) => c.completionStatus === "Completion state unavailable",
      );
    default:
      return cards;
  }
}

export { progressProvenanceLabel, quantityLabel };
export type { ExecutionProgressLine };
