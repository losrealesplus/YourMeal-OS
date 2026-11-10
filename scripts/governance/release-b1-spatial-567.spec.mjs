import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  B1_SPATIAL_567 as r,
  b1Spatial567Payload,
  b1Spatial567ScopeId,
  verifyB1Gate6Evidence,
  authorizeB1Spatial567,
  assertB1Spatial567Manifest,
} from "./release-b1-spatial-567.mjs";
import { EATCLEAN_1A_563, eatclean1A563Payload } from "./release-eatclean-1a-flow04-563.mjs";
import { routeExactInterval } from "./release-plan.mjs";
import { rollbackBuildEnabled } from "./release-rollback-v1.mjs";
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

const final = "1".repeat(40);
const head = "2".repeat(40);
const govPr = 573;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-11-10T12:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

const productPaths = [
  ...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path))),
].sort();

const priorGovPaths = [
  ...new Set(r.priorGovernanceCommits.flatMap((c) => c.files.map((f) => f.path))),
].sort();

function gate6EvidenceSnapshot() {
  const ge = r.gate6Evidence;
  const baseRun = (runId) => ({
    id: runId,
    status: "completed",
    conclusion: "success",
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: ge.sourceSha,
    path: ge.workflow,
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  });
  const baseArtifact = (stage) => ({
    id: stage.artifactId,
    name: stage.artifactName,
    expired: false,
    digest: stage.artifactDigest,
    workflow_run: {
      id: stage.runId,
      head_sha: ge.sourceSha,
      head_branch: "main",
    },
  });
  const reviews = [
    {
      state: "approved",
      user: { id: r.reviewerId },
      environments: [{ name: ge.environment }],
    },
  ];

  return {
    preflight: {
      run: baseRun(ge.preflight.runId),
      artifact: baseArtifact(ge.preflight),
      reportSha256: ge.preflight.reportSha256,
      report: {
        state: ge.preflight.expectedState,
        sourceSha: ge.sourceSha,
        publishedBaseSha: ge.publishedBaseSha,
        project: ge.project,
        manifestSha256: ge.manifestSha256,
        observedLedgerHead: ge.preflight.expectedObservedLedgerHead,
        observedLedgerCount: ge.preflight.expectedObservedLedgerCount,
        ledgerDigest: ge.preflight.expectedLedgerDigest,
        verifiedPrerequisites: Object.fromEntries(
          Array.from({ length: 10 }, (_, i) => [`prereq_${i}`, true]),
        ),
        b1ObjectsAbsent: Object.fromEntries(
          Array.from({ length: 17 }, (_, i) => [`obj_${i}`, true]),
        ),
      },
      reviews: structuredClone(reviews),
    },
    install: {
      run: baseRun(ge.install.runId),
      artifact: baseArtifact(ge.install),
      reportSha256: ge.install.reportSha256,
      report: {
        state: ge.install.expectedState,
        sourceSha: ge.sourceSha,
        project: ge.project,
        manifestSha256: ge.manifestSha256,
        preflightRunId: ge.install.expectedPreflightRunId,
        preflightDigest: ge.install.expectedPreflightDigest,
        installedMigrationsCount: 3,
        installedVersions: [...ge.install.expectedInstalledVersions],
      },
      reviews: structuredClone(reviews),
    },
    backfill: {
      run: baseRun(ge.backfill.runId),
      artifact: baseArtifact(ge.backfill),
      reportSha256: ge.backfill.reportSha256,
      report: {
        state: ge.backfill.expectedState,
        sourceSha: ge.sourceSha,
        project: ge.project,
        manifestSha256: ge.manifestSha256,
        installRunId: ge.backfill.expectedInstallRunId,
        installReportSha256: ge.backfill.expectedInstallReportSha256,
        backfillOutput: {
          backfillResult: {
            success: true,
            total_balances_migrated: 0,
            total_tenants_processed: 1,
            discrepancies_registered: 0,
          },
          discrepanciesCount: 0,
        },
      },
      reviews: structuredClone(reviews),
    },
  };
}

