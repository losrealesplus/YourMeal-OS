import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  STAFF_523 as r,
  staff523Payload,
  staff523ScopeId,
  authorizeStaff523,
  assertStaff523Manifest,
} from "./release-staff-orders-523.mjs";
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
  gov = 524;
const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-11T20:00:00Z",
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
        pr: 523,
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
      523,
      r.candidateSha,
      r.productHeadSha,
      "codex/eatclean-atomic-staff-order-capture",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    diff: {
      commits: [r.candidateSha, final],
      paths: [...new Set([...r.productFiles.map((f) => f.path), ...r.governancePaths])].sort(),
    },
  };
}
const context = {
  repository: r.repository,
  ref: "refs/heads/main",
  sha: final,
  runId: "10001",
  attempt: "1",
  event: "workflow_dispatch",
};
const run = {
  id: 10001,
  run_attempt: 1,
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: final,
  path: policy.workflow,
  actor: { id: r.reviewerId },
  triggering_actor: { id: r.reviewerId },
};
function inputs(s = snapshot()) {
  const p = staff523Payload(s, policy);
  return {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([523, gov]),
    exact_interval_scope: JSON.stringify(canonical(p)),
    authorization_id: staff523ScopeId(p),
  };
}
test("exact scope eligible only after explicit authorized dispatch", () => {
  const p = authorizeStaff523(snapshot(), inputs(), context, run, policy);
  assert.equal(p.reconciled, true);
  assert.equal(p.payload.constraints.productionSqlAuthorized, false);
  assert.equal(p.payload.constraints.orderActivationAuthorized, false);
});
for (const [name, change] of [
  ["baseline SHA", (s) => (s.baseline.sha = "0".repeat(40))],
  ["baseline deployment", (s) => s.baseline.deploymentId++],
  ["baseline version", (s) => (s.baseline.versionId = "other")],
  ["main stale", (s) => (s.currentMainSha = "0".repeat(40))],
  ["candidate SHA", (s) => (s.commits[0].sha = "0".repeat(40))],
  ["product PR", (s) => (s.commits[0].pr = 522)],
  ["product paths", (s) => s.commits[0].files.pop()],
  ["product before hash", (s) => (s.commits[0].files[0].before = "a".repeat(64))],
  ["product after hash", (s) => (s.commits[0].files[0].after = "a".repeat(64))],
  ["product head", (s) => (s.productPr.head.sha = "0".repeat(40))],
  ["product merge authority", (s) => (s.productPr.merged_by.id = 1)],
  ["product foreign repo", (s) => (s.productPr.head.repo.full_name = "x/y")],
  ["extra commit", (s) => s.commits.push(s.commits[1])],
  ["governance parent", (s) => (s.commits[1].parent = "0".repeat(40))],
  ["governance head", (s) => (s.commits[1].headSha = "0".repeat(40))],
  ["governance branch", (s) => (s.remediation.head.ref = "main")],
  ["governance authority", (s) => (s.remediation.merged_by.id = 1)],
  [
    "governance paths",
    (s) => s.commits[1].files.push({ path: "src/extra.ts", before: null, after: "a".repeat(64) }),
  ],
  ["governance missing hash", (s) => (s.commits[1].files[0].after = null)],
  ["interval paths", (s) => s.diff.paths.push("src/extra.ts")],
  ["interval commits", (s) => s.diff.commits.reverse()],
])
  test("reject " + name, () => {
    const s = snapshot();
    change(s);
    assert.throws(() => staff523Payload(s, policy));
  });
for (const [name, change] of [
  ["wrong policy authority", (p) => (p.reviewerId = 1)],
  ["wrong policy environment", (p) => (p.environment = "staging")],
  ["wrong policy repository", (p) => (p.repository = "x/y")],
])
  test("reject " + name, () => {
    const p = { ...policy };
    change(p);
    assert.throws(() => staff523Payload(snapshot(), p));
  });
