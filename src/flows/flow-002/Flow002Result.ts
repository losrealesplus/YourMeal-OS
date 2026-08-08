/**
 * FLOW-002 result — collaboration evidence, not business payloads.
 * Answers: which transition failed — never why the business failed.
 */

import type {
  Flow002Context,
  Flow002EvidenceStep,
} from "./Flow002Context";

export type Flow002ErrorCode =
  | "PERMISSION_DENIED"
  | "TENANT_MISMATCH"
  | "TRANSITION_FAILED"
  | "EMPTY_COMMITMENT"
  | "EMPTY_WORK"
  | "EMPTY_EXECUTION"
  | "EMPTY_ASSIGNMENT"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type Flow002Error = {
  code: Flow002ErrorCode;
  message: string;
  recoverable: boolean;
  /** Which hop failed — Flow answers this; Capabilities answer business why. */
  transition?: Flow002EvidenceStep["transition"];
  evidence?: Record<string, unknown>;
};

export type Flow002Result = {
  ok: boolean;
  context: Flow002Context | null;
  steps: Flow002EvidenceStep[];
  errors: Flow002Error[];
};
