import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  SMOKE_RETRY_574 as r,
  smokeRetry574Payload,
  smokeRetry574ScopeId,
  authorizeSmokeRetry574,
  assertSmokeRetry574Manifest,
} from "./release-smoke-retry-574.mjs";
import { routeExactInterval } from "./release-plan.mjs";
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
const govPr = 575;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-11-12T15:00:00Z",
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
  const govCommit = {
    sha: finalSha,
    parent: r.candidateSha,
    pr: govPr,
    headSha: govHeadSha,
    files: r.governancePaths.map((p) => ({
      path: p,
      before: p.includes("release-smoke-retry-574") ? null : "b".repeat(64),
      after: "a".repeat(64),
    })),
  };
  const totalPaths = [...new Set([...candidatePaths, ...r.governancePaths])].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: finalSha,
    currentMainSha: finalSha,
    commits: [candidateCommit, govCommit],
    candidatePr: humanPr(r.candidatePr, r.candidateSha, r.candidateHeadSha, r.candidateBranch),
    remediation: humanPr(govPr, finalSha, govHeadSha, r.governanceBranch),
    diff: {
      commits: [r.candidateSha, finalSha],
      paths: totalPaths,
    },
  };
}

function validDispatch() {
  const s = snapshot();
  const payload = smokeRetry574Payload(s, policy);
  const scopeId = smokeRetry574ScopeId(payload);

  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: finalSha,
    authorized_prs: JSON.stringify([r.candidatePr, govPr]),
    authorization_id: scopeId,
    exact_interval_scope: JSON.stringify(canonical(payload)),
  };

  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: finalSha,
    runId: "999001",
    attempt: "1",
    event: "workflow_dispatch",
  };

  const run = {
    id: 999001,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: finalSha,
    path: ".github/workflows/deploy-production.yml",
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  };

  return { s, payload, scopeId, inputs, ctx, run };
}

test("Smoke Retry 574: static configuration invariants", () => {
  assert.equal(r.repository, "losrealesplus/YourMeal-OS");
  assert.equal(r.environment, "production-worker");
  assert.equal(r.reviewerId, 292604102);
  assert.equal(r.reviewerLogin, "losrealesplus");
  assert.equal(r.baseline.sha, "f585c653795967d6d2161d6be04e361b9566ef39");
  assert.equal(r.baseline.deploymentId, 7692130125);
  assert.equal(r.baseline.versionId, "f467a3b2-b5bc-4672-ac9b-379e4da936d0");
  assert.equal(r.candidateSha, "70ab2a73608dcdb4070d6772a6bfb9a7cfcf06de");
  assert.equal(r.candidatePr, 574);
  assert.equal(r.candidateHeadSha, "3b8ca9f752303098cc7515dcc7be021576438de0");
  assert.equal(r.candidateFiles.length, 3);
  assert.equal(r.governanceBranch, "codex/gate7-smoke-retry-574-reconciliation");
  assert.equal(r.governancePaths.length, 9);
  assert.deepEqual(r.constraints, {
    productionSqlAuthorized: false,
    migrationExecutionAuthorized: false,
    productionWorkerApprovalGranted: false,
  });
  assert.equal(classifyPaths(candidatePaths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");
  assert.deepEqual(classifyPaths(candidatePaths).special, [
    "scripts/governance/release-publication.spec.mjs",
    "scripts/governance/release-publish.mjs",
  ]);
});

test("Smoke Retry 574: generates exact canonical payload and authorizes dispatch", () => {
  const { s, payload, scopeId, inputs, ctx, run } = validDispatch();
  assert.equal(payload.reconciliationType, "SMOKE_RETRY_574_PREPARATION");
  assert.equal(payload.candidatePr, 574);
  assert.equal(payload.governancePr, govPr);
  assert.equal(payload.finalSourceSha, finalSha);
  assert.equal(scopeId, hash(JSON.stringify(payload)));

  const auth = authorizeSmokeRetry574(s, inputs, ctx, run, policy);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, scopeId);
  assert.deepEqual(auth.payload, payload);
});

test("Smoke Retry 574: manifest verification passes in Phase 2 and fails on mutation", () => {
  const { s, inputs, ctx, run } = validDispatch();
  const reconciliation = authorizeSmokeRetry574(s, inputs, ctx, run, policy);
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: finalSha,
    reconciliation,
  };
  const manifest = {
    sourceSha: finalSha,
    reconciliation,
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: finalSha,
      reconciliation,
    },
  };

  assertSmokeRetry574Manifest(manifest, fresh);
  assertReconciliationManifest(manifest, fresh);

  const mutated = structuredClone(manifest);
  mutated.plan.reconciliation.payload.governancePr = 999;
  assert.throws(
    () => assertSmokeRetry574Manifest(mutated, fresh),
    /Smoke Retry 574 preparation\/publication scope changed/,
  );
});

