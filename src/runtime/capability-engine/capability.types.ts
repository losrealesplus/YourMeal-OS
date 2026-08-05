/**
 * Capability Engine contracts — unique lifecycle for all platform capabilities.
 * DEVELOPER-PLATFORM-009 · Developer Platform v1.6
 *
 * Recovery Engine will only call Capability.recover() / verify() — never Assets/Network directly.
 */

import type { RuntimePlatform, RuntimeSeverity } from "../runtime-core";

export type CapabilityPlatform = RuntimePlatform;

/** Official lifecycle (per capability instance). */
export type CapabilityLifecycleState =
  | "idle"
  | "diagnosing"
  | "healthy"
  | "warning"
  | "error"
  | "recovering"
  | "verifying";

export type RuntimeCheckStatus =
  | "pass"
  | "warning"
  | "fail"
  | "info"
  | "skip";

/** Result of one check produced by Capability.diagnose(). */
export type RuntimeCheckResult = {
  checkId: string;
  checkName: string;
  status: RuntimeCheckStatus;
  message: string;
  payload?: unknown;
  recommendations?: string[];
  severity?: RuntimeSeverity;
  soft?: boolean;
  durationMs?: number;
};

export type RuntimeRecoveryResult = {
  ok: boolean;
  code: string;
  message: string;
  /** NOT_IMPLEMENTED until Recovery Engine / capability recover(). */
  supported: boolean;
};

export type RuntimeVerificationResult = {
  ok: boolean;
  code: string;
  message: string;
  supported: boolean;
  checks?: RuntimeCheckResult[];
};

export type CapabilityContext = {
  platform: CapabilityPlatform;
  runAt: string;
  signal?: AbortSignal;
};

/**
 * Permanent capability contract — all future modules must implement this.
 */
export type RuntimeCapability = {
  id: string;
  name: string;
  category: string;
  version?: string;
  description?: string;
  supportedPlatforms: CapabilityPlatform[];
  diagnose: (ctx: CapabilityContext) => Promise<RuntimeCheckResult[]>;
  recover?: (ctx: CapabilityContext) => Promise<RuntimeRecoveryResult>;
  verify?: (ctx: CapabilityContext) => Promise<RuntimeVerificationResult>;
};

export type CapabilityHealthSnapshot = {
  capabilityId: string;
  state: CapabilityLifecycleState;
  lastRunAt: string | null;
  lastResults: RuntimeCheckResult[];
  recoverSupported: boolean;
  verifySupported: boolean;
};

export const CAPABILITY_ENGINE_VERSION = "1.6.0";
