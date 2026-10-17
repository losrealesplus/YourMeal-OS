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

export const P1_532 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-p1-orders-532.json", import.meta.url))),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const p1Orders532ScopeId = (p) => hash(JSON.stringify(canonical(p)));

function humanPr(pr, number, sha, policy) {
  demand(
    pr?.number === number &&
      pr.merged_at &&
      pr.merge_commit_sha === sha &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === policy.repository &&
      pr.head?.repo?.full_name === policy.repository &&
      pr.merged_by?.id === policy.reviewerId &&
      pr.merged_by?.login === policy.reviewerLogin,
    `P1 Universal Intake PR #${number} canonical human merge missing`,
  );
}

export function p1Orders532Payload(s, policy) {
  const r = P1_532;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "P1 #532 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "P1 #532 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "P1 #532 final source stale",
  );
  demand(s.commits?.length === 9, "P1 #532 exact 8-product plus governance merge interval required");

  const productCommits = s.commits.slice(0, 8);
  const gov = s.commits[8];

  // Validate the 8 product commits
  demand(
    productCommits[0].parent === r.baseline.sha &&
      productCommits[7].sha === r.candidateSha &&
      productCommits[7].pr === r.productPr &&
      same(
        productCommits.map((c) => c.pr),
        r.productPrs,
      ),
    "P1 #532 product lineage mismatch",
  );

  humanPr(s.productPr, r.productPr, r.candidateSha, policy);
  demand(s.productPr.head.sha === r.productHeadSha, "P1 #532 product head mismatch");

  // Verify all product files across the 8 product commits match sealed productFiles
  demand(
    same(s.productFiles, r.productFiles),
    "P1 #532 sealed product files mismatch",
  );

  // Validate governance commit
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.productPr,
    "P1 #532 governance lineage mismatch",
  );
  humanPr(s.remediation, gov.pr, s.targetSha, policy);
  demand(
    s.remediation.head.ref === r.governanceBranch &&
      SHA.test(gov.headSha ?? "") &&
      gov.headSha === s.remediation.head.sha,
    "P1 #532 governance head mismatch",
  );
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "P1 #532 governance paths/hashes invalid",
  );

  const paths = [...new Set([...r.productFiles.map((f) => f.path), ...r.governancePaths])].sort();
  demand(
    same(s.diff?.commits, [...productCommits.map((c) => c.sha), gov.sha]) &&
      same(s.diff?.paths, paths),
    "P1 #532 interval expanded",
  );
  demand(
    classifyPaths(r.productFiles.map((f) => f.path)).special.length === 56,
    "P1 #532 SPECIAL classification changed",
  );

  return canonical({
    schema: 1,
    reconciliationType: "P1_532_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    productPr: r.productPr,
    productHeadSha: r.productHeadSha,
    productPrs: r.productPrs,
    productFiles: r.productFiles,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeP1Orders532(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "P1 #532 explicit dispatch required",
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
    "P1 #532 dispatch authority mismatch",
  );
  const payload = p1Orders532Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "P1_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "P1_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === P1_532.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [...P1_532.productPrs, payload.governancePr]),
    "P1 #532 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === p1Orders532ScopeId(payload),
    "P1 #532 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertP1Orders532Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "P1_532_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, P1_532.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "P1 #532 preparation/publication scope changed",
  );
}
