/**
 * Doctor Runner — execute registered checks · Health Score · evidence.
 * Doctor never imports concrete check modules; Registry supplies them.
 * DEVELOPER-PLATFORM-004
 */

import {
  emitRuntimeCoreEvent,
  type RuntimeEvidence,
  type RuntimePlatform,
} from "../runtime-core";
import {
  DOCTOR_CAPABILITY_ORDER,
  doctorCapabilityLabel,
} from "./DoctorCapability";
import type {
  DoctorCheck,
  DoctorCheckContext,
  DoctorCheckResult,
  DoctorCheckStatus,
  DoctorCapabilityId,
} from "./DoctorCheck";
import {
  evidenceFromDoctorCheck,
  shouldEmitDoctorEvidence,
} from "./DoctorEvidence";
import { getChecks } from "./DoctorRegistry";
import {
  DOCTOR_ENGINE_VERSION,
  type DoctorCapabilitySummary,
  type DoctorExecutedCheck,
  type DoctorReport,
} from "./DoctorReport";
import {
  markDoctorRunOnTimeline,
  reportIncidentFromDoctorCheck,
} from "../incident-engine/doctor-bridge";
import {
  listCapabilities,
  registerBuiltinCapabilities,
  runAllCapabilities,
  type RuntimeCheckResult,
} from "../capability-engine";

export type RunDoctorOptions = {
  platform?: RuntimePlatform;
  /** Limit to capability ids (future UI filters). */
  capabilities?: string[];
  signal?: AbortSignal;
  device?: string;
};

function detectPlatform(): RuntimePlatform {
  try {
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor;
    const p = cap?.getPlatform?.() ?? "web";
    if (p === "android" || p === "ios" || p === "web") return p;
    return "web";
  } catch {
    return "web";
  }
}

function supportsPlatform(check: DoctorCheck, platform: RuntimePlatform): boolean {
  if (!check.supports || check.supports.length === 0) return true;
  return check.supports.includes(platform);
}

function statusRank(status: DoctorCheckStatus): number {
  switch (status) {
    case "fail":
      return 4;
    case "warning":
      return 3;
    case "info":
      return 2;
    case "skip":
      return 1;
    case "pass":
    default:
      return 0;
  }
}

function worstStatus(statuses: DoctorCheckStatus[]): DoctorCheckStatus {
  let worst: DoctorCheckStatus = "pass";
  for (const s of statuses) {
    if (statusRank(s) > statusRank(worst)) worst = s;
  }
  return worst;
}

/**
 * Health Score 0–100.
 * skip excluded; pass/info = 1; warning = 0.5; fail = 0.
 */
export function computeHealthScore(checks: DoctorExecutedCheck[]): number {
  let earned = 0;
  let possible = 0;
  for (const c of checks) {
    if (c.status === "skip") continue;
    possible += 1;
    if (c.status === "pass" || c.status === "info") earned += 1;
    else if (c.status === "warning") earned += 0.5;
  }
  if (possible === 0) return 100;
  return Math.round((earned / possible) * 100);
}

async function safeRun(
  check: DoctorCheck,
  ctx: DoctorCheckContext,
): Promise<DoctorCheckResult> {
  try {
    return await check.run(ctx);
  } catch (err) {
    return {
      status: "fail",
      message: err instanceof Error ? err.message : String(err),
      recommendations: [
        `Inspect check ${check.id} — unexpected throw during Doctor run.`,
      ],
    };
  }
}

function summarizeCapabilities(
  executed: DoctorExecutedCheck[],
): DoctorCapabilitySummary[] {
  const byCap = new Map<string, DoctorExecutedCheck[]>();
  for (const c of executed) {
    const list = byCap.get(c.capability) ?? [];
    list.push(c);
    byCap.set(c.capability, list);
  }

  const known = new Set(DOCTOR_CAPABILITY_ORDER as readonly string[]);
  const orderedIds = [
    ...DOCTOR_CAPABILITY_ORDER.filter((id) => byCap.has(id)),
    ...[...byCap.keys()].filter((id) => !known.has(id)).sort(),
  ];

  return orderedIds.map((capability) => {
    const list = byCap.get(capability) ?? [];
    const counts = { pass: 0, warning: 0, fail: 0, info: 0, skip: 0 };
    for (const item of list) {
      counts[item.status] += 1;
    }
    return {
      capability: capability as DoctorCapabilityId,
      label: doctorCapabilityLabel(capability),
      status: worstStatus(list.map((x) => x.status)),
      ...counts,
      total: list.length,
    };
  });
}

function doctorResultFromCapability(
  result: RuntimeCheckResult,
): DoctorCheckResult {
  return {
    status: result.status,
    message: result.message,
    payload: result.payload,
    recommendations: result.recommendations,
    severity: result.severity,
  };
}

function checkStubFromCapabilityResult(
  capabilityId: string,
  result: RuntimeCheckResult,
): DoctorCheck {
  return {
    id: result.checkId,
    name: result.checkName,
    capability: capabilityId as DoctorCapabilityId,
    severity: result.severity ?? "error",
    soft: result.soft,
    run: () => doctorResultFromCapability(result),
  };
}

