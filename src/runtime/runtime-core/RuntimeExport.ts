/**
 * Export Engine — interface only (no ZIP / download implementation).
 * DEVELOPER-PLATFORM-002 · Phase 5 will implement.
 */

import type { RuntimeEvidence } from "./types";

export type RuntimeExportBundle = {
  createdAt: string;
  evidences: RuntimeEvidence[];
  meta?: Record<string, unknown>;
};

export type RuntimeExportEngine = {
  collect: () => Promise<RuntimeEvidence[]> | RuntimeEvidence[];
  serialize: (
    evidences: RuntimeEvidence[],
  ) => Promise<string> | string;
  prepare: () => Promise<RuntimeExportBundle> | RuntimeExportBundle;
  /** Not implemented in Foundation — throws. */
  download: (bundle: RuntimeExportBundle) => Promise<void> | void;
};

/**
 * Stub engine — contracts only. download() deliberately unimplemented.
 */
export function createExportEngineStub(deps: {
  collect: RuntimeExportEngine["collect"];
}): RuntimeExportEngine {
  return {
    collect: deps.collect,
    serialize(evidences) {
      return JSON.stringify(evidences, null, 2);
    },
    async prepare() {
      const evidences = await deps.collect();
      return {
        createdAt: new Date().toISOString(),
        evidences,
        meta: { engine: "runtime-core-stub", version: "1.0.0" },
      };
    },
    download() {
      throw new Error(
        "RuntimeExportEngine.download is not implemented (Developer Platform Phase 5)",
      );
    },
  };
}