function snapshot() {
  const govCommit = {
    sha: final,
    parent: r.priorGovernanceHeadSha,
    pr: govPr,
    headSha: head,
    files: r.governancePaths.map((p) => ({
      path: p,
      before: "b".repeat(64),
      after: "a".repeat(64),
    })),
  };

  const commits = [
    ...structuredClone(r.productCommits),
    ...structuredClone(r.priorGovernanceCommits),
    govCommit,
  ];
  const totalPaths = [...new Set([...productPaths, ...priorGovPaths, ...r.governancePaths])].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPrs: r.productPrs.map((n, i) =>
      humanPr(n, r.productCommits[i].sha, r.productCommits[i].headSha, "feat-branch"),
    ),
    priorGovernancePrs: r.priorGovernanceCommits.map((c) =>
      humanPr(c.pr, c.sha, c.headSha, r.priorGovernanceBranches[String(c.pr)]),
    ),
    gate6Evidence: gate6EvidenceSnapshot(),
    remediation: humanPr(govPr, final, head, r.governanceBranch),
    diff: {
      commits: commits.map((c) => c.sha),
      paths: totalPaths,
    },
  };
}

function validDispatch() {
  const s = snapshot();
  const payload = b1Spatial567Payload(s, policy);
  const scopeId = b1Spatial567ScopeId(payload);

  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...r.productPrs, ...r.priorGovernancePrs, govPr]),
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

  return { s, payload, scopeId, inputs, ctx, run };
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
  assert.equal(r.priorGovernanceHeadSha, "5b29cd1d9d6ccedb0f14e84ccd65422f1a8ee3b0");
  assert.deepEqual(r.priorGovernancePrs, [568, 569, 570, 571, 572]);
  assert.equal(r.priorGovernanceCommits.length, 5);
  assert.equal(r.gate6Evidence.sourceSha, "5bedc79d5c5009da4c26f2cbbe7c71ee9e5c4137");
  assert.equal(r.gate6Evidence.project, "nhirlpkuvonggctdzzad");
  assert.equal(
    r.gate6Evidence.manifestSha256,
    "514084c03011c436781dfbed62a1acbc1279d070f50fcf6ae9bcfac2bff9d009",
  );
  assert.equal(r.governanceBranch, "codex/gate7-ci-test-git-identity");
  assert.equal(r.governancePaths.length, 4);
  assert.deepEqual(r.governancePaths, [...r.governancePaths].sort());
  const union = [...new Set([...productPaths, ...priorGovPaths, ...r.governancePaths])].sort();
  assert.equal(union.length, 101);
  assert.equal(classifyPaths(productPaths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");
  assert.equal(r.constraints.productionSqlAuthorized, false);
  assert.equal(r.constraints.migrationExecutionAuthorized, false);
  assert.equal(r.constraints.productionWorkerApprovalGranted, false);
});

