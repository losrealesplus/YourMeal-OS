/**
 * Development Environment RuntimeCapability — Host/Doctor glance.
 * Full toolchain validation runs via `npm run doctor:env` (CLI drivers).
 * HOUSEKEEPING-002 — registerable capability only; does not modify Doctor Engine.
 */

import type {
  CapabilityContext,
  RuntimeCapability,
  RuntimeCheckResult,
} from "../capability.types";
import { registerCapability, getCapability } from "../CapabilityRegistry";

export const DEVELOPMENT_ENVIRONMENT_CAPABILITY_ID = "development-environment";

export const developmentEnvironmentCapability: RuntimeCapability = {
  id: DEVELOPMENT_ENVIRONMENT_CAPABILITY_ID,
  name: "Development Environment",
  category: "developer",
  version: "1.0.0",
  description:
    "Local toolchain integrity (JDK 21 · Android SDK · ADB · Gradle · Node). CLI: npm run doctor:env",
  supportedPlatforms: ["web", "android", "ios"],
  diagnose: async (
    _ctx: CapabilityContext,
  ): Promise<RuntimeCheckResult[]> => {
    // Browser Host cannot probe host JDK/SDK. Evidence points operators to CLI.
    return [
      {
        checkId: "dev-env.cli-contract",
        checkName: "CLI Development Environment",
        status: "info",
        message:
          "Full validation: npm run doctor:env · bootstrap: scripts/development/bootstrap.sh",
        recommendations: [
          "Run `npm run doctor:env` before build:mobile / assembleDebug",
          "Expected JDK major: 21 (ERROR on 22+)",
        ],
      },
      {
        checkId: "dev-env.jdk-policy",
        checkName: "JDK policy",
        status: "info",
        message: "Official JDK for YourMeal OS mobile builds: 21 (JBR / Temurin)",
      },
      {
        checkId: "dev-env.fopeba",
        checkName: "FOPEBA",
        status: "pass",
        message:
          "Drivers return Evidence + Recommendation + Recovery Hint — never auto-recover",
      },
    ];
  },
};

let installed = false;

export function registerDevelopmentEnvironmentCapability(): void {
  if (installed) return;
  if (!getCapability(DEVELOPMENT_ENVIRONMENT_CAPABILITY_ID)) {
    registerCapability(developmentEnvironmentCapability);
  }
  installed = true;
}

export function resetDevelopmentEnvironmentCapabilityFlag(): void {
  installed = false;
}
