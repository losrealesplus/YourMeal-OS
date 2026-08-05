/**
 * Knowledge category labels.
 */

import type { KnowledgeCategory } from "./knowledge.types";

export const KNOWLEDGE_CATEGORY_LABELS: Record<string, string> = {
  assets: "Assets",
  branding: "Branding",
  runtime: "Runtime",
  android: "Android",
  ios: "iOS",
  supabase: "Supabase",
  network: "Network",
  storage: "Storage",
  session: "Session",
  performance: "Performance",
  security: "Security",
  developer: "Developer",
  general: "General",
};

export function knowledgeCategoryLabel(category: KnowledgeCategory | string): string {
  return KNOWLEDGE_CATEGORY_LABELS[category] ?? category;
}
