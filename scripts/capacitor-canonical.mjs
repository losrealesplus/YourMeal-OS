#!/usr/bin/env node
/**
 * Capacitor · Distribution canonical runner.
 * Evidence before Implementation.
 *
 * Certifies native shell + reproducible Android/iOS builds as Distribution.
 * Tenant-agnostic — Core SaaS → Capacitor → Android / iOS.
 *
 * Modes:
 *   (default) / --live   Through CERTIFIED_THROUGH (0 = empty → BLOCKED at C1).
 *   --runner-only        Empty pipeline → BLOCKED at C1 (Gate baseline).
 *   --self-test          Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c     Validate an explicit observed step list.
 *   --through=C1|…|C5    Scope delivery CAPACITOR-001..005 (future).
 *
 * Spec: docs/00-status/CAPACITOR_SPEC.md
 *
 * NO C1–C5 drivers · NO Capacitor install · NO Android/iOS builds · NO stores.
 */

/** Highest block with a capability driver implemented. */
const CAPACITOR_CERTIFIED_THROUGH = 0;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CAPACITOR_CANONICAL_STEPS,
  CAPACITOR_EXIT,
  CAPACITOR_SEGMENTS,
  buildCapacitorEvidenceReport,
  capacitorStepsThrough,
  evaluateCapacitorProgress,
  formatCapacitorComparisonTable,
  validateCapacitorPipeline,
} from "./lib/capacitor-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/capacitor/evidence");

function evidencePathFor(mode, through) {
  if (mode === "live" && through) {
    return path.join(EVIDENCE_DIR, `capacitor-00${through}-canonical-live.json`);
  }
  if (mode === "live") {
    return path.join(EVIDENCE_DIR, "capacitor-canonical-live.json");
  }
  if (mode === "runner-only" || mode === "default") {
    return path.join(EVIDENCE_DIR, "capacitor-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `capacitor-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "capacitor-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "capacitor-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "capacitor-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4|5 | null} */
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^C/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 5) through = /** @type {1|2|3|4|5} */ (n);
    }
  }
  if (mode === "live" && through == null && CAPACITOR_CERTIFIED_THROUGH > 0) {
    through = /** @type {1|2|3|4|5} */ (CAPACITOR_CERTIFIED_THROUGH);
  }
  return { mode, pipelineArg, through };
}

async function writeEvidence(report, mode, through) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const payload = `${JSON.stringify(report, null, 2)}\n`;
  const target = evidencePathFor(mode, through);
  await writeFile(target, payload, "utf8");
  if (
    mode === "live" &&
    through != null &&
    through === CAPACITOR_CERTIFIED_THROUGH
  ) {
    const aggregate = path.join(EVIDENCE_DIR, "capacitor-canonical-live.json");
    if (aggregate !== target) await writeFile(aggregate, payload, "utf8");
  }
  return target;
}

function exitFor(progress) {
  if (progress.status === "PASS") return CAPACITOR_EXIT.PASS;
  if (progress.status === "BLOCKED") return CAPACITOR_EXIT.BLOCKED;
  return CAPACITOR_EXIT.FAIL;
}

function printBlocked(report, progress) {
  console.log("");
  console.log("CAPACITOR");
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
  console.log("CAPACITOR · Canonical runner");
  console.log(
    "Distribution · C1–C5 · Core SaaS → Capacitor → Android / iOS",
  );
  console.log("Evidence before Implementation · Core Integrity Rule");
  console.log(
    `mode: ${mode}${through ? ` · through=C${through}` : ""} · CERTIFIED_THROUGH=${CAPACITOR_CERTIFIED_THROUGH}`,
  );
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only" || mode === "default" || mode === "live") {
    // CERTIFIED_THROUGH=0 → institutionalize contract only (empty → BLOCKED at C1).
    // No capability drivers yet — live with through=null also BLOCKED at C1.
    if (mode === "live" && through != null && through >= 1) {
      console.error(
        "Capability drivers for C1+ are not implemented — CERTIFIED_THROUGH=0.",
      );
      console.error(
        "Use default / --runner-only for Gate baseline, or --self-test for synthetic PASS.",
      );
      process.exit(CAPACITOR_EXIT.FAIL);
    }

    const pipeline = [];
    const progress = evaluateCapacitorProgress(pipeline, { through: null });
    const report = buildCapacitorEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      code_status:
        mode === "live" ? "CERTIFIED_THROUGH_0" : "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    const code = printBlocked(report, progress);
    const out = await writeEvidence(
      report,
      mode === "live" ? "live" : mode === "default" ? "runner-only" : mode,
      null,
    );
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(code);
  }

  if (mode === "self-test") {
    const pipeline = through
      ? capacitorStepsThrough(through)
      : [...CAPACITOR_CANONICAL_STEPS];
    const progress = evaluateCapacitorProgress(pipeline, { through });
    if (!through) {
      const classic = validateCapacitorPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatCapacitorComparisonTable(classic));
        process.exit(CAPACITOR_EXIT.FAIL);
      }
    }
    const report = buildCapacitorEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatCapacitorComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=C${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateCapacitorProgress(pipeline, { through });
    const report = buildCapacitorEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatCapacitorComparisonTable(progress));
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

  process.exit(CAPACITOR_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(CAPACITOR_EXIT.FAIL);
});
