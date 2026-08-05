/**
 * Incident category labels & mapping from Doctor capabilities.
 */

import type { IncidentCategory } from "./incident.types";

export const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  assets: "Assets",
  branding: "Branding",
  runtime: "Runtime",
  android: "Android",
  ios: "iOS",
  network: "Network",
  supabase: "Supabase",
  storage: "Storage",
  session: "Session",
  performance: "Performance",
  security: "Security",
  developer: "Developer",
  unknown: "Unknown",
};

export function incidentCategoryLabel(category: string): string {
  return INCIDENT_CATEGORY_LABELS[category] ?? category;
}

/** Map Doctor capability → incident category (1:1 for foundation). */
export function categoryFromCapability(capability: string): IncidentCategory {
  if (capability in INCIDENT_CATEGORY_LABELS) {
    return capability as IncidentCategory;
  }
  return "unknown";
}
