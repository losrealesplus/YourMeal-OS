#!/usr/bin/env node
/**
 * FLOW-05 · Customer Experience Lifecycle canonical runner.
 * Evidence before Implementation.
 *
 * Certifies the full customer journey (B1–B8) as a Flow contract.
 * Tenant-agnostic — EatClean is the first implementation, not the product.
 *
 * Modes:
 *   (default) / --live   Through CERTIFIED_THROUGH (0 = empty → BLOCKED at B1).
 *   --runner-only        Empty pipeline → BLOCKED at B1 (Gate baseline).
 *   --self-test          Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c     Validate an explicit observed step list.
 *   --through=B1|…|B8    Scope delivery FLOW05-001..008.
 *
 * Spec: docs/00-status/FLOW_05_SPEC.md
 *
 * NO Capacitor · NO flow05-pass ritual · NO EatClean-only coupling.
 */

/** Highest block with a capability driver implemented. */
const FLOW05_CERTIFIED_THROUGH = 8;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLOW05_CANONICAL_STEPS,
  FLOW05_EXIT,
  FLOW05_SEGMENTS,
  buildFlow05EvidenceReport,
  evaluateFlow05Progress,
  flow05StepsThrough,
  formatFlow05ComparisonTable,
  validateFlow05Pipeline,
} from "./lib/flow-05-canonical-pipeline.mjs";
import { runFlow05CapabilityDriver } from "./lib/flow-05-capability-driver.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/flow-05/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(EVIDENCE_DIR, `flow-05-00${through}-canonical-live.json`);
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "flow-05-canonical-live.json");
  }
  if (mode === "runner-only" || mode === "default") {
    return path.join(EVIDENCE_DIR, "flow-05-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `flow-05-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "flow-05-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "flow-05-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "flow-05-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4|5|6|7|8 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") mode = "live";
    else if (a === "--runner-only") mode = "runner-only";
    else if (a === "--self-test") mode = "self-test";
    else if (a.startsWith("--pipeline=")) {
      mode = "pipeline";
      pipelineArg = a
        .slice("--pipeline=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--through=")) {
      const raw = a.slice("--through=".length).toUpperCase().replace(/^B/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 8) through = /** @type {1|2|3|4|5|6|7|8} */ (n);
    }
  }
  if (mode === "live" && through == null && FLOW05_CERTIFIED_THROUGH > 0) {
    through = /** @type {1|2|3|4|5|6|7|8} */ (FLOW05_CERTIFIED_THROUGH);
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  const target = evidencePathFor(mode, through);
  await writeFile(target, payload, "utf8");
  // Keep aggregate live evidence when scoped deliveries advance CERTIFIED_THROUGH.
  if (mode === "live" && through != null && through === FLOW05_CERTIFIED_THROUGH) {
    const aggregate = path.join(EVIDENCE_DIR, "flow-05-canonical-live.json");
    if (aggregate !== target) await writeFile(aggregate, payload, "utf8");
  }
  return target;
}

function exitFor(progress) {
  if (progress.status === "PASS") return FLOW05_EXIT.PASS;
  if (progress.status === "BLOCKED") return FLOW05_EXIT.BLOCKED;
  return FLOW05_EXIT.FAIL;
}

function printBlocked(report, progress) {
  console.log("");
  console.log("FLOW-05");
  console.log("");
  console.log(report.status);
  console.log("");
  console.log(`blocked_at=${report.blocked_at}`);
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);
  return exitFor(progress);
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("FLOW-05 · Canonical runner");
  console.log(
    "Customer Experience Lifecycle · B1–B8 · tenant-agnostic · not Capacitor",
  );
  console.log("Evidence before Implementation");
  console.log(
    `mode: ${mode}${through ? ` · through=B${through}` : ""} · CERTIFIED_THROUGH=${FLOW05_CERTIFIED_THROUGH}`,
  );
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only" || mode === "default") {
    const pipeline = [];
    const progress = evaluateFlow05Progress(pipeline, { through: null });
    const report = buildFlow05EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    const code = printBlocked(report, progress);
    const out = await writeEvidence(report, mode, null);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(code);
  }

  if (mode === "live") {
    const scope = through ?? FLOW05_CERTIFIED_THROUGH;

    // CERTIFIED_THROUGH=0 → institutionalize contract only (empty → BLOCKED at B1).
    if (scope < 1) {
      const pipeline = [];
      const progress = evaluateFlow05Progress(pipeline, { through: null });
      const report = buildFlow05EvidenceReport({
        status: progress.status,
        reason: progress.reason,
        pipeline,
        validation: {
          duplicates: progress.duplicates,
          missing: progress.missing,
          out_of_order: progress.out_of_order,
          firstFailure: progress.firstFailure,
        },
        code_status: "CERTIFIED_THROUGH_0",
        progress,
        evidence: {},
      });
      const code = printBlocked(report, progress);
      const out = await writeEvidence(report, "live", null);
      console.log(`evidence_file: ${path.relative(ROOT, out)}`);
      process.exit(code);
    }

    console.log(`Driving FLOW-05 blocks (through=B${scope})…`);
    const driver = runFlow05CapabilityDriver({
      root: ROOT,
      through: scope,
    });
    if (!driver.ok) {
      console.error("Capability driver failed:");
      console.error(driver.reason ?? "unknown");
      const report = buildFlow05EvidenceReport({
        status: "FAIL",
        reason: driver.reason ?? "FLOW-05 capability driver failed",
        pipeline: driver.steps,
        code_status: "CAPABILITY_DRIVER_FAIL",
        evidence: driver.evidence ?? {},
      });
      await writeEvidence(report, "live", through);
      process.exit(FLOW05_EXIT.FAIL);
    }

    const observed = driver.steps;
    const progress = evaluateFlow05Progress(observed, { through: scope });
    const report = buildFlow05EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline: observed,
      validation: progress,
      code_status: `CAPABILITY_DRIVER_B${progress.certified_through || 0}`,
      progress,
      evidence: driver.evidence ?? {},
      meta: {
        terminal: {
          segment: FLOW05_SEGMENTS[progress.certified_through] ?? null,
        },
      },
    });

    console.log(formatFlow05ComparisonTable(progress));
    console.log("");
    console.log(progress.reason);
    console.log(
      `certified_through=B${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "live", through ?? scope);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? flow05StepsThrough(through)
      : [...FLOW05_CANONICAL_STEPS];
    const progress = evaluateFlow05Progress(pipeline, { through });
    if (!through) {
      const classic = validateFlow05Pipeline(pipeline);
      if (!classic.ok) {
        console.error(formatFlow05ComparisonTable(classic));
        process.exit(FLOW05_EXIT.FAIL);
      }
    }
    const report = buildFlow05EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatFlow05ComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=B${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateFlow05Progress(pipeline, { through });
    const report = buildFlow05EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatFlow05ComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} blocked_at=${report.blocked_at ?? "—"}`,
    );
    console.log(
      `duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
    );
    const out = await writeEvidence(report, "pipeline", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  process.exit(FLOW05_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(FLOW05_EXIT.FAIL);
});
