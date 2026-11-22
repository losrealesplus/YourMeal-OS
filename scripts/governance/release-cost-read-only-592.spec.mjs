import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  COST_READ_ONLY_592 as r,
  costReadOnly592Payload,
  costReadOnly592ScopeId,
  authorizeCostReadOnly592,
  verifyCostReadOnly592Reconciliation,
  assertCostReadOnly592Manifest,
} from "./release-cost-read-only-592.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { hash, classifyPaths } from "./release-contract.mjs";
import { assertReconciliationManifest } from "./release-reconciliation.mjs";

const policy = {
  repository: r.repository,
  environment: r.environment,
  reviewerId: r.reviewerId,
  reviewerLogin: r.reviewerLogin,
  workflow: ".github/workflows/deploy-production.yml",
};

const finalSha = "1".repeat(40);
const govHeadSha = "2".repeat(40);
const govPr = 593;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-11-22T14:40:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

const candidatePaths = r.candidateFiles.map((f) => f.path).sort();

function snapshot() {
  const candidateCommit = {
    sha: r.candidateSha,
    parent: r.baseline.sha,
    pr: r.candidatePr,
    headSha: r.candidateHeadSha,
    files: structuredClone(r.candidateFiles),
  };
  const revertCommit = {
    sha: r.revertSha,
    parent: r.candidateSha,
    pr: r.revertPr,
    headSha: r.revertHeadSha,
    files: structuredClone(r.revertFiles),
  };
  const govCommit = {
    sha: finalSha,
    parent: r.revertSha,
    pr: govPr,
    headSha: govHeadSha,
    files: r.governancePaths.map((p) => ({
      path: p,
      before: p.includes("release-cost-read-only-592") ? null : "b".repeat(64),
      after: "a".repeat(64),
    })),
  };
  const totalPaths = [...new Set([...candidatePaths, ...r.governancePaths])].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: finalSha,
    currentMainSha: finalSha,
    commits: [candidateCommit, revertCommit, govCommit],
    candidatePr: humanPr(r.candidatePr, r.candidateSha, r.candidateHeadSha, r.candidateBranch),
    revertPr: humanPr(r.revertPr, r.revertSha, r.revertHeadSha, r.revertBranch),
    remediation: humanPr(govPr, finalSha, govHeadSha, r.governanceBranch),
    featureFlagServiceBlob: r.featureFlagServiceBlob,
    diff: {
      commits: [r.candidateSha, r.revertSha, finalSha],
      paths: totalPaths,
    },
  };
}

function validDispatch(mode = "normal") {
  const s = snapshot();
  const payload = costReadOnly592Payload(s, policy);
  const inputs = {
    mode,
    reason: "Release read-only UI fix after governance reconciliation",
    ...(mode === "exact_interval"
      ? {
          authorized_prs: JSON.stringify([r.candidatePr, r.revertPr, govPr]),
          exact_interval_scope: JSON.stringify(canonical(payload)),
          authorization_id: costReadOnly592ScopeId(payload),
          expected_base_sha: r.baseline.sha,
          expected_target_sha: finalSha,
        }
      : {}),
  };
  const ctx = {
    repository: policy.repository,
    sha: finalSha,
    runId: "45034000000",
    attempt: "1",
    event: "workflow_dispatch",
    ref: "refs/heads/main",
  };
  const run = {
    id: 45034000000,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: finalSha,
    path: policy.workflow,
    actor: { id: policy.reviewerId },
    triggering_actor: { id: policy.reviewerId },
  };
  return { s, inputs, ctx, run };
}

test("Cost Read-Only 592: static configuration invariants", () => {
  assert.equal(r.repository, "losrealesplus/YourMeal-OS");
  assert.equal(r.environment, "production-worker");
  assert.equal(r.baseline.sha, "891f18c8047f04ff9a827aa90bc44a1174db4748");
  assert.equal(r.candidateSha, "a12e6a1da3d92d08c889288c9798e0f384feb119");
  assert.equal(r.revertSha, "0ba407d8fb4b7a3957c4a462f1de38bb7fab611f");
  assert.equal(r.featureFlagServiceBlob, "489f06d9ca78037e9d747f725fdaa6f2ebdba57b");
  assert.equal(r.candidateFiles.length, 7);
  assert.equal(r.revertFiles.length, 1);
  assert.equal(r.productFiles.length, 6);
  assert.equal(r.governancePaths.length, 10);
  assert.equal(r.constraints.productionSqlAuthorized, false);
  assert.equal(r.constraints.migrationExecutionAuthorized, false);
});

