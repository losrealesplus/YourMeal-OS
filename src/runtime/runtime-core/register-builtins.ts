/**
 * Built-in Suite bridges — register Assets / DOM / Consistency metadata only.
 * Does NOT change module behavior or UI. DEVELOPER-PLATFORM-002.
 */

import type { RuntimeModule } from "./RuntimeModule";
import { findModule, registerModule } from "./RuntimeRegistry";
import { createEvidence } from "./RuntimeEvidence";

const BUILTINS: RuntimeModule[] = [
  {
    id: "assets",
    title: "Assets",
    description: "Asset resolution ledger · logo · __l5e detection",
    icon: "package",
    category: "Diagnostics",
    version: "1.0.0",
    experimental: false,
    visible: true,
    permissions: "ENGINEERING",
    health: () => ({ ok: true, detail: "bridged · UI in Runtime Suite" }),
    export: () =>
      createEvidence({
        source: "assets",
        category: "diagnostics",
        severity: "info",
        payload: { bridged: true, note: "full snapshot via Suite Assets tab" },
      }),
  },
  {
    id: "dom",
    title: "DOM",
    description: "Live document.images probe",
    icon: "layout",
    category: "Diagnostics",
    version: "1.0.0",
    experimental: false,
    visible: true,
    permissions: "ENGINEERING",
    health: () => ({ ok: true, detail: "bridged · UI in Runtime Suite" }),
    export: () =>
      createEvidence({
        source: "dom",
        category: "diagnostics",
        severity: "info",
        payload: { bridged: true, note: "full snapshot via Suite DOM tab" },
      }),
  },
  {
    id: "consistency",
    title: "Consistency",
    description: "LIVE / HISTORICAL / ORPHAN / STALE lifecycle engine",
    icon: "git-compare",
    category: "Diagnostics",
    version: "1.0.0",
    experimental: false,
    visible: true,
    permissions: "ENGINEERING",
    health: () => ({ ok: true, detail: "bridged · UI in Runtime Suite" }),
    export: () =>
      createEvidence({
        source: "consistency",
        category: "diagnostics",
        severity: "info",
        payload: {
          bridged: true,
          note: "full snapshot via Suite Consistency tab",
        },
      }),
  },
];

let installed = false;

/** Idempotent — safe to call from client boot. */
export function registerBuiltinRuntimeModules(): void {
  if (installed) return;
  for (const mod of BUILTINS) {
    if (!findModule(mod.id)) registerModule(mod);
  }
  installed = true;
}

/** Test helper */
export function resetBuiltinRegistrationFlag(): void {
  installed = false;
}

export const BUILTIN_MODULE_IDS = BUILTINS.map((m) => m.id);
