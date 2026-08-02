#!/usr/bin/env node
/**
 * FLOW-01 canonical runner — Evidence before Implementation.
 *
 * Modes:
 *   --self-test   (default) Validate frozen full contract (synthetic PASS).
 *   --live        Evaluate domain observations (progressive BLOCKED/PASS/FAIL).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *   --through=T1|T2|T3|T4   Scope delivery FLOW01-001..004 (prefix PASS).
 *
 *   npm run test:flow01-canonical
 *   npm run test:flow01-canonical -- --live
 *   npm run test:flow01-canonical -- --pipeline=FLOW01_T1_STARTED,FLOW01_T1_COMPLETED --through=T1
 *
 * Spec: docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md
 * Plan: docs/00-status/FLOW_01_DELIVERY_PLAN.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLOW01_CANONICAL_STEPS,
  FLOW01_EXIT,
  buildFlow01EvidenceReport,
  computeFlow01Durations,
  evaluateFlow01Progress,
  flow01StepsThrough,
  formatFlow01ComparisonTable,
  validateFlow01Pipeline,
} from "./lib/flow01-canonical-pipeline.mjs";
import { runFlow01DomainDriver } from "./lib/flow01-domain-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/flow-01/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(EVIDENCE_DIR, `flow01-00${through}-canonical-live.json`);
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "flow01-canonical-live.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `flow01-00${through}-canonical.json`);
  }
  return path.join(EVIDENCE_DIR, "flow01-canonical.json");
}

function parseArgs(argv) {
  let mode = "self-test";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") mode = "live";
    else if (a === "--self-test") mode = "self-test";
    else if (a.startsWith("--pipeline=")) {
      mode = "pipeline";
      pipelineArg = a
        .slice("--pipeline=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--through=")) {
      const raw = a.slice("--through=".length).toUpperCase().replace(/^T/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 4) through = /** @type {1|2|3|4} */ (n);
    }
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const target = evidencePathFor(mode, through);
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return target;
}

function syntheticTimestamps(steps) {
  const t0 = Date.now() - steps.length * 15;
  /** @type {Record<string, number>} */
  const ts = {};
  steps.forEach((s, i) => {
    ts[s] = t0 + i * 15;
  });
  return ts;
}

/**
 * Exit: PASS=0 · FAIL=1 · BLOCKED=2
 * Scoped delivery PASS (through=Tn) exits 0 even if flow_status=BLOCKED.
 */
function exitFor(progress) {
  if (progress.status === "PASS") return FLOW01_EXIT.PASS;
  if (progress.status === "BLOCKED") return FLOW01_EXIT.BLOCKED;
  return FLOW01_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("FLOW-01 · Canonical runner");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=T${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "self-test") {
    const pipeline = through
      ? flow01StepsThrough(through)
      : [...FLOW01_CANONICAL_STEPS];
    const progress = evaluateFlow01Progress(pipeline, { through });
    // Full unscoped self-test must also satisfy classic once-only validator
    if (!through) {
      const classic = validateFlow01Pipeline(pipeline);
      if (!classic.ok) {
        console.error(formatFlow01ComparisonTable(classic));
        process.exit(FLOW01_EXIT.FAIL);
      }
    }
    const duration_ms = computeFlow01Durations(syntheticTimestamps(pipeline));
    const report = buildFlow01EvidenceReport({
      status: progress.status,
      reason: progress.reason || (through ? "" : "Contract self-test"),
      pipeline,
      validation: progress,
      duration_ms,
      code_status: "RUNNER_SELF_TEST",
      progress,
    });
    console.log(formatFlow01ComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence: ${path.relative(ROOT, out)}`);
    if (report.status === "PASS") {
      console.log(
        through
          ? `PASS — FLOW01-00${through} (full FLOW-01 still BLOCKED at ${report.blocked_at})`
          : "PASS — FLOW-01 evidence contract satisfied",
      );
    }
    process.exit(exitFor(progress));
  }

  if (mode === "live") {
    console.log("Driving FLOW-01 domain (certified transitions)…");
    const driver = runFlow01DomainDriver({ root: ROOT, through });
    if (!driver.ok) {
      console.error("Domain driver failed (vitest):");
      console.error(driver.output.slice(-4000));
      const report = buildFlow01EvidenceReport({
        status: "FAIL",
        reason: "FLOW-01 domain driver failed",
        pipeline: driver.steps,
        code_status: "DOMAIN_DRIVER_FAIL",
        terminal: { order_status: null, packaging_batch: null },
      });
      await writeEvidence(report, "live", through);
      process.exit(FLOW01_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateFlow01Progress(observed, { through });
    const duration_ms = computeFlow01Durations(syntheticTimestamps(observed));
    const orderStatusForThrough = {
      1: "in_production",
      2: "prepared",
      3: "ready_for_delivery",
      4: "delivered",
    };
    const report = buildFlow01EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      duration_ms,
      code_status: `DOMAIN_DRIVER_T${progress.certified_through || 0}`,
      terminal: {
        order_status:
          orderStatusForThrough[progress.certified_through] ?? null,
        packaging_batch:
          progress.certified_through >= 2 ? "IN_PROGRESS" : null,
      },
      progress,
    });

    console.log(formatFlow01ComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=T${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=[](prefix) out_of_order=${JSON.stringify(report.out_of_order)}`,
    );

    const out = await writeEvidence(report, "live", through);
    console.log(`evidence: ${path.relative(ROOT, out)}`);

    if (
      progress.certified_through >= 2 &&
      progress.blocked_at === "FLOW01_T3_STARTED"
    ) {
      console.log("FLOW01-002 · PASS through T2 · BLOCKED at T3 (expected)");
    } else if (
      progress.certified_through >= 1 &&
      progress.blocked_at === "FLOW01_T2_STARTED"
    ) {
      console.log("FLOW01-001 · PASS through T1 · BLOCKED at T2 (expected)");
    }
    process.exit(exitFor(progress));
  }

  // --pipeline=
  const pipeline = pipelineArg ?? [];
  const progress = evaluateFlow01Progress(pipeline, { through });
  const duration_ms = computeFlow01Durations(syntheticTimestamps(pipeline));
  const report = buildFlow01EvidenceReport({
    status: progress.status,
    reason: progress.reason,
    pipeline,
    validation: progress,
    duration_ms,
    code_status: "OBSERVED_PIPELINE",
    progress,
  });

  console.log(formatFlow01ComparisonTable(progress));
  console.log("");
  console.log(
    `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
  );
  console.log(
    `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
  );

  const out = await writeEvidence(report, "pipeline", through);
  console.log(`evidence: ${path.relative(ROOT, out)}`);
  process.exit(exitFor(progress));
}

main().catch((err) => {
  console.error(err);
  process.exit(FLOW01_EXIT.FAIL);
});
