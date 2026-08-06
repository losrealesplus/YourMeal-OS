/**
 * Mutable bag passed across stages. Orchestrator owns the instance;
 * stages only patch known fields — no framework imports here.
 */

import type { BootstrapRunMode } from "./types";

export type BootstrapContext = {
  runId: string;
  mode: BootstrapRunMode;
  bootEpochMs: number;
  hasSession: boolean;
  userId: string | null;
  tenantId: string | null;
  homePath: string | null;
  brandProvenance: "static" | "remote" | "fallback" | null;
  /** Free-form evidence bag (never put secrets / JWTs here). */
  evidence: Record<string, unknown>;
};

export function createBootstrapContext(
  runId: string,
  mode: BootstrapRunMode,
): BootstrapContext {
  return {
    runId,
    mode,
    bootEpochMs: Date.now(),
    hasSession: false,
    userId: null,
    tenantId: null,
    homePath: null,
    brandProvenance: null,
    evidence: {},
  };
}
