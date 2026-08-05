/**
 * Knowledge severity helpers.
 */

import type { KnowledgeSeverity } from "./knowledge.types";

export const KNOWLEDGE_SEVERITY_ORDER: readonly KnowledgeSeverity[] = [
  "info",
  "warning",
  "error",
  "critical",
] as const;

export function knowledgeSeverityRank(s: KnowledgeSeverity): number {
  return KNOWLEDGE_SEVERITY_ORDER.indexOf(s);
}
