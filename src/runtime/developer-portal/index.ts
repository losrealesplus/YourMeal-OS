/**
 * Developer Portal — official engineering discovery + authentication gate.
 *
 * Discovery: triple-tap TenantLogo
 * Auth: passphrase (YMOS Horus → Runtime Suite via ymos-runtime-toggle)
 *
 * Spec: docs/05-architecture/DEVELOPER_PORTAL.md
 * ADR: docs/adr/0037-developer-portal.md
 */
export { DeveloperPortal } from "./DeveloperPortal";
export { useDeveloperPortal } from "./useDeveloperPortal";
export {
  createTripleTapDetector,
  TRIPLE_TAP_WINDOW_MS,
  TRIPLE_TAP_COUNT,
} from "./triple-tap";
export {
  PASSPHRASE_CATALOG,
  matchPassphrase,
  normalizePassphrase,
} from "./passphrase";
export type { PassphraseEntry, PassphraseAction } from "./passphrase";
export {
  requestDeveloperPortal,
  emitDeveloperPortalOpened,
  YMOS_DEVELOPER_PORTAL_DISCOVER_EVENT,
  DEVELOPER_PORTAL_OPENED_EVENT,
} from "./developer-portal-events";
export type { DeveloperPortalOpenedDetail } from "./developer-portal-events";
