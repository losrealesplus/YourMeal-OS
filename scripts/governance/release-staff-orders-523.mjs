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
export const STAFF_523 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-staff-orders-523.json", import.meta.url))),
);
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const staff523ScopeId = (p) => hash(JSON.stringify(canonical(p)));
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
    "Staff #523 canonical human merge missing",
  );
}
export function staff523Payload(s, policy) {
  const r = STAFF_523;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "Staff #523 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "Staff #523 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "Staff #523 final source stale",
  );
  demand(s.commits?.length === 2, "Staff #523 exact two-merge interval required");
  const [product, gov] = s.commits;
  demand(
    product.sha === r.candidateSha &&
      product.parent === r.baseline.sha &&
      product.pr === r.productPr &&
      same(product.files, r.productFiles),
    "Staff #523 product lineage/content mismatch",
  );
  humanPr(s.productPr, r.productPr, r.candidateSha, policy);
  demand(s.productPr.head.sha === r.productHeadSha, "Staff #523 product head mismatch");
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.productPr,
    "Staff #523 governance lineage mismatch",
  );
  humanPr(s.remediation, gov.pr, s.targetSha, policy);
  demand(
    s.remediation.head.ref === r.governanceBranch &&
      SHA.test(gov.headSha ?? "") &&
      gov.headSha === s.remediation.head.sha,
    "Staff #523 governance head mismatch",
  );
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "Staff #523 governance paths/hashes invalid",
  );
  const paths = [...new Set([...r.productFiles.map((f) => f.path), ...r.governancePaths])].sort();
  demand(
    same(s.diff?.commits, [product.sha, gov.sha]) && same(s.diff?.paths, paths),
    "Staff #523 interval expanded",
  );
  demand(
    classifyPaths(r.productFiles.map((f) => f.path)).special.length === 5,
    "Staff #523 SPECIAL classification changed",
  );
  return canonical({
    schema: 1,
    reconciliationType: "STAFF_523_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    productPr: r.productPr,
    productHeadSha: r.productHeadSha,
    productFiles: r.productFiles,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}
export function authorizeStaff523(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "Staff #523 explicit dispatch required",
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
    "Staff #523 dispatch authority mismatch",
  );
  const payload = staff523Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "STAFF_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "STAFF_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === STAFF_523.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [523, payload.governancePr]),
    "Staff #523 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === staff523ScopeId(payload),
    "Staff #523 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}
export function assertStaff523Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "STAFF_523_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, STAFF_523.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "Staff #523 preparation/publication scope changed",
  );
}
