import test from "node:test";
import assert from "node:assert/strict";
import {
  B1_SPATIAL_567 as r,
  b1Spatial567Payload,
  b1Spatial567ScopeId,
  authorizeB1Spatial567,
  assertB1Spatial567Manifest,
} from "./release-b1-spatial-567.mjs";
import {
  EATCLEAN_1A_563,
  eatclean1A563Payload,
} from "./release-eatclean-1a-flow04-563.mjs";
import { routeExactInterval } from "./release-plan.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { hash, classifyPaths } from "./release-contract.mjs";

const policy = {
  repository: r.repository,
  environment: r.environment,
  reviewerId: r.reviewerId,
  reviewerLogin: r.reviewerLogin,
  workflow: ".github/workflows/deploy-production.yml",
};

const final = "1".repeat(40);
const head = "2".repeat(40);
const govPr = 568;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-11-08T12:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

const productPaths = [
  ...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path))),
].sort();

function snapshot() {
  const govCommit = {
    sha: final,
    parent: r.candidateSha,
    pr: govPr,
    headSha: head,
    files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
  };

  const commits = [...structuredClone(r.productCommits), govCommit];
  const totalPaths = [...new Set([...productPaths, ...r.governancePaths])].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPrs: r.productPrs.map((n, i) =>
      humanPr(n, r.productCommits[i].sha, r.productCommits[i].headSha, "feat-branch"),
    ),
    remediation: humanPr(govPr, final, head, r.governanceBranch),
    diff: {
      commits: commits.map((c) => c.sha),
      paths: totalPaths,
    },
  };
}

test("B1 Spatial 567: static configuration invariants", () => {
  assert.equal(r.repository, "losrealesplus/YourMeal-OS");
  assert.equal(r.environment, "production-worker");
  assert.equal(r.reviewerId, 292604102);
  assert.equal(r.reviewerLogin, "losrealesplus");
  assert.equal(r.baseline.sha, "fcc7801548fe60c3994f08fa18dc5f11431c6138");
  assert.equal(r.baseline.deploymentId, 7300101642);
  assert.equal(r.baseline.versionId, "07ece6be-721b-40b5-a747-acb43bee3142");
  assert.equal(r.candidateSha, "e30bf0dc151375fd0c8d2343c7e2710b806225ce");
  assert.equal(r.candidatePr, 567);
  assert.equal(r.productPrs.length, 15);
  assert.equal(r.productCommits.length, 15);
  assert.equal(productPaths.length, 93);
  assert.equal(r.governanceBranch, "feat/gate7-b1-spatial-reconciliation");
  assert.equal(r.governancePaths.length, 8);
  assert.equal(r.constraints.productionSqlAuthorized, false);
  assert.equal(r.constraints.migrationExecutionAuthorized, false);
  assert.equal(r.constraints.productionWorkerApprovalGranted, false);
});

test("B1 Spatial 567: valid control snapshot produces canonical payload and deterministic scope ID", () => {
  const s = snapshot();
  const payload = b1Spatial567Payload(s, policy);
  assert.equal(payload.schema, 1);
  assert.equal(payload.reconciliationType, "B1_SPATIAL_567_PREPARATION");
  assert.equal(payload.candidateSha, r.candidateSha);
  assert.equal(payload.candidatePr, 567);
  assert.equal(payload.governancePr, govPr);
  assert.equal(payload.finalSourceSha, final);
  assert.equal(payload.productPrs.length, 15);
  assert.equal(payload.constraints.productionSqlAuthorized, false);

  const scopeId = b1Spatial567ScopeId(payload);
  assert.match(scopeId, /^[a-f0-9]{64}$/);
});

test("B1 Spatial 567: rejects repository mismatch", () => {
  const s = snapshot();
  assert.throws(
    () => b1Spatial567Payload(s, { ...policy, repository: "other/repo" }),
    /B1 Spatial 567 policy mismatch/,
  );
});

test("B1 Spatial 567: rejects baseline mismatch", () => {
  const s = snapshot();
  s.baseline.sha = "0".repeat(40);
  assert.throws(() => b1Spatial567Payload(s, policy), /B1 Spatial 567 baseline mismatch/);
});

test("B1 Spatial 567: rejects stale targetSha (anti-future-commit)", () => {
  const s = snapshot();
  s.targetSha = "3".repeat(40);
  assert.throws(() => b1Spatial567Payload(s, policy), /B1 Spatial 567 final source stale/);
});

test("B1 Spatial 567: rejects commit count mismatch", () => {
  const s = snapshot();
  s.commits.pop(); // remove governance commit
  assert.throws(() => b1Spatial567Payload(s, policy), /exact 16-commit interval required/);
});

