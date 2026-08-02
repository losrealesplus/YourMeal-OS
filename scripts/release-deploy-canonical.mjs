#!/usr/bin/env node
/**
 * RELEASE-01 · B-04 Deploy canonical runner — Evidence before Implementation.
 *
 * Certifies reproducible deployment (D1–D3). Complements Smoke + Cross-flow + E2E.
 *
 * Default (CERTIFIED_THROUGH = 0): empty pipeline → BLOCKED at D1.
 * Modes:
 *   --runner-only    Empty pipeline → BLOCKED at D1 (Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=D1|…   Scope delivery RELEASE-DEPLOY-001..003 (no drivers yet).
 *
 * Spec: docs/00-status/RELEASE_DEPLOY_SPEC.md
 *
 * NO D1 capability driver in this PR · NO CI · NO infra · NO Rollback.
 */

/** Highest segment with a capability driver implemented (0 = runner-only). */
const RELEASE_DEPLOY_CERTIFIED_THROUGH = 0;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_DEPLOY_CANONICAL_STEPS,
  RELEASE_DEPLOY_EXIT,
  buildReleaseDeployEvidenceReport,
  evaluateReleaseDeployProgress,
  formatReleaseDeployComparisonTable,
  releaseDeployStepsThrough,
  validateReleaseDeployPipeline,
} from "./lib/release-deploy-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/release-deploy/evidence");

function evidencePathFor(mode, through) {
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical.json");
  }
  if (through) {
    return path.join(EVIDENCE_DIR, `release-deploy-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-deploy-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-deploy-canonical.json");
}

function parseArgs(argv) {
  // Until D1+ drivers exist, default = runner-only (BLOCKED at D1).
  let mode = RELEASE_DEPLOY_CERTIFIED_THROUGH === 0 ? "runner-only" : "live";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3 | null} */
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^D/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 3) through = /** @type {1|2|3} */ (n);
    }
  }
  if (mode === "live" && RELEASE_DEPLOY_CERTIFIED_THROUGH === 0) {
    mode = "runner-only";
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
  if (progress.status === "PASS") return RELEASE_DEPLOY_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_DEPLOY_EXIT.BLOCKED;
  return RELEASE_DEPLOY_EXIT.FAIL;
}

async function emitBlockedAtD1() {
  const pipeline = [];
  const progress = evaluateReleaseDeployProgress(pipeline, { through: null });
  const report = buildReleaseDeployEvidenceReport({
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
  console.log("RELEASE-DEPLOY");
  console.log("");
  console.log(report.status);
  console.log("");
  console.log(`blocked_at=${report.blocked_at}`);
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);

  const out = await writeEvidence(report, "runner-only", null);
  console.log(`evidence_file: ${path.relative(ROOT, out)}`);
  process.exit(exitFor(progress));
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("RELEASE-DEPLOY · Canonical runner");
  console.log("Reproducible deploy · not Smoke · not Cross-flow · not E2E · not a Flow");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=D${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    await emitBlockedAtD1();
  }

  if (mode === "live") {
    console.error(
      "LIVE mode requires CERTIFIED_THROUGH >= 1 (D1 driver). Not in this PR.",
    );
    process.exit(RELEASE_DEPLOY_EXIT.FAIL);
  }

  if (mode === "self-test") {
    const pipeline = through
      ? releaseDeployStepsThrough(through)
      : [...RELEASE_DEPLOY_CANONICAL_STEPS];
    const progress = evaluateReleaseDeployProgress(pipeline, { through });
    if (!through) {
      const classic = validateReleaseDeployPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatReleaseDeployComparisonTable(classic));
        process.exit(RELEASE_DEPLOY_EXIT.FAIL);
      }
    }
    const report = buildReleaseDeployEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatReleaseDeployComparisonTable(progress));
    console.log("");
    console.log(progress.reason || progress.status);
    console.log(
      `certified_through=D${progress.certified_through || 0} · blocked_at=${progress.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "pipeline") {
    const pipeline = pipelineArg ?? [];
    const progress = evaluateReleaseDeployProgress(pipeline, { through });
    const report = buildReleaseDeployEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatReleaseDeployComparisonTable(progress));
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

  process.exit(RELEASE_DEPLOY_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_DEPLOY_EXIT.FAIL);
});
