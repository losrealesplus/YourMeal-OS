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

export const CR_COST_05_582 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-cr-cost-05-582.json", import.meta.url), "utf8")),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const crCost05_582ScopeId = (p) => hash(JSON.stringify(canonical(p)));

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
    `CR-COST-05 (PR #${c.pr}) canonical human PR provenance mismatch`,
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
      (pr.head?.ref === releaseConfig.governanceBranch ||
        pr.head?.ref === "fix/gate7-cr-cost-05-total-paths-83" ||
        pr.head?.ref === "fix/gate7-separate-authorization-cr-cost-05") &&
      pr.head?.sha === gov.headSha &&
      pr.merged_by?.id === policy.reviewerId &&
      pr.merged_by?.login === policy.reviewerLogin,
    `CR-COST-05 Governance PR #${gov.pr} canonical human PR provenance mismatch`,
  );
}

export function crCost05_582Payload(s, policy, releaseConfig = CR_COST_05_582) {
  const r = releaseConfig;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "CR-COST-05 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "CR-COST-05 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") && s.targetSha === s.currentMainSha,
    "CR-COST-05 final source stale",
  );

  const hasGovCommit = s.commits?.length >= 8;
  const isDirectCandidate = s.commits?.length === 7;
  demand(
    hasGovCommit || isDirectCandidate,
    "CR-COST-05 interval must have 7 candidate commits (PRs #576–#582) or 8+ commits (+ governance PRs)",
  );

  for (let i = 0; i < 7; i++) {
    const commit = s.commits[i];
    const expected = r.productCommits[i];
    demand(
      commit.sha === expected.sha &&
        commit.parent === expected.parent &&
        commit.pr === expected.pr &&
        commit.headSha === expected.headSha &&
        same(commit.files, expected.files),
      `CR-COST-05 product commit #${expected.pr} lineage or content mismatch`,
    );
    if (s.productPrs && typeof s.productPrs[i] === "object") {
      humanPr(s.productPrs[i], expected, policy);
    }
  }

  let gov = null;
  let totalPaths;
  const productPaths = [
    ...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path))),
  ].sort();
  demand(productPaths.length === 73, "CR-COST-05 must cover exactly 73 reviewed product files");

  if (hasGovCommit) {
    const expectedGovPaths = [...r.governancePaths].sort();
    for (let i = 7; i < s.commits.length; i++) {
      const c = s.commits[i];
      const expectedParent = i === 7 ? r.candidateSha : s.commits[i - 1].sha;
      demand(
        c.parent === expectedParent &&
          Number.isSafeInteger(c.pr) &&
          c.pr > r.candidatePr &&
          SHA.test(c.headSha ?? ""),
        `CR-COST-05 governance commit #${c.pr} lineage mismatch`,
      );
      demand(
        Array.isArray(c.files) &&
          c.files.length > 0 &&
          c.files.every((f) => expectedGovPaths.includes(f.path)) &&
          c.files.every(
            (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
          ),
        `CR-COST-05 governance commit #${c.pr} files mismatch`,
      );
    }
    gov = s.commits.at(-1);
    demand(gov.sha === s.targetSha, "CR-COST-05 governance target SHA mismatch");
    if (s.remediation) {
      humanGovPr(s.remediation, gov, policy, r);
    }
    totalPaths = [...new Set([...productPaths, ...expectedGovPaths])].sort();
    demand(totalPaths.length === 83, "CR-COST-05 total interval path count mismatch");
  } else {
    totalPaths = productPaths;
    demand(s.targetSha === r.candidateSha, "CR-COST-05 direct target must match candidateSha");
  }

  demand(
    same(s.diff?.commits, s.commits.map((c) => c.sha)) && same(s.diff?.paths, totalPaths),
    "CR-COST-05 interval expanded or unclassified files detected",
  );
  demand(
    classifyPaths(productPaths).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
    "CR-COST-05 SPECIAL classification must remain",
  );

  return canonical({
    schema: 1,
    reconciliationType: "CR_COST_05_582_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    candidatePr: r.candidatePr,
    candidateHeadSha: r.candidateHeadSha,
    candidateBranch: r.candidateBranch,
    productPrs: r.productPrs,
    productCommits: r.productCommits,
    ...(gov
      ? {
          governancePr: gov.pr,
          governanceHeadSha: gov.headSha,
          governanceFiles: gov.files,
        }
      : {}),
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeCrCost05_582(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = CR_COST_05_582,
) {
  assertContext(ctx, policy);
  demand(
    ctx.event === "workflow_dispatch",
    "CR-COST-05 explicit workflow_dispatch required",
  );
  demand(
    run.id === Number(ctx.runId) &&
      run.run_attempt === 1 &&
      run.event === "workflow_dispatch" &&
      run.head_branch === "main" &&
      run.head_sha === ctx.sha &&
      run.path?.split("@")[0] === policy.workflow &&
      (run.actor?.id === policy.reviewerId || run.triggering_actor?.id === policy.reviewerId),
    "CR-COST-05 dispatch authority mismatch",
  );

  const payload = crCost05_582Payload(s, policy, releaseConfig);

  if (inputs.mode === "exact_interval") {
    const prs = parseReleaseJson(
      inputs.authorized_prs,
      "CR_COST_05_INPUT_INVALID",
      "authorized_prs",
      "integer-pr-array",
      (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
    );
    const scope = parseReleaseJson(
      inputs.exact_interval_scope,
      "CR_COST_05_INPUT_INVALID",
      "exact_interval_scope",
      "exact-human-scope",
      jsonObject,
    );
    const govPrs = s.commits?.length > 7 ? s.commits.slice(7).map((c) => c.pr) : [];
    const expectedPrs = govPrs.length > 0
      ? [...releaseConfig.productPrs, ...govPrs]
      : (payload.governancePr
        ? [...releaseConfig.productPrs, payload.governancePr]
        : [...releaseConfig.productPrs]);
    demand(
      payload.finalSourceSha === ctx.sha &&
        inputs.expected_base_sha === releaseConfig.baseline.sha &&
        inputs.expected_target_sha === ctx.sha &&
        same(prs, expectedPrs),
      "CR-COST-05 dispatch anchors mismatch",
    );
    demand(
      inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
        same(scope, payload) &&
        inputs.authorization_id === crCost05_582ScopeId(payload),
      "CR-COST-05 human scope mismatch",
    );
  } else {
    // Mode normal or other approved dispatch
    demand(
      typeof inputs.reason === "string" && inputs.reason.trim().length > 0,
      "CR-COST-05 requires explicit reason for release preparation",
    );
    demand(
      payload.finalSourceSha === ctx.sha,
      "CR-COST-05 dispatch target SHA mismatch",
    );
    if (inputs.expected_target_sha) {
      demand(
        inputs.expected_target_sha === ctx.sha,
        "CR-COST-05 expected target SHA mismatch",
      );
    }
  }

  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function verifyCrCost05_582Reconciliation(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = CR_COST_05_582,
) {
  assertContext(ctx, policy);
  const payload = crCost05_582Payload(s, policy, releaseConfig);
  demand(
    payload.candidateSha === releaseConfig.candidateSha &&
      same(payload.baseline, releaseConfig.baseline) &&
      same(payload.productCommits, releaseConfig.productCommits),
    "CR-COST-05 candidate/baseline mismatch",
  );
  if (inputs && typeof inputs.reason === "string") {
    demand(inputs.reason.trim().length > 0, "CR-COST-05 requires valid reason");
  }
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertCrCost05_582Manifest(manifest, fresh, releaseConfig = CR_COST_05_582) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "CR_COST_05_582_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  const manifestPayload = manifest.reconciliation?.payload;
  demand(
    payload.candidateSha === releaseConfig.candidateSha &&
      manifestPayload?.candidateSha === releaseConfig.candidateSha &&
      same(payload.baseline, releaseConfig.baseline) &&
      same(payload.productCommits, releaseConfig.productCommits),
    "CR-COST-05 publication rejected: pinned baseline or candidate mismatch",
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
    "CR-COST-05 preparation/publication scope changed",
  );
}
