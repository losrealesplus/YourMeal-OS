/**
 * Runtime Secret Gateway — hidden command palette for YMOS Runtime tooling.
 *
 * Public API (only):
 *   installRuntimeSecretGateway()
 *   disposeRuntimeSecretGateway()
 *
 * Phrase (v1): "YMOS Horus" (case-insensitive) → opens Runtime Inspector via event.
 * No UI · No buttons · No localStorage · RAM only.
 */
export {
  installRuntimeSecretGateway,
  disposeRuntimeSecretGateway,
  matchSecretCommand,
  SECRET_COMMANDS,
} from "./runtime-secret-gateway";
export { RuntimeSecretBuffer } from "./runtime-secret-buffer";
export {
  YMOS_RUNTIME_OPEN_EVENT,
  YMOS_RUNTIME_TOGGLE_EVENT,
  YMOS_RUNTIME_CLOSE_EVENT,
  YMOS_SECRET_GATEWAY_TRIGGERED_EVENT,
  dispatchRuntimeOpen,
  dispatchRuntimeToggle,
  dispatchSecretGatewayTriggered,
} from "./runtime-secret-events";
export type { YmosSecretGatewayTriggeredDetail } from "./runtime-secret-events";
