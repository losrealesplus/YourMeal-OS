/**
 * Runtime capability checks — Registry / Host / builtins.
 * DEVELOPER-PLATFORM-004
 */

import {
  BUILTIN_MODULE_IDS,
  findModule,
  getModules,
} from "../../runtime-core";
import type { DoctorCheck } from "../DoctorCheck";

export const runtimeChecks: DoctorCheck[] = [
  {
    id: "runtime.registry-populated",
    name: "Registry populated",
    capability: "runtime",
    severity: "error",
    description: "At least one Runtime Module is registered",
    run: () => {
      const mods = getModules();
      if (mods.length === 0) {
        return {
          status: "fail",
          message: "Runtime Registry is empty",
          recommendations: [
            "Call registerBuiltinRuntimeModules() and registerLegacyHostModules() at boot",
          ],
          payload: { count: 0 },
        };
      }
      return {
        status: "pass",
        message: `${mods.length} module(s) registered`,
        payload: { ids: mods.map((m) => m.id) },
      };
    },
  },
  {
    id: "runtime.builtins-present",
    name: "Health builtins present",
    capability: "runtime",
    severity: "error",
    description: "Assets · DOM · Consistency bridges registered",
    run: () => {
      const missing = BUILTIN_MODULE_IDS.filter((id) => !findModule(id));
      if (missing.length) {
        return {
          status: "fail",
          message: `Missing builtins: ${missing.join(", ")}`,
          recommendations: ["Ensure registerBuiltinRuntimeModules() runs on client boot"],
          payload: { missing },
        };
      }
      return {
        status: "pass",
        message: "Assets · DOM · Consistency registered",
        payload: { builtins: BUILTIN_MODULE_IDS },
      };
    },
  },
  {
    id: "runtime.doctor-module",
    name: "Doctor module registered",
    capability: "runtime",
    severity: "warning",
    soft: true,
    run: () => {
      if (!findModule("doctor")) {
        return {
          status: "warning",
          message: "Doctor Runtime Module not in Registry",
          recommendations: ["Call registerDoctorModule() at boot"],
        };
      }
      return {
        status: "pass",
        message: "Doctor module present in Registry",
      };
    },
  },
  {
    id: "runtime.portal-host-ready",
    name: "Host modules discoverable",
    capability: "runtime",
    severity: "info",
    soft: true,
    run: () => {
      const mods = getModules().filter((m) => m.visible !== false);
      const health = mods.filter((m) => m.category === "Health");
      return {
        status: mods.length > 0 ? "pass" : "fail",
        message:
          mods.length > 0
            ? `Host can list ${mods.length} visible module(s) (${health.length} Health)`
            : "No visible modules for Host",
        payload: {
          visible: mods.map((m) => m.id),
          health: health.map((m) => m.id),
        },
      };
    },
  },
];
