/**
 * Bootstrap lifecycle events — observe-only.
 * Developer Platform / Doctor may subscribe later; this module does not
 * import Runtime, Doctor, or any engine (ADR 0050 / PRODUCT-CORE-002).
 */

import type { BootstrapResult, BootstrapStageId, BootstrapStageResult } from "./types";

export type BootstrapLifecycleEventName =
  | "bootstrap:run_started"
  | "bootstrap:stage_started"
  | "bootstrap:stage_completed"
  | "bootstrap:stage_failed"
  | "bootstrap:run_completed"
  | "bootstrap:run_failed"
  | "bootstrap:auth_required";

export type BootstrapLifecycleEvent = {
  name: BootstrapLifecycleEventName;
  timestamp: string;
  runId: string;
  stage?: BootstrapStageId;
  durationMs?: number;
  result?: BootstrapResult;
  stageResult?: BootstrapStageResult;
  payload?: Record<string, unknown>;
};

type Listener = (event: BootstrapLifecycleEvent) => void;

const listeners = new Set<Listener>();

export function onBootstrapLifecycle(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitBootstrapLifecycle(
  event: Omit<BootstrapLifecycleEvent, "timestamp"> & { timestamp?: string },
): BootstrapLifecycleEvent {
  const full: BootstrapLifecycleEvent = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
  for (const listener of [...listeners]) {
    try {
      listener(full);
    } catch {
      // Observe-only: never let subscribers break startup.
    }
  }
  return full;
}

/** Test helper */
export function resetBootstrapLifecycleListeners(): void {
  listeners.clear();
}
