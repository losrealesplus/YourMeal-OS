import { afterEach, describe, expect, it } from "vitest";
import {
  deriveApplicationReadySnapshot,
  isApplicationReady,
} from "./deriveApplicationReady";
import {
  emitApplicationLifecycle,
  onApplicationLifecycle,
  resetApplicationLifecycleListeners,
} from "./ApplicationLifecycleEvents";
import type { BootstrapResult } from "@/bootstrap/pipeline/types";
import type { BootstrapIdentitySnapshot } from "@/bootstrap/pipeline/BootstrapIdentityStore";

function boot(
  status: BootstrapResult["status"],
): BootstrapResult {
  return {
    id: "r1",
    status,
    currentStage: status === "ready" ? "ready" : "authentication",
    stages: [],
    mode: "cold",
    errors: status === "failed"
      ? [
          {
            code: "ENV_INVALID",
            stage: "environment",
            message: "missing",
            recoverable: true,
          },
        ]
      : [],
  };
}

function identity(
  partial: Partial<BootstrapIdentitySnapshot>,
): BootstrapIdentitySnapshot {
  return {
    userId: null,
    roles: [],
    profile: null,
    tenant: null,
    homePath: null,
    status: "idle",
    updatedAt: 0,
    ...partial,
  };
}

describe("Application Ready Gate derivation", () => {
  afterEach(() => {
    resetApplicationLifecycleListeners();
  });

  it("is the single decision: Ready only when bootstrap ready or identity ready", () => {
    expect(isApplicationReady(null, null)).toBe(false);
    expect(isApplicationReady(boot("running"), null)).toBe(false);
    expect(isApplicationReady(boot("auth_required"), null)).toBe(false);
    expect(isApplicationReady(boot("ready"), null)).toBe(true);
    expect(
      isApplicationReady(
        boot("auth_required"),
        identity({ userId: "u1", status: "ready" }),
      ),
    ).toBe(true);
  });

  it("maps explicit lifecycle states", () => {
    expect(deriveApplicationReadySnapshot(null, null).state).toBe(
      "NOT_STARTED",
    );
    expect(deriveApplicationReadySnapshot(boot("running"), null).state).toBe(
      "BOOTSTRAPPING",
    );
    expect(
      deriveApplicationReadySnapshot(boot("auth_required"), null).state,
    ).toBe("AUTH_REQUIRED");
    expect(deriveApplicationReadySnapshot(boot("ready"), null).state).toBe(
      "READY",
    );
    expect(deriveApplicationReadySnapshot(boot("failed"), null).state).toBe(
      "FAILED",
    );
  });

  it("emits application lifecycle events on state publish", () => {
    const names: string[] = [];
    onApplicationLifecycle((e) => names.push(e.name));
    emitApplicationLifecycle("BOOTSTRAPPING");
    emitApplicationLifecycle("READY");
    expect(names).toEqual([
      "application:bootstrapping",
      "application:ready",
    ]);
  });
});

describe("ensureApplicationReady", () => {
  it("resolves immediately when already ready", async () => {
    const orch = await import("@/bootstrap/pipeline/BootstrapOrchestrator");
    const store = await import("@/bootstrap/pipeline/BootstrapIdentityStore");
    orch.resetBootstrapOrchestrator();
    store.resetBootstrapIdentitySnapshot();

    // Seed identity ready without full pipeline
    store.publishBootstrapIdentitySnapshot({
      userId: "u1",
      roles: [],
      profile: null,
      tenant: null,
      homePath: "/app",
      status: "ready",
    });

    const { ensureApplicationReady } = await import("./ensureApplicationReady");
    const snap = await ensureApplicationReady({ timeoutMs: 2000 });
    expect(snap.isReady).toBe(true);

    orch.resetBootstrapOrchestrator();
    store.resetBootstrapIdentitySnapshot();
  });
});
