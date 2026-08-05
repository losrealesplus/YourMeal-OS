/**
 * Knowledge Engine — Diagnostic Knowledge Model (Developer Platform v1.4)
 *
 * Spec: docs/05-architecture/KNOWLEDGE_ENGINE.md
 * ADR: docs/adr/0043-diagnostic-knowledge-model.md
 *
 * Knowledge does not know Doctor. Doctor may know Knowledge.
 */

export type {
  RuntimeKnowledge,
  KnowledgeSeverity,
  KnowledgeCategory,
  KnowledgeMatchInput,
  KnowledgeMatch,
} from "./knowledge.types";
export { KNOWLEDGE_ENGINE_VERSION } from "./knowledge.types";

export {
  registerKnowledge,
  unregisterKnowledge,
  getKnowledge,
  getAllKnowledge,
  resetKnowledgeRegistry,
} from "./KnowledgeRegistry";

export {
  searchKnowledge,
  buildKnowledgeIndex,
} from "./KnowledgeIndex";

export {
  matchIncident,
  matchCapability,
  matchManyIncidents,
  resolveKnowledgeIds,
} from "./KnowledgeMatcher";

export {
  registerFoundationKnowledge,
  resetFoundationKnowledgeFlag,
  FOUNDATION_KNOWLEDGE,
  FOUNDATION_KNOWLEDGE_IDS,
} from "./articles/foundation";

export {
  registerKnowledgeModule,
  resetKnowledgeModuleFlags,
} from "./register-knowledge-module";

export { KnowledgePanel } from "./KnowledgePanel";

export {
  knowledgeCategoryLabel,
  KNOWLEDGE_CATEGORY_LABELS,
} from "./KnowledgeCategory";
