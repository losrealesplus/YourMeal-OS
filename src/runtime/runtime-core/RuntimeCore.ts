/**
 * Runtime Core — kernel facade for the Runtime Suite.
 * Modules depend on Core; Core never depends on modules.
 */

import type { RuntimeModule } from "./RuntimeModule";
import {
  disable,
  enable,
  findModule,
  getModules,
  isEnabled,
  registerModule,
  unregisterModule,
} from "./RuntimeRegistry";
import { emitRuntimeCoreEvent, onRuntimeCoreEvent } from "./RuntimeEvents";
import { createEvidence } from "./RuntimeEvidence";
import { createExportEngineStub } from "./RuntimeExport";
import { canAccessModule } from "./RuntimePermissions";
import type { RuntimeEvidence } from "./types";

export const RUNTIME_CORE_VERSION = "1.0.0";

export type RuntimeCoreApi = {
  version: string;
  registerModule: typeof registerModule;
  unregisterModule: typeof unregisterModule;
  getModules: typeof getModules;
  findModule: typeof findModule;
  isEnabled: typeof isEnabled;
  enable: typeof enable;
  disable: typeof disable;
  on: typeof onRuntimeCoreEvent;
  emit: typeof emitRuntimeCoreEvent;
  createEvidence: typeof createEvidence;
  canAccessModule: typeof canAccessModule;
  exportEngine: ReturnType<typeof createExportEngineStub>;
};

async function collectFromRegistered(): Promise<RuntimeEvidence[]> {
  const out: RuntimeEvidence[] = [];
  for (const mod of getModules()) {
    if (!mod.export || !isEnabled(mod.id)) continue;
    const chunk = await mod.export();
    if (!chunk) continue;
    if (Array.isArray(chunk)) out.push(...chunk);
    else out.push(chunk);
  }
  return out;
}

let singleton: RuntimeCoreApi | null = null;

export function getRuntimeCore(): RuntimeCoreApi {
  if (singleton) return singleton;
  singleton = {
    version: RUNTIME_CORE_VERSION,
    registerModule,
    unregisterModule,
    getModules,
    findModule,
    isEnabled,
    enable,
    disable,
    on: onRuntimeCoreEvent,
    emit: emitRuntimeCoreEvent,
    createEvidence,
    canAccessModule,
    exportEngine: createExportEngineStub({ collect: collectFromRegistered }),
  };
  return singleton;
}

/** Alias used by bootstraps. */
export const RuntimeCore = {
  get: getRuntimeCore,
  version: RUNTIME_CORE_VERSION,
};

export type { RuntimeModule };
