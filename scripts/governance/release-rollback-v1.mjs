import fs from "node:fs";
import {
  demand,
  hash,
  SHA,
  DIGEST,
  assertContext,
  assertApproval,
  classifyPaths,
} from "./release-contract.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { parseReleaseJson, jsonObject } from "./release-json.mjs";
const freeze = (v) => {
  if (v && typeof v === "object") {
    Object.values(v).forEach(freeze);
    Object.freeze(v);
  }
  return v;
};
export const ROLLBACK_V1 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-rollback-v1.json", import.meta.url))),
);
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const rollbackV1ScopeId = (p) => hash(JSON.stringify(canonical(p)));
function humanPr(pr, c, policy) {
  demand(
    pr?.number === c.pr &&
      pr.merged_at &&
      pr.merge_commit_sha === c.sha &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === policy.repository &&
      pr.head?.repo?.full_name === policy.repository &&
      pr.head.sha === c.headSha &&
      pr.merged_by?.id === policy.reviewerId &&
      pr.merged_by?.login === policy.reviewerLogin,
    "Rollback v1 canonical human PR provenance mismatch",
  );
}
export function verifyRollbackInstallation(e) {
  const r = ROLLBACK_V1,
    i = r.installation,
    run = e?.run;
  demand(
    run?.id === i.runId &&
      run.run_attempt === 1 &&
      run.event === "workflow_dispatch" &&
      run.head_sha === i.sourceSha &&
      run.head_branch === "main" &&
      run.path === ".github/workflows/migrate-production.yml" &&
      run.conclusion === "success" &&
      run.actor?.id === r.reviewerId &&
      run.triggering_actor?.id === r.reviewerId,
    "Rollback v1 installation run mismatch",
  );
  demand(
    e.artifact?.id === i.artifactId &&
      e.artifact.name === i.artifactName &&
      !e.artifact.expired &&
      e.artifact.digest === i.artifactDigest &&
      e.reportSha256 === i.reportSha256 &&
      same(e.report, i.report) &&
      e.report.state === "INSTALLED_AND_VERIFIED" &&
      e.report.operation === "install",
    "Rollback v1 installation receipt mismatch",
  );
  assertApproval(e.reviews, { environment: "production-db", reviewerId: r.reviewerId });
  return i;
}
export function rollbackV1Payload(s, policy) {
  const r = ROLLBACK_V1;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "Rollback v1 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "Rollback v1 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "Rollback v1 final source stale",
  );
  demand(
    s.commits?.length === 5 && same(s.commits.slice(0, 4), r.productCommits),
    "Rollback v1 sealed interval changed",
  );
  demand(s.productPrs?.length === 4, "Rollback v1 product PRs missing");
  r.productCommits.forEach((c, n) => humanPr(s.productPrs[n], c, policy));
  const gov = s.commits[4];
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > 551 &&
      SHA.test(gov.headSha ?? ""),
    "Rollback v1 governance lineage mismatch",
  );
  humanPr(s.remediation, gov, policy);
  demand(s.remediation.head.ref === r.governanceBranch, "Rollback v1 governance branch mismatch");
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "Rollback v1 governance files mismatch",
  );
  const paths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.governancePaths,
    ]),
  ].sort();
  demand(
    same(
      s.diff?.commits,
      s.commits.map((c) => c.sha),
    ) && same(s.diff?.paths, paths),
    "Rollback v1 interval expanded",
  );
  demand(
    classifyPaths(r.productCommits.flatMap((c) => c.files.map((f) => f.path))).decision ===
      "REQUIRES_SEPARATE_AUTHORIZATION",
    "Rollback v1 SPECIAL classification must remain",
  );
  const installation = verifyRollbackInstallation(s.installation);
  return canonical({
    schema: 1,
    reconciliationType: "ROLLBACK_V1_ACTIVATION_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    productCommits: r.productCommits,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    installation,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}
export function authorizeRollbackV1(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "Rollback v1 explicit dispatch required",
  );
  demand(
    run.id === Number(ctx.runId) &&
      run.run_attempt === 1 &&
      run.event === "workflow_dispatch" &&
      run.head_branch === "main" &&
      run.head_sha === ctx.sha &&
      run.path?.split("@")[0] === policy.workflow &&
      run.actor?.id === policy.reviewerId &&
      run.triggering_actor?.id === policy.reviewerId,
    "Rollback v1 dispatch authority mismatch",
  );
  const payload = rollbackV1Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "ROLLBACK_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "ROLLBACK_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === ROLLBACK_V1.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [548, 550, 549, 551, payload.governancePr]),
    "Rollback v1 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === rollbackV1ScopeId(payload),
    "Rollback v1 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}
export function assertRollbackV1Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "ROLLBACK_V1_ACTIVATION_PREPARATION")
    return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, ROLLBACK_V1.constraints) &&
      same(payload.installation, ROLLBACK_V1.installation) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "Rollback v1 preparation/publication scope changed",
  );
}

/** Only a freshly authorized exact rollback plan may enable the Vite build. */
export function rollbackBuildEnabled(plan, ctx) {
  const p = plan.reconciliation?.payload;
  if (p?.reconciliationType !== "ROLLBACK_V1_ACTIVATION_PREPARATION") return false;
  assertContext(ctx, ROLLBACK_V1);
  demand(
    ctx.event === "workflow_dispatch" &&
      plan.decision === "AUTHORIZED_RECONCILED_RELEASE" &&
      plan.repository === ctx.repository &&
      plan.reconciliation.reconciled === true &&
      same(p.baseline, ROLLBACK_V1.baseline) &&
      plan.sourceSha === ctx.sha &&
      plan.runId === ctx.runId &&
      plan.attempt === ctx.attempt &&
      p.finalSourceSha === ctx.sha &&
      p.candidateSha === ROLLBACK_V1.candidateSha &&
      same(p.productCommits, ROLLBACK_V1.productCommits) &&
      same(p.installation, ROLLBACK_V1.installation) &&
      same(p.constraints, ROLLBACK_V1.constraints) &&
      p.constraints.rollbackFlagActivationAuthorized === true &&
      plan.reconciliation.reconciliationId === hash(JSON.stringify(p)),
    "Rollback Vite build lacks exact activation authority",
  );
  return true;
}
