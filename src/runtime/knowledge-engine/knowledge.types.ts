/**
 * Diagnostic Knowledge Model — contracts.
 * DEVELOPER-PLATFORM-007 · Developer Platform v1.4
 *
 * Knowledge does not know Doctor. Doctor (and UI) may know Knowledge.
 */

import type { RuntimeSeverity } from "../runtime-core";

export type KnowledgeSeverity = RuntimeSeverity;

export type KnowledgeCategory =
  | "assets"
  | "branding"
  | "runtime"
  | "android"
  | "ios"
  | "supabase"
  | "network"
  | "storage"
  | "session"
  | "performance"
  | "security"
  | "developer"
  | "general"
  | (string & {});

/**
 * Permanent knowledge article — single source of truth for recommendations later.
 */
export type RuntimeKnowledge = {
  id: string;
  title: string;
  description: string;
  category: KnowledgeCategory;
  severity: KnowledgeSeverity;
  tags: string[];
  capabilities: string[];
  /** Declarative patterns matched against incident title/description/checkId. */
  incidentPatterns: string[];
  recommendations: string[];
  references?: string[];
};

/** Input for declarative matching (Incident-shaped; no Incident Engine import). */
export type KnowledgeMatchInput = {
  title?: string;
  description?: string;
  capability?: string;
  category?: string;
  checkId?: string;
  tags?: string[];
};

export type KnowledgeMatch = {
  article: RuntimeKnowledge;
  /** 0–1 declarative score */
  score: number;
  matchedOn: string[];
};

export const KNOWLEDGE_ENGINE_VERSION = "1.4.0";