/** Run all registered checks (or filtered) and build a DoctorReport. */
export async function runDoctor(
  options: RunDoctorOptions = {},
): Promise<DoctorReport> {
  const platform = options.platform ?? detectPlatform();
  const runAt = new Date().toISOString();
  const started = Date.now();

  emitRuntimeCoreEvent("doctor-start", { platform, runAt });
  markDoctorRunOnTimeline(runAt, platform);

  const ctx: DoctorCheckContext = {
    platform,
    runAt,
    signal: options.signal,
  };

  // Prefer Capability Engine — Doctor no longer owns check discovery.
  registerBuiltinCapabilities();
  const caps = listCapabilities();

  const executed: DoctorExecutedCheck[] = [];
  const evidences: RuntimeEvidence[] = [];
  const recommendations: string[] = [];

  if (caps.length > 0) {
    const runs = await runAllCapabilities(ctx, {
      capabilityIds: options.capabilities,
    });
    const covered = new Set<string>();
    for (const run of runs) {
      for (const result of run.results) {
        covered.add(result.checkId);
        executed.push({
          id: result.checkId,
          name: result.checkName,
          capability: run.capability.id as DoctorCapabilityId,
          status: result.status,
          message: result.message,
          severity: result.severity,
          recommendations: result.recommendations ?? [],
          soft: result.soft,
          durationMs: result.durationMs ?? 0,
        });
        if (result.recommendations?.length) {
          recommendations.push(...result.recommendations);
        }
        const doctorResult = doctorResultFromCapability(result);
        if (
          shouldEmitDoctorEvidence(doctorResult) &&
          result.status !== "pass"
        ) {
          const check = checkStubFromCapabilityResult(
            run.capability.id,
            result,
          );
          const evidence = evidenceFromDoctorCheck({
            check,
            result: doctorResult,
            platform,
            runAt,
            device: options.device,
          });
          evidences.push(evidence);
          reportIncidentFromDoctorCheck({
            check,
            result: doctorResult,
            evidence,
            runAt,
          });
        }
      }
    }

    // Orphan DoctorRegistry checks not owned by a Capability (experimental / tests).
    let orphans = getChecks().filter(
      (c) => !covered.has(c.id) && supportsPlatform(c, platform),
    );
    if (options.capabilities?.length) {
      const allow = new Set(options.capabilities);
      orphans = orphans.filter((c) => allow.has(c.capability));
    }
    orphans = orphans.slice().sort((a, b) => a.id.localeCompare(b.id));
    for (const check of orphans) {
      const t0 = Date.now();
      const result = await safeRun(check, ctx);
      const durationMs = Date.now() - t0;
      executed.push({
        id: check.id,
        name: check.name,
        capability: check.capability,
        status: result.status,
        message: result.message,
        severity: result.severity ?? check.severity,
        recommendations: result.recommendations ?? [],
        soft: check.soft,
        durationMs,
      });
      if (result.recommendations?.length) {
        recommendations.push(...result.recommendations);
      }
      if (shouldEmitDoctorEvidence(result) && result.status !== "pass") {
        const evidence = evidenceFromDoctorCheck({
          check,
          result,
          platform,
          runAt,
          device: options.device,
        });
        evidences.push(evidence);
        reportIncidentFromDoctorCheck({
          check,
          result,
          evidence,
          runAt,
        });
      }
    }
  } else {
    // Legacy fallback — direct DoctorRegistry (tests / empty capability registry).
    let queue = getChecks().filter((c) => supportsPlatform(c, platform));
    if (options.capabilities?.length) {
      const allow = new Set(options.capabilities);
      queue = queue.filter((c) => allow.has(c.capability));
    }
    queue = queue.slice().sort((a, b) => a.id.localeCompare(b.id));

    for (const check of queue) {
      const t0 = Date.now();
      const result = await safeRun(check, ctx);
      const durationMs = Date.now() - t0;
      executed.push({
        id: check.id,
        name: check.name,
        capability: check.capability,
        status: result.status,
        message: result.message,
        severity: result.severity ?? check.severity,
        recommendations: result.recommendations ?? [],
        soft: check.soft,
        durationMs,
      });
      if (result.recommendations?.length) {
        recommendations.push(...result.recommendations);
      }
      if (shouldEmitDoctorEvidence(result) && result.status !== "pass") {
        const evidence = evidenceFromDoctorCheck({
          check,
          result,
          platform,
          runAt,
          device: options.device,
        });
        evidences.push(evidence);
        reportIncidentFromDoctorCheck({
          check,
          result,
          evidence,
          runAt,
        });
      }
    }
  }

  const healthScore = computeHealthScore(executed);
  const ok = executed.every(
    (c) => c.status === "pass" || c.status === "info" || c.status === "skip",
  );
  const report: DoctorReport = {
    version: DOCTOR_ENGINE_VERSION,
    runAt,
    platform,
    healthScore,
    ok,
    checks: executed,
    capabilities: summarizeCapabilities(executed),
    evidences,
    recommendations: [...new Set(recommendations)],
    durationMs: Date.now() - started,
  };

  emitRuntimeCoreEvent("doctor-finish", {
    healthScore: report.healthScore,
    ok: report.ok,
    checkCount: report.checks.length,
  });

  return report;
}
