import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  P0_538 as r,
  p0Orders538Payload,
  p0Orders538ScopeId,
  authorizeP0Orders538,
  assertP0Orders538Manifest,
} from "./release-p0-orders-538.mjs";
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
  gov = 541;

const c538Sha = "829c218c7c15e146998dbf102fcd01c607b79755";
const c539Sha = "3c771f7e4743714bcc39aa92b6c799b7e988867b";

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-18T10:00:00Z",
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
        sha: c538Sha,
        parent: r.baseline.sha,
        pr: 538,
        headSha: r.productHeadSha,
        files: structuredClone(r.productFiles),
      },
      {
        sha: c539Sha,
        parent: c538Sha,
        pr: 539,
        headSha: "3".repeat(40),
        files: [],
      },
      {
        sha: r.candidateSha,
        parent: c539Sha,
        pr: 540,
        headSha: "4".repeat(40),
        files: [],
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
      538,
      c538Sha,
      r.productHeadSha,
      "fix/p0-cx-01d-order-confirmation-canonical-quoted-writer",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    productFiles: structuredClone(r.productFiles),
    diff: {
      commits: [c538Sha, c539Sha, r.candidateSha, final],
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
  const payload = p0Orders538Payload(s, policy);
  const authorization_id = p0Orders538ScopeId(payload);
  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([538, 539, 540, gov]),
    authorization_id,
    exact_interval_scope: JSON.stringify(canonical(payload)),
    reason: "Controlled EatClean P0 Order Confirmation release preparation",
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

test("P0 EatClean #538 sealed interval PASS and immutable record", () => {
  const v = valid();
  assert.equal(r.productFiles.length, 16);
  assert.equal(r.governancePaths.length, 7);
  assert.equal(classifyPaths(r.productFiles.map((f) => f.path)).special.length, 2);
  const payload = p0Orders538Payload(v.s, policy);
  assert.equal(payload.candidateSha, r.candidateSha);
  assert.equal(payload.productPr, 538);
  assert.deepEqual(payload.productPrs, [538, 539, 540]);
  assert.equal(payload.governancePr, gov);
  const auth = authorizeP0Orders538(v.s, v.inputs, v.ctx, run(), policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, hash(JSON.stringify(payload)));
  assertP0Orders538Manifest(v.manifest, v.fresh);
  assertReconciliationManifest(v.manifest, v.fresh, policy);
});

test("P0 #538 FAIL: wrong baseline SHA", () => {
  const v = valid();
  v.s.baseline.sha = "0".repeat(40);
  assert.throws(() => p0Orders538Payload(v.s, policy), /baseline mismatch/);
});

test("P0 #538 FAIL: altered product commit lineage", () => {
  const v = valid();
  v.s.commits[0].parent = "f".repeat(40);
  assert.throws(() => p0Orders538Payload(v.s, policy), /product commit 1 lineage mismatch/);
});

test("P0 #538 FAIL: altered PR #539 lineage", () => {
  const v = valid();
  v.s.commits[1].sha = "f".repeat(40);
  assert.throws(() => p0Orders538Payload(v.s, policy), /product commit 2/);
});

test("P0 #538 FAIL: missing clean revert commit #540", () => {
  const v = valid();
  v.s.commits[2].pr = 999;
  assert.throws(() => p0Orders538Payload(v.s, policy), /product commit 3/);
});

test("P0 #538 FAIL: unauthorized product PR merger", () => {
  const v = valid();
  v.s.productPr.merged_by.id = 99999999;
  assert.throws(() => p0Orders538Payload(v.s, policy), /canonical human merge missing/);
});

test("P0 #538 FAIL: altered product head SHA", () => {
  const v = valid();
  v.s.productPr.head.sha = "0".repeat(40);
  assert.throws(() => p0Orders538Payload(v.s, policy), /product head mismatch/);
});

test("P0 #538 FAIL: altered sealed product files", () => {
  const v = valid();
  v.s.productFiles[0].after = "f".repeat(64);
  assert.throws(() => p0Orders538Payload(v.s, policy), /sealed product files mismatch/);
});

test("P0 #538 FAIL: governance PR head branch mismatch", () => {
  const v = valid();
  v.s.remediation.head.ref = "feature/wrong-branch";
  assert.throws(() => p0Orders538Payload(v.s, policy), /governance head mismatch/);
});

test("P0 #538 FAIL: wrong dispatch mode (must be exact_interval)", () => {
  const v = valid();
  v.inputs.mode = "normal";
  assert.throws(() => authorizeP0Orders538(v.s, v.inputs, v.ctx, run(), policy), /explicit dispatch required/);
});

test("P0 #538 FAIL: wrong authorized_prs array in dispatch", () => {
  const v = valid();
  v.inputs.authorized_prs = JSON.stringify([538, gov]);
  assert.throws(() => authorizeP0Orders538(v.s, v.inputs, v.ctx, run(), policy), /dispatch anchors mismatch/);
});

test("P0 #538 FAIL: tampered scope identity in dispatch", () => {
  const v = valid();
  v.inputs.authorization_id = "0".repeat(64);
  assert.throws(() => authorizeP0Orders538(v.s, v.inputs, v.ctx, run(), policy), /human scope mismatch/);
});
