import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  EATCLEAN_1A_563 as r,
  eatclean1A563Payload,
  eatclean1A563ScopeId,
  authorizeEatClean1A563,
  assertEatClean1A563Manifest,
} from "./release-eatclean-1a-flow04-563.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { classifyPaths, hash } from "./release-contract.mjs";
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
  candSha = "3".repeat(40),
  gov = 564;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-28T18:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

function snapshot() {
  const commits = [
    ...structuredClone(r.productCommits),
    {
      sha: candSha,
      parent: r.candidatePr.baseSha,
      pr: r.candidatePr.number,
      files: structuredClone(r.candidatePr.files),
    },
    {
      sha: final,
      parent: candSha,
      pr: gov,
      headSha: head,
      files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
    },
  ];

  const productPaths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.candidatePr.files.map((f) => f.path),
    ]),
  ].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPrs: r.productCommits.map((c) =>
      humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`),
    ),
    candidatePr: humanPr(
      r.candidatePr.number,
      candSha,
      r.candidatePr.headSha,
      "feat/eatclean-1a-kitchen-flow04-ui",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    diff: {
      commits: commits.map((c) => c.sha),
      paths: [...new Set([...productPaths, ...r.governancePaths])].sort(),
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
  const payload = eatclean1A563Payload(s, policy);
  const authorization_id = eatclean1A563ScopeId(payload);
  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, gov]),
    authorization_id,
    exact_interval_scope: JSON.stringify(canonical(payload)),
    reason: "Controlled EatClean 1A FLOW-04 #563 publication",
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

test("EatClean 1A FLOW-04 sealed interval PASS and immutable record", () => {
  const v = valid();
  assert.equal(r.productCommits.length, 10);
  assert.equal(r.candidatePr.files.length, 9);
  assert.equal(r.governancePaths.length, 6);

  const productPaths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.candidatePr.files.map((f) => f.path),
    ]),
  ];
  assert.equal(productPaths.length, 55);
  assert.equal(classifyPaths(productPaths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");

  const payload = eatclean1A563Payload(v.s, policy);
  assert.equal(payload.candidateSha, candSha);
  assert.equal(payload.candidatePr, 563);
  assert.equal(payload.governancePr, gov);

  const auth = authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, hash(JSON.stringify(payload)));

  assertEatClean1A563Manifest(v.manifest, v.fresh);
  assertReconciliationManifest(v.manifest, v.fresh, policy);
});

test("sealed hashes and first-parent sequence match real reviewed Git content", () => {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  assert.deepEqual(
    git("rev-list", "--first-parent", "--reverse", `${r.baseline.sha}..ffff9d14019e4e71f76de126a5fccfa78b43aff7`).split("\n"),
    r.productCommits.map((c) => c.sha),
  );

  for (const c of r.productCommits) {
    assert.equal(git("rev-parse", `${c.sha}^1`), c.parent);
    assert.deepEqual(
      git("diff", "--name-only", "--no-renames", c.parent, c.sha).split("\n").sort(),
      c.files.map((f) => f.path),
    );
    for (const f of c.files) {
      for (const [rev, want] of [
        [c.parent, f.before],
        [c.sha, f.after],
      ]) {
        const exists = git("ls-tree", rev, "--", f.path);
        assert.equal(exists ? hash(execFileSync("git", ["show", `${rev}:${f.path}`])) : null, want);
      }
    }
  }

  // Verify candidate PR 563 file diff matches Git content between base and head
  assert.deepEqual(
    git("diff", "--name-only", "--no-renames", r.candidatePr.baseSha, r.candidatePr.headSha).split("\n").sort(),
    r.candidatePr.files.map((f) => f.path),
  );
  for (const f of r.candidatePr.files) {
    for (const [rev, want] of [
      [r.candidatePr.baseSha, f.before],
      [r.candidatePr.headSha, f.after],
    ]) {
      const exists = git("ls-tree", rev, "--", f.path);
      assert.equal(exists ? hash(execFileSync("git", ["show", `${rev}:${f.path}`])) : null, want);
    }
  }
});

test("EatClean 1A FLOW-04 FAIL: baseline mismatch", () => {
  const s = snapshot();
  s.baseline.sha = "0".repeat(40);
  assert.throws(() => eatclean1A563Payload(s, policy), /baseline mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: candidate commit parent mismatch", () => {
  const s = snapshot();
  s.commits[10].parent = "0".repeat(40);
  assert.throws(() => eatclean1A563Payload(s, policy), /candidate PR 563 lineage\/content mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: candidate commit files mismatch", () => {
  const s = snapshot();
  s.commits[10].files[0].after = "0".repeat(64);
  assert.throws(() => eatclean1A563Payload(s, policy), /candidate PR 563 lineage\/content mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: sealed product commit hash altered", () => {
  const s = snapshot();
  s.commits[0].files[0].after = "0".repeat(64);
  assert.throws(() => eatclean1A563Payload(s, policy), /sealed commits mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: additional unauthorized commit", () => {
  const s = snapshot();
  s.commits.splice(5, 0, {
    sha: "4".repeat(40),
    parent: s.commits[4].sha,
    pr: 999,
    files: [],
  });
  assert.throws(() => eatclean1A563Payload(s, policy), /exact 12-commit interval required/);
});

test("EatClean 1A FLOW-04 FAIL: foreign PR in sequence", () => {
  const s = snapshot();
  s.productPrs[0].number = 999;
  assert.throws(() => eatclean1A563Payload(s, policy), /provenance mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: expanded diff path", () => {
  const s = snapshot();
  s.diff.paths.push("src/unauthorized.ts");
  s.diff.paths.sort();
  assert.throws(() => eatclean1A563Payload(s, policy), /interval expanded/);
});

test("EatClean 1A FLOW-04 FAIL: governance branch mismatch", () => {
  const s = snapshot();
  s.remediation.head.ref = "main";
  assert.throws(() => eatclean1A563Payload(s, policy), /governance branch mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: wrong dispatch actor", () => {
  const v = valid();
  const badRun = run();
  badRun.actor.id = 999;
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, badRun, policy), /dispatch authority mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: altered authorization ID", () => {
  const v = valid();
  v.inputs.authorization_id = "0".repeat(64);
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy), /human scope mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: tampered exact_interval_scope", () => {
  const v = valid();
  const tampered = JSON.parse(v.inputs.exact_interval_scope);
  tampered.constraints.productionWorkerApprovalGranted = true;
  v.inputs.exact_interval_scope = JSON.stringify(canonical(tampered));
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy), /human scope mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: normal mode instead of exact_interval", () => {
  const v = valid();
  v.inputs.mode = "normal";
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy), /explicit dispatch required/);
});
