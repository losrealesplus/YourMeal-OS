#!/usr/bin/env node
/**
 * RELEASE-01 · B-02 Cross-flow canonical runner — Evidence before Implementation.
 *
 * Certifies chained handoffs (C1–C4) across FLOW-01…04.
 * Does NOT implement domain segments yet.
 *
 * Default (`npm run test:release-crossflow`): empty pipeline → BLOCKED at C1.
 * Modes:
 *   (default)     Empty pipeline → BLOCKED (runner-only).
 *   --self-test   Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *   --through=C1|…   Scope delivery RELEASE-CROSSFLOW-001..004 (future).
 *
 * Spec: docs/00-status/RELEASE_CROSSFLOW_SPEC.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_CROSSFLOW_CANONICAL_STEPS,
  RELEASE_CROSSFLOW_EXIT,
  buildReleaseCrossflowEvidenceReport,
  evaluateReleaseCrossflowProgress,
  formatReleaseCrossflowComparisonTable,
  releaseCrossflowStepsThrough,
  validateReleaseCrossflowPipeline,
} from "./lib/release-crossflow-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/release-crossflow/evidence",
);

function evidencePathFor(mode, through) {
  if (through) {
    return path.join(
      EVIDENCE_DIR,
      `release-crossflow-00${through}-canonical.json`,
    );
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-crossflow-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-crossflow-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-crossflow-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3|4 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--self-test") mode = "self-test";
    else if (a === "--live") {
      // Reserved — segment drivers not implemented (Evidence before Implementation).
      mode = "default";
    } else if (a.startsWith("--pipeline=")) {
      mode = "pipeline";
      pipelineArg = a
        .slice("--pipeline=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a.startsWith("--through=")) {
      const raw = a.slice("--through=".length).toUpperCase().replace(/^C/, "");
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

function exitFor(progress) {
  if (progress.status === "PASS") return RELEASE_CROSSFLOW_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_CROSSFLOW_EXIT.BLOCKED;
  return RELEASE_CROSSFLOW_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-CROSSFLOW · Canonical runner");
  console.log("Chained handoffs · not a new Flow · not Smoke");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=C${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "self-test") {
    const pipeline = through
      ? releaseCrossflowStepsThrough(through)
      : [...RELEASE_CROSSFLOW_CANONICAL_STEPS];
    const progress = evaluateReleaseCrossflowProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseCrossflowPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseCrossflowComparisonTable(classic));
        process.exit(RELEASE_CROSSFLOW_EXIT.FAIL);
      }
    }
    const report = buildReleaseCrossflowEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatReleaseCrossflowComparisonTable(progress));
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
    const progress = evaluateReleaseCrossflowProgress(pipeline, { through });
    const report = buildReleaseCrossflowEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatReleaseCrossflowComparisonTable(progress));
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

  // Default / runner-only: empty pipeline → BLOCKED at C1
  const pipeline = [];
  const progress = evaluateReleaseCrossflowProgress(pipeline, {
    through: null,
  });
  const report = buildReleaseCrossflowEvidenceReport({
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

  console.log("");
  console.log("RELEASE-CROSSFLOW");
  console.log("");
  console.log(report.status);
  console.log("");
  console.log(`blocked_at=${report.blocked_at}`);
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);

  const out = await writeEvidence(report, "default", null);
  console.log(`evidence_file: ${path.relative(ROOT, out)}`);
  process.exit(exitFor(progress));
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_CROSSFLOW_EXIT.FAIL);
});
