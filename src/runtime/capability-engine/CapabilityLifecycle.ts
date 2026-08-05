/**
 * Per-capability lifecycle state (no globals).
 */

import type {
  CapabilityLifecycleState,
  RuntimeCheckResult,
  RuntimeCheckStatus,
} from "./capability.types";

const states = new Map<string, CapabilityLifecycleState>();
const lastResults = new Map<string, RuntimeCheckResult[]>();
const lastRunAt = new Map<string, string>();

export function getCapabilityState(id: string): CapabilityLifecycleState {
  return states.get(id) ?? "idle";
}

export function setCapabilityState(
  id: string,
  state: CapabilityLifecycleState,
): void {
  states.set(id, state);
}

export function setCapabilityLastResults(
  id: string,
  runAt: string,
  results: RuntimeCheckResult[],
): void {
  lastRunAt.set(id, runAt);
  lastResults.set(id, results);
}

export function getCapabilityLastResults(id: string): RuntimeCheckResult[] {
  return lastResults.get(id) ?? [];
}

export function getCapabilityLastRunAt(id: string): string | null {
  return lastRunAt.get(id) ?? null;
}

export function deriveStateFromResults(
  results: RuntimeCheckResult[],
): CapabilityLifecycleState {
  if (results.length === 0) return "idle";
  let worst: RuntimeCheckStatus = "pass";
  const rank = (s: RuntimeCheckStatus) =>
    s === "fail" ? 4 : s === "warning" ? 3 : s === "info" ? 2 : s === "skip" ? 1 : 0;
  for (const r of results) {
    if (rank(r.status) > rank(worst)) worst = r.status;
  }
  if (worst === "fail") return "error";
  if (worst === "warning") return "warning";
  return "healthy";
}

export function resetCapabilityLifecycle(): void {
  states.clear();
  lastResults.clear();
  lastRunAt.clear();
}