test("Smoke Retry 574: fail-closed negative boundary checks", () => {
  const baseMismatch = snapshot();
  baseMismatch.baseline.sha = "0".repeat(40);
  assert.throws(() => smokeRetry574Payload(baseMismatch, policy), /baseline mismatch/);

  const alteredCandidateHash = snapshot();
  alteredCandidateHash.commits[0].files[1].after = "f".repeat(64);
  assert.throws(
    () => smokeRetry574Payload(alteredCandidateHash, policy),
    /candidate PR #574 lineage or content mismatch/,
  );

  const extraPath = snapshot();
  extraPath.diff.paths.push("src/routes/index.tsx");
  assert.throws(
    () => smokeRetry574Payload(extraPath, policy),
    /interval expanded or unclassified files detected/,
  );

  const alteredConfigWithSql = structuredClone(r);
  alteredConfigWithSql.governancePaths = [
    ...r.governancePaths,
    "supabase/migrations/20261112000000_forbidden.sql",
  ].sort();
  const sqlSnap = snapshot();
  sqlSnap.commits[1].files.push({
    path: "supabase/migrations/20261112000000_forbidden.sql",
    before: null,
    after: "c".repeat(64),
  });
  sqlSnap.commits[1].files.sort((a, b) => a.path.localeCompare(b.path));
  sqlSnap.diff.paths = [
    ...new Set([...candidatePaths, ...alteredConfigWithSql.governancePaths]),
  ].sort();
  assert.throws(
    () => smokeRetry574Payload(sqlSnap, policy, alteredConfigWithSql),
    /forbids migrations or product\/runtime changes/,
  );

  const { s, inputs, ctx, run } = validDispatch();
  assert.throws(
    () =>
      authorizeSmokeRetry574(s, { ...inputs, authorization_id: "0".repeat(64) }, ctx, run, policy),
    /human scope mismatch/,
  );
  assert.throws(
    () =>
      authorizeSmokeRetry574(
        s,
        { ...inputs, authorized_prs: JSON.stringify([574]) },
        ctx,
        run,
        policy,
      ),
    /dispatch anchors mismatch/,
  );
  assert.throws(
    () => authorizeSmokeRetry574(s, inputs, ctx, { ...run, run_attempt: 2 }, policy),
    /dispatch authority mismatch/,
  );
  assert.throws(
    () =>
      authorizeSmokeRetry574(
        s,
        {
          ...inputs,
          exact_interval_scope: JSON.stringify(JSON.parse(inputs.exact_interval_scope), null, 2),
        },
        ctx,
        run,
        policy,
      ),
    /human scope mismatch/,
  );
});

test("Smoke Retry 574: routeExactInterval routes baseline f585c653 exclusively to authorizeSmokeRetry574", () => {
  const { s, inputs, ctx, run } = validDispatch();
  assert.throws(
    () =>
      routeExactInterval(
        ctx,
        s.baseline,
        s.diff,
        [574, govPr],
        finalSha,
        {
          ...inputs,
          authorization_id: "051234c16e205b1dec9554685df9bf21799c6d2c64cc8653d3a006290486dd1f",
        },
        run,
        policy,
      ),
    /Exact interval|Smoke Retry 574|Git|fatal/,
  );
});

