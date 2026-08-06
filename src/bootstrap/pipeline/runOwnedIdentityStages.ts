/**
 * Run Session → Tenant → Branding → Navigation with Stage ownership.
 * Used when a session appears after auth_required (login) or when the
 * Identity Provider observes INITIAL_SESSION and the cold pipeline has not
 * yet published a ready snapshot for that user.
 *
 * Providers must call this instead of loading identity themselves.
 */

import { createBootstrapContext } from "./BootstrapContext";
import { SessionStage } from "./stages/SessionStage";
import { TenantStage } from "./stages/TenantStage";
import { BrandingStage } from "./stages/BrandingStage";
import { NavigationStage } from "./stages/NavigationStage";
import {
  getBootstrapIdentitySnapshot,
  type BootstrapIdentitySnapshot,
} from "./BootstrapIdentityStore";
import type { BootstrapRunMode } from "./types";

const IDENTITY_STAGES = [
  SessionStage,
  TenantStage,
  BrandingStage,
  NavigationStage,
] as const;

const inflightByUser = new Map<string, Promise<BootstrapIdentitySnapshot>>();

export async function runOwnedIdentityStages(input: {
  userId: string;
  mode?: BootstrapRunMode;
}): Promise<BootstrapIdentitySnapshot> {
  const existing = inflightByUser.get(input.userId);
  if (existing) return existing;

  const promise = (async () => {
    const ready = getBootstrapIdentitySnapshot();
    if (
      ready.status === "ready" &&
      ready.userId === input.userId &&
      ready.updatedAt > Date.now() - 5_000
    ) {
      return ready;
    }

    const ctx = createBootstrapContext(
      `id-${Date.now().toString(36)}`,
      input.mode ?? "cold",
    );
    ctx.hasSession = true;
    ctx.userId = input.userId;

    for (const stage of IDENTITY_STAGES) {
      const outcome = await stage.run(ctx);
      if (outcome.patch) {
        if (outcome.patch.hasSession !== undefined) {
          ctx.hasSession = outcome.patch.hasSession;
        }
        if (outcome.patch.userId !== undefined) ctx.userId = outcome.patch.userId;
        if (outcome.patch.tenantId !== undefined) {
          ctx.tenantId = outcome.patch.tenantId;
        }
        if (outcome.patch.homePath !== undefined) {
          ctx.homePath = outcome.patch.homePath;
        }
        if (outcome.patch.brandProvenance !== undefined) {
          ctx.brandProvenance = outcome.patch.brandProvenance;
        }
      }
      if (outcome.status === "failed" && stage.blocking) {
        break;
      }
    }

    return getBootstrapIdentitySnapshot();
  })().finally(() => {
    inflightByUser.delete(input.userId);
  });

  inflightByUser.set(input.userId, promise);
  return promise;
}

/** Test helper */
export function resetOwnedIdentityStagesInflight(): void {
  inflightByUser.clear();
}
