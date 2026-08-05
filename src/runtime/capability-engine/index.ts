/**
 * Capability Engine — Developer Platform v1.6
 *
 * Spec: docs/05-architecture/CAPABILITY_ENGINE.md
 * ADR: docs/adr/0045-capability-engine.md
 *
 * All future modules implement RuntimeCapability.
 * Recovery Engine will only orchestrate Capability.recover/verify.
 */

export type {
  RuntimeCapability,
  RuntimeCheckResult,
  RuntimeCheckStatus,
  RuntimeRecoveryResult,
  RuntimeVerificationResult,
  CapabilityContext,
  CapabilityLifecycleState,
  CapabilityPlatform,
  CapabilityHealthSnapshot,
} from "./capability.types";
export { CAPABILITY_ENGINE_VERSION } from "./capability.types";

export {
  registerCapability,
  unregisterCapability,
  getCapability,
  listCapabilities,
  resetCapabilityRegistry,
} from "./CapabilityRegistry";

export {
  runCapability,
  runAllCapabilities,
  recoverCapability,
  verifyCapability,
  type CapabilityRunResult,
} from "./CapabilityRunner";

export {
  getCapabilityState,
  setCapabilityState,
  getCapabilityLastResults,
  resetCapabilityLifecycle,
  deriveStateFromResults,
} from "./CapabilityLifecycle";

export { capabilityHealth } from "./CapabilityHealth";

export { createCapabilityFromChecks } from "./createCapabilityFromChecks";

export {
  registerBuiltinCapabilities,
  resetBuiltinCapabilitiesFlag,
  FOUNDATION_CAPABILITIES,
  FOUNDATION_CAPABILITY_IDS,
} from "./capabilities/foundation";

export {
  registerDevelopmentEnvironmentCapability,
  resetDevelopmentEnvironmentCapabilityFlag,
  developmentEnvironmentCapability,
  DEVELOPMENT_ENVIRONMENT_CAPABILITY_ID,
} from "./capabilities/development-environment";

export {
  registerCapabilitiesModule,
  resetCapabilitiesModuleFlags,
} from "./register-capabilities-module";

export { CapabilitiesPanel } from "./CapabilitiesPanel";
