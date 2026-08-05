/**
 * Register Recovery Host module.
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import { registerBuiltinCapabilities } from "../capability-engine";
import {
  exportRecoveryHistory,
  getRecoveryEngineInfo,
} from "./RecoveryEngine";
import { RecoveryPanel } from "./RecoveryPanel";
import { RECOVERY_ENGINE_VERSION } from "./recovery.types";

const recoveryModule: RuntimeModule = {
  id: "recovery",
  title: "Recovery",
  description: "Orchestrate Capability.recover → verify",
  icon: "wrench",
  category: "Recovery",
  version: RECOVERY_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: () => {
    const info = getRecoveryEngineInfo();
    return {
      ok: info.running === 0,
      detail: `${info.history} history · ${info.running} running`,
    };
  },
  export: () =>
    createEvidence({
      source: "recovery",
      category: "diagnostics",
      severity: "info",
      payload: { history: exportRecoveryHistory() },
    }),
};

let moduleInstalled = false;
let rendererInstalled = false;

export function registerRecoveryModule(): void {
  registerBuiltinCapabilities();
  if (!moduleInstalled) {
    if (!findModule("recovery")) {
      registerModule(recoveryModule);
    }
    moduleInstalled = true;
  }
  if (!rendererInstalled) {
    registerModuleRenderer("recovery", () => createElement(RecoveryPanel));
    rendererInstalled = true;
  }
}

export function resetRecoveryModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
}
