/**
 * Legacy Suite tab bridges — Host selects modules; Inspector still owns panels.
 * Does not modify Assets / DOM / Consistency engines.
 */

import {
  findModule,
  registerModule,
  type RuntimeModule,
  type RuntimeModuleCategory,
  type RuntimePlatform,
} from "../runtime-core";

/** Maps registry module id → existing Inspector tab label. */
export const LEGACY_TAB_BY_MODULE_ID: Record<string, string> = {
  general: "General",
  runtime: "Runtime",
  assets: "Assets",
  dom: "DOM",
  consistency: "Consistency",
  i18n: "i18n",
  router: "Router",
  supabase: "Supabase",
  network: "Network",
  storage: "Storage",
  clipboard: "Clipboard",
  device: "Device",
  errors: "Errors",
};

const ALL: RuntimePlatform[] = ["web", "android", "ios"];

function bridge(
  id: string,
  title: string,
  category: RuntimeModuleCategory,
  description: string,
): RuntimeModule {
  return {
    id,
    title,
    description,
    category,
    version: "1.0.0",
    visible: true,
    experimental: false,
    permissions: "ENGINEERING",
    supports: ALL,
    icon: id,
  };
}

const LEGACY_BRIDGES: RuntimeModule[] = [
  bridge("general", "General", "Application", "Shell overview"),
  bridge("runtime", "Runtime", "Application", "Mount & runtime status"),
  // assets / dom / consistency already registered by Core builtins
  bridge("i18n", "i18n", "Application", "Localization snapshot"),
  bridge("router", "Router", "Application", "Router location"),
  bridge("supabase", "Supabase", "Network", "Supabase client status"),
  bridge("network", "Network", "Network", "Network observe panel"),
  bridge("storage", "Storage", "Application", "Web storage snapshot"),
  bridge("clipboard", "Clipboard", "Developer", "Copy diagnostic helpers"),
  bridge("device", "Device", "System", "Device / Capacitor info"),
  bridge("errors", "Errors", "Developer", "Exception & redirect ledger"),
];

let installed = false;

/** Register non-builtin legacy Suite panels into the Registry (idempotent). */
export function registerLegacyHostModules(): void {
  if (installed) return;
  for (const mod of LEGACY_BRIDGES) {
    if (!findModule(mod.id)) registerModule(mod);
  }
  installed = true;
}

export function legacyTabForModuleId(id: string): string | undefined {
  return LEGACY_TAB_BY_MODULE_ID[id];
}

export function moduleIdForLegacyTab(tab: string): string | undefined {
  const entry = Object.entries(LEGACY_TAB_BY_MODULE_ID).find(
    ([, t]) => t === tab,
  );
  return entry?.[0];
}

/** Test helper */
export function resetLegacyHostRegistrationFlag(): void {
  installed = false;
}
