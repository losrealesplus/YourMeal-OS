#!/usr/bin/env node
/**
 * FLOW-03 canonical runner — Evidence before Implementation.
 *
 * Default (no domain): BLOCKED at FLOW03_T1_STARTED.
 * Modes:
 *   (default)     Empty pipeline → BLOCKED (runner-only, no domain).
 *   --self-test   Validate frozen full contract (synthetic PASS).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *   --through=T1|T2|T3   Scope delivery FLOW03-001..003 (prefix PASS).
 *
 *   npm run test:flow03-canonical
 *   npm run test:flow03-canonical:unit
 *
 * Spec: docs/00-status/FLOW_03_BILLING_SPEC.md
 *
 * No domain / AccountingService / Supabase / UI / RPC in this runner PR.
 * --live lands with FLOW03-001+.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLOW03_CANONICAL_STEPS,
  FLOW03_EXIT,
  buildFlow03EvidenceReport,
  computeFlow03Durations,
  evaluateFlow03Progress,
  flow03StepsThrough,
  formatFlow03ComparisonTable,
  validateFlow03Pipeline,
} from "./lib/flow03-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT, "docs/10-validation/flow-03/evidence");

function evidencePathFor(mode, through) {
  if (through) {
    return path.join(EVIDENCE_DIR, `flow03-00${through}-canonical.json`);
  }
  if (mode === "self-test") {
    return path.join(EVIDENCE_DIR, "flow03-canonical-self-test.json");
  }
  if (mode === "pipeline") {
    return path.join(EVIDENCE_DIR, "flow03-canonical-pipeline.json");
  }
  return path.join(EVIDENCE_DIR, "flow03-canonical.json");
}

function parseArgs(argv) {
  let mode = "default";
  /** @type {string[] | null} */
  let pipelineArg = null;
  /** @type {1|2|3 | null} */
  let through = null;
  for (const a of argv) {
    if (a === "--live") {
      console.error(
        "FLOW-03 --live is not available yet (no domain driver). " +
          "Use default / --self-test / --pipeline= until FLOW03-001.",
      );
      process.exit(FLOW03_EXIT.FAIL);
    } else if (a === "--self-test") mode = "self-test";
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
      if (n >= 1 && n <= 3) through = /** @type {1|2|3} */ (n);
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

/** Exit: PASS=0 · FAIL=1 · BLOCKED=2 */
function exitFor(progress) {
  if (progress.status === "PASS") return FLOW03_EXIT.PASS;
  if (progress.status === "BLOCKED") return FLOW03_EXIT.BLOCKED;
  return FLOW03_EXIT.FAIL;
}

async function main() {
  const { mode, pipelineArg, through } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("FLOW-03 · Canonical runner");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}${through ? ` · through=T${through}` : ""}`);
  console.log("═══════════════════════════════════════════════");

  // Default: executable contract with zero domain → BLOCKED at T1
  if (mode === "default") {
    const pipeline = [];
    const progress = evaluateFlow03Progress(pipeline, { through });
    const report = buildFlow03EvidenceReport({
      status: progress.status,
      reason: progress.reason,
      pipeline,
      validation: {
        duplicates: progress.duplicates,
        missing: progress.missing,
        out_of_order: progress.out_of_order,
        firstFailure: progress.firstFailure,
      },
      duration_ms: computeFlow03Durations({}),
      code_status: "RUNNER_ONLY",
      progress,
      evidence: {},
    });

    console.log("");
    console.log("FLOW-03");
    console.log("");
    console.log(report.status);
    console.log("");
    console.log(`blocked_at=${report.blocked_at}`);
    console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
    console.log(`missing=${JSON.stringify(report.missing)}`);
    console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
    console.log(`evidence=${JSON.stringify(report.evidence)}`);

    const out = await writeEvidence(report, mode, through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    process.exit(exitFor(progress));
  }

  if (mode === "self-test") {
    const pipeline = through
      ? flow03StepsThrough(through)
      : [...FLOW03_CANONICAL_STEPS];
    const progress = evaluateFlow03Progress(pipeline, { through });
    if (!through) {
      const classic = validateFlow03Pipeline(pipeline);
      if (!classic.ok) {
        console.error(formatFlow03ComparisonTable(classic));
        process.exit(FLOW03_EXIT.FAIL);
      }
    }
    const duration_ms = computeFlow03Durations(syntheticTimestamps(pipeline));
    const report = buildFlow03EvidenceReport({
      status: progress.status,
      reason: progress.reason || (through ? "" : "Contract self-test"),
      pipeline,
      validation: progress,
      duration_ms,
      code_status: "RUNNER_SELF_TEST",
      progress,
      evidence: {},
    });
    console.log(formatFlow03ComparisonTable(progress));
    console.log("");
    console.log(
      `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
    );
    const out = await writeEvidence(report, "self-test", through);
    console.log(`evidence_file: ${path.relative(ROOT, out)}`);
    if (report.status === "PASS") {
      console.log(
        through
          ? `PASS — FLOW03-00${through} (full FLOW-03 still BLOCKED at ${report.blocked_at})`
          : "PASS — FLOW-03 evidence contract satisfied (self-test)",
      );
    }
    process.exit(exitFor(progress));
  }

  // --pipeline=
  const pipeline = pipelineArg ?? [];
  const progress = evaluateFlow03Progress(pipeline, { through });
  const duration_ms = computeFlow03Durations(syntheticTimestamps(pipeline));
  const report = buildFlow03EvidenceReport({
    status: progress.status,
    reason: progress.reason,
    pipeline,
    validation: progress,
    duration_ms,
    code_status: "OBSERVED_PIPELINE",
    progress,
    evidence: {},
  });

  console.log(formatFlow03ComparisonTable(progress));
  console.log("");
  console.log(
    `status=${report.status} delivery=${report.delivery_status} flow=${report.flow_status} certified_through=T${report.certified_through || 0} blocked_at=${report.blocked_at ?? "—"}`,
  );
  console.log(`duplicates=${JSON.stringify(report.duplicates)}`);
  console.log(`missing=${JSON.stringify(report.missing)}`);
  console.log(`out_of_order=${JSON.stringify(report.out_of_order)}`);
  console.log(`evidence=${JSON.stringify(report.evidence)}`);

  const out = await writeEvidence(report, "pipeline", through);
  console.log(`evidence_file: ${path.relative(ROOT, out)}`);
  process.exit(exitFor(progress));
}

main().catch((err) => {
  console.error(err);
  process.exit(FLOW03_EXIT.FAIL);
});
