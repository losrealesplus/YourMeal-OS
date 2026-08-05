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

/**
 * Modules sorted by Host category order then title.
 * Category order is defined by the Host; Core accepts an order list.
 */
export function getModulesSorted(
  categoryOrder: readonly string[],
): RuntimeModule[] {
  const rank = new Map(categoryOrder.map((c, i) => [c, i]));
  return getModules().slice().sort((a, b) => {
    const ra = rank.get(a.category) ?? 999;
    const rb = rank.get(b.category) ?? 999;
    if (ra !== rb) return ra - rb;
    return a.title.localeCompare(b.title);
  });
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
