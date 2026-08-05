/**
 * Capability Registry — capabilities self-register; Recovery will never hard-code modules.
 */

import { emitRuntimeCoreEvent } from "../runtime-core";
import type { RuntimeCapability } from "./capability.types";

const capabilities = new Map<string, RuntimeCapability>();

export function registerCapability(capability: RuntimeCapability): void {
  if (!capability?.id) {
    throw new Error("CapabilityRegistry: capability.id is required");
  }
  if (!capability.diagnose) {
    throw new Error(
      `CapabilityRegistry: diagnose() is required (${capability.id})`,
    );
  }
  if (!capability.supportedPlatforms?.length) {
    throw new Error(
      `CapabilityRegistry: supportedPlatforms required (${capability.id})`,
    );
  }
  capabilities.set(capability.id, capability);
  emitRuntimeCoreEvent("capability-registered", { id: capability.id });
}

export function unregisterCapability(id: string): void {
  capabilities.delete(id);
}

export function getCapability(id: string): RuntimeCapability | undefined {
  return capabilities.get(id);
}

export function listCapabilities(): RuntimeCapability[] {
  return [...capabilities.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function resetCapabilityRegistry(): void {
  capabilities.clear();
}