test("B1 Spatial 567: sealed hashes and first-parent sequence match real reviewed Git content", () => {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const pinnedCommits = [...r.productCommits, ...r.priorGovernanceCommits];
  assert.deepEqual(
    git(
      "rev-list",
      "--first-parent",
      "--reverse",
      `${r.baseline.sha}..${r.priorGovernanceHeadSha}`,
    ).split("\n"),
    pinnedCommits.map((c) => c.sha),
  );
  for (const c of pinnedCommits) {
    assert.equal(git("rev-parse", `${c.sha}^1`), c.parent);
    assert.deepEqual(
      git("diff", "--name-only", "--no-renames", c.parent, c.sha)
        .split("\n")
        .filter(Boolean)
        .sort(),
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
  const manifestInPr571 = r.priorGovernanceCommits[3].files.find(
    (f) => f.path === r.gate6Evidence.manifestPath,
  );
  assert.equal(manifestInPr571?.after, r.gate6Evidence.manifestSha256);
});

test("B1 Spatial 567: valid control snapshot produces canonical payload within dispatch limit", () => {
  const s = snapshot();
  assert.equal(
    verifyB1Gate6Evidence(s.gate6Evidence, policy).sourceSha,
    r.priorGovernanceCommits[3].sha,
  );

  const payload = b1Spatial567Payload(s, policy);
  assert.equal(payload.schema, 1);
  assert.equal(payload.reconciliationType, "B1_SPATIAL_567_PREPARATION");
  assert.equal(payload.candidateSha, r.candidateSha);
  assert.equal(payload.candidatePr, 567);
  assert.equal(payload.priorGovernanceHeadSha, r.priorGovernanceHeadSha);
  assert.deepEqual(payload.priorGovernancePrs, [568, 569, 570, 571, 572]);
  assert.equal(payload.governancePr, govPr);
  assert.equal(payload.finalSourceSha, final);
  assert.equal(payload.productPrs.length, 15);
  assert.equal(payload.constraints.productionSqlAuthorized, false);

  const canonicalScope = JSON.stringify(canonical(payload));
  assert.ok(
    canonicalScope.length < 60000,
    `Expected compact scope < 60000 bytes for GitHub workflow_dispatch, got ${canonicalScope.length}`,
  );

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

test("B1 Spatial 567: rejects stale targetSha and priorGovernanceHeadSha self-release", () => {
  const s = snapshot();
  s.targetSha = "3".repeat(40);
  assert.throws(() => b1Spatial567Payload(s, policy), /B1 Spatial 567 final source stale/);

  const sPriorHead = snapshot();
  sPriorHead.targetSha = r.priorGovernanceHeadSha;
  sPriorHead.currentMainSha = r.priorGovernanceHeadSha;
  assert.throws(() => b1Spatial567Payload(sPriorHead, policy), /B1 Spatial 567 final source stale/);
});

test("B1 Spatial 567: rejects commit count mismatch", () => {
  const s = snapshot();
  s.commits.pop();
  assert.throws(() => b1Spatial567Payload(s, policy), /exact 21-commit interval required/);
});

test("B1 Spatial 567: rejects tampered product or prior governance commit", () => {
  const s1 = snapshot();
  s1.commits[0].sha = "0".repeat(40);
  assert.throws(() => b1Spatial567Payload(s1, policy), /sealed commits mismatch/);

  const s2 = snapshot();
  s2.commits[18].files[0].after = "0".repeat(64);
  assert.throws(() => b1Spatial567Payload(s2, policy), /prior governance commits mismatch/);
});

test("B1 Spatial 567: rejects non-human PR merge or wrong prior governance branch", () => {
  const s1 = snapshot();
  s1.productPrs[0].merged_by.id = 999999999;
  assert.throws(() => b1Spatial567Payload(s1, policy), /canonical human PR provenance mismatch/);

  const s2 = snapshot();
  s2.priorGovernancePrs[0].merged_by.id = 999999999;
  assert.throws(() => b1Spatial567Payload(s2, policy), /canonical human PR provenance mismatch/);

  const s3 = snapshot();
  s3.priorGovernancePrs[1].head.ref = "wrong-branch";
  assert.throws(() => b1Spatial567Payload(s3, policy), /Prior Governance PR #569 branch mismatch/);
});

test("B1 Spatial 567: rejects terminal governance parent not equal to priorGovernanceHeadSha", () => {
  const s = snapshot();
  s.commits[20].parent = r.candidateSha;
  assert.throws(() => b1Spatial567Payload(s, policy), /governance lineage mismatch/);
});

test("B1 Spatial 567: rejects governance PR number <= priorGovernancePrs.at(-1)", () => {
  const s = snapshot();
  s.commits[20].pr = 572;
  assert.throws(() => b1Spatial567Payload(s, policy), /governance lineage mismatch/);
});

test("B1 Spatial 567: rejects governance branch mismatch", () => {
  const s = snapshot();
  s.remediation.head.ref = "wrong-branch";
  assert.throws(
    () => b1Spatial567Payload(s, policy),
    /Governance PR #573 canonical human PR provenance mismatch/,
  );
});

test("B1 Spatial 567: rejects extra unclassified path in diff", () => {
  const s = snapshot();
  s.diff.paths.push("extra-rogue-file.ts");
  assert.throws(
    () => b1Spatial567Payload(s, policy),
    /interval expanded or unclassified files detected/,
  );
});

test("B1 Spatial 567: rejects tampered or unapproved Gate 6 evidence", () => {
  const mutations = [
    (s) => (s.gate6Evidence.preflight.report.state = "READ_ONLY_PREFLIGHT_FAIL"),
    (s) => (s.gate6Evidence.preflight.reviews = []),
    (s) => (s.gate6Evidence.preflight.report.verifiedPrerequisites.ledger_head = false),
    (s) => (s.gate6Evidence.preflight.report.b1ObjectsAbsent.warehouses_absent = false),
    (s) => (s.gate6Evidence.install.artifact.expired = true),
    (s) => (s.gate6Evidence.install.run.run_attempt = 2),
    (s) => (s.gate6Evidence.install.report.installedVersions = ["20261107210000"]),
    (s) => (s.gate6Evidence.backfill.reportSha256 = "0".repeat(64)),
    (s) => (s.gate6Evidence.backfill.report.installReportSha256 = "0".repeat(64)),
    (s) => (s.gate6Evidence.backfill.report.backfillOutput.discrepanciesCount = 1),
    (s) => (s.gate6Evidence.backfill.reviews[0].user.id = 7),
  ];
  for (const mutate of mutations) {
    const s = snapshot();
    mutate(s);
    assert.throws(() => b1Spatial567Payload(s, policy));
  }
});

test("B1 Spatial 567: authorizeB1Spatial567 succeeds under valid dispatch and disables rollback build", () => {
  const { s, payload, scopeId, inputs, ctx, run } = validDispatch();

  const auth = authorizeB1Spatial567(s, inputs, ctx, run, policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, scopeId);
  assert.deepEqual(auth.payload, payload);

  const plan = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    repository: r.repository,
    sourceSha: final,
    runId: ctx.runId,
    attempt: ctx.attempt,
    reconciliation: auth,
  };
  assert.equal(rollbackBuildEnabled(plan, ctx), false);
});

test("B1 Spatial 567: authorizeB1Spatial567 rejects missing prior PRs, push event, or tampered scope", () => {
  for (const change of [
    (v) => (v.ctx.event = "push"),
    (v) => (v.inputs.mode = "normal"),
    (v) => (v.inputs.authorized_prs = JSON.stringify([...r.productPrs, govPr])),
    (v) => (v.inputs.authorization_id = "0".repeat(64)),
    (v) => (v.inputs.exact_interval_scope = "{}"),
    (v) => (v.run.actor.id = 7),
    (v) => (v.run.run_attempt = 2),
  ]) {
    const v = validDispatch();
    change(v);
    assert.throws(() => authorizeB1Spatial567(v.s, v.inputs, v.ctx, v.run, policy));
  }
});

test("B1 Spatial 567: assertB1Spatial567Manifest validates intact manifest and rejects tampered reconciliation", () => {
  const { payload, scopeId } = validDispatch();

  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: final,
    reconciliation: {
      reconciled: true,
      reconciliationId: scopeId,
      payload,
    },
  };

  const manifest = {
    sourceSha: final,
    reconciliation: fresh.reconciliation,
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: final,
      reconciliation: fresh.reconciliation,
    },
  };

  assert.doesNotThrow(() => assertB1Spatial567Manifest(manifest, fresh));
  assert.doesNotThrow(() => assertReconciliationManifest(manifest, fresh));

  for (const tamper of [
    (m) => (m.reconciliation.payload.candidateSha = "0".repeat(40)),
    (m) => (m.reconciliation.payload.priorGovernanceCommits[0].pr = 999),
    (m) => (m.plan.reconciliation.payload.gate6Evidence.backfill.runId = 999),
  ]) {
    const mutated = structuredClone(manifest);
    tamper(mutated);
    assert.throws(
      () => assertB1Spatial567Manifest(mutated, fresh),
      /preparation\/publication scope changed|candidateCommit does not match/,
    );
  }
});

test("Reconciler Router: hermetically selects authorizeEatClean1A563 and authorizeB1Spatial567 without GH_TOKEN", () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "gate7-b1-router-")));
  try {
    fs.mkdirSync(path.join(dir, "bin"));
    const ge = r.gate6Evidence;
    const fakeGh = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const ge = ${JSON.stringify(ge)};
if (process.argv[2] === 'run' && process.argv[3] === 'download') {
  const targetDir = process.argv[process.argv.indexOf('--dir') + 1];
  for (const k of ['preflight', 'install', 'backfill']) {
    fs.writeFileSync(path.join(targetDir, ge[k].reportFile), '{}');
  }
  process.exit(0);
}
const endpoint = (process.argv[3] || '').replace(/^repos\\/[^/]+\\/[^/]+\\//, '');
if (endpoint.includes('/artifacts')) {
  const runId = Number(endpoint.split('/')[2]);
  const stage = ['preflight', 'install', 'backfill'].map((k) => ge[k]).find((s) => s.runId === runId);
  console.log(JSON.stringify({ total_count: 1, artifacts: [{ id: stage.artifactId, name: stage.artifactName, expired: false, digest: stage.artifactDigest }] }));
} else if (endpoint.endsWith('/approvals')) {
  console.log('[]');
} else if (endpoint.startsWith('actions/runs/')) {
  console.log(JSON.stringify({ id: Number(endpoint.split('/')[2]) }));
} else {
  console.log(JSON.stringify({ number: 1, head: { sha: '${"0".repeat(40)}' } }));
}
`;
    fs.writeFileSync(path.join(dir, "bin/gh"), fakeGh, { mode: 0o755 });

    const script = `
      import assert from "node:assert/strict";
      import { routeExactInterval } from ${JSON.stringify(new URL("./release-plan.mjs", import.meta.url).href)};
      import { EATCLEAN_1A_563 } from ${JSON.stringify(new URL("./release-eatclean-1a-flow04-563.mjs", import.meta.url).href)};
      import { B1_SPATIAL_567 as r } from ${JSON.stringify(new URL("./release-b1-spatial-567.mjs", import.meta.url).href)};

      const policy = ${JSON.stringify(policy)};

      const candSha = "f50973714cffd94e225372543be66ceb6ba81d87";
      const govSha = "6159c437caf6903f2d1854021eb77071ad1cee50";
      assert.throws(
        () =>
          routeExactInterval(
            { repository: policy.repository, ref: "refs/heads/main", event: "workflow_dispatch", sha: govSha, runId: "123", attempt: "1" },
            { sha: EATCLEAN_1A_563.baseline.sha },
            { commits: [...EATCLEAN_1A_563.productCommits.map((c) => c.sha), candSha, govSha], paths: [] },
            [...EATCLEAN_1A_563.productPrs, 563, 564],
            govSha,
            {},
            { id: 123 },
            policy,
          ),
        /EatClean 1A FLOW-04/,
      );

      assert.throws(
        () =>
          routeExactInterval(
            { repository: policy.repository, ref: "refs/heads/main", event: "workflow_dispatch", sha: r.candidateSha, runId: "123", attempt: "1" },
            { sha: r.baseline.sha },
            { commits: r.productCommits.map((c) => c.sha), paths: [] },
            [...r.productPrs],
            r.candidateSha,
            {},
            { id: 123 },
            policy,
          ),
        /B1 Spatial 567/,
      );
    `;

    const cleanEnv = {
      ...process.env,
      PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
      HOME: dir,
    };
    delete cleanEnv.GH_TOKEN;
    delete cleanEnv.GITHUB_TOKEN;

    const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: cleanEnv,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("Reconciler Router: mixed or unauthorized interval on baseline fcc78015 fails closed", () => {
  const base = { sha: r.baseline.sha };
  const diff = {
    commits: [
      ...EATCLEAN_1A_563.productCommits.map((c) => c.sha),
      "f50973714cffd94e225372543be66ceb6ba81d87",
      "6159c437caf6903f2d1854021eb77071ad1cee50",
    ],
    paths: [],
  };
  const prs = [...EATCLEAN_1A_563.productPrs, 563, 565];

  assert.throws(
    () =>
      routeExactInterval(
        {
          repository: policy.repository,
          sha: "6159c437caf6903f2d1854021eb77071ad1cee50",
          runId: "123",
        },
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
  assert.throws(() => eatclean1A563Payload(b1Snap, policy), /EatClean 1A FLOW-04/);

  const eatcleanSnap = {
    ...b1Snap,
    commits: b1Snap.commits.slice(0, 12),
    productPrs: b1Snap.productPrs.slice(0, 10),
  };
  assert.throws(() => b1Spatial567Payload(eatcleanSnap, policy), /B1 Spatial 567/);
});

test("B1 Spatial 567 integrated: --b1-567-payload and prepare() reconcile post-Gate-6 commit and fail closed on push", () => {
  const repoRoot = path.resolve(".");
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "gate7-b1-integrated-")));
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, dir]);
    execFileSync("git", ["config", "user.name", "Gate 7 test"], { cwd: dir });
    execFileSync("git", ["config", "user.email", "gate7-test@example.invalid"], { cwd: dir });
    execFileSync("git", ["checkout", "--quiet", r.priorGovernanceHeadSha], { cwd: dir });

    const ge = gate6EvidenceSnapshot();
    const reportBytes = {
      preflight: Buffer.from(JSON.stringify(ge.preflight.report)),
      install: Buffer.from(JSON.stringify(ge.install.report)),
      backfill: Buffer.from(JSON.stringify(ge.backfill.report)),
    };

    const tempConfig = structuredClone(r);
    for (const k of ["preflight", "install", "backfill"]) {
      tempConfig.gate6Evidence[k].reportSha256 = hash(reportBytes[k]);
    }

    fs.writeFileSync(
      path.join(dir, "scripts/governance/release-b1-spatial-567.json"),
      `${JSON.stringify(tempConfig, null, 2)}\n`,
    );
    for (const rel of [
      "scripts/governance/release-b1-spatial-567.mjs",
      "scripts/governance/release-b1-spatial-567.spec.mjs",
      "scripts/governance/release-eatclean-1a-flow04-563.spec.mjs",
      "scripts/governance/release-plan.mjs",
    ]) {
      fs.copyFileSync(path.join(repoRoot, rel), path.join(dir, rel));
    }

    execFileSync("git", ["add", ...r.governancePaths], { cwd: dir });
    const govTree = execFileSync("git", ["write-tree"], { cwd: dir, encoding: "utf8" }).trim();
    const govCommit = execFileSync(
      "git",
      [
        "commit-tree",
        govTree,
        "-p",
        r.priorGovernanceHeadSha,
        "-m",
        "fix(governance): post-Gate-6 Gate 7 reconciliation PR 572",
      ],
      { cwd: dir, encoding: "utf8" },
    ).trim();
    execFileSync("git", ["checkout", "--quiet", govCommit], { cwd: dir });

    const baselineReport = {
      schema: 1,
      repository: policy.repository,
      sourceSha: r.baseline.sha,
      runId: "40103726985",
      attempt: "1",
      state: "DEPLOYED",
      mutationStarted: true,
      versionId: r.baseline.versionId,
      deploymentId: "53b09377-9e84-4b7f-b960-925829ef54d1",
      tarSha256: "1bd23f12ff0305af2aa27493a9cbaf8856404d302bc24f8d74bdd328c7dc041e",
      configSha256: "6b430f21921697883924ee1457dd680e8bb056ac8b970d1481230e73ccddbd5c",
      artifactId: "12564385065",
    };

    const workerEnv = {
      name: policy.environment,
      can_admins_bypass: false,
      protection_rules: [
        {
          type: "required_reviewers",
          reviewers: [{ type: "User", reviewer: { id: policy.reviewerId } }],
        },
      ],
    };

    const responses = {
      [`environments/${policy.environment}`]: workerEnv,
      "actions/runs/123": {
        id: 123,
        run_attempt: 1,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: govCommit,
        path: policy.workflow,
        actor: { id: policy.reviewerId, login: policy.reviewerLogin },
        triggering_actor: { id: policy.reviewerId, login: policy.reviewerLogin },
      },
      "git/ref/heads/main": { object: { sha: govCommit } },
      [`deployments?environment=${policy.environment}`]: [{ id: 7300101642, sha: r.baseline.sha }],
      "deployments/7300101642/statuses": [
        {
          state: "success",
          log_url: `https://github.com/${policy.repository}/actions/runs/40103726985/job/1`,
        },
      ],
      "actions/runs/40103726985": {
        id: 40103726985,
        path: policy.workflow,
        head_sha: r.baseline.sha,
        head_branch: "main",
        conclusion: "success",
      },
      "actions/runs/40103726985/artifacts": {
        total_count: 1,
        artifacts: [{ name: "gate7-release-report-40103726985-1", expired: false }],
      },
    };

    for (const c of r.productCommits) {
      const prObj = humanPr(c.pr, c.sha, c.headSha, `prod-${c.pr}`);
      responses[`commits/${c.sha}/pulls`] = [prObj];
      responses[`pulls/${c.pr}`] = prObj;
    }
    for (const c of r.priorGovernanceCommits) {
      const prObj = humanPr(c.pr, c.sha, c.headSha, r.priorGovernanceBranches[String(c.pr)]);
      responses[`commits/${c.sha}/pulls`] = [prObj];
      responses[`pulls/${c.pr}`] = prObj;
    }
    const govPrObj = humanPr(govPr, govCommit, head, r.governanceBranch);
    responses[`commits/${govCommit}/pulls`] = [govPrObj];
    responses[`pulls/${govPr}`] = govPrObj;

    for (const k of ["preflight", "install", "backfill"]) {
      const st = tempConfig.gate6Evidence[k];
      responses[`actions/runs/${st.runId}`] = ge[k].run;
      responses[`actions/runs/${st.runId}/artifacts`] = {
        total_count: 1,
        artifacts: [ge[k].artifact],
      };
      responses[`actions/runs/${st.runId}/approvals`] = ge[k].reviews;
    }

    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(path.join(dir, "baseline-report.json"), JSON.stringify(baselineReport));
    for (const k of ["preflight", "install", "backfill"]) {
      fs.writeFileSync(path.join(dir, `${k}-report.json`), reportBytes[k]);
    }

    fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
    const ghScript = `#!${process.execPath}
import fs from 'node:fs';
import path from 'node:path';
const baseDir = ${JSON.stringify(dir)};
if (process.argv[2] === 'run' && process.argv[3] === 'download') {
  const runId = process.argv[4];
  const targetDir = process.argv[process.argv.indexOf('--dir') + 1];
  const name = process.argv[process.argv.indexOf('--name') + 1];
  if (runId === '40103726985') {
    fs.copyFileSync(path.join(baseDir, 'baseline-report.json'), path.join(targetDir, 'release-report.json'));
  } else {
    const map = {
      [String(${tempConfig.gate6Evidence.preflight.runId})]: ['preflight-report.json', ${JSON.stringify(tempConfig.gate6Evidence.preflight.reportFile)}],
      [String(${tempConfig.gate6Evidence.install.runId})]: ['install-report.json', ${JSON.stringify(tempConfig.gate6Evidence.install.reportFile)}],
      [String(${tempConfig.gate6Evidence.backfill.runId})]: ['backfill-report.json', ${JSON.stringify(tempConfig.gate6Evidence.backfill.reportFile)}],
    };
    const entry = map[runId];
    if (!entry) throw new Error('Unexpected download ' + runId + ' ' + name);
    fs.copyFileSync(path.join(baseDir, entry[0]), path.join(targetDir, entry[1]));
  }
  process.exit(0);
}
const responses = JSON.parse(fs.readFileSync(path.join(baseDir, 'responses.json'), 'utf8'));
const key = process.argv[3]
  .replace(/^repos\\/[^/]+\\/[^/]+\\//, '')
  .replace(/[?&]per_page=100&page=1$/, '')
  .replace(/[?&]per_page=100$/, '');
if (!(key in responses)) throw new Error('Unexpected API: ' + key);
console.log(JSON.stringify(responses[key]));
`;
    fs.writeFileSync(path.join(dir, "bin/gh"), ghScript, { mode: 0o755 });

    const cleanEnv = {
      ...process.env,
      PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
      HOME: dir,
    };
    delete cleanEnv.GH_TOKEN;
    delete cleanEnv.GITHUB_TOKEN;

    const gen = spawnSync(
      process.execPath,
      ["scripts/governance/release-plan.mjs", "--b1-567-payload"],
      {
        cwd: dir,
        encoding: "utf8",
        env: cleanEnv,
      },
    );
    assert.equal(gen.status, 0, gen.stderr || gen.stdout);
    const generated = JSON.parse(gen.stdout);
    assert.equal(generated.payload.finalSourceSha, govCommit);
    assert.equal(generated.payload.governancePr, govPr);
    assert.equal(generated.payload.priorGovernanceHeadSha, r.priorGovernanceHeadSha);
    assert.ok(
      generated.exactIntervalScope.length < 60000,
      `Generated scope too large: ${generated.exactIntervalScope.length}`,
    );

    const inputs = {
      mode: "exact_interval",
      expected_base_sha: r.baseline.sha,
      expected_target_sha: govCommit,
      authorized_prs: JSON.stringify([...r.productPrs, ...r.priorGovernancePrs, govPr]),
      authorization_id: generated.authorizationId,
      exact_interval_scope: generated.exactIntervalScope,
      reason: "Integrated post-Gate-6 reconciliation",
    };
    fs.writeFileSync(path.join(dir, "event-dispatch.json"), JSON.stringify({ inputs }));
    fs.writeFileSync(path.join(dir, "gh-output"), "");
    fs.writeFileSync(path.join(dir, "gh-summary"), "");

    const dispatchRes = spawnSync(process.execPath, ["scripts/governance/release-plan.mjs"], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...cleanEnv,
        GITHUB_REPOSITORY: policy.repository,
        GITHUB_REF: "refs/heads/main",
        GITHUB_SHA: govCommit,
        GITHUB_RUN_ID: "123",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_EVENT_NAME: "workflow_dispatch",
        GITHUB_EVENT_PATH: path.join(dir, "event-dispatch.json"),
        GITHUB_OUTPUT: path.join(dir, "gh-output"),
        GITHUB_STEP_SUMMARY: path.join(dir, "gh-summary"),
      },
    });
    assert.equal(dispatchRes.status, 0, dispatchRes.stderr || dispatchRes.stdout);
    const plan = JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-plan.json"), "utf8"));
    assert.equal(plan.decision, "AUTHORIZED_RECONCILED_RELEASE");
    assert.equal(plan.reconciliation?.reconciled, true);
    assert.equal(plan.reconciliation?.reconciliationId, generated.authorizationId);
    const outputText = fs.readFileSync(path.join(dir, "gh-output"), "utf8");
    assert.match(outputText, /eligible=true/);
    assert.match(outputText, /rollback_enabled=false/);

    // Push event to main must still fail closed with eligible=false
    fs.writeFileSync(path.join(dir, "event-push.json"), JSON.stringify({}));
    fs.writeFileSync(path.join(dir, "gh-output"), "");
    const pushRes = spawnSync(process.execPath, ["scripts/governance/release-plan.mjs"], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...cleanEnv,
        GITHUB_REPOSITORY: policy.repository,
        GITHUB_REF: "refs/heads/main",
        GITHUB_SHA: govCommit,
        GITHUB_RUN_ID: "124",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_EVENT_NAME: "push",
        GITHUB_EVENT_PATH: path.join(dir, "event-push.json"),
        GITHUB_OUTPUT: path.join(dir, "gh-output"),
        GITHUB_STEP_SUMMARY: path.join(dir, "gh-summary"),
      },
    });
    assert.equal(pushRes.status, 1);
    assert.match(
      pushRes.stderr,
      /Privileged\/unknown delta requires a separate authorization path/,
    );
    assert.match(fs.readFileSync(path.join(dir, "gh-output"), "utf8"), /eligible=false/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
