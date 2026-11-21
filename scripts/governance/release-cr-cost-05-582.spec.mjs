import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  CR_COST_05_582 as r,
  crCost05_582Payload,
  crCost05_582ScopeId,
  authorizeCrCost05_582,
  verifyCrCost05_582Reconciliation,
  assertCrCost05_582Manifest,
} from "./release-cr-cost-05-582.mjs";
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
const govPr = 583;

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-11-21T18:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

const productPaths = [...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path)))].sort();

function snapshot(includeGov = true) {
  const commits = r.productCommits.map((c) => structuredClone(c));
  if (includeGov) {
    const govCommit = {
      sha: finalSha,
      parent: r.candidateSha,
      pr: govPr,
      headSha: govHeadSha,
      files: r.governancePaths.map((p) => ({
        path: p,
        before: p.includes("release-cr-cost-05-582") ? null : "b".repeat(64),
        after: "a".repeat(64),
      })),
    };
    commits.push(govCommit);
  }

  const targetSha = includeGov ? finalSha : r.candidateSha;
  const totalPaths = includeGov
    ? [...new Set([...productPaths, ...r.governancePaths])].sort()
    : productPaths;

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha,
    currentMainSha: targetSha,
    commits,
    productPrs: r.productCommits.map((c) =>
      humanPr(c.pr, c.sha, c.headSha, c.pr === 582 ? r.candidateBranch : `feat/pr-${c.pr}`),
    ),
    remediation: includeGov ? humanPr(govPr, finalSha, govHeadSha, r.governanceBranch) : undefined,
    diff: {
      commits: commits.map((c) => c.sha),
      paths: totalPaths,
    },
  };
}

function validDispatch(mode = "exact_interval") {
  const s = snapshot(true);
  const payload = crCost05_582Payload(s, policy);
  const scopeId = crCost05_582ScopeId(payload);

  const inputs =
    mode === "exact_interval"
      ? {
          mode: "exact_interval",
          expected_base_sha: r.baseline.sha,
          expected_target_sha: finalSha,
          authorized_prs: JSON.stringify([...r.productPrs, govPr]),
          authorization_id: scopeId,
          exact_interval_scope: JSON.stringify(canonical(payload)),
          reason: "Controlled Market Intelligence production release",
        }
      : {
          mode: "normal",
          expected_base_sha: r.baseline.sha,
          expected_target_sha: finalSha,
          reason: "Controlled Market Intelligence release with DB migrations applied",
        };

  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: finalSha,
    runId: "999002",
    attempt: "1",
    event: "workflow_dispatch",
  };

  const run = {
    id: 999002,
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

test("CR-COST-05 #582: static configuration invariants", () => {
  assert.equal(r.repository, "losrealesplus/YourMeal-OS");
  assert.equal(r.environment, "production-worker");
  assert.equal(r.reviewerId, 292604102);
  assert.equal(r.reviewerLogin, "losrealesplus");
  assert.equal(r.baseline.sha, "f3a505ba2c05cff29107b568233a077f7e4adc55");
  assert.equal(r.baseline.deploymentId, 7743677316);
  assert.equal(r.baseline.versionId, "841c4fb0-b459-40aa-9233-01cc6d3c50c7");
  assert.equal(r.candidateSha, "c60da942f6bbac9cb0378a231458caaf9b55a3ab");
  assert.equal(r.candidatePr, 582);
  assert.equal(r.candidateHeadSha, "bd1028a4e600e75e096ac6df1babb61a4a518bac");
  assert.deepEqual(r.productPrs, [576, 577, 578, 579, 580, 581, 582]);
  assert.equal(r.productCommits.length, 7);
  assert.equal(productPaths.length, 73);
  assert.equal(r.governancePaths.length, 10);
  assert.equal(r.constraints.productionSqlAuthorized, false);
  assert.equal(r.constraints.migrationExecutionAuthorized, false);
  assert.equal(r.constraints.productionWorkerApprovalGranted, false);
  assert.equal(r.constraints.dbMigrationsAppliedAcknowledged, true);
});

test("CR-COST-05 #582: sealed hashes and first-parent sequence match real reviewed Git content", () => {
  let prev = r.baseline.sha;
  for (const c of r.productCommits) {
    assert.equal(c.parent, prev);
    const revSha = execFileSync("git", ["rev-parse", `${c.sha}`], { encoding: "utf8" }).trim();
    assert.equal(revSha, c.sha);
    for (const f of c.files) {
      if (f.after !== null) {
        const entry = execFileSync("git", ["ls-tree", c.sha, "--", f.path], { encoding: "utf8" });
        const blob = /^100(?:644|755) blob ([a-f0-9]{40})\t/.exec(entry);
        assert.ok(blob, `Blob must exist for ${f.path} in commit ${c.sha}`);
        const realHash = hash(execFileSync("git", ["cat-file", "blob", blob[1]]));
        assert.equal(f.after, realHash, `Hash mismatch for ${f.path}`);
      }
    }
    prev = c.sha;
  }
});

test("CR-COST-05 #582: generates exact canonical payload and authorizes dispatch", () => {
  const { s, payload, scopeId, inputs, ctx, run } = validDispatch("exact_interval");
  assert.equal(payload.reconciliationType, "CR_COST_05_582_PREPARATION");
  assert.equal(payload.candidateSha, r.candidateSha);
  assert.equal(payload.finalSourceSha, finalSha);
  assert.equal(payload.governancePr, govPr);
  assert.equal(typeof scopeId, "string");
  assert.equal(scopeId.length, 64);

  const resExact = authorizeCrCost05_582(s, inputs, ctx, run, policy);
  assert.equal(resExact.reconciled, true);
  assert.equal(resExact.reconciliationId, scopeId);

  // Normal mode dispatch authorization
  const normalDispatch = validDispatch("normal");
  const resNormal = authorizeCrCost05_582(
    normalDispatch.s,
    normalDispatch.inputs,
    normalDispatch.ctx,
    normalDispatch.run,
    policy,
  );
  assert.equal(resNormal.reconciled, true);
  assert.equal(resNormal.reconciliationId, normalDispatch.scopeId);
});

test("CR-COST-05 #582: verifyCrCost05_582Reconciliation validates correctly", () => {
  const { s, inputs, ctx, run } = validDispatch("normal");
  const rec = verifyCrCost05_582Reconciliation(s, inputs, ctx, run, policy);
  assert.equal(rec.reconciled, true);
  assert.equal(rec.payload.candidateSha, r.candidateSha);
});

test("CR-COST-05 #582: manifest verification passes in Phase 2 and fails on mutation", () => {
  const { payload, scopeId } = validDispatch();
  const manifest = {
    sourceSha: finalSha,
    reconciliation: { reconciliationId: scopeId, payload },
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: finalSha,
      reconciliation: { reconciliationId: scopeId, payload },
    },
  };
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: finalSha,
    reconciliation: { reconciliationId: scopeId, payload },
  };

  assert.doesNotThrow(() => assertReconciliationManifest(manifest, fresh));
  assert.doesNotThrow(() => assertCrCost05_582Manifest(manifest, fresh));

  const tampered = structuredClone(manifest);
  tampered.reconciliation.payload.candidateSha = "0".repeat(40);
  assert.throws(
    () => assertCrCost05_582Manifest(tampered, fresh),
    /CR-COST-05 publication rejected: pinned baseline or candidate mismatch/,
  );
});

