/**
 * Application Ready Gate — PRODUCT-CORE-004
 * Single lifecycle latch: "Is the application Ready?"
 */

export type {
  ApplicationLifecycleState,
  ApplicationReadySnapshot,
} from "./deriveApplicationReady";

export {
  deriveApplicationReadySnapshot,
  isApplicationReady,
} from "./deriveApplicationReady";

export {
  emitApplicationLifecycle,
  onApplicationLifecycle,
  resetApplicationLifecycleListeners,
  type ApplicationLifecycleEvent,
  type ApplicationLifecycleEventName,
} from "./ApplicationLifecycleEvents";

export { ReadyContext, ReadyContextProvider, useReadyContext } from "./ReadyContext";
export { useApplicationReady } from "./useApplicationReady";
export { ApplicationReadyGate } from "./ApplicationReadyGate";
export {
  ensureApplicationReady,
  ApplicationReadyFailedError,
} from "./ensureApplicationReady";
