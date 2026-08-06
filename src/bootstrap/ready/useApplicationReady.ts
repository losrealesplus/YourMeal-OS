import { useReadyContext } from "./ReadyContext";
import type { ApplicationReadySnapshot } from "./deriveApplicationReady";

/**
 * React hook — Product features ask: is the application Ready?
 * Single consumer API over ReadyContext (populated by ApplicationReadyGate).
 */
export function useApplicationReady(): ApplicationReadySnapshot {
  return useReadyContext();
}
