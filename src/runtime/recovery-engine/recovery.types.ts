/**
 * Recovery Engine contracts — orchestration only.
 * DEVELOPER-PLATFORM-010 · Developer Platform v1.7
 *
 * Recovery never knows Assets/Android/Supabase — only Capability + Recommendation.
 */

import type { RuntimeVerificationResult } from "../capability-engine";

export type RecoveryStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export type RuntimeRecovery = {
  id: string;
  capabilityId: string;
  recommendationId: string;
  startedAt: number;
  finishedAt?: number;
  status: RecoveryStatus;
  verifyResult?: RuntimeVerificationResult;
  recoverMessage?: string;
  evidences: string[];
};

/** Alias — recovery run result (same as RuntimeRecovery). */
export type RecoveryResult = RuntimeRecovery;

export type RecoveryTimelineEvent = {
  id: string;
  recoveryId: string;
  timestamp: number;
  kind:
    | "recovery-started"
    | "recovery-finished"
    | "verify-pass"
    | "verify-fail"
    | "not-supported"
    | "cancelled"
    | "evidence-linked";
  message: string;
  evidenceId?: string;
};

export const RECOVERY_ENGINE_VERSION = "1.7.0";