test("Cost Read-Only 592: generates exact canonical payload and authorizes dispatch", () => {
  const { s, inputs, ctx, run } = validDispatch("normal");
  const result = authorizeCostReadOnly592(s, inputs, ctx, run, policy);
  assert.equal(result.reconciled, true);
  assert.equal(result.payload.candidateSha, r.candidateSha);
  assert.equal(result.payload.revertSha, r.revertSha);
  assert.equal(result.payload.governancePr, govPr);
  assert.equal(result.reconciliationId, hash(JSON.stringify(result.payload)));
});

test("Cost Read-Only 592: verifies reconciliation in mode normal", () => {
  const { s, inputs, ctx, run } = validDispatch("normal");
  const result = verifyCostReadOnly592Reconciliation(s, inputs, ctx, run, policy);
  assert.equal(result.reconciled, true);
  assert.equal(result.payload.reconciliationType, "COST_READ_ONLY_592_PREPARATION");
});

test("Cost Read-Only 592: authorizes exact_interval mode with explicit scope", () => {
  const { s, inputs, ctx, run } = validDispatch("exact_interval");
  const result = authorizeCostReadOnly592(s, inputs, ctx, run, policy);
  assert.equal(result.reconciled, true);
  assert.equal(result.payload.reconciliationType, "COST_READ_ONLY_592_PREPARATION");
});

test("Cost Read-Only 592: manifest verification passes and detects tampering", () => {
  const { s, inputs, ctx, run } = validDispatch("normal");
  const result = verifyCostReadOnly592Reconciliation(s, inputs, ctx, run, policy);
  const manifest = {
    schema: 1,
    sourceSha: finalSha,
    runId: ctx.runId,
    attempt: ctx.attempt,
    repository: policy.repository,
    reconciliation: result,
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: finalSha,
      reconciliation: result,
    },
  };
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: finalSha,
    reconciliation: result,
  };
  assert.doesNotThrow(() => assertCostReadOnly592Manifest(manifest, fresh));
  assert.doesNotThrow(() => assertReconciliationManifest(manifest, fresh));

  // Tampered candidateSha fails closed
  const tamperedManifest = structuredClone(manifest);
  tamperedManifest.reconciliation.payload.candidateSha = "0".repeat(40);
  assert.throws(() => assertCostReadOnly592Manifest(tamperedManifest, fresh));
});

test("Cost Read-Only 592: fail-closed negative boundary checks", () => {
  // 1. Baseline mismatch
  const badBaseline = snapshot();
  badBaseline.baseline.sha = "0".repeat(40);
  assert.throws(() => costReadOnly592Payload(badBaseline, policy), /baseline mismatch/);

  // 2. Candidate commit mismatch
  const badCandidate = snapshot();
  badCandidate.commits[0].sha = "0".repeat(40);
  assert.throws(() => costReadOnly592Payload(badCandidate, policy), /candidate PR #591 lineage/);

  // 3. Revert commit mismatch
  const badRevert = snapshot();
  badRevert.commits[1].sha = "0".repeat(40);
  assert.throws(() => costReadOnly592Payload(badRevert, policy), /clean revert PR #592 lineage/);

  // 4. Feature flag service blob mismatch (unclean revert)
  const badBlob = snapshot();
  badBlob.featureFlagServiceBlob = "0".repeat(40);
  assert.throws(() => costReadOnly592Payload(badBlob, policy), /clean revert violated/);

  // 5. Forbidden SQL migrations in interval
  const sqlInterval = snapshot();
  sqlInterval.diff.paths.push("supabase/migrations/20261122000000_unauthorized.sql");
  assert.throws(() => costReadOnly592Payload(sqlInterval, policy), /interval expanded/);

  // 6. Commit count < 3
  const truncatedCommits = snapshot();
  truncatedCommits.commits = truncatedCommits.commits.slice(0, 2);
  assert.throws(() => costReadOnly592Payload(truncatedCommits, policy), /at least 3 commits/);
});
