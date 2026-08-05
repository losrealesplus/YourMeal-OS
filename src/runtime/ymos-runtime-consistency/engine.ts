/**
 * RUNTIME-CONSISTENCY-002 — RuntimeConsistencyEngine v1.
 * Pure observe-only: reads DOM + ledger + Performance; never mutates stores.
 */
import { annotateLedgerEntries, classifyFirstFailure } from "./annotate";
import { DEFAULT_CONSISTENCY_RULES } from "./rules";
import { buildConsistencyTimeline } from "./timeline";
import type {
  ConsistencyReport,
  ConsistencyResult,
  RuntimeConsistencyContext,
  RuntimeConsistencyRule,
} from "./types";
import type { YmosAssetAuditSnapshot } from "../ymos-runtime-assets/types";
import type { YmosDomImageRow } from "../ymos-runtime-inspector/dom-images";

declare global {
  interface Window {
    __YMOS_BOOT_EPOCH_MS__?: number;
  }
}

function bootEpochMs(): number {
  if (typeof window === "undefined") return Date.now();
  if (!window.__YMOS_BOOT_EPOCH_MS__) {
    window.__YMOS_BOOT_EPOCH_MS__ = Date.now();
  }
  return window.__YMOS_BOOT_EPOCH_MS__;
}

function readPerformanceNames(): string[] {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return [];
  }
  try {
    return performance
      .getEntriesByType("resource")
      .map((e) => (e as PerformanceResourceTiming).name)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function scoreResults(results: ConsistencyResult[]): {
  score: number;
  maxScore: number;
  ok: number;
  warning: number;
  error: number;
} {
  const maxScore = results.length * 10;
  let score = 0;
  let ok = 0;
  let warning = 0;
  let error = 0;
  for (const r of results) {
    if (r.severity === "ok") {
      score += 10;
      ok += 1;
    } else if (r.severity === "warning") {
      score += 5;
      warning += 1;
    } else {
      error += 1;
    }
  }
  return { score, maxScore, ok, warning, error };
}

export function buildConsistencyContext(input: {
  domImages: YmosDomImageRow[];
  ledger: YmosAssetAuditSnapshot;
  route: string;
  now?: number;
}): RuntimeConsistencyContext {
  return {
    now: input.now ?? Date.now(),
    route: input.route,
    domImages: input.domImages,
    ledger: input.ledger,
    performanceNames: readPerformanceNames(),
    bootEpochMs: bootEpochMs(),
  };
}

export function runRuntimeConsistencyEngine(
  ctx: RuntimeConsistencyContext,
  rules: RuntimeConsistencyRule[] = DEFAULT_CONSISTENCY_RULES,
): ConsistencyReport {
  const results = rules.map((rule) => rule.run(ctx));
  const annotatedEntries = annotateLedgerEntries(ctx.ledger, ctx.domImages, ctx.now);
  const { lifecycle, reason } = classifyFirstFailure(ctx.ledger, annotatedEntries);
  const timeline = buildConsistencyTimeline({
    annotated: annotatedEntries,
    domImages: ctx.domImages,
    firstFailureLifecycle: lifecycle,
    firstFailureReason: reason,
    firstFailureUrl: ctx.ledger.firstFailure?.url ?? null,
  });
  const scored = scoreResults(results);

  return {
    tool: "YMOS Runtime Consistency Engine",
    version: 1,
    capturedAt: new Date(ctx.now).toISOString(),
    route: ctx.route,
    score: scored.score,
    maxScore: scored.maxScore,
    summary: {
      ok: scored.ok,
      warning: scored.warning,
      error: scored.error,
    },
    results,
    annotatedEntries,
    firstFailureLifecycle: lifecycle,
    firstFailureReason: reason,
    timeline,
  };
}

export type { ConsistencyReport, ConsistencyResult, RuntimeConsistencyRule };
