/**
 * Runtime Event Bus — typed Core events (in-memory · no global window coupling required).
 * Modules subscribe via Core API; Suite open/close may bridge from window events later.
 */

import type { RuntimeCoreEvent, RuntimeCoreEventName } from "./types";

type Listener = (event: RuntimeCoreEvent) => void;

const listeners = new Map<string, Set<Listener>>();
const anyListeners = new Set<Listener>();

export function onRuntimeCoreEvent(
  name: RuntimeCoreEventName | "*",
  listener: Listener,
): () => void {
  if (name === "*") {
    anyListeners.add(listener);
    return () => {
      anyListeners.delete(listener);
    };
  }
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name)!.add(listener);
  return () => {
    listeners.get(name)?.delete(listener);
  };
}

export function emitRuntimeCoreEvent(
  name: RuntimeCoreEventName | (string & {}),
  payload?: unknown,
): RuntimeCoreEvent {
  const event: RuntimeCoreEvent = {
    name,
    timestamp: new Date().toISOString(),
    payload,
  };
  const set = listeners.get(name);
  if (set) for (const l of [...set]) l(event);
  for (const l of [...anyListeners]) l(event);
  return event;
}

/** Test helper */
export function resetRuntimeEvents(): void {
  listeners.clear();
  anyListeners.clear();
}
