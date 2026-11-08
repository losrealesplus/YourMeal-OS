import fs from "node:fs";
import { demand, hash, SHA, DIGEST, assertContext, classifyPaths } from "./release-contract.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { parseReleaseJson, jsonObject } from "./release-json.mjs";

const freeze = (v) => {
  if (v && typeof v === "object") {
    Object.values(v).forEach(freeze);
    Object.freeze(v);
  }
  return v;
};

export const B1_SPATIAL_567 = freeze(
  JSON.parse(
    fs.readFileSync(new URL("./release-b1-spatial-567.json", import.meta.url), "utf8"),
  ),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const b1Spatial567ScopeId = (p) => hash(JSON.stringify(canonical(p)));

function humanPr(pr, c, policy) {
  demand(
    pr?.number === c.pr &&
      pr.merged_at &&
      pr.merge_commit_sha === c.sha &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === policy.repository &&
      pr.head?.repo?.full_name === policy.repository &&
      pr.head?.sha === c.headSha &&
      pr.merged_by?.id === policy.reviewerId &&
      pr.merged_by?.login === policy.reviewerLogin,
    `B1 Spatial 567 PR #${c.pr} canonical human PR provenance mismatch`,
  );
}

function humanGovPr(pr, gov, policy, releaseConfig) {
  demand(
    Number.isSafeInteger(pr?.number) &&
      pr.number > releaseConfig.candidatePr &&
      pr.number === gov.pr &&
      pr.merged_at &&
      pr.merge_commit_sha === gov.sha &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === policy.repository &&
      pr.head?.repo?.full_name === policy.repository &&
      pr.head?.ref === releaseConfig.governanceBranch &&
      pr.head?.sha === gov.headSha &&
      pr.merged_by?.id === policy.reviewerId &&
      pr.merged_by?.login === policy.reviewerLogin,
    `B1 Spatial 567 Governance PR #${gov.pr} canonical human PR provenance mismatch`,
  );
}

export function b1Spatial567Payload(s, policy, releaseConfig = B1_SPATIAL_567) {
  const r = releaseConfig;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "B1 Spatial 567 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "B1 Spatial 567 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") && s.targetSha === s.currentMainSha,
    "B1 Spatial 567 final source stale",
  );
  demand(
    s.commits?.length === 16,
    "B1 Spatial 567 exact 16-commit interval required (15 product commits + 1 governance PR)",
  );

  // Commits 0..14 are the 15 pinned product commits on main (PR #553 - #567)
  demand(
    same(s.commits.slice(0, 15), r.productCommits),
    "B1 Spatial 567 sealed commits mismatch",
  );
  demand(s.productPrs?.length === 15, "B1 Spatial 567 product PRs missing or truncated");
  r.productCommits.forEach((c, n) => humanPr(s.productPrs[n], c, policy));

  // Candidate commit is index 14 (PR #567)
  const candidateCommit = s.commits[14];
  demand(
    candidateCommit.sha === r.candidateSha &&
      candidateCommit.pr === r.candidatePr,
    "B1 Spatial 567 candidate commit mismatch",
  );

  // Commit 15 is the governance PR
  const gov = s.commits[15];
  demand(
    gov.sha === s.targetSha &&
      gov.parent === candidateCommit.sha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.candidatePr &&
      SHA.test(gov.headSha ?? ""),
    "B1 Spatial 567 governance lineage mismatch",
  );
  humanGovPr(s.remediation, gov, policy, r);
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "B1 Spatial 567 governance files mismatch",
  );

  const productPaths = [
    ...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path))),
  ].sort();
  demand(
    productPaths.length === 93,
    "B1 Spatial 567 must cover exactly 93 reviewed product files",
  );

  const totalPaths = [...new Set([...productPaths, ...r.governancePaths])].sort();
  demand(
    same(
      s.diff?.commits,
      s.commits.map((c) => c.sha),
    ) && same(s.diff?.paths, totalPaths),
    "B1 Spatial 567 interval expanded or unclassified files detected",
  );
  demand(
    classifyPaths(productPaths).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
    "B1 Spatial 567 SPECIAL classification must remain",
  );

  return canonical({
    schema: 1,
    reconciliationType: "B1_SPATIAL_567_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: candidateCommit.sha,
    candidatePr: r.candidatePr,
    auditEvidence: r.auditEvidence,
    productPrs: r.productPrs,
    productCommits: r.productCommits,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeB1Spatial567(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = B1_SPATIAL_567,
) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "B1 Spatial 567 explicit dispatch required",
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
    "B1 Spatial 567 dispatch authority mismatch",
  );
  const payload = b1Spatial567Payload(s, policy, releaseConfig);
  demand(
    payload.candidateSha === releaseConfig.candidateSha,
    "B1 Spatial 567 candidate commit SHA mismatch with pinned release",
  );
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "B1_SPATIAL_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "B1_SPATIAL_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === releaseConfig.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [...releaseConfig.productPrs, payload.governancePr]),
    "B1 Spatial 567 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === b1Spatial567ScopeId(payload),
    "B1 Spatial 567 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertB1Spatial567Manifest(manifest, fresh, releaseConfig = B1_SPATIAL_567) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "B1_SPATIAL_567_PREPARATION")
    return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    payload.candidateSha === releaseConfig.candidateSha,
    "B1 Spatial 567 publication rejected: candidateCommit does not match sealed candidateSha",
  );
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, releaseConfig.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "B1 Spatial 567 preparation/publication scope changed",
  );
}
