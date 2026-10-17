import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  P1_532 as r,
  p1Orders532Payload,
  p1Orders532ScopeId,
  authorizeP1Orders532,
  assertP1Orders532Manifest,
} from "./release-p1-orders-532.mjs";
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
  gov = 533;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-17T11:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

// The 8 product commits between baseline and candidate
const productShas = [
  "5abb88ecf65327ca2268e27664c78551055020d5",
  "f92e8d98dfefa57b930e6b335c56769f0dc0b2c1",
  "62c1a951aa9f55c0bd5abdc966105d9dbb56dc91",
  "41b5fb42a6f26f8782d994908c58c4f8f0373082",
  "d4e38fdbd9617f4ff264f9eecb2ac30b39008bdc",
  "707935e55e62df8e4fa0fbea2b5fbc84a3ec8105",
  "4dc5df9e2fde62b0116244120e3fa9448a12596c",
  r.candidateSha,
];

function snapshot() {
  const commits = productShas.map((sha, idx) => ({
    sha,
    parent: idx === 0 ? r.baseline.sha : productShas[idx - 1],
    pr: r.productPrs[idx],
    files: [],
  }));

  // Governance commit follows candidateSha
  commits.push({
    sha: final,
    parent: r.candidateSha,
    pr: gov,
    headSha: head,
    files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
  });

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPr: humanPr(
      532,
      r.candidateSha,
      r.productHeadSha,
      "gate6-controlled-cutover-engineering",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    productFiles: structuredClone(r.productFiles),
    diff: {
      commits: [...productShas, final],
      paths: [...new Set([...r.productFiles.map((f) => f.path), ...r.governancePaths])].sort(),
    },
  };
}

const context = {
  repository: r.repository,
  ref: "refs/heads/main",
  sha: final,
  runId: "10002",
  attempt: "1",
  event: "workflow_dispatch",
};

const run = {
  id: 10002,
  run_attempt: 1,
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: final,
  path: policy.workflow,
  actor: { id: r.reviewerId },
  triggering_actor: { id: r.reviewerId },
};

function inputs(s = snapshot()) {
  const p = p1Orders532Payload(s, policy);
  return {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, gov]),
    exact_interval_scope: JSON.stringify(canonical(p)),
    authorization_id: p1Orders532ScopeId(p),
  };
}

test("P1 exact scope eligible only after explicit authorized dispatch", () => {
  const p = authorizeP1Orders532(snapshot(), inputs(), context, run, policy);
  assert.equal(p.reconciled, true);
  assert.equal(p.payload.constraints.productionSqlAuthorized, false);
  assert.equal(p.payload.constraints.orderActivationAuthorized, false);
});

for (const [name, change] of [
  ["baseline SHA", (s) => (s.baseline.sha = "0".repeat(40))],
  ["baseline deployment", (s) => s.baseline.deploymentId++],
  ["baseline version", (s) => (s.baseline.versionId = "other")],
  ["main stale", (s) => (s.currentMainSha = "0".repeat(40))],
  ["candidate SHA", (s) => (s.commits[7].sha = "0".repeat(40))],
  ["product PR", (s) => (s.commits[7].pr = 531)],
  ["product paths missing", (s) => s.productFiles.pop()],
  ["product before hash", (s) => (s.productFiles[0].before = "a".repeat(64))],
  ["product after hash", (s) => (s.productFiles[0].after = "a".repeat(64))],
  ["product head", (s) => (s.productPr.head.sha = "0".repeat(40))],
  ["product merge authority", (s) => (s.productPr.merged_by.id = 1)],
  ["product foreign repo", (s) => (s.productPr.head.repo.full_name = "x/y")],
  ["extra commit", (s) => s.commits.push(s.commits[8])],
  ["governance parent", (s) => (s.commits[8].parent = "0".repeat(40))],
  ["governance head", (s) => (s.commits[8].headSha = "0".repeat(40))],
  ["governance branch", (s) => (s.remediation.head.ref = "main")],
  ["governance authority", (s) => (s.remediation.merged_by.id = 1)],
  [
    "governance paths",
    (s) => s.commits[8].files.push({ path: "src/extra.ts", before: null, after: "a".repeat(64) }),
  ],
  ["governance missing hash", (s) => (s.commits[8].files[0].after = null)],
  ["interval paths", (s) => s.diff.paths.push("src/extra.ts")],
  ["interval commits", (s) => s.diff.commits.reverse()],
])
  test("reject " + name, () => {
    const s = snapshot();
    change(s);
    assert.throws(() => p1Orders532Payload(s, policy));
  });

for (const [name, change] of [
  ["wrong policy authority", (p) => (p.reviewerId = 1)],
  ["wrong policy environment", (p) => (p.environment = "staging")],
  ["wrong policy repository", (p) => (p.repository = "x/y")],
])
  test("reject " + name, () => {
    const p = { ...policy };
    change(p);
    assert.throws(() => p1Orders532Payload(snapshot(), p));
  });

for (const [name, change] of [
  ["normal dispatch", (i) => (i.mode = "normal")],
  ["wrong expected base", (i) => (i.expected_base_sha = "0".repeat(40))],
  ["wrong expected source", (i) => (i.expected_target_sha = "0".repeat(40))],
  ["wrong PR list", (i) => (i.authorized_prs = "[532,533]")],
  ["wrong authorization hash", (i) => (i.authorization_id = "0".repeat(64))],
  ["invalid JSON", (i) => (i.exact_interval_scope = "{")],
  [
    "SQL widening",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.constraints.productionSqlAuthorized = true;
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = p1Orders532ScopeId(p);
    },
  ],
  [
    "activation widening",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.constraints.orderActivationAuthorized = true;
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = p1Orders532ScopeId(p);
    },
  ],
  [
    "governance content drift",
    (i) => {
      const p = JSON.parse(i.exact_interval_scope);
      p.governanceFiles[0].after = "b".repeat(64);
      i.exact_interval_scope = JSON.stringify(canonical(p));
      i.authorization_id = p1Orders532ScopeId(p);
    },
  ],
])
  test("dispatch rejects " + name, () => {
    const i = inputs();
    change(i);
    assert.throws(() => authorizeP1Orders532(snapshot(), i, context, run, policy));
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
    assert.throws(() => authorizeP1Orders532(snapshot(), inputs(), context, v, policy));
  });

test("push never grants preparation authority", () =>
  assert.throws(() =>
    authorizeP1Orders532(snapshot(), inputs(), { ...context, event: "push" }, run, policy),
  ));

test("product SPECIAL stays SPECIAL (56 files)", () =>
  assert.equal(classifyPaths(r.productFiles.map((f) => f.path)).special.length, 56));

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
      assert.equal(actual, f[key], `Hash mismatch for ${f.path} at ${key} (${sha})`);
    }
});

function manifest() {
  const rec = authorizeP1Orders532(snapshot(), inputs(), context, run, policy);
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
  assert.throws(() => assertP1Orders532Manifest(v.manifest, v.fresh));
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