test("Smoke Retry 574: end-to-end CLI proposal and exact_interval dispatch in isolated git repo", () => {
  const repoRoot = path.resolve(".");
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "gate7-smoke-574-")));
  try {
    const git = (...args) =>
      execFileSync("git", args, {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "Gate7 Test",
          GIT_AUTHOR_EMAIL: "gate7-test@example.invalid",
          GIT_COMMITTER_NAME: "Gate7 Test",
          GIT_COMMITTER_EMAIL: "gate7-test@example.invalid",
        },
      }).trim();

    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, dir]);
    git("config", "user.name", "Gate7 Test");
    git("config", "user.email", "gate7-test@example.invalid");
    git("checkout", "--quiet", r.candidateSha);

    for (const rel of r.governancePaths) {
      const target = path.join(dir, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, rel), target);
    }

    git("add", ...r.governancePaths);
    const govTree = git("write-tree");
    const govSha = git(
      "commit-tree",
      govTree,
      "-p",
      r.candidateSha,
      "-m",
      "fix(governance): reconcile Gate 7 Smoke Retry #574",
    );
    git("checkout", "--quiet", govSha);

    const baseSha = r.baseline.sha;
    const candSha = r.candidateSha;

    const baselineReport = {
      schema: 1,
      repository: policy.repository,
      sourceSha: baseSha,
      runId: "42885576096",
      attempt: "1",
      state: "DEPLOYED",
      mutationStarted: true,
      versionId: r.baseline.versionId,
      deploymentId: "7dd0fb4f-a849-4aae-a3a9-b04500c8214c",
      tarSha256: "d".repeat(64),
      configSha256: "e".repeat(64),
      artifactId: "13795707925",
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

    const candPrObj = humanPr(r.candidatePr, candSha, r.candidateHeadSha, r.candidateBranch);
    const govPrObj = humanPr(govPr, govSha, govHeadSha, r.governanceBranch);

    const responses = {
      [`environments/${policy.environment}`]: workerEnv,
      "actions/runs/999": {
        id: 999,
        run_attempt: 1,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: govSha,
        path: policy.workflow,
        actor: { id: policy.reviewerId, login: policy.reviewerLogin },
        triggering_actor: { id: policy.reviewerId, login: policy.reviewerLogin },
      },
      "git/ref/heads/main": { object: { sha: govSha } },
      [`deployments?environment=${policy.environment}`]: [
        { id: r.baseline.deploymentId, sha: baseSha },
      ],
      [`deployments/${r.baseline.deploymentId}/statuses`]: [
        {
          state: "failure",
          log_url: `https://github.com/${policy.repository}/actions/runs/42885576096/job/130074380386`,
        },
      ],
      "actions/runs/42885576096": {
        id: 42885576096,
        path: policy.workflow,
        head_sha: baseSha,
        head_branch: "main",
        conclusion: "failure",
      },
      "actions/runs/42885576096/artifacts": {
        total_count: 1,
        artifacts: [{ name: "gate7-release-report-42885576096-1", expired: false }],
      },
      [`commits/${candSha}/pulls`]: [candPrObj],
      [`pulls/${r.candidatePr}`]: candPrObj,
      [`commits/${govSha}/pulls`]: [govPrObj],
      [`pulls/${govPr}`]: govPrObj,
    };

    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(path.join(dir, "baseline-report.json"), JSON.stringify(baselineReport));
    fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
    const ghScript = `#!${process.execPath}
import fs from "node:fs";
import path from "node:path";
const baseDir = ${JSON.stringify(dir)};
if (process.argv[2] === "run" && process.argv[3] === "download") {
  const targetDir = process.argv[process.argv.indexOf("--dir") + 1];
  fs.copyFileSync(path.join(baseDir, "baseline-report.json"), path.join(targetDir, "release-report.json"));
  process.exit(0);
}
const responses = JSON.parse(fs.readFileSync(path.join(baseDir, "responses.json"), "utf8"));
const key = process.argv[3]
  .replace(/^repos\\/[^/]+\\/[^/]+\\//, "")
  .replace(/[?&]per_page=100&page=1$/, "")
  .replace(/[?&]per_page=100$/, "");
if (!(key in responses)) throw new Error("Unexpected API: " + key);
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
      ["scripts/governance/release-plan.mjs", "--smoke-retry-574-payload"],
      { cwd: dir, encoding: "utf8", env: cleanEnv },
    );
    assert.equal(gen.status, 0, gen.stderr || gen.stdout);
    const generated = JSON.parse(gen.stdout);
    assert.equal(generated.payload.finalSourceSha, govSha);
    assert.equal(generated.payload.governancePr, govPr);
    assert.equal(generated.payload.candidatePr, 574);
    assert.ok(generated.exactIntervalScope.length < 16000);

    const inputs = {
      mode: "exact_interval",
      expected_base_sha: baseSha,
      expected_target_sha: govSha,
      authorized_prs: JSON.stringify([574, govPr]),
      authorization_id: generated.authorizationId,
      exact_interval_scope: generated.exactIntervalScope,
      reason: "Reconcile Gate 7 Smoke Retry #574",
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
        GITHUB_SHA: govSha,
        GITHUB_RUN_ID: "999",
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
    assert.equal(plan.reconciliation?.reconciliationId, generated.authorizationId);
    assert.match(fs.readFileSync(path.join(dir, "gh-output"), "utf8"), /eligible=true/);

    // Push event must still fail closed
    fs.writeFileSync(path.join(dir, "event-push.json"), JSON.stringify({}));
    fs.writeFileSync(path.join(dir, "gh-output"), "");
    const pushRes = spawnSync(process.execPath, ["scripts/governance/release-plan.mjs"], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...cleanEnv,
        GITHUB_REPOSITORY: policy.repository,
        GITHUB_REF: "refs/heads/main",
        GITHUB_SHA: govSha,
        GITHUB_RUN_ID: "1000",
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
