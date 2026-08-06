import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BootstrapOrchestrator,
  onBootstrapLifecycle,
  resetBootstrapLifecycleListeners,
  resetBootstrapOrchestrator,
  type BootstrapStageHandler,
} from "./index";

function stage(
  id: BootstrapStageHandler["id"],
  blocking: boolean,
  run: BootstrapStageHandler["run"],
): BootstrapStageHandler {
  return { id, blocking, run };
}

describe("BootstrapOrchestrator", () => {
  afterEach(() => {
    resetBootstrapOrchestrator();
    resetBootstrapLifecycleListeners();
  });

  it("defines exactly one ordered pipeline of eight stages before Ready", async () => {
    const { BOOTSTRAP_PIPELINE_STAGES } = await import("./BootstrapPipeline");
    expect(BOOTSTRAP_PIPELINE_STAGES.map((s) => s.id)).toEqual([
      "app_launch",
      "environment",
      "services",
      "authentication",
      "session",
      "tenant",
      "branding",
      "navigation",
    ]);
  });

  it("runs stages sequentially and reaches ready", async () => {
    const order: string[] = [];
    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => {
        order.push("app_launch");
        return { status: "ok" };
      }),
      stage("environment", true, async () => {
        order.push("environment");
        return { status: "ok" };
      }),
      stage("services", true, async () => {
        order.push("services");
        return { status: "ok" };
      }),
      stage("authentication", true, async () => {
        order.push("authentication");
        return {
          status: "ok",
          patch: { hasSession: true, userId: "u1" },
        };
      }),
      stage("session", true, async () => {
        order.push("session");
        return { status: "ok" };
      }),
      stage("tenant", true, async () => {
        order.push("tenant");
        return { status: "ok" };
      }),
      stage("branding", false, async () => {
        order.push("branding");
        return { status: "degraded", patch: { brandProvenance: "fallback" } };
      }),
      stage("navigation", true, async () => {
        order.push("navigation");
        return { status: "ok" };
      }),
    ];

    const orch = new BootstrapOrchestrator(stages);
    const result = await orch.run({ mode: "cold" });

    expect(order).toEqual([
      "app_launch",
      "environment",
      "services",
      "authentication",
      "session",
      "tenant",
      "branding",
      "navigation",
    ]);
    expect(result.status).toBe("ready");
    expect(result.currentStage).toBe("ready");
    expect(result.brandProvenance).toBe("fallback");
    expect(orch.isReady()).toBe(true);
  });

  it("stops on blocking failure", async () => {
    const later = vi.fn(async () => ({ status: "ok" as const }));
    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => ({ status: "ok" })),
      stage("environment", true, async () => ({
        status: "failed",
        error: {
          code: "ENV_INVALID",
          stage: "environment",
          message: "missing",
          recoverable: true,
        },
      })),
      stage("services", true, later),
    ];

    const orch = new BootstrapOrchestrator(stages);
    const result = await orch.run({ mode: "cold" });

    expect(result.status).toBe("failed");
    expect(result.currentStage).toBe("environment");
    expect(later).not.toHaveBeenCalled();
    expect(result.errors[0]?.code).toBe("ENV_INVALID");
  });

  it("stops with auth_required without failing the run", async () => {
    const session = vi.fn(async () => ({ status: "ok" as const }));
    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => ({ status: "ok" })),
      stage("environment", true, async () => ({ status: "ok" })),
      stage("services", true, async () => ({ status: "ok" })),
      stage("authentication", true, async () => ({
        status: "auth_required",
        patch: { hasSession: false, userId: null },
      })),
      stage("session", true, session),
    ];

    const orch = new BootstrapOrchestrator(stages);
    const result = await orch.run({ mode: "cold" });

    expect(result.status).toBe("auth_required");
    expect(session).not.toHaveBeenCalled();
    expect(orch.isReady()).toBe(false);
  });

  it("continues after non-blocking degraded branding", async () => {
    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => ({ status: "ok" })),
      stage("environment", true, async () => ({ status: "ok" })),
      stage("services", true, async () => ({ status: "ok" })),
      stage("authentication", true, async () => ({
        status: "ok",
        patch: { hasSession: true, userId: "u1" },
      })),
      stage("session", true, async () => ({ status: "ok" })),
      stage("tenant", true, async () => ({ status: "ok" })),
      stage("branding", false, async () => ({ status: "degraded" })),
      stage("navigation", true, async () => ({ status: "ok" })),
    ];

    const orch = new BootstrapOrchestrator(stages);
    const result = await orch.run({ mode: "cold" });
    expect(result.status).toBe("ready");
    expect(result.stages.find((s) => s.stage === "branding")?.status).toBe(
      "degraded",
    );
  });

  it("emits lifecycle events with durations", async () => {
    const events: string[] = [];
    onBootstrapLifecycle((e) => events.push(e.name));

    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => ({ status: "ok" })),
    ];
    const orch = new BootstrapOrchestrator(stages);
    await orch.run({ mode: "cold" });

    expect(events).toContain("bootstrap:run_started");
    expect(events).toContain("bootstrap:stage_started");
    expect(events).toContain("bootstrap:stage_completed");
    expect(events).toContain("bootstrap:run_completed");
  });

  it("shares in-flight run across concurrent callers", async () => {
    let releases!: () => void;
    const gate = new Promise<void>((resolve) => {
      releases = resolve;
    });

    const stages: BootstrapStageHandler[] = [
      stage("app_launch", true, async () => {
        await gate;
        return { status: "ok" };
      }),
    ];
    const orch = new BootstrapOrchestrator(stages);
    const a = orch.run({ mode: "cold" });
    const b = orch.run({ mode: "cold" });
    releases();
    const [ra, rb] = await Promise.all([a, b]);
    expect(ra.id).toBe(rb.id);
  });
});
