#!/usr/bin/env node
/**
 * RELEASE-01 · B-06 Beta Acceptance canonical runner — Evidence before Implementation.
 *
 * Certifies the product as a whole (B1–B5) by composing Track B `-pass` anchors.
 *
 * Default (CERTIFIED_THROUGH = 0): empty pipeline → BLOCKED at B1.
 * Modes:
 *   --runner-only    Empty pipeline → BLOCKED at B1 (Gate land-check).
 *   --self-test      Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c Validate an explicit observed step list.
 *   --through=B1|…   Scope delivery RELEASE-01-BETA-001..005 (no drivers yet).
 *
 * Spec: docs/00-status/RELEASE_01_BETA_SPEC.md
 *
 * NO B1–B5 capability drivers in this PR · NO CI · NO infra · NO FLOW-05.
 */

/** Highest segment with a capability driver implemented (0 = runner-only). */
const RELEASE_01_BETA_CERTIFIED_THROUGH = 0;

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RELEASE_01_BETA_CANONICAL_STEPS,
  RELEASE_01_BETA_EXIT,
  buildRelease01BetaEvidenceReport,
  evaluateRelease01BetaProgress,
  formatRelease01BetaComparisonTable,
  release01BetaStepsThrough,
  validateRelease01BetaPipeline,
} from "./lib/release-01-beta-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/release-01-beta/evidence",
);

function evidencePathFor(mode, through) {
  if (mode === "runner-only") {
    return path.join(EVIDENCE_DIR, "release-01-beta-canonical.json");
  }
  if (through) {
    return path.join(
      EVIDENCE_DIR,
      `release-01-beta-00${through}-canonical.json`,
    );
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "release-01-beta-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "release-01-beta-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "release-01-beta-canonical.json");
}

function parseArgs(argv) {
  // Until B1+ drivers exist, default = runner-only (BLOCKED at B1).
  let mode = RELEASE_01_BETA_CERTIFIED_THROUGH === 0 ? "runner-only" : "live";
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
      const raw = a.slice("--through=".length).toUpperCase().replace(/^B/, "");
      const n = Number(raw);
      if (n >= 1 && n <= 5) through = /** @type {1|2|3|4|5} */ (n);
    }
  }
  if (mode === "live" && RELEASE_01_BETA_CERTIFIED_THROUGH === 0) {
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
  if (progress.status === "PASS") return RELEASE_01_BETA_EXIT.PASS;
  if (progress.status === "BLOCKED") return RELEASE_01_BETA_EXIT.BLOCKED;
  return RELEASE_01_BETA_EXIT.FAIL;
}

async function emitBlockedAtB1() {
  const pipeline = [];
  const progress = evaluateRelease01BetaProgress(pipeline, { through: null });
  const report = buildRelease01BetaEvidenceReport({
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
  console.log("RELEASE-01-BETA");
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
  console.log("RELEASE-01-BETA · Canonical runner");
  console.log(
    "Beta acceptance · composes Track B · not a Flow · not Smoke/Cross-flow/E2E/Deploy/Rollback re-run",
  );
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=B${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "runner-only") {
    await emitBlockedAtB1();
  }

  if (mode === "live") {
    console.error(
      "LIVE mode requires CERTIFIED_THROUGH >= 1 (B1 driver). Not in this PR.",
    );
    process.exit(RELEASE_01_BETA_EXIT.FAIL);
  }

  if (mode === "self-test") {
    const pipeline = through
      ? release01BetaStepsThrough(through)
      : [...RELEASE_01_BETA_CANONICAL_STEPS];
    const progress = evaluateRelease01BetaProgress(pipeline, { through });
    if (!through) {
      const classic = validateRelease01BetaPipeline(pipeline);
      if (!classic.ok) {
        console.error(formatRelease01BetaComparisonTable(classic));
        process.exit(RELEASE_01_BETA_EXIT.FAIL);
      }
    }
    const report = buildRelease01BetaEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "SELF_TEST",
      progress,
      evidence: { synthetic: true },
    });
    console.log(formatRelease01BetaComparisonTable(progress));
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
    const progress = evaluateRelease01BetaProgress(pipeline, { through });
    const report = buildRelease01BetaEvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: progress,
      code_status: "PIPELINE",
      progress,
    });
    console.log(formatRelease01BetaComparisonTable(progress));
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

  process.exit(RELEASE_01_BETA_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(RELEASE_01_BETA_EXIT.FAIL);
});
