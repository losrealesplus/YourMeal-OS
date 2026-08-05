/**
 * In-memory recovery history (no persistence yet).
 */

import type { RuntimeRecovery, RecoveryTimelineEvent } from "./recovery.types";

const history: RuntimeRecovery[] = [];
const timeline: RecoveryTimelineEvent[] = [];
const running = new Map<string, RuntimeRecovery>();
let seq = 0;

export function nextRecoveryId(): string {
  seq += 1;
  return `recov-${Date.now().toString(36)}-${seq}`;
}

export function putRecovery(recovery: RuntimeRecovery): void {
  const idx = history.findIndex((h) => h.id === recovery.id);
  if (idx >= 0) history[idx] = recovery;
  else history.unshift(recovery);
  if (recovery.status === "running" || recovery.status === "pending") {
    running.set(recovery.id, recovery);
  } else {
    running.delete(recovery.id);
  }
}

export function getRecovery(id: string): RuntimeRecovery | undefined {
  return history.find((h) => h.id === id) ?? running.get(id);
}

export function getRecoveryHistory(): RuntimeRecovery[] {
  return history.slice().sort((a, b) => b.startedAt - a.startedAt);
}

/** @deprecated Prefer getRecoveryHistory */
export function listRecoveryHistory(): RuntimeRecovery[] {
  return getRecoveryHistory();
}

export function listRunningRecoveries(): RuntimeRecovery[] {
  return [...running.values()];
}

export function appendRecoveryTimeline(
  event: Omit<RecoveryTimelineEvent, "id" | "timestamp"> & {
    id?: string;
    timestamp?: number;
  },
): RecoveryTimelineEvent {
  const full: RecoveryTimelineEvent = {
    id: event.id ?? `rtl-${Date.now().toString(36)}-${++seq}`,
    recoveryId: event.recoveryId,
    timestamp: event.timestamp ?? Date.now(),
    kind: event.kind,
    message: event.message,
    evidenceId: event.evidenceId,
  };
  timeline.push(full);
  return full;
}

export function getRecoveryTimeline(recoveryId?: string): RecoveryTimelineEvent[] {
  const list = recoveryId
    ? timeline.filter((e) => e.recoveryId === recoveryId)
    : timeline.slice();
  return list.sort((a, b) => a.timestamp - b.timestamp);
}

export function exportRecoveryHistoryJson(): string {
  return JSON.stringify(
    {
      engine: "recovery-engine",
      version: "1.7.0",
      exportedAt: new Date().toISOString(),
      history: getRecoveryHistory(),
      timeline: getRecoveryTimeline(),
    },
    null,
    2,
  );
}

export function resetRecoveryHistory(): void {
  history.length = 0;
  timeline.length = 0;
  running.clear();
  seq = 0;
}
