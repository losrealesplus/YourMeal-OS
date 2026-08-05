/**
 * Capability health helpers.
 */

import type {
  CapabilityHealthSnapshot,
  RuntimeCapability,
} from "./capability.types";
import {
  getCapabilityLastResults,
  getCapabilityLastRunAt,
  getCapabilityState,
} from "./CapabilityLifecycle";

export function capabilityHealth(
  capability: RuntimeCapability,
): CapabilityHealthSnapshot {
  return {
    capabilityId: capability.id,
    state: getCapabilityState(capability.id),
    lastRunAt: getCapabilityLastRunAt(capability.id),
    lastResults: getCapabilityLastResults(capability.id),
    recoverSupported: typeof capability.recover === "function",
    verifySupported: typeof capability.verify === "function",
  };
}
