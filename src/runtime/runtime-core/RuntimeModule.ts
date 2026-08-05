/**
 * Runtime Module contract — every Suite tool implements the same surface.
 * DEVELOPER-PLATFORM-002 · UI may live elsewhere; Core only needs the contract.
 */

import type {
  RuntimeEvidence,
  RuntimeHealthReport,
  RuntimeModuleMeta,
} from "./types";

export type RuntimeModule = RuntimeModuleMeta & {
  /** Optional lifecycle — no-op allowed for Phase-1 bridges. */
  mount?: () => void | Promise<void>;
  unmount?: () => void | Promise<void>;
  dispose?: () => void | Promise<void>;
  /** Contribute evidence slice for future Export Engine. */
  export?: () => RuntimeEvidence | RuntimeEvidence[] | null | Promise<
    RuntimeEvidence | RuntimeEvidence[] | null
  >;
  /** Lightweight health probe for future Doctor. */
  health?: () => RuntimeHealthReport | Promise<RuntimeHealthReport>;
};

export type RuntimeModuleRegistration = RuntimeModule;
