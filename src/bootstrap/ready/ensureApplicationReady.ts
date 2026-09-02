/**
 * Wait until the application lifecycle reaches READY (or FAIL).
 * Used by Product Core route guards — not by public auth/landing.
 */

import { getBootstrapOrchestrator } from "@/bootstrap/pipeline/BootstrapOrchestrator";
import {
  getBootstrapIdentitySnapshot,
  subscribeBootstrapIdentitySnapshot,
} from "@/bootstrap/pipeline/BootstrapIdentityStore";
import {
  deriveApplicationReadySnapshot,
  type ApplicationReadySnapshot,
} from "./deriveApplicationReady";

export class ApplicationReadyFailedError extends Error {
  readonly snapshot: ApplicationReadySnapshot;
  constructor(snapshot: ApplicationReadySnapshot) {
    super(
      snapshot.bootstrap?.errors[0]?.message ??
        "Application bootstrap failed before Ready",
    );
    this.name = "ApplicationReadyFailedError";
    this.snapshot = snapshot;
  }
}

function currentSnapshot(): ApplicationReadySnapshot {
  return deriveApplicationReadySnapshot(
    getBootstrapOrchestrator().getResult(),
    getBootstrapIdentitySnapshot(),
  );
}

/**
 * Resolves when `isReady === true`.
 * Rejects on FAILED. AUTH_REQUIRED keeps waiting (caller should be authenticated).
 */
export function ensureApplicationReady(
  options?: { timeoutMs?: number },
): Promise<ApplicationReadySnapshot> {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const existing = currentSnapshot();
  if (existing.isReady) return Promise.resolve(existing);
  if (existing.isFailed) {
    return Promise.reject(new ApplicationReadyFailedError(existing));
  }

  return new Promise<ApplicationReadySnapshot>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      cleanup();
      if (!settled) {
        settled = true;
        reject(new ApplicationReadyFailedError(currentSnapshot()));
      }
    }, timeoutMs);

    const evaluate = () => {
      const snap = currentSnapshot();
      if (snap.isReady) {
        cleanup();
        if (!settled) {
          settled = true;
          resolve(snap);
        }
        return;
      }
      if (snap.isFailed) {
        cleanup();
        if (!settled) {
          settled = true;
          reject(new ApplicationReadyFailedError(snap));
        }
      }
    };

    const unsubBoot = getBootstrapOrchestrator().subscribe(() => evaluate());
    const unsubId = subscribeBootstrapIdentitySnapshot(() => evaluate());

    function cleanup() {
      clearTimeout(timer);
      unsubBoot();
      unsubId();
    }

    // Kick cold pipeline if somehow not started (SSR/tests).
    void getBootstrapOrchestrator().run({ mode: "cold" }).then(() => evaluate());
    evaluate();
  });
}
