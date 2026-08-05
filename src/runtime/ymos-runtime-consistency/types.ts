/**
 * RUNTIME-CONSISTENCY-002 — types for the Runtime Consistency Engine v1.
 * Observe-only validation: never mutates app/DOM/ledger stores.
 */

import type { YmosAssetAuditSnapshot, YmosAssetEntry } from "../ymos-runtime-assets/types";
import type { YmosDomImageRow } from "../ymos-runtime-inspector/dom-images";

/** Lifecycle of a datum relative to live WebView truth. */
export type ConsistencyLifecycle =
  | "LIVE"
  | "HISTORICAL"
  | "ORPHAN"
  | "STALE"
  | "UNKNOWN";

export type ConsistencySeverity = "ok" | "warning" | "error";

export type ConsistencyResult = {
  ruleId: string;
  severity: ConsistencySeverity;
  title: string;
  description: string;
  evidence: unknown;
};

export type RuntimeConsistencyRule = {
  id: string;
  run: (ctx: RuntimeConsistencyContext) => ConsistencyResult;
};

export type AnnotatedAssetEntry = YmosAssetEntry & {
  lifecycle: ConsistencyLifecycle;
  lifecycleReason: string;
  ageMs: number | null;
};

export type ConsistencyTimelineEvent = {
  at: string;
  label: string;
  detail: string;
};

export type RuntimeConsistencyContext = {
  now: number;
  route: string;
  domImages: YmosDomImageRow[];
  ledger: YmosAssetAuditSnapshot;
  performanceNames: string[];
  bootEpochMs: number;
};

export type ConsistencyReport = {
  tool: "YMOS Runtime Consistency Engine";
  version: 1;
  capturedAt: string;
  route: string;
  score: number;
  maxScore: number;
  summary: {
    ok: number;
    warning: number;
    error: number;
  };
  results: ConsistencyResult[];
  annotatedEntries: AnnotatedAssetEntry[];
  firstFailureLifecycle: ConsistencyLifecycle | null;
  firstFailureReason: string | null;
  timeline: ConsistencyTimelineEvent[];
};
