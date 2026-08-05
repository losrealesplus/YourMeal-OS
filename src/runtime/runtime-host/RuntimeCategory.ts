/**
 * Developer Platform Host — category taxonomy & ordering.
 * DEVELOPER-PLATFORM-003
 */

import type { RuntimeModule, RuntimeModuleCategory, RuntimePlatform } from "../runtime-core";
import { detectRuntimePlatform } from "../runtime-core";

export { detectRuntimePlatform };

export const RUNTIME_HOST_CATEGORIES: readonly RuntimeModuleCategory[] = [
  "Health",
  "Capabilities",
  "Application",
  "Network",
  "System",
  "Security",
  "Developer",
  "Knowledge",
  "Recommendations",
  "Recovery",
] as const;

export const RUNTIME_HOST_CATEGORY_LABELS: Record<RuntimeModuleCategory, string> =
  {
    Health: "Health",
    Capabilities: "Capabilities",
    Application: "Application",
    Network: "Network",
    System: "System",
    Security: "Security",
    Developer: "Developer",
    Knowledge: "Knowledge",
    Recommendations: "Recommendations",
    Recovery: "Recovery",
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
