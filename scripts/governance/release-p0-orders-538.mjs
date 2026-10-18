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

export const P0_538 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-p0-orders-538.json", import.meta.url))),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const p0Orders538ScopeId = (p) => hash(JSON.stringify(canonical(p)));

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
    `P0 Order Recovery PR #${number} canonical human merge missing`,
  );
}

export function p0Orders538Payload(s, policy) {
  const r = P0_538;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "P0 #538 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "P0 #538 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "P0 #538 final source stale",
  );
  demand(s.commits?.length === 4, "P0 #538 exact 3-product plus governance merge interval required");

  const [c538, c539, c540, gov] = s.commits;

  // Validate the 3 product commits in main
  demand(
    c538.sha === "829c218c7c15e146998dbf102fcd01c607b79755" &&
      c538.parent === r.baseline.sha &&
      c538.pr === 538,
    "P0 #538 product commit 1 lineage mismatch",
  );
  demand(
    c539.sha === "3c771f7e4743714bcc39aa92b6c799b7e988867b" &&
      c539.parent === c538.sha &&
      c539.pr === 539,
    "P0 #538 product commit 2 (accidental merge) lineage mismatch",
  );
  demand(
    c540.sha === r.candidateSha &&
      c540.parent === c539.sha &&
      c540.pr === 540,
    "P0 #538 product commit 3 (clean revert) lineage mismatch",
  );

  humanPr(s.productPr, r.productPr, c538.sha, policy);
  demand(s.productPr.head.sha === r.productHeadSha, "P0 #538 product head mismatch");

  // Verify all net product files match sealed productFiles
  demand(
    same(s.productFiles, r.productFiles),
    "P0 #538 sealed product files mismatch",
  );

  // Validate governance commit
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > 540,
    "P0 #538 governance lineage mismatch",
  );
  humanPr(s.remediation, gov.pr, s.targetSha, policy);
  demand(
    s.remediation.head.ref === r.governanceBranch &&
      SHA.test(gov.headSha ?? "") &&
      gov.headSha === s.remediation.head.sha,
    "P0 #538 governance head mismatch",
  );
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "P0 #538 governance paths/hashes invalid",
  );

  demand(
    classifyPaths(r.productFiles.map((f) => f.path)).special.length === 2,
    "P0 #538 SPECIAL classification changed",
  );

  return canonical({
    schema: 1,
    reconciliationType: "P0_538_PREPARATION",
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

export function authorizeP0Orders538(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "P0 #538 explicit dispatch required",
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
    "P0 #538 dispatch authority mismatch",
  );
  const payload = p0Orders538Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "P0_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "P0_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === P0_538.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [...P0_538.productPrs, payload.governancePr]),
    "P0 #538 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === p0Orders538ScopeId(payload),
    "P0 #538 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertP0Orders538Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "P0_538_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, P0_538.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "P0 #538 preparation/publication scope changed",
  );
}
