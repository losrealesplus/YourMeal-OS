import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  OPERATIONS_545 as r,
  operations545Payload,
  operations545ScopeId,
  authorizeOperations545,
  assertOperations545Manifest,
} from "./release-operational-evolution-545.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { assertApproval, classifyPaths, hash } from "./release-contract.mjs";
import { assertReconciliationManifest } from "./release-reconciliation.mjs";

const policy = {
  repository: r.repository,
  environment: r.environment,
  reviewerId: r.reviewerId,
  reviewerLogin: r.reviewerLogin,
  workflow: ".github/workflows/deploy-production.yml",
};

const final = "1".repeat(40),
  head = "2".repeat(40),
  gov = 546;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-20T17:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

function snapshot() {
  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits: [
      {
        sha: r.candidateSha,
        parent: r.baseline.sha,
        pr: 545,
        files: structuredClone(r.productFiles),
      },
      {
        sha: final,
        parent: r.candidateSha,
        pr: gov,
        headSha: head,
        files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
      },
    ],
    productPr: humanPr(
      545,
      r.candidateSha,
      r.productHeadSha,
      "feature/eatclean-operational-evolution-orders-packing",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    diff: {
      commits: [r.candidateSha, final],
      paths: [...new Set([...r.productFiles.map((f) => f.path), ...r.governancePaths])].sort(),
    },
  };
}

function run(id = 1) {
  return {
    id,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: final,
    path: policy.workflow,
    actor: { id: r.reviewerId, login: r.reviewerLogin },
    triggering_actor: { id: r.reviewerId, login: r.reviewerLogin },
  };
}

function valid() {
  const s = snapshot();
  const payload = operations545Payload(s, policy);
  const authorization_id = operations545ScopeId(payload);
  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([545, gov]),
    authorization_id,
    exact_interval_scope: JSON.stringify(canonical(payload)),
    reason: "Controlled EatClean Operational Evolution 545 preparation",
  };
  const ctx = {
    repository: policy.repository,
    ref: "refs/heads/main",
    sha: final,
    runId: "1",
    attempt: "1",
    event: "workflow_dispatch",
  };
  const fresh = {
    schema: 1,
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: final,
    runId: "1",
    attempt: "1",
    reconciliation: {
      reconciled: true,
      reconciliationId: hash(JSON.stringify(payload)),
      payload,
    },
  };
  const manifest = {
    schema: 1,
    sourceSha: final,
    runId: "1",
    attempt: "1",
    repository: policy.repository,
    tarSha256: "b".repeat(64),
    configSha256: "c".repeat(64),
    reconciliation: fresh.reconciliation,
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: final,
      reconciliation: fresh.reconciliation,
    },
  };
  return { s, payload, authorization_id, inputs, ctx, fresh, manifest };
}

test("Operational Evolution #545 sealed interval PASS and immutable record", () => {
  const v = valid();
  assert.equal(r.productFiles.length, 21);
  assert.equal(r.governancePaths.length, 7);
  assert.equal(classifyPaths(r.productFiles.map((f) => f.path)).special.length, 2);
  const payload = operations545Payload(v.s, policy);
  assert.equal(payload.candidateSha, r.candidateSha);
  assert.equal(payload.productPr, 545);
  assert.equal(payload.governancePr, gov);
  const auth = authorizeOperations545(v.s, v.inputs, v.ctx, run(), policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, hash(JSON.stringify(payload)));
  assertOperations545Manifest(v.manifest, v.fresh);
  assertReconciliationManifest(v.manifest, v.fresh, policy);
});

test("Operational Evolution #545 FAIL: baseline mismatch", () => {
  const s = snapshot();
  s.baseline.sha = "0".repeat(40);
  assert.throws(() => operations545Payload(s, policy), /baseline mismatch/);
});

test("Operational Evolution #545 FAIL: candidate SHA mismatch", () => {
  const s = snapshot();
  s.commits[0].sha = "0".repeat(40);
  assert.throws(() => operations545Payload(s, policy), /product lineage/);
});

test("Operational Evolution #545 FAIL: modified product file hash", () => {
  const s = snapshot();
  s.commits[0].files[0].after = "0".repeat(64);
  assert.throws(() => operations545Payload(s, policy), /product lineage/);
});

test("Operational Evolution #545 FAIL: unauthorized actor", () => {
  const v = valid();
  const badRun = run();
  badRun.actor.id = 999;
  assert.throws(() => authorizeOperations545(v.s, v.inputs, v.ctx, badRun, policy), /dispatch authority mismatch/);
});

test("Operational Evolution #545 FAIL: altered authorization ID", () => {
  const v = valid();
  v.inputs.authorization_id = "0".repeat(64);
  assert.throws(() => authorizeOperations545(v.s, v.inputs, v.ctx, run(), policy), /human scope mismatch/);
});
