/**
 * Dev Bootstrap Mode — synthetic identity for local UX (`VITE_BOOTSTRAP_MODE`).
 *
 * App Bootstrap Pipeline (startup order) lives in `./pipeline` — ADR 0050 / 0051.
 * Do not conflate the two.
 */
export { isBootstrapMode } from "./flag";
export {
  BOOTSTRAP_PROFILES,
  BOOTSTRAP_TENANT_ID,
  getBootstrapProfile,
  getBootstrapProfileByUserId,
  type BootstrapProfile,
  type BootstrapProfileId,
} from "./profiles";
export {
  clearBootstrapProfile,
  getActiveBootstrapProfile,
  getActiveBootstrapSession,
  setBootstrapProfile,
  subscribeBootstrapAuth,
} from "./session-store";
export { IdentityProvider } from "@/identity/identity-provider";
export { BootstrapShell } from "./BootstrapShell";
export { BootstrapModeBanner } from "./BootstrapModeBanner";
