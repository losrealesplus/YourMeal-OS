/**
 * Evidence Engine — contract only (no storage / persistence).
 * Future Doctor / Export will produce RuntimeEvidence via this shape.
 */

import type { RuntimeEvidence, RuntimeSeverity } from "./types";

export type CreateEvidenceInput = {
  source: string;
  severity?: RuntimeSeverity;
  payload: unknown;
  category: string;
  id?: string;
};

export function createEvidence(input: CreateEvidenceInput): RuntimeEvidence {
  return {
    id:
      input.id ??
      `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    source: input.source,
    severity: input.severity ?? "info",
    payload: input.payload,
    category: input.category,
  };
}

/** Placeholder collector — returns empty until modules implement export(). */
export function collectEvidenceFromModules(
  exporters: Array<() => RuntimeEvidence | RuntimeEvidence[] | null>,
): RuntimeEvidence[] {
  const out: RuntimeEvidence[] = [];
  for (const ex of exporters) {
    const chunk = ex();
    if (!chunk) continue;
    if (Array.isArray(chunk)) out.push(...chunk);
    else out.push(chunk);
  }
  return out;
}