test("B1 Spatial 567: rejects tampered product commit sha", () => {
  const s = snapshot();
  s.commits[0].sha = "0".repeat(40);
  assert.throws(() => b1Spatial567Payload(s, policy), /sealed commits mismatch/);
});

test("B1 Spatial 567: rejects non-human product PR merge", () => {
  const s = snapshot();
  s.productPrs[0].merged_by.id = 999999999;
  assert.throws(() => b1Spatial567Payload(s, policy), /canonical human PR provenance mismatch/);
});

test("B1 Spatial 567: rejects governance parent that is not candidateSha", () => {
  const s = snapshot();
  s.commits[15].parent = "0".repeat(40);
  assert.throws(() => b1Spatial567Payload(s, policy), /governance lineage mismatch/);
});

test("B1 Spatial 567: rejects governance PR number less than or equal to candidate PR", () => {
  const s = snapshot();
  s.commits[15].pr = 567;
  assert.throws(() => b1Spatial567Payload(s, policy), /governance lineage mismatch/);
});

test("B1 Spatial 567: rejects governance branch mismatch", () => {
  const s = snapshot();
  s.remediation.head.ref = "wrong-branch";
  assert.throws(() => b1Spatial567Payload(s, policy), /Governance PR #568 canonical human PR provenance mismatch/);
});

test("B1 Spatial 567: rejects extra unclassified path in diff", () => {
  const s = snapshot();
  s.diff.paths.push("extra-rogue-file.ts");
  assert.throws(() => b1Spatial567Payload(s, policy), /interval expanded or unclassified files detected/);
});

test("B1 Spatial 567: authorizeB1Spatial567 succeeds under valid dispatch", () => {
  const s = snapshot();
  const payload = b1Spatial567Payload(s, policy);
  const scopeId = b1Spatial567ScopeId(payload);

  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, govPr]),
    authorization_id: scopeId,
    exact_interval_scope: JSON.stringify(canonical(payload)),
  };

  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: final,
    runId: "123456",
    attempt: "1",
    event: "workflow_dispatch",
  };

  const run = {
    id: 123456,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: final,
    path: ".github/workflows/deploy-production.yml",
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  };

  const auth = authorizeB1Spatial567(s, inputs, ctx, run, policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, scopeId);
  assert.deepEqual(auth.payload, payload);
});

test("B1 Spatial 567: authorizeB1Spatial567 rejects non-workflow_dispatch event", () => {
  const s = snapshot();
  const payload = b1Spatial567Payload(s, policy);
  const scopeId = b1Spatial567ScopeId(payload);

  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, govPr]),
    authorization_id: scopeId,
    exact_interval_scope: JSON.stringify(canonical(payload)),
  };

  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: final,
    runId: "123456",
    attempt: "1",
    event: "push",
  };

  const run = {
    id: 123456,
    run_attempt: 1,
    event: "push",
    head_branch: "main",
    head_sha: final,
    path: ".github/workflows/deploy-production.yml",
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  };

  assert.throws(
    () => authorizeB1Spatial567(s, inputs, ctx, run, policy),
    /B1 Spatial 567 explicit dispatch required/,
  );
});

test("B1 Spatial 567: assertB1Spatial567Manifest validates intact manifest and rejects tampered reconciliation", () => {
  const s = snapshot();
  const payload = b1Spatial567Payload(s, policy);
  const scopeId = b1Spatial567ScopeId(payload);

  const fresh = {
    sourceSha: final,
    reconciliation: {
      reconciliationId: scopeId,
      payload,
    },
  };

  const manifest = {
    sourceSha: final,
    reconciliation: {
      reconciliationId: scopeId,
      payload,
    },
    plan: {
      sourceSha: final,
      reconciliation: {
        reconciliationId: scopeId,
        payload,
      },
    },
  };

  // Valid manifest does not throw
  assert.doesNotThrow(() => assertB1Spatial567Manifest(manifest, fresh));

  // Tampered candidateSha in payload
  const tampered = structuredClone(manifest);
  tampered.reconciliation.payload.candidateSha = "0".repeat(40);
  assert.throws(
    () => assertB1Spatial567Manifest(tampered, fresh),
    /preparation\/publication scope changed/,
  );
});

