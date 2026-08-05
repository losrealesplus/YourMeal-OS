/**
 * Bridge DoctorCheck arrays into RuntimeCapability without changing check logic.
 * Capability Engine owns lifecycle; checks stay observe-only.
 */

import type { DoctorCheck } from "../runtime-doctor/DoctorCheck";
import type {
  CapabilityContext,
  CapabilityPlatform,
  RuntimeCapability,
  RuntimeCheckResult,
  RuntimeRecoveryResult,
  RuntimeVerificationResult,
} from "./capability.types";

export type CreateCapabilityFromChecksInput = {
  id: string;
  name: string;
  category: string;
  description?: string;
  version?: string;
  supportedPlatforms?: CapabilityPlatform[];
  checks: DoctorCheck[];
  /** When true, expose recover/verify stubs that return NOT_SUPPORTED (panel shows YES for contract presence — user wants YES/NO for recover supported). */
  exposeRecoverStub?: boolean;
  exposeVerifyStub?: boolean;
};

const ALL: CapabilityPlatform[] = ["web", "android", "ios"];

/**
 * Wrap existing Doctor checks as a RuntimeCapability.
 * recover/verify omitted by default → Recover Supported = NO.
 */
export function createCapabilityFromChecks(
  input: CreateCapabilityFromChecksInput,
): RuntimeCapability {
  const platforms = input.supportedPlatforms?.length
    ? input.supportedPlatforms
    : ALL;

  const capability: RuntimeCapability = {
    id: input.id,
    name: input.name,
    category: input.category,
    description: input.description,
    version: input.version ?? "1.0.0",
    supportedPlatforms: platforms,
    diagnose: async (ctx: CapabilityContext): Promise<RuntimeCheckResult[]> => {
      const results: RuntimeCheckResult[] = [];
      for (const check of input.checks) {
        if (
          check.supports?.length &&
          !check.supports.includes(ctx.platform)
        ) {
          results.push({
            checkId: check.id,
            checkName: check.name,
            status: "skip",
            message: `Skipped on ${ctx.platform}`,
            soft: check.soft,
            severity: check.severity,
            durationMs: 0,
          });
          continue;
        }
        const t0 = Date.now();
        try {
          const result = await check.run({
            platform: ctx.platform,
            runAt: ctx.runAt,
            signal: ctx.signal,
          });
          results.push({
            checkId: check.id,
            checkName: check.name,
            status: result.status,
            message: result.message,
            payload: result.payload,
            recommendations: result.recommendations,
            severity: result.severity ?? check.severity,
            soft: check.soft,
            durationMs: Date.now() - t0,
          });
        } catch (err) {
          results.push({
            checkId: check.id,
            checkName: check.name,
            status: "fail",
            message: err instanceof Error ? err.message : String(err),
            severity: check.severity,
            soft: check.soft,
            durationMs: Date.now() - t0,
          });
        }
      }
      return results;
    },
  };

  if (input.exposeRecoverStub) {
    capability.recover = async (): Promise<RuntimeRecoveryResult> => ({
      ok: false,
      code: "NOT_IMPLEMENTED",
      message: "Recovery not implemented for this capability yet",
      supported: false,
    });
  }

  if (input.exposeVerifyStub) {
    capability.verify = async (): Promise<RuntimeVerificationResult> => ({
      ok: false,
      code: "NOT_IMPLEMENTED",
      message: "Verify not implemented for this capability yet",
      supported: false,
    });
  }

  return capability;
}
