import type {
  CapabilityContext,
  RuntimeCapability,
  RuntimeVerificationResult,
} from "../capability-engine";
import type { RuntimeRecovery } from "./recovery.types";
import { appendRecoveryTimeline, putRecovery } from "./RecoveryHistory";

/**
 * RecoveryRunner — executes Capability.recover() then Capability.verify().
 * No domain recovery logic lives here.
 */
export async function executeCapabilityRecovery(input: {
  recovery: RuntimeRecovery;
  capability: RuntimeCapability;
  ctx: CapabilityContext;
}): Promise<{
  recovery: RuntimeRecovery;
  verifyResult?: RuntimeVerificationResult;
}> {
  const { capability, ctx } = input;
  let recovery: RuntimeRecovery = {
    ...input.recovery,
    status: "running",
  };
  putRecovery(recovery);
  appendRecoveryTimeline({
    recoveryId: recovery.id,
    kind: "recovery-started",
    message: `Recovery started for ${capability.id}`,
  });

  if (!capability.recover) {
    recovery = {
      ...recovery,
      status: "failed",
      finishedAt: Date.now(),
      recoverMessage: "Recovery Not Supported",
    };
    putRecovery(recovery);
    appendRecoveryTimeline({
      recoveryId: recovery.id,
      kind: "not-supported",
      message: "Recovery Not Supported",
    });
    appendRecoveryTimeline({
      recoveryId: recovery.id,
      kind: "recovery-finished",
      message: "Recovery finished · not supported",
    });
    return { recovery };
  }

  try {
    const recoverResult = await capability.recover(ctx);
    recovery = {
      ...recovery,
      recoverMessage: recoverResult.message,
    };
    putRecovery(recovery);

    if (!recoverResult.ok || recoverResult.supported === false) {
      recovery = {
        ...recovery,
        status: "failed",
        finishedAt: Date.now(),
      };
      putRecovery(recovery);
      appendRecoveryTimeline({
        recoveryId: recovery.id,
        kind: recoverResult.supported === false ? "not-supported" : "recovery-finished",
        message: recoverResult.message,
      });
      if (recoverResult.supported !== false) {
        appendRecoveryTimeline({
          recoveryId: recovery.id,
          kind: "recovery-finished",
          message: `Recovery failed: ${recoverResult.message}`,
        });
      } else {
        appendRecoveryTimeline({
          recoveryId: recovery.id,
          kind: "recovery-finished",
          message: "Recovery Not Supported",
        });
      }
      return { recovery };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    recovery = {
      ...recovery,
      status: "failed",
      finishedAt: Date.now(),
      recoverMessage: message,
    };
    putRecovery(recovery);
    appendRecoveryTimeline({
      recoveryId: recovery.id,
      kind: "recovery-finished",
      message: `recover() failed: ${message}`,
    });
    return { recovery };
  }

  let verifyResult: RuntimeVerificationResult | undefined;
  if (capability.verify) {
    try {
      verifyResult = await capability.verify(ctx);
      appendRecoveryTimeline({
        recoveryId: recovery.id,
        kind: verifyResult.ok ? "verify-pass" : "verify-fail",
        message: verifyResult.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      verifyResult = {
        ok: false,
        code: "VERIFY_THREW",
        message: `verify() failed: ${message}`,
        supported: true,
      };
      appendRecoveryTimeline({
        recoveryId: recovery.id,
        kind: "verify-fail",
        message: verifyResult.message,
      });
    }
  } else {
    verifyResult = {
      ok: true,
      code: "NO_VERIFY",
      message: "No verify() — recover completed without post-check",
      supported: false,
    };
    appendRecoveryTimeline({
      recoveryId: recovery.id,
      kind: "verify-pass",
      message: verifyResult.message,
    });
  }

  const status = verifyResult.ok ? "success" : "failed";
  recovery = {
    ...recovery,
    status,
    finishedAt: Date.now(),
    verifyResult,
  };
  putRecovery(recovery);
  appendRecoveryTimeline({
    recoveryId: recovery.id,
    kind: "recovery-finished",
    message: `Recovery ${status}`,
  });

  return { recovery, verifyResult };
}