test("CR-COST-05 #582: fail-closed negative boundary checks", () => {
  const baseMismatch = snapshot();
  baseMismatch.baseline.sha = "0".repeat(40);
  assert.throws(() => crCost05_582Payload(baseMismatch, policy), /baseline mismatch/);

  const alteredProductHash = snapshot();
  alteredProductHash.commits[0].files[0].after = "f".repeat(64);
  assert.throws(
    () => crCost05_582Payload(alteredProductHash, policy),
    /CR-COST-05 product commit #576 lineage or content mismatch/,
  );

  const extraPath = snapshot();
  extraPath.diff.paths.push("src/routes/rogue.tsx");
  assert.throws(
    () => crCost05_582Payload(extraPath, policy),
    /CR-COST-05 interval expanded or unclassified files detected/,
  );

  const { s, inputs, ctx, run } = validDispatch("exact_interval");
  assert.throws(
    () =>
      authorizeCrCost05_582(s, { ...inputs, authorization_id: "0".repeat(64) }, ctx, run, policy),
    /human scope mismatch/,
  );

  assert.throws(
    () =>
      authorizeCrCost05_582(
        s,
        { ...inputs, authorized_prs: JSON.stringify([576, 577]) },
        ctx,
        run,
        policy,
      ),
    /dispatch anchors mismatch/,
  );

  assert.throws(
    () => authorizeCrCost05_582(s, inputs, ctx, { ...run, run_attempt: 2 }, policy),
    /dispatch authority mismatch/,
  );
});

test("CR-COST-05 #582: routeExactInterval routes baseline f3a505ba exclusively to authorizeCrCost05_582", () => {
  const { s, inputs, ctx, run } = validDispatch("exact_interval");
  assert.throws(
    () =>
      routeExactInterval(
        ctx,
        r.baseline,
        s.diff,
        s.commits.map((c) => c.pr),
        finalSha,
        inputs,
        run,
        policy,
      ),
    /Exact interval|CR-COST-05|Git|fatal/,
  );
});

test("CR-COST-05 #582: supports sequential governance PRs (PR #583 + terminal PR #584)", () => {
  const s = snapshot(true);
  const secondGovSha = "3".repeat(40);
  const secondGovCommit = {
    sha: secondGovSha,
    parent: finalSha,
    pr: 584,
    headSha: "4".repeat(40),
    files: [
      {
        path: "scripts/governance/release-cr-cost-05-582.json",
        before: "a".repeat(64),
        after: "c".repeat(64),
      },
      {
        path: "scripts/governance/release-cr-cost-05-582.mjs",
        before: "a".repeat(64),
        after: "c".repeat(64),
      },
    ],
  };
  s.commits.push(secondGovCommit);
  s.diff.commits.push(secondGovSha);
  s.targetSha = secondGovSha;
  s.currentMainSha = secondGovSha;
  s.remediation = humanPr(584, secondGovSha, "4".repeat(40), "fix/gate7-cr-cost-05-total-paths-83");

  const payload = crCost05_582Payload(s, policy);
  assert.equal(payload.governancePr, 584);
  assert.equal(payload.finalSourceSha, secondGovSha);

  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: secondGovSha,
    runId: "999003",
    attempt: "1",
    event: "workflow_dispatch",
  };
  const run = {
    id: 999003,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: secondGovSha,
    path: ".github/workflows/deploy-production.yml",
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  };

  const res = authorizeCrCost05_582(
    s,
    { mode: "normal", reason: "Multi-stage governance update" },
    ctx,
    run,
    policy,
  );
  assert.equal(res.reconciled, true);
});
