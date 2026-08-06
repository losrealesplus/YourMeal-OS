/**
 * Bootstrap Orchestrator — director of the App Bootstrap Pipeline.
 *
 * Coordinates order only. Must not import Supabase, Branding, React Router,
 * React Query, Doctor, or Providers (PRODUCT-CORE-002).
 */

import {
  createBootstrapContext,
  type BootstrapContext,
} from "./BootstrapContext";
import { emitBootstrapLifecycle } from "./BootstrapEvents";
import { getBootstrapPipelineStages } from "./BootstrapPipeline";
import type { BootstrapStageHandler } from "./stages/BootstrapStage";
import type {
  BootstrapError,
  BootstrapResult,
  BootstrapRunMode,
  BootstrapStageId,
  BootstrapStageResult,
  BootstrapStatus,
} from "./types";

export type BootstrapRunOptions = {
  mode?: BootstrapRunMode;
};

function newRunId(): string {
  return `boot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function detectMode(explicit?: BootstrapRunMode): BootstrapRunMode {
  if (explicit) return explicit;
  try {
    // Lazy flag check — Orchestrator still avoids owning bootstrap-mode logic.
    const vite = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (vite?.VITE_BOOTSTRAP_MODE === "true") return "bootstrap_mode";
  } catch {
    /* ignore */
  }
  return "cold";
}

export class BootstrapOrchestrator {
  private result: BootstrapResult | null = null;
  private running: Promise<BootstrapResult> | null = null;
  private readonly listeners = new Set<(result: BootstrapResult) => void>();
  private readonly stages: readonly BootstrapStageHandler[];

  constructor(stages: readonly BootstrapStageHandler[] = getBootstrapPipelineStages()) {
    this.stages = stages;
  }

  getResult(): BootstrapResult | null {
    return this.result;
  }

  isReady(): boolean {
    return this.result?.status === "ready";
  }

  subscribe(listener: (result: BootstrapResult) => void): () => void {
    this.listeners.add(listener);
    if (this.result) listener(this.result);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Run or resume cold start. Concurrent callers share the same in-flight promise.
   * Idempotent while already ready.
   */
  run(options?: BootstrapRunOptions): Promise<BootstrapResult> {
    if (this.result?.status === "ready") {
      return Promise.resolve(this.result);
    }
    if (this.running) return this.running;
    this.running = this.execute(options).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** Test helper — clear singleton state between specs. */
  reset(): void {
    this.result = null;
    this.running = null;
  }

  private publish(result: BootstrapResult): void {
    this.result = result;
    for (const listener of [...this.listeners]) {
      try {
        listener(result);
      } catch {
        /* ignore */
      }
    }
  }

  private async execute(options?: BootstrapRunOptions): Promise<BootstrapResult> {
    const id = newRunId();
    const mode = detectMode(options?.mode);
    const ctx = createBootstrapContext(id, mode);
    const stages = this.stages;
    const stageResults: BootstrapStageResult[] = [];
    const errors: BootstrapError[] = [];

    let status: BootstrapStatus = "running";
    let currentStage: BootstrapStageId = "app_launch";

    const snapshot = (): BootstrapResult => ({
      id,
      status,
      currentStage,
      stages: [...stageResults],
      tenantId: ctx.tenantId,
      homePath: ctx.homePath,
      brandProvenance: ctx.brandProvenance ?? undefined,
      mode,
      errors: [...errors],
      readyAt: status === "ready" ? new Date().toISOString() : undefined,
    });

    emitBootstrapLifecycle({
      name: "bootstrap:run_started",
      runId: id,
      payload: { mode },
    });
    this.publish(snapshot());

    for (const stage of stages) {
      currentStage = stage.id;
      const startedAt = new Date().toISOString();
      const t0 = Date.now();

      emitBootstrapLifecycle({
        name: "bootstrap:stage_started",
        runId: id,
        stage: stage.id,
      });
      this.publish(snapshot());

      let stageResult: BootstrapStageResult;
      try {
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

        const finishedAt = new Date().toISOString();
        stageResult = {
          stage: stage.id,
          status: outcome.status,
          startedAt,
          finishedAt,
          durationMs: Date.now() - t0,
          notes: outcome.notes,
          evidence: outcome.evidence,
          error: outcome.error,
        };

        if (outcome.error) errors.push(outcome.error);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const error: BootstrapError = {
          code: "UNKNOWN",
          stage: stage.id,
          message,
          recoverable: true,
        };
        errors.push(error);
        stageResult = {
          stage: stage.id,
          status: "failed",
          startedAt,
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - t0,
          error,
        };
      }

      stageResults.push(stageResult);

      if (stageResult.status === "failed") {
        emitBootstrapLifecycle({
          name: "bootstrap:stage_failed",
          runId: id,
          stage: stage.id,
          durationMs: stageResult.durationMs,
          stageResult,
        });

        if (stage.blocking) {
          status = "failed";
          const result = snapshot();
          emitBootstrapLifecycle({
            name: "bootstrap:run_failed",
            runId: id,
            stage: stage.id,
            result,
          });
          this.publish(result);
          return result;
        }

        // Non-blocking failure → continue as degraded path
        continue;
      }

      emitBootstrapLifecycle({
        name: "bootstrap:stage_completed",
        runId: id,
        stage: stage.id,
        durationMs: stageResult.durationMs,
        stageResult,
      });

      if (stageResult.status === "auth_required") {
        status = "auth_required";
        const result = snapshot();
        emitBootstrapLifecycle({
          name: "bootstrap:auth_required",
          runId: id,
          stage: stage.id,
          result,
        });
        emitBootstrapLifecycle({
          name: "bootstrap:run_completed",
          runId: id,
          result,
        });
        this.publish(result);
        return result;
      }
    }

    // Branding may be degraded — still Ready (ADR 0050).
    currentStage = "ready";
    status = "ready";
    const result = snapshot();
    result.readyAt = new Date().toISOString();

    emitBootstrapLifecycle({
      name: "bootstrap:run_completed",
      runId: id,
      result,
    });
    this.publish(result);
    return result;
  }
}

let singleton: BootstrapOrchestrator | null = null;

export function getBootstrapOrchestrator(): BootstrapOrchestrator {
  if (!singleton) singleton = new BootstrapOrchestrator();
  return singleton;
}

/** Test helper */
export function resetBootstrapOrchestrator(): void {
  singleton?.reset();
  singleton = null;
}

/**
 * Fire-and-forget cold start entry — does not gate UI (PRODUCT-CORE-002).
 * Safe to call once from client boot.
 */
export function startBootstrapPipeline(
  options?: BootstrapRunOptions,
): Promise<BootstrapResult> {
  return getBootstrapOrchestrator().run(options);
}
