#!/usr/bin/env node
/**
 * FLOW-01 canonical runner — Evidence before Implementation.
 *
 * Modes:
 *   --self-test   (default) Validate frozen contract with synthetic perfect pipeline.
 *                 Proves runner/validator before domain code exists.
 *   --live        Attempt domain driver (BLOCKED until Implementation wires it).
 *   --pipeline=a,b,c   Validate an explicit observed step list.
 *
 *   npm run test:flow01-canonical
 *   npm run test:flow01-canonical -- --live
 *
 * Spec: docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FLOW01_CANONICAL_STEPS,
  FLOW01_EXIT,
  buildFlow01EvidenceReport,
  classifyFlow01Outcome,
  computeFlow01Durations,
  formatFlow01ComparisonTable,
  validateFlow01Pipeline,
} from "./lib/flow01-canonical-pipeline.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(
  ROOT,
  "docs/10-validation/flow-01/evidence",
);
function evidencePathFor(mode) {
  const name =
    mode === "live" ? "flow01-canonical-live.json" : "flow01-canonical.json";
  return path.join(EVIDENCE_DIR, name);
}

function parseArgs(argv) {
  let mode = "self-test";
  /** @type {string[] | null} */
  let pipelineArg = null;
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
    }
  }
  return { mode, pipelineArg };
}

async function writeEvidence(report, mode) {
  await mkdir(EVIDENCE_DIR, { recursive: true });
  const target = evidencePathFor(mode);
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

async function main() {
  const { mode, pipelineArg } = parseArgs(process.argv.slice(2));

  console.log("═══════════════════════════════════════════════");
  console.log("FLOW-01 · Canonical runner");
  console.log("Evidence before Implementation");
  console.log(`mode: ${mode}`);
  console.log("═══════════════════════════════════════════════");

  if (mode === "live") {
    const outcome = classifyFlow01Outcome({
      mode: "live",
      validationOk: false,
      pipelineStarted: false,
      domainDriverReady: false,
    });
    const report = buildFlow01EvidenceReport({
      status: outcome.status,
      reason: outcome.reason,
      pipeline: [],
      code_status: "DOMAIN_DRIVER_PENDING",
      terminal: { order_status: null, packaging_batch: null },
    });
    const out = await writeEvidence(report, "live");
    console.log(outcome.reason);
    console.log(`evidence: ${path.relative(ROOT, out)}`);
    console.log("Next: wire domain driver after Implementation PRs.");
    process.exit(FLOW01_EXIT.BLOCKED);
  }

  const pipeline =
    mode === "pipeline" && pipelineArg
      ? pipelineArg
      : [...FLOW01_CANONICAL_STEPS];

  const validation = validateFlow01Pipeline(pipeline);
  const duration_ms = computeFlow01Durations(syntheticTimestamps(pipeline));
  const outcome = classifyFlow01Outcome({
    mode: mode === "pipeline" ? "pipeline" : "self-test",
    validationOk: validation.ok,
    pipelineStarted: pipeline.length > 0,
    domainDriverReady: false,
    reason: validation.ok
      ? ""
      : `Pipeline stopped at ${validation.firstFailure}`,
  });

  const report = buildFlow01EvidenceReport({
    status: outcome.status,
    reason: outcome.reason,
    pipeline,
    validation,
    duration_ms,
    code_status: mode === "self-test" ? "RUNNER_SELF_TEST" : "OBSERVED_PIPELINE",
  });

  console.log(formatFlow01ComparisonTable(validation));
  console.log("");
  console.log(
    `status=${report.status} duplicates=${JSON.stringify(report.duplicates)} missing=${JSON.stringify(report.missing)} out_of_order=${JSON.stringify(report.out_of_order)}`,
  );

  const out = await writeEvidence(report);
  console.log(`evidence: ${path.relative(ROOT, out)}`);

  if (report.status === "PASS") {
    console.log("PASS — FLOW-01 evidence contract satisfied");
    process.exit(FLOW01_EXIT.PASS);
  }
  if (report.status === "BLOCKED") {
    process.exit(FLOW01_EXIT.BLOCKED);
  }
  process.exit(FLOW01_EXIT.FAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(FLOW01_EXIT.FAIL);
});
