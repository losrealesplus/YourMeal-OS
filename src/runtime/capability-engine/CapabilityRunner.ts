/**
 * CapabilityRunner — diagnose / (stub) recover / verify orchestration surface.
 * Recovery Engine will call these; it must not know Assets/Network internals.
 */

import { emitRuntimeCoreEvent } from "../runtime-core";
import { capabilityHealth } from "./CapabilityHealth";
import {
  deriveStateFromResults,
  setCapabilityLastResults,
  setCapabilityState,
} from "./CapabilityLifecycle";
import {
  getCapability,
  listCapabilities,
} from "./CapabilityRegistry";
import type {
  CapabilityContext,
  CapabilityPlatform,
  RuntimeCapability,
  RuntimeCheckResult,
  RuntimeRecoveryResult,
  RuntimeVerificationResult,
} from "./capability.types";

export type CapabilityRunResult = {
  capability: RuntimeCapability;
  results: RuntimeCheckResult[];
  health: ReturnType<typeof capabilityHealth>;
};

function supportsPlatform(
  capability: RuntimeCapability,
  platform: CapabilityPlatform,
): boolean {
  return capability.supportedPlatforms.includes(platform);
}

/** Run diagnose() for one capability and update lifecycle. */
export async function runCapability(
  id: string,
  ctx: CapabilityContext,
): Promise<CapabilityRunResult | null> {
  const capability = getCapability(id);
  if (!capability) return null;
  if (!supportsPlatform(capability, ctx.platform)) {
    setCapabilityState(id, "idle");
    return {
      capability,
      results: [],
      health: capabilityHealth(capability),
    };
  }

  setCapabilityState(id, "diagnosing");
  emitRuntimeCoreEvent("capability-diagnose-start", { id });

  let results: RuntimeCheckResult[] = [];
  try {
    results = await capability.diagnose(ctx);
  } catch (err) {
    results = [
      {
        checkId: `${id}.diagnose-throw`,
        checkName: "Diagnose threw",
        status: "fail",
        message: err instanceof Error ? err.message : String(err),
      },
    ];
  }

  setCapabilityLastResults(id, ctx.runAt, results);
  setCapabilityState(id, deriveStateFromResults(results));
  emitRuntimeCoreEvent("capability-diagnose-finish", {
    id,
    count: results.length,
  });

  return {
    capability,
    results,
    health: capabilityHealth(capability),
  };
}

/** Diagnose all registered capabilities (platform-filtered). */
export async function runAllCapabilities(
  ctx: CapabilityContext,
  options?: { capabilityIds?: string[] },
): Promise<CapabilityRunResult[]> {
  let list = listCapabilities().filter((c) =>
    supportsPlatform(c, ctx.platform),
  );
  if (options?.capabilityIds?.length) {
    const allow = new Set(options.capabilityIds);
    list = list.filter((c) => allow.has(c.id));
  }
  list = list.slice().sort((a, b) => a.id.localeCompare(b.id));

  const out: CapabilityRunResult[] = [];
  for (const cap of list) {
    const result = await runCapability(cap.id, ctx);
    if (result) out.push(result);
  }
  return out;
}

/** Stub recover — capabilities without recover() report unsupported. */
export async function recoverCapability(
  id: string,
  ctx: CapabilityContext,
): Promise<RuntimeRecoveryResult> {
  const capability = getCapability(id);
  if (!capability) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: `Unknown capability: ${id}`,
      supported: false,
    };
  }
  if (!capability.recover) {
    return {
      ok: false,
      code: "NOT_SUPPORTED",
      message: `Capability ${id} does not implement recover()`,
      supported: false,
    };
  }
  setCapabilityState(id, "recovering");
  try {
    return await capability.recover(ctx);
  } finally {
    // Leave state for verify / next diagnose to clarify.
  }
}

export async function verifyCapability(
  id: string,
  ctx: CapabilityContext,
): Promise<RuntimeVerificationResult> {
  const capability = getCapability(id);
  if (!capability) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: `Unknown capability: ${id}`,
      supported: false,
    };
  }
  if (!capability.verify) {
    return {
      ok: false,
      code: "NOT_SUPPORTED",
      message: `Capability ${id} does not implement verify()`,
      supported: false,
    };
  }
  setCapabilityState(id, "verifying");
  return capability.verify(ctx);
}