for (const [name, change] of [
  ["normal dispatch", (i) => (i.mode = "normal")],
  ["wrong expected base", (i) => (i.expected_base_sha = "0".repeat(40))],
  ["wrong expected source", (i) => (i.expected_target_sha = "0".repeat(40))],
  ["wrong PR list", (i) => (i.authorized_prs = "[523,525]")],
  ["wrong authorization hash", (i) => (i.authorization_id = "0".repeat(64))],
  ["invalid JSON", (i) => (i.exact_interval_scope = "{")],
  [
    "SQL widening",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.constraints.productionSqlAuthorized = true;
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = staff523ScopeId(p);
    },
  ],
  [
    "activation widening",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.constraints.orderActivationAuthorized = true;
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = staff523ScopeId(p);
    },
  ],
  [
    "governance content drift",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.governanceFiles[0].after = "b".repeat(64);
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = staff523ScopeId(p);
    },
  ],
])
  test("dispatch rejects " + name, () => {
    const i = inputs();
    change(i);
    assert.throws(() => authorizeStaff523(snapshot(), i, context, run, policy));
  });
for (const [name, change] of [
  ["actor", (v) => (v.actor.id = 1)],
  ["triggering actor", (v) => (v.triggering_actor.id = 1)],
  ["retry", (v) => (v.run_attempt = 2)],
  ["wrong run", (v) => v.id++],
  ["workflow", (v) => (v.path = "other.yml")],
  ["source", (v) => (v.head_sha = "0".repeat(40))],
])
  test("run rejects " + name, () => {
    const v = structuredClone(run);
    change(v);
    assert.throws(() => authorizeStaff523(snapshot(), inputs(), context, v, policy));
  });
test("push never grants preparation authority", () =>
  assert.throws(() =>
    authorizeStaff523(snapshot(), inputs(), { ...context, event: "push" }, run, policy),
  ));
test("product SPECIAL stays SPECIAL", () =>
  assert.equal(classifyPaths(r.productFiles.map((f) => f.path)).special.length, 5));
test("sealed file hashes match actual product Git blobs", () => {
  for (const f of r.productFiles)
    for (const [key, sha] of [
      ["before", r.baseline.sha],
      ["after", r.candidateSha],
    ]) {
      let actual = null;
      try {
        actual = hash(
          execFileSync("git", ["show", sha + ":" + f.path], {
            stdio: ["ignore", "pipe", "ignore"],
          }),
        );
      } catch {}
      assert.equal(actual, f[key]);
    }
});
function manifest() {
  const rec = authorizeStaff523(snapshot(), inputs(), context, run, policy);
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: final,
    reconciliation: rec,
  };
  return {
    fresh,
    manifest: {
      sourceSha: final,
      reconciliation: structuredClone(rec),
      plan: structuredClone(fresh),
    },
  };
}
test("phase manifest exact binding passes existing mechanism", () => {
  const v = manifest();
  assertReconciliationManifest(v.manifest, v.fresh);
});
test("modified phase payload rejected", () => {
  const v = manifest();
  v.manifest.reconciliation.payload.productFiles[0].after = "b".repeat(64);
  assert.throws(() => assertReconciliationManifest(v.manifest, v.fresh));
});
test("modified phase source rejected", () => {
  const v = manifest();
  v.manifest.sourceSha = "0".repeat(40);
  assert.throws(() => assertStaff523Manifest(v.manifest, v.fresh));
});
test("preparation cannot substitute production approval", () => {
  assert.throws(() => assertApproval([], policy));
  assert.throws(() =>
    assertApproval(
      [{ state: "approved", environments: [{ name: policy.environment }], user: { id: 1 } }],
      policy,
    ),
  );
});
test("publisher approval and workflow barrier retained", () => {
  const wf = fs.readFileSync(".github/workflows/deploy-production.yml", "utf8");
  assert.match(wf, /environment:\s*\n\s*name: production-worker/);
  const publish = fs.readFileSync("scripts/governance/release-publish.mjs", "utf8");
  assert.match(publish, /assertApproval/);
});
