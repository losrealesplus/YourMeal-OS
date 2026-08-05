/**
 * Register Knowledge as a Host module (category Knowledge).
 * Knowledge Engine does not import Doctor.
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import { registerFoundationKnowledge } from "./articles/foundation";
import { getAllKnowledge } from "./KnowledgeRegistry";
import { KnowledgePanel } from "./KnowledgePanel";
import { KNOWLEDGE_ENGINE_VERSION } from "./knowledge.types";

const knowledgeModule: RuntimeModule = {
  id: "knowledge",
  title: "Knowledge",
  description: "Diagnostic Knowledge Model · declarative articles",
  icon: "book",
  category: "Knowledge",
  version: KNOWLEDGE_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: () => {
    const n = getAllKnowledge().length;
    return { ok: n > 0, detail: `${n} articles` };
  },
  export: () =>
    createEvidence({
      source: "knowledge",
      category: "diagnostics",
      severity: "info",
      payload: { articles: getAllKnowledge() },
    }),
};

let moduleInstalled = false;
let rendererInstalled = false;

export function registerKnowledgeModule(): void {
  registerFoundationKnowledge();

  if (!moduleInstalled) {
    if (!findModule("knowledge")) {
      registerModule(knowledgeModule);
    }
    moduleInstalled = true;
  }
  if (!rendererInstalled) {
    registerModuleRenderer("knowledge", () => createElement(KnowledgePanel));
    rendererInstalled = true;
  }
}

export function resetKnowledgeModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
}
