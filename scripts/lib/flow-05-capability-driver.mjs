/**
 * FLOW-05 · Capability driver (customer journey B1–B8).
 *
 * CERTIFIED_THROUGH = 0 in runner — no block drivers yet.
 * Does NOT execute Registration…History. Does NOT open Capacitor.
 */
import { FLOW05_SEGMENTS } from "./flow-05-canonical-pipeline.mjs";

/**
 * @param {{ root: string, through?: 1|2|3|4|5|6|7|8 | 0 | null }} opts
 * @returns {{ ok: boolean, steps: string[], reason?: string, evidence?: Record<string, unknown> }}
 */
export function runFlow05CapabilityDriver({ root: _root, through = null }) {
  const max = through ?? 0;
  /** @type {string[]} */
  const steps = [];
  /** @type {Record<string, unknown>} */
  const evidence = { segments: FLOW05_SEGMENTS };

  if (max < 1) {
    return {
      ok: true,
      steps,
      evidence: {
        ...evidence,
        note: "CERTIFIED_THROUGH=0 — runner institutionalizes contract only",
      },
    };
  }

  return {
    ok: false,
    steps,
    reason:
      "FLOW-05 block drivers are not implemented — stop at Runner (CERTIFIED_THROUGH=0). Open FLOW05-001 for B1 only after Gate.",
    evidence,
  };
}
