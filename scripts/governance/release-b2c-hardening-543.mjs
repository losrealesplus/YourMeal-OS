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

export const B2C_543 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-b2c-hardening-543.json", import.meta.url))),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const b2cHardening543ScopeId = (p) => hash(JSON.stringify(canonical(p)));

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
    `B2C Hardening PR #${number} canonical human merge missing`,
  );
}

export function b2cHardening543Payload(s, policy) {
  const r = B2C_543;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "B2C #543 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "B2C #543 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "B2C #543 final source stale",
  );
  demand(s.commits?.length === 3, "B2C #543 exact 2-product plus governance merge interval required");

  const [c542, c543, gov] = s.commits;

  // Validate the 2 product commits in main
  demand(
    c542.sha === "34d588de1d22bdacee55a22ab440e5c2b7d7d648" &&
      c542.parent === r.baseline.sha &&
      c542.pr === 542,
    "B2C #543 product commit 1 (PR 542) lineage mismatch",
  );
  demand(
    c543.sha === r.candidateSha &&
      c543.parent === c542.sha &&
      c543.pr === 543,
    "B2C #543 product commit 2 (PR 543) lineage mismatch",
  );

  demand(s.productPrs?.length === 2, "B2C #543 two product PRs required");
  humanPr(s.productPrs[0], 542, c542.sha, policy);
  demand(s.productPrs[0].head.sha === r.productPr542HeadSha, "B2C #543 product PR 542 head mismatch");

  humanPr(s.productPrs[1], 543, c543.sha, policy);
  demand(s.productPrs[1].head.sha === r.productPr543HeadSha, "B2C #543 product PR 543 head mismatch");

  // Verify all net product files match sealed productFiles
  demand(
    same(s.productFiles, r.productFiles),
    "B2C #543 sealed product files mismatch",
  );

  // Validate governance commit
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > 543,
    "B2C #543 governance lineage mismatch",
  );
  humanPr(s.remediation, gov.pr, s.targetSha, policy);
  demand(
    s.remediation.head.ref === r.governanceBranch &&
      SHA.test(gov.headSha ?? "") &&
      gov.headSha === s.remediation.head.sha,
    "B2C #543 governance head mismatch",
  );
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "B2C #543 governance paths/hashes invalid",
  );

  demand(
    classifyPaths(r.productFiles.map((f) => f.path)).special.length === 5,
    "B2C #543 SPECIAL classification changed",
  );

  return canonical({
    schema: 1,
    reconciliationType: "B2C_HARDENING_543_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    productPrs: r.productPrs,
    productPr542HeadSha: r.productPr542HeadSha,
    productPr543HeadSha: r.productPr543HeadSha,
    productFiles: r.productFiles,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeB2cHardening543(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "B2C #543 explicit dispatch required",
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
    "B2C #543 dispatch authority mismatch",
  );
  const payload = b2cHardening543Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "B2C_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "B2C_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === B2C_543.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [...B2C_543.productPrs, payload.governancePr]),
    "B2C #543 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === b2cHardening543ScopeId(payload),
    "B2C #543 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertB2cHardening543Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "B2C_HARDENING_543_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, B2C_543.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "B2C #543 preparation/publication scope changed",
  );
}
