/**
 * Foundation capabilities — register existing Doctor check groups.
 * Logic unchanged; only wrapped as RuntimeCapability.
 * DEVELOPER-PLATFORM-009
 */

import { androidChecks } from "../../runtime-doctor/checks/android-checks";
import { assetsChecks } from "../../runtime-doctor/checks/assets-checks";
import { brandingChecks } from "../../runtime-doctor/checks/branding-checks";
import { runtimeChecks } from "../../runtime-doctor/checks/runtime-checks";
import { supabaseChecks } from "../../runtime-doctor/checks/supabase-checks";
import { createCapabilityFromChecks } from "../createCapabilityFromChecks";
import { registerCapability, getCapability } from "../CapabilityRegistry";
import type { RuntimeCapability } from "../capability.types";
import {
  recoverRuntimeCapability,
  verifyRuntimeCapability,
} from "../runtime-recovery";
import { registerDevelopmentEnvironmentCapability, resetDevelopmentEnvironmentCapabilityFlag } from "./development-environment";

export const FOUNDATION_CAPABILITIES: RuntimeCapability[] = [
  createCapabilityFromChecks({
    id: "assets",
    name: "Assets",
    category: "health",
    description: "Asset resolution ledger · logo · __l5e",
    checks: assetsChecks,
  }),
  createCapabilityFromChecks({
    id: "branding",
    name: "Branding",
    category: "application",
    description: "Tenant brand config probes",
    checks: brandingChecks,
  }),
  createCapabilityFromChecks({
    id: "runtime",
    name: "Runtime",
    category: "system",
    description: "Registry · modules · suite gate · recoverable dismiss",
    checks: runtimeChecks,
    recover: recoverRuntimeCapability,
    verify: verifyRuntimeCapability,
  }),
  createCapabilityFromChecks({
    id: "android",
    name: "Android",
    category: "system",
    description: "Capacitor / Android platform probe",
    checks: androidChecks,
    supportedPlatforms: ["web", "android", "ios"],
  }),
  createCapabilityFromChecks({
    id: "supabase",
    name: "Supabase",
    category: "network",
    description: "Supabase env / connectivity probes",
    checks: supabaseChecks,
  }),
];

let installed = false;

export function registerBuiltinCapabilities(): void {
  if (installed) return;
  for (const cap of FOUNDATION_CAPABILITIES) {
    if (!getCapability(cap.id)) registerCapability(cap);
  }
  registerDevelopmentEnvironmentCapability();
  installed = true;
}

export function resetBuiltinCapabilitiesFlag(): void {
  installed = false;
  resetDevelopmentEnvironmentCapabilityFlag();
}

export const FOUNDATION_CAPABILITY_IDS = FOUNDATION_CAPABILITIES.map(
  (c) => c.id,
);
