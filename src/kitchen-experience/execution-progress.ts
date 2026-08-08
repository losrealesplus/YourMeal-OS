/**
 * KE005 — Kitchen Execution Progress (Experience only).
 *
 * Communicate progress without inventing durable Capability state.
 * Session overlays (KE001) are labeled as session — never as Start/Complete Capability.
 * Start / Pause / Resume / Block / Assign → Future until Capability opens.
 */

import {
  buildAdaptedTodaysKitchenWork,
  effectiveExecutionQuantity,
} from "@/kitchen-experience/adapt-execution";
import { buildLabelContext } from "@/kitchen-experience/label-context";
import {
  getKitchenWorkStatus,
  kitchenWorkStatusLabel,
  type KitchenExecutionCard,
  type KitchenWorkStatus,
  type TodaysKitchenWork,
} from "@/kitchen-experience/today-work";

export type ProgressProvenance =
  /** Operator marked status in this browser session */
  | "session"
  /** Inferred from prep handoff (blocked/overdue) — not Capability Block */
  | "prep_infer"
  /** Handed off and available — durable execution progress unknown */
  | "available_unknown";

export type ProgressBucket =
  | "completed_session"
  | "in_progress_session"
  | "blocked"
  | "remaining"
  | "available";

export type ExecutionProgressLine = {
  card: KitchenExecutionCard;
  provenance: ProgressProvenance;
  bucket: ProgressBucket;
  /** Operator-facing status label */
  statusLabel: string;
  /** Honest progress line — never claims durable Capability Complete */
  progressLabel: string;
  durableProgressAvailable: boolean;
  hasCriticalSpecial: boolean;
};

export type ExecutionProgressSummary = {
  dayDate: string;
  dayLabel: string;
  total: number;
  /** Session-marked completed only */
  completedSession: number;
  /** Session-marked in progress only */
  inProgressSession: number;
  blocked: number;
  remaining: number;
  available: number;
  warningCount: number;
  /**
   * Session completion ratio — only when total > 0.
   * Never presented as durable Capability progress.
   */
  sessionCompletionRatio: number | null;
  /** Trustworthy handoff totals for display: "Completed 12 / 30" (session) */
  completionIndicator: string;
  durableProgressGap: string;
  emptyReason: string | null;
  nextActionHint: string;
  lines: ExecutionProgressLine[];
  view: TodaysKitchenWork;
};

function provenanceFor(card: KitchenExecutionCard): ProgressProvenance {
  const overlay = getKitchenWorkStatus(card.id);
  if (overlay) return "session";
  if (
    card.prepStatusSummary === "Bloqueada" ||
    card.prepStatusSummary === "Vencida"
  ) {
    return "prep_infer";
  }
  return "available_unknown";
}

function bucketFor(
  card: KitchenExecutionCard,
  provenance: ProgressProvenance,
): ProgressBucket {
  if (card.status === "completed" && provenance === "session") {
    return "completed_session";
  }
  if (card.status === "in_progress" && provenance === "session") {
    return "in_progress_session";
  }
  if (card.status === "blocked") return "blocked";
  if (provenance === "available_unknown" || card.status === "ready") {
    return "available";
  }
  return "remaining";
}

function progressLabelFor(
  card: KitchenExecutionCard,
  provenance: ProgressProvenance,
): string {
  if (provenance === "session") {
    return `Progreso de sesión · ${kitchenWorkStatusLabel(card.status)}`;
  }
  if (provenance === "prep_infer") {
    return `Prep ${card.prepStatusSummary} · progreso de ejecución durable no disponible`;
  }
  return "Execution progress not yet available";
}

export function buildProgressLine(
  card: KitchenExecutionCard,
): ExecutionProgressLine {
  const provenance = provenanceFor(card);
  const bucket = bucketFor(card, provenance);
  const labelCtx = buildLabelContext(card);
  return {
    card,
    provenance,
    bucket,
    statusLabel: kitchenWorkStatusLabel(card.status),
    progressLabel: progressLabelFor(card, provenance),
    durableProgressAvailable: false,
    hasCriticalSpecial: labelCtx.hasCritical,
  };
}

/** Build day's progress summary from handoff + session honesty. */
export function buildExecutionProgress(
  dayDate?: string,
): ExecutionProgressSummary {
  const view = buildAdaptedTodaysKitchenWork(dayDate);
  const lines = view.cards.map(buildProgressLine);

  let completedSession = 0;
  let inProgressSession = 0;
  let blocked = 0;
  let available = 0;

  for (const line of lines) {
    switch (line.bucket) {
      case "completed_session":
        completedSession += 1;
        break;
      case "in_progress_session":
        inProgressSession += 1;
        break;
      case "blocked":
        blocked += 1;
        break;
      case "available":
        available += 1;
        break;
      default:
        break;
    }
  }

  const total = lines.length;
  const remaining = total - completedSession;
  const sessionCompletionRatio =
    total > 0 ? completedSession / total : null;

  const completionIndicator =
    total === 0
      ? "Sin trabajo"
      : `Completados (sesión) ${completedSession} / ${total} · Restantes ${remaining}`;

  return {
    dayDate: view.dayDate,
    dayLabel: view.dayLabel,
    total,
    completedSession,
    inProgressSession,
    blocked,
    remaining,
    available,
    warningCount: view.warnings.length + blocked,
    sessionCompletionRatio,
    completionIndicator,
    durableProgressGap:
      "GAP: Durable ExecutionUnit Start / Pause / Resume / Complete / Block / Assign not opened — session marks only. Do not invent Capability state from Experience.",
    emptyReason: view.emptyReason,
    nextActionHint: view.nextActionHint,
    lines,
    view,
  };
}

export function filterProgressLines(
  lines: ExecutionProgressLine[],
  filter: "all" | "remaining" | "completed" | "blocked" | "unknown",
): ExecutionProgressLine[] {
  switch (filter) {
    case "remaining":
      return lines.filter((l) => l.bucket !== "completed_session");
    case "completed":
      return lines.filter((l) => l.bucket === "completed_session");
    case "blocked":
      return lines.filter((l) => l.bucket === "blocked");
    case "unknown":
      return lines.filter((l) => l.provenance === "available_unknown");
    default:
      return lines;
  }
}

export function progressProvenanceLabel(p: ProgressProvenance): string {
  switch (p) {
    case "session":
      return "Sesión";
    case "prep_infer":
      return "Prep";
    case "available_unknown":
      return "Sin progreso durable";
  }
}

export function quantityLabel(card: KitchenExecutionCard): string {
  const q = effectiveExecutionQuantity(card);
  return `${q}${card.quantityEstimated ? "*" : ""}`;
}

export type { KitchenWorkStatus };
