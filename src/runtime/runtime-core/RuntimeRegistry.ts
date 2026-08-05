/**
 * Runtime Registry — single source of registered modules.
 * Core never imports Assets/DOM/Consistency — modules self-register.
 */

import type { RuntimeModule } from "./RuntimeModule";
import { emitRuntimeCoreEvent } from "./RuntimeEvents";

type RegistryState = {
  modules: Map<string, RuntimeModule>;
  enabled: Set<string>;
};

const state: RegistryState = {
  modules: new Map(),
  enabled: new Set(),
};

export function registerModule(module: RuntimeModule): void {
  if (!module?.id) {
    throw new Error("RuntimeRegistry: module.id is required");
  }
  state.modules.set(module.id, module);
  if (module.visible !== false) {
    state.enabled.add(module.id);
  }
  emitRuntimeCoreEvent("module-registered", { id: module.id });
}

export function unregisterModule(id: string): void {
  state.modules.delete(id);
  state.enabled.delete(id);
  emitRuntimeCoreEvent("module-unregistered", { id });
}

export function getModules(): RuntimeModule[] {
  return [...state.modules.values()];
}

export function findModule(id: string): RuntimeModule | undefined {
  return state.modules.get(id);
}

export function isEnabled(id: string): boolean {
  return state.enabled.has(id) && state.modules.has(id);
}

export function enable(id: string): void {
  if (!state.modules.has(id)) return;
  state.enabled.add(id);
  emitRuntimeCoreEvent("module-enabled", { id });
}

export function disable(id: string): void {
  state.enabled.delete(id);
  emitRuntimeCoreEvent("module-disabled", { id });
}

/** Test / HMR helper — wipe registry (does not dispose modules). */
export function resetRuntimeRegistry(): void {
  state.modules.clear();
  state.enabled.clear();
}
