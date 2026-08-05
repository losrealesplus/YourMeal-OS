/**
 * Host module for Capability Engine registry view.
 */

import { createElement } from "react";
import {
  createEvidence,
  findModule,
  registerModule,
  type RuntimeModule,
} from "../runtime-core";
import { registerModuleRenderer } from "../runtime-host";
import { registerBuiltinCapabilities } from "./capabilities/foundation";
import { listCapabilities } from "./CapabilityRegistry";
import { CapabilitiesPanel } from "./CapabilitiesPanel";
import { CAPABILITY_ENGINE_VERSION } from "./capability.types";
import { capabilityHealth } from "./CapabilityHealth";

const capabilitiesModule: RuntimeModule = {
  id: "capabilities",
  title: "Capabilities",
  description: "RuntimeCapability registry · diagnose lifecycle",
  icon: "boxes",
  category: "Capabilities",
  version: CAPABILITY_ENGINE_VERSION,
  experimental: false,
  visible: true,
  permissions: "ENGINEERING",
  supports: ["web", "android", "ios"],
  health: () => {
    const n = listCapabilities().length;
    return { ok: n > 0, detail: `${n} capabilities registered` };
  },
  export: () =>
    createEvidence({
      source: "capabilities",
      category: "diagnostics",
      severity: "info",
      payload: {
        capabilities: listCapabilities().map((c) => ({
          id: c.id,
          name: c.name,
          health: capabilityHealth(c),
        })),
      },
    }),
};

let moduleInstalled = false;
let rendererInstalled = false;

export function registerCapabilitiesModule(): void {
  registerBuiltinCapabilities();
  if (!moduleInstalled) {
    if (!findModule("capabilities")) {
      registerModule(capabilitiesModule);
    }
    moduleInstalled = true;
  }
  if (!rendererInstalled) {
    registerModuleRenderer("capabilities", () =>
      createElement(CapabilitiesPanel),
    );
    rendererInstalled = true;
  }
}

export function resetCapabilitiesModuleFlags(): void {
  moduleInstalled = false;
  rendererInstalled = false;
}
