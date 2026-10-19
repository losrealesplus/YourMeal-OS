import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  B2C_543 as r,
  b2cHardening543Payload,
  b2cHardening543ScopeId,
  authorizeB2cHardening543,
  assertB2cHardening543Manifest,
} from "./release-b2c-hardening-543.mjs";
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
  gov = 544;

const c542Sha = "34d588de1d22bdacee55a22ab440e5c2b7d7d648";
const c543Sha = "82e984eb647fef90db98d28a7b3e81ca5dd2dfb8";

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-18T18:00:00Z",
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
        sha: c542Sha,
        parent: r.baseline.sha,
        pr: 542,
        headSha: r.productPr542HeadSha,
        files: [],
      },
      {
        sha: c543Sha,
        parent: c542Sha,
        pr: 543,
        headSha: r.productPr543HeadSha,
        files: [],
      },
      {
        sha: final,
        parent: r.candidateSha,
        pr: gov,
        headSha: head,
        files: r.governancePaths.map((p) => ({
          path: p,
          before: "a".repeat(64),
          after: "b".repeat(64),
        })),
      },
    ],
    productPrs: [
      humanPr(542, c542Sha, r.productPr542HeadSha, "feat/b2c-onboarding-calendar-multiday"),
      humanPr(543, c543Sha, r.productPr543HeadSha, "fix/b2c-hardening-5-points"),
    ],
    productFiles: structuredClone(r.productFiles),
    remediation: humanPr(gov, final, head, r.governanceBranch),
  };
}

function inputs(payload) {
  return {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, gov]),
    authorization_id: b2cHardening543ScopeId(payload),
    exact_interval_scope: JSON.stringify(canonical(payload)),
  };
}

function runCtx() {
  return {
    ctx: {
      repository: r.repository,
      ref: "refs/heads/main",
      sha: final,
      runId: "123456",
      attempt: "1",
      event: "workflow_dispatch",
    },
    run: {
      id: 123456,
      run_attempt: 1,
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: final,
      path: ".github/workflows/deploy-production.yml",
      actor: { id: r.reviewerId },
      triggering_actor: { id: r.reviewerId },
    },
  };
}

test("B2C #543 sealed baseline and candidate match expectations", () => {
  assert.equal(r.baseline.sha, "f2d63350ba3e21dd77301730dd1754cc11ad1fdc");
  assert.equal(r.baseline.versionId, "8bbf1cc1-8325-4ade-82c9-86798ca119c6");
  assert.equal(r.candidateSha, "82e984eb647fef90db98d28a7b3e81ca5dd2dfb8");
  assert.equal(r.productFiles.length, 28);
  const special = classifyPaths(r.productFiles.map((f) => f.path)).special;
  assert.equal(special.length, 5);
  assert.deepEqual(special.sort(), [
    "B2C_HARDENING_5_POINTS_IMPLEMENTATION_REPORT.md",
    "EATCLEAN_B2C_ONBOARDING_AND_MULTIDAY_IMPLEMENTATION_REPORT.md",
    "src/hooks/use-tenant-active-week.spec.tsx",
    "src/hooks/use-tenant-active-week.ts",
    "supabase/migrations/20261018193000_cr_order_server_cutoff_enforcement.sql",
  ]);
});

test("b2cHardening543Payload produces deterministic canonical payload", () => {
  const p1 = b2cHardening543Payload(snapshot(), policy);
  const p2 = b2cHardening543Payload(snapshot(), policy);
  assert.deepEqual(p1, p2);
  assert.equal(p1.reconciliationType, "B2C_HARDENING_543_PREPARATION");
  assert.equal(p1.productFiles.length, 28);
  assert.equal(p1.finalSourceSha, final);
  assert.equal(p1.governancePr, gov);
  assert.equal(p1.constraints.orderCreation, true);
  assert.equal(p1.constraints.staffOrderCapture, true);
  assert.equal(p1.constraints.crmIdentityMutations, false);
});

test("authorizeB2cHardening543 validates explicit human dispatch and scope identity", () => {
  const snap = snapshot();
  const payload = b2cHardening543Payload(snap, policy);
  const { ctx, run } = runCtx();
  const res = authorizeB2cHardening543(snap, inputs(payload), ctx, run, policy);
  assert.equal(res.reconciled, true);
  assert.equal(res.reconciliationId, hash(JSON.stringify(payload)));
  assert.deepEqual(res.payload, payload);
});

test("authorizeB2cHardening543 rejects altered authorization ID", () => {
  const snap = snapshot();
  const payload = b2cHardening543Payload(snap, policy);
  const badInputs = inputs(payload);
  badInputs.authorization_id = "0".repeat(64);
  const { ctx, run } = runCtx();
  assert.throws(
    () => authorizeB2cHardening543(snap, badInputs, ctx, run, policy),
    /human scope mismatch/,
  );
});

test("authorizeB2cHardening543 rejects non-reviewer actor dispatch", () => {
  const snap = snapshot();
  const payload = b2cHardening543Payload(snap, policy);
  const { ctx, run } = runCtx();
  run.triggering_actor = { id: 999999 };
  assert.throws(
    () => authorizeB2cHardening543(snap, inputs(payload), ctx, run, policy),
    /dispatch authority mismatch/,
  );
});

test("assertB2cHardening543Manifest ensures manifest and plan reconciliation match", () => {
  const snap = snapshot();
  const payload = b2cHardening543Payload(snap, policy);
  const reconciliationId = hash(JSON.stringify(payload));
  const fresh = {
    sourceSha: final,
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    reconciliation: { payload, reconciliationId },
  };
  const manifest = {
    sourceSha: final,
    reconciliation: { payload, reconciliationId },
    plan: {
      sourceSha: final,
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      reconciliation: { payload, reconciliationId },
    },
  };
  assert.doesNotThrow(() => assertB2cHardening543Manifest(manifest, fresh));
  assert.doesNotThrow(() => assertReconciliationManifest(manifest, fresh));
});
