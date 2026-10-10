import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  EXACT_INTERVAL as r,
  EXACT_GOVERNANCE_FILES,
  EXACT_CONSTRAINTS,
  readExactEvidence,
  verifyExactEvidence,
  exactIntervalPayload,
  exactScopeId,
  authorizeExactInterval,
  canonical,
} from "./release-exact-interval.mjs";
import { assertReconciliationManifest } from "./release-reconciliation.mjs";
import { activationMode } from "./release-activation.mjs";
import { assertApproval, classifyPaths, preparationEligible, hash } from "./release-contract.mjs";

const policy = {
  repository: r.repository,
  reviewerId: 292604102,
  workflow: ".github/workflows/deploy-production.yml",
  environment: "production-worker",
};
const evidence = verifyExactEvidence(readExactEvidence());
const finalSha = "1111111111111111111111111111111111111111";
const headSha = "2222222222222222222222222222222222222222";
const ctx = {
  repository: r.repository,
  ref: "refs/heads/main",
  sha: finalSha,
  runId: "10001",
  attempt: "1",
  event: "workflow_dispatch",
};
const run = {
  id: 10001,
  run_attempt: 1,
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: finalSha,
  path: policy.workflow,
  actor: { id: policy.reviewerId },
  triggering_actor: { id: policy.reviewerId },
};
function snapshot() {
  return {
    ...readExactEvidence(),
    repository: r.repository,
    baseline: {
      sha: r.baselineSha,
      deploymentId: r.baselineDeploymentId,
      versionId: r.baselineVersionId,
    },
    candidateSha: r.candidateSha,
    finalSourceSha: finalSha,
    currentMainSha: finalSha,
    sealedCommits: [...evidence.commits],
    sealedPrs: [...r.prs],
    sealedPaths: [...evidence.paths],
    sealedFiles: structuredClone(evidence.manifest.paths),
    governanceParent: r.candidateSha,
    governanceHead: headSha,
    governanceCommits: [finalSha],
    governancePaths: [...EXACT_GOVERNANCE_FILES],
    governanceFiles: EXACT_GOVERNANCE_FILES.map((path) => ({
      path,
      before: null,
      after: "a".repeat(64),
    })),
    fullCommits: [...evidence.commits, finalSha],
    fullPrs: [...r.prs, 514],
    fullPaths: [...new Set([...evidence.paths, ...EXACT_GOVERNANCE_FILES])].sort(),
    remediation: {
      number: 514,
      merged: true,
      state: "closed",
      base: { ref: "main", repo: { full_name: r.repository } },
      head: { ref: r.branch, sha: headSha, repo: { full_name: r.repository } },
      merge_commit_sha: finalSha,
      merged_by: { id: policy.reviewerId },
    },
  };
}
function inputs(s = snapshot()) {
  const payload = exactIntervalPayload(s, policy);
  return {
    mode: "exact_interval",
    expected_base_sha: r.baselineSha,
    expected_target_sha: finalSha,
    authorized_prs: JSON.stringify([...r.prs, 514]),
    exact_interval_scope: JSON.stringify(canonical(payload)),
    authorization_id: exactScopeId(payload),
  };
}
function deny(name, change) {
  test(name, () => {
    const s = snapshot(),
      i = inputs(s),
      c = structuredClone(ctx),
      u = structuredClone(run);
    change(s, i, c, u);
    assert.throws(() => authorizeExactInterval(s, i, c, u, policy));
  });
}
test("sealed artifact and manifest retain their exact approved bytes", () => {
  assert.equal(evidence.paths.length, 113);
  assert.equal(classifyPaths(evidence.paths).special.length, 47);
  assert.deepEqual(evidence.plan.prs, r.prs);
});
test("actual local Git blobs match every sealed before/after hash and byte count", () => {
  for (const entry of evidence.manifest.paths)
    for (const [side, sha] of [
      ["before", r.baselineSha],
      ["after", r.candidateSha],
    ]) {
      const tree = execFileSync("git", ["ls-tree", sha, "--", entry.path], { encoding: "utf8" });
      if (!tree) {
        assert.equal(entry[side], null);
        continue;
      }
      assert.match(tree, /^100(?:644|755) blob /);
      const blob = tree.split(/\s+/)[2],
        bytes = execFileSync("git", ["cat-file", "blob", blob]);
      assert.deepEqual({ sha256: hash(bytes), bytes: bytes.length }, entry[side]);
    }
});
test("exact future human dispatch permits preparation, never supplies production approval", () => {
  const s = snapshot(),
    result = authorizeExactInterval(s, inputs(s), ctx, run, policy);
  assert.equal(result.reconciled, true);
  assert.deepEqual(result.payload.constraints, EXACT_CONSTRAINTS);
  assert.throws(() => assertApproval([], policy));
  assert.equal(preparationEligible("AUTHORIZED_RECONCILED_RELEASE"), true);
});
test("content verification alone preserves SPECIAL and does not grant eligibility", () => {
  exactIntervalPayload(snapshot(), policy);
  assert.equal(classifyPaths(evidence.paths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");
  assert.equal(preparationEligible(classifyPaths(evidence.paths).decision), false);
});
deny("no authority on push", (_s, i, c, u) => {
  c.event = u.event = "push";
  i.mode = "normal";
});
deny("no self-authorization from a normal dispatch", (_s, i) => {
  i.mode = "normal";
});
deny("missing scope cannot be authorized", (_s, i) => {
  delete i.exact_interval_scope;
});
deny("wrong dispatch actor", (_s, _i, _c, u) => {
  u.actor.id = 1;
});
deny("wrong triggering actor", (_s, _i, _c, u) => {
  u.triggering_actor.id = 1;
});
deny("rerun rejected", (_s, _i, c, u) => {
  c.attempt = "2";
  u.run_attempt = 2;
});
deny("wrong repository", (s) => {
  s.repository = "other/repo";
});
deny("wrong baseline", (s) => {
  s.baseline.sha = "b".repeat(40);
});
deny("wrong baseline deployment", (s) => {
  s.baseline.deploymentId++;
});
deny("wrong baseline version", (s) => {
  s.baseline.versionId = "different";
});
deny("wrong candidate commit", (s) => {
  s.candidateSha = "b".repeat(40);
});
deny("changed final commit without fresh scope", (s, _i, c, u) => {
  s.finalSourceSha = s.currentMainSha = c.sha = u.head_sha = "b".repeat(40);
});
deny("extra sealed route", (s) => {
  s.sealedPaths.push("src/extra.ts");
});
deny("missing sealed route", (s) => {
  s.sealedPaths.pop();
});
deny("altered sealed after hash", (s) => {
  s.sealedFiles.find((f) => f.after).after.sha256 = "b".repeat(64);
});
deny("altered sealed before hash", (s) => {
  s.sealedFiles.find((f) => f.before).before.sha256 = "b".repeat(64);
});
deny("altered manifest bytes", (s) => {
  s.manifestBytes = Buffer.concat([s.manifestBytes, Buffer.from(" ")]);
});
deny("altered release plan bytes", (s) => {
  s.planBytes = Buffer.concat([s.planBytes, Buffer.from(" ")]);
});
deny("additional PR", (s) => {
  s.sealedPrs.push(515);
});
deny("missing PR", (s) => {
  s.sealedPrs.pop();
});
deny("PR reorder", (s) => {
  s.sealedPrs.reverse();
});
deny("extra transient commit", (s) => {
  s.fullCommits.splice(2, 0, "b".repeat(40));
});
deny("different interval parent", (s) => {
  s.governanceParent = "b".repeat(40);
});
deny("additional governance path", (s) => {
  s.governancePaths.push("src/permissions/index.ts");
});
deny("removed governance path", (s) => {
  s.governancePaths.pop();
});
deny("additional full path", (s) => {
  s.fullPaths.push("src/extra.ts");
});
deny("altered governance hash requires new explicit human scope", (s) => {
  s.governanceFiles[0].after = "b".repeat(64);
});
deny("different governance branch", (s) => {
  s.remediation.head.ref = "other";
});
deny("forked governance PR", (s) => {
  s.remediation.head.repo.full_name = "other/repo";
});
deny("not human merged", (s) => {
  s.remediation.merged_by.id = 1;
});
deny("unmerged governance PR", (s) => {
  s.remediation.merged = false;
});
deny("governance merge head changed", (s) => {
  s.governanceHead = "b".repeat(40);
});
deny("A5 activation not authorized", (_s, i) => {
  const v = JSON.parse(i.exact_interval_scope);
  v.constraints.a5 = "ENABLED";
  i.exact_interval_scope = JSON.stringify(v);
  i.authorization_id = exactScopeId(v);
});
deny("A4b activation not authorized", (_s, i) => {
  const v = JSON.parse(i.exact_interval_scope);
  v.constraints.a4b = "ENABLED";
  i.exact_interval_scope = JSON.stringify(v);
  i.authorization_id = exactScopeId(v);
});
deny("SQL authority cannot be added", (_s, i) => {
  const v = JSON.parse(i.exact_interval_scope);
  v.constraints.productionSqlAuthorized = true;
  i.exact_interval_scope = JSON.stringify(v);
  i.authorization_id = exactScopeId(v);
});
deny("duplicate scope keys rejected", (_s, i) => {
  i.exact_interval_scope = i.exact_interval_scope.replace('"schema":1', '"schema":0,"schema":1');
});
deny("wrong scope digest", (_s, i) => {
  i.authorization_id = "0".repeat(64);
});
test("normal and historical modes cannot consume exact-interval inputs", () => {
  assert.equal(activationMode({}), false);
  assert.equal(activationMode({ mode: "initial_activation" }), true);
  assert.equal(activationMode(inputs()), false);
  assert.throws(() => activationMode({ ...inputs(), mode: "normal" }));
  assert.throws(() => activationMode({ ...inputs(), mode: "initial_activation" }));
});
test("Phase 1/2 bind all payload bytes and source, not only copied IDs", () => {
  const s = snapshot(),
    reconciliation = authorizeExactInterval(s, inputs(s), ctx, run, policy);
  const fresh = { decision: "AUTHORIZED_RECONCILED_RELEASE", sourceSha: finalSha, reconciliation };
  const manifest = {
    sourceSha: finalSha,
    reconciliation: structuredClone(reconciliation),
    plan: structuredClone(fresh),
  };
  assertReconciliationManifest(manifest, fresh);
  manifest.reconciliation.payload.constraints.a5 = "ENABLED";
  assert.throws(() => assertReconciliationManifest(manifest, fresh));
});
test("source drift after preparation is rejected", () => {
  const s = snapshot(),
    reconciliation = authorizeExactInterval(s, inputs(s), ctx, run, policy);
  const fresh = { decision: "AUTHORIZED_RECONCILED_RELEASE", sourceSha: finalSha, reconciliation };
  const manifest = { sourceSha: "b".repeat(40), reconciliation, plan: fresh };
  assert.throws(() => assertReconciliationManifest(manifest, fresh));
});
test("workflow defaults remain normal and production approval remains protected", () => {
  const yaml = fs.readFileSync(".github/workflows/deploy-production.yml", "utf8");
  assert.match(yaml, /options: \[normal, initial_activation, exact_interval\]/);
  assert.match(yaml, /default: normal/);
  assert.match(yaml, /name: production-worker/);
  assert.match(yaml, /release-exact-interval\.spec\.mjs/);
});