test("Reconciler Router: selects authorizeEatClean1A563 for historical #563 interval", () => {
  const base = { sha: EATCLEAN_1A_563.baseline.sha };
  const candSha = "f50973714cffd94e225372543be66ceb6ba81d87";
  const govSha = "6159c437caf6903f2d1854021eb77071ad1cee50";
  const commits = [
    ...EATCLEAN_1A_563.productCommits.map((c) => c.sha),
    candSha,
    govSha,
  ];
  const prs = [
    ...EATCLEAN_1A_563.productPrs,
    563,
    564,
  ];
  const diff = { commits, paths: [] };

  // Router identifies EatClean candidate and invokes its authorizer (which validates EatClean 1A FLOW-04 inputs)
  assert.throws(
    () =>
      routeExactInterval(
        { repository: policy.repository, ref: "refs/heads/main", event: "workflow_dispatch", sha: govSha, runId: "123", attempt: "1" },
        base,
        diff,
        prs,
        govSha,
        {},
        { id: 123 },
        policy,
      ),
    /EatClean 1A FLOW-04/,
  );
});

test("Reconciler Router: selects authorizeB1Spatial567 for B1 post-#567 interval", () => {
  const base = { sha: r.baseline.sha };
  const diff = {
    commits: r.productCommits.map((c) => c.sha),
    paths: [],
  };
  const prs = [...r.productPrs];

  assert.throws(
    () =>
      routeExactInterval(
        { repository: policy.repository, ref: "refs/heads/main", event: "workflow_dispatch", sha: r.candidateSha, runId: "123", attempt: "1" },
        base,
        diff,
        prs,
        r.candidateSha,
        {},
        { id: 123 },
        policy,
      ),
    /B1 Spatial 567/,
  );
});

test("Reconciler Router: mixed or unauthorized interval on baseline fcc78015 fails closed", () => {
  const base = { sha: r.baseline.sha };
  // Mixed commits: has PR 565 but not 567 candidateSha
  const diff = {
    commits: [
      ...EATCLEAN_1A_563.productCommits.map((c) => c.sha),
      "f50973714cffd94e225372543be66ceb6ba81d87",
      "6159c437caf6903f2d1854021eb77071ad1cee50",
    ],
    paths: [],
  };
  const prs = [
    ...EATCLEAN_1A_563.productPrs,
    563,
    565, // PR > 564
  ];

  assert.throws(
    () =>
      routeExactInterval(
        { repository: policy.repository, sha: "6159c437caf6903f2d1854021eb77071ad1cee50", runId: "123" },
        base,
        diff,
        prs,
        "6159c437caf6903f2d1854021eb77071ad1cee50",
        {},
        { id: 123 },
        policy,
      ),
    /matches neither EatClean 1A FLOW-04 nor B1 Spatial 567 reconciliation/,
  );
});

test("Reconciler Router: incomplete intervals on baseline fcc78015 fail closed", () => {
  const base = { sha: r.baseline.sha };

  // Case A: Missing 567 in prs despite having candidate commit
  const diffB1 = {
    commits: r.productCommits.map((c) => c.sha),
    paths: [],
  };
  const prsIncompleteB1 = r.productPrs.filter((n) => n !== 567);
  assert.throws(
    () =>
      routeExactInterval(
        { repository: policy.repository, sha: r.candidateSha, runId: "123" },
        base,
        diffB1,
        prsIncompleteB1,
        r.candidateSha,
        {},
        { id: 123 },
        policy,
      ),
    /matches neither EatClean 1A FLOW-04 nor B1 Spatial 567 reconciliation/,
  );

  // Case B: Missing 563 in prs
  const diff563 = {
    commits: EATCLEAN_1A_563.productCommits.map((c) => c.sha),
    paths: [],
  };
  const prsIncomplete563 = EATCLEAN_1A_563.productPrs.filter((n) => n !== 563);
  assert.throws(
    () =>
      routeExactInterval(
        { repository: policy.repository, sha: r.candidateSha, runId: "123" },
        base,
        diff563,
        prsIncomplete563,
        r.candidateSha,
        {},
        { id: 123 },
        policy,
      ),
    /matches neither EatClean 1A FLOW-04 nor B1 Spatial 567 reconciliation/,
  );
});

test("Reconciler Router: cross-capture prevention ensures authorizers cannot capture each other's interval", () => {
  const b1Snap = snapshot();
  // Attempting to evaluate B1 snapshot in EatClean authorizer fails
  assert.throws(
    () => eatclean1A563Payload(b1Snap, policy),
    /EatClean 1A FLOW-04/,
  );

  // Attempting to evaluate truncated EatClean snapshot in B1 authorizer fails
  const eatcleanSnap = {
    ...b1Snap,
    commits: b1Snap.commits.slice(0, 12),
    productPrs: b1Snap.productPrs.slice(0, 10),
  };
  assert.throws(
    () => b1Spatial567Payload(eatcleanSnap, policy),
    /B1 Spatial 567/,
  );
});
