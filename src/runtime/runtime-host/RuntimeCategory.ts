/**
 * Developer Platform Host — category taxonomy & ordering.
 * DEVELOPER-PLATFORM-003
 */

import type { RuntimeModule, RuntimeModuleCategory, RuntimePlatform } from "../runtime-core";

export const RUNTIME_HOST_CATEGORIES: readonly RuntimeModuleCategory[] = [
  "Health",
  "Application",
  "Network",
  "System",
  "Security",
  "Developer",
] as const;

export const RUNTIME_HOST_CATEGORY_LABELS: Record<RuntimeModuleCategory, string> =
  {
    Health: "Health",
    Application: "Application",
    Network: "Network",
    System: "System",
    Security: "Security",
    Developer: "Developer",
  };

export type HostModuleGroup = {
  category: RuntimeModuleCategory;
  label: string;
  modules: RuntimeModule[];
};

/** Group enabled modules by category (Host order). Empty categories omitted. */
export function groupModulesByCategory(
  modules: RuntimeModule[],
): HostModuleGroup[] {
  const byCat = new Map<RuntimeModuleCategory, RuntimeModule[]>();
  for (const mod of modules) {
    const list = byCat.get(mod.category) ?? [];
    list.push(mod);
    byCat.set(mod.category, list);
  }
  const groups: HostModuleGroup[] = [];
  for (const category of RUNTIME_HOST_CATEGORIES) {
    const list = byCat.get(category);
    if (!list?.length) continue;
    groups.push({
      category,
      label: RUNTIME_HOST_CATEGORY_LABELS[category],
      modules: list.slice().sort((a, b) => a.title.localeCompare(b.title)),
    });
  }
  return groups;
}

/** True when module supports platform (missing supports ⇒ all). */
export function moduleSupportsPlatform(
  module: RuntimeModule,
  platform: RuntimePlatform,
): boolean {
  if (!module.supports || module.supports.length === 0) return true;
  return module.supports.includes(platform);
}

export function detectRuntimePlatform(): RuntimePlatform {
  try {
    // Lazy string check avoids hard Capacitor import in pure helpers/tests.
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor;
    const p = cap?.getPlatform?.() ?? "web";
    if (p === "android" || p === "ios" || p === "web") return p;
    return "web";
  } catch {
    return "web";
  }
}
