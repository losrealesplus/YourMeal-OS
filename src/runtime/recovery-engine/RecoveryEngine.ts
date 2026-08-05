/**
 * RecoveryEngine — orchestrates recover → verify. No domain repair logic.
 * DEVELOPER-PLATFORM-010 · Developer Platform v1.7
 *
 * Knows: Capability Engine · Recommendation Engine.
 * Never: Assets · Android · Supabase · Branding · Storage.
 * Never modifies: Doctor · Incident · Knowledge.
 */

import { createEvidence, emitRuntimeCoreEvent } from "../runtime-core";
import {
  getCapability,
  registerBuiltinCapabilities,
  type CapabilityContext,
  type RuntimeVerificationResult,
} from "../capability-engine";
import { detectRuntimePlatform } from "../runtime-host";
import {
  getRecommendation,
  type RuntimeRecommendation,
} from "../recommendation-engine";
import {
  appendRecoveryTimeline,
  exportRecoveryHistoryJson as historyToJson,
  getRecovery,
  getRecoveryHistory as readHistory,
  listRunningRecoveries,
  nextRecoveryId,
  putRecovery,
} from "./RecoveryHistory";
import { resolveRecoverableCapabilityId } from "./RecoveryPolicy";
import { executeCapabilityRecovery } from "./RecoveryRunner";
import type { RecoveryResult, RuntimeRecovery } from "./recovery.types";
import { RECOVERY_ENGINE_VERSION } from "./recovery.types";

export type { RuntimeRecovery, RecoveryResult };

export type RunRecoveryOptions = {
  recommendationId: string;
  /** Optional override — normally resolved from recommendation.capabilityIds */
  capabilityId?: string;
  ctx?: CapabilityContext;
};

function defaultCtx(): CapabilityContext {
  return {
    platform: detectRuntimePlatform(),
    runAt: new Date().toISOString(),
  };
}

function failNotSupported(input: {
  recommendationId: string;
  capabilityId: string;
  message: string;
}): RuntimeRecovery {
  const recovery: RuntimeRecovery = {
    id: nextRecoveryId(),
    capabilityId: input.capabilityId,
    recommendationId: input.recommendationId,
    startedAt: Date.now(),
    finishedAt: Date.now(),
    status: "failed",
    recoverMessage: input.message,
    evidences: [],
  };
  putRecovery(recovery);
  appendRecoveryTimeline({
    recoveryId: recovery.id,
    kind: "not-supported",
    message: input.message,
  });
  appendRecoveryTimeline({
    recoveryId: recovery.id,
    kind: "recovery-finished",
    message: input.message,
  });
  emitRuntimeCoreEvent("recovery-finished", {
    recoveryId: recovery.id,
    status: "failed",
    reason: "not-supported",
  });
  return recovery;
}

/**
 * Run recovery for a recommendation (manual only).
 */
export async function runRecovery(
  options: RunRecoveryOptions,
): Promise<RuntimeRecovery> {
  registerBuiltinCapabilities();

  const recommendation: RuntimeRecommendation | undefined = getRecommendation(
    options.recommendationId,
  );
  if (!recommendation) {
    throw new Error(`Recommendation not found: ${options.recommendationId}`);
  }

  const capabilityId =
    options.capabilityId ?? resolveRecoverableCapabilityId(recommendation);

  if (!capabilityId) {
    return failNotSupported({
      recommendationId: recommendation.id,
      capabilityId: recommendation.capabilityIds[0] ?? "unknown",
      message: "Recovery Not Supported",
    });
  }

  const capability = getCapability(capabilityId);
  if (!capability?.recover) {
    return failNotSupported({
      recommendationId: recommendation.id,
      capabilityId,
      message: "Recovery Not Supported",
    });
  }

  const pending: RuntimeRecovery = {
    id: nextRecoveryId(),
    capabilityId,
    recommendationId: recommendation.id,
    startedAt: Date.now(),
    status: "pending",
    evidences: [],
  };
  putRecovery(pending);

  emitRuntimeCoreEvent("recovery-started", {
    recoveryId: pending.id,
    capabilityId,
    recommendationId: recommendation.id,
  });

  const { recovery, verifyResult } = await executeCapabilityRecovery({
    recovery: pending,
    capability,
    ctx: options.ctx ?? defaultCtx(),
  });

  const evidence = createEvidence({
    source: "recovery-engine",
    category: "diagnostics",
    severity: recovery.status === "success" ? "info" : "warning",
    payload: {
      recoveryId: recovery.id,
      capabilityId,
      recommendationId: recommendation.id,
      status: recovery.status,
      recoverMessage: recovery.recoverMessage,
      verify: verifyResult
        ? {
            ok: verifyResult.ok,
            code: verifyResult.code,
            message: verifyResult.message,
          }
        : null,
    },
  });

  const withEvidence: RuntimeRecovery = {
    ...recovery,
    evidences: [...recovery.evidences, evidence.id],
  };
  putRecovery(withEvidence);
  appendRecoveryTimeline({
    recoveryId: recovery.id,
    kind: "evidence-linked",
    message: `Evidence linked: ${evidence.id}`,
    evidenceId: evidence.id,
  });

  emitRuntimeCoreEvent("recovery-finished", {
    recoveryId: withEvidence.id,
    status: withEvidence.status,
    capabilityId,
  });

  return getRecovery(withEvidence.id) ?? withEvidence;
}

export function verifyRecovery(
  recoveryId: string,
): RuntimeVerificationResult | undefined {
  const recovery = getRecovery(recoveryId);
  if (!recovery) return undefined;
  if (recovery.verifyResult) return recovery.verifyResult;

  registerBuiltinCapabilities();
  const capability = getCapability(recovery.capabilityId);
  if (!capability?.verify) {
    return {
      ok: false,
      code: "NO_VERIFY",
      message: "Capability has no verify()",
      supported: false,
    };
  }
  return undefined;
}

export function cancelRecovery(recoveryId: string): RuntimeRecovery | undefined {
  const recovery = getRecovery(recoveryId);
  if (!recovery) return undefined;
  if (
    recovery.status === "success" ||
    recovery.status === "failed" ||
    recovery.status === "cancelled"
  ) {
    return recovery;
  }
  const cancelled: RuntimeRecovery = {
    ...recovery,
    status: "cancelled",
    finishedAt: Date.now(),
  };
  putRecovery(cancelled);
  appendRecoveryTimeline({
    recoveryId,
    kind: "cancelled",
    message: "Recovery cancelled",
  });
  emitRuntimeCoreEvent("recovery-cancelled", { recoveryId });
  return getRecovery(recoveryId);
}

export function getRecoveryHistory(): RuntimeRecovery[] {
  return readHistory();
}

/** Structured history for export callers (JSON-serializable array). */
export function exportRecoveryHistory(): RuntimeRecovery[] {
  return readHistory();
}

/** Full JSON document (history + timeline). */
export function exportRecoveryHistoryDocument(): string {
  return historyToJson();
}

export function getRecoveryEngineInfo(): {
  version: string;
  history: number;
  running: number;
} {
  return {
    version: RECOVERY_ENGINE_VERSION,
    history: readHistory().length,
    running: listRunningRecoveries().length,
  };
}
