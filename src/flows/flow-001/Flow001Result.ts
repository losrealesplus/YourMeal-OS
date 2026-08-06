/**
 * FLOW-001 result — collaboration evidence, not business payloads.
 */

import type {
  Flow001Context,
  Flow001EvidenceStep,
} from "./Flow001Context";

export type Flow001ErrorCode =
  | "PERMISSION_DENIED"
  | "TENANT_MISMATCH"
  | "TRANSITION_FAILED"
  | "EMPTY_COMMITMENT"
  | "EMPTY_WORK"
  | "EMPTY_EXECUTION"
  | "UNIMPLEMENTED"
  | "UNKNOWN";

export type Flow001Error = {
  code: Flow001ErrorCode;
  message: string;
  recoverable: boolean;
  transition?: Flow001EvidenceStep["transition"];
  evidence?: Record<string, unknown>;
};

export type Flow001Result = {
  ok: boolean;
  context: Flow001Context | null;
  steps: Flow001EvidenceStep[];
  errors: Flow001Error[];
};
