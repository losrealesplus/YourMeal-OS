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

export const SMOKE_RETRY_574 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-smoke-retry-574.json", import.meta.url), "utf8")),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const smokeRetry574ScopeId = (p) => hash(JSON.stringify(canonical(p)));

const FORBIDDEN_PATH =
  /^(?:supabase\/migrations\/|migrations\/|src\/|public\/|instances\/)|\.sql$/i;

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
    `Smoke Retry 574 PR #${c.pr} canonical human PR provenance mismatch`,
  );
}

export function smokeRetry574Payload(s, policy, releaseConfig = SMOKE_RETRY_574) {
  const r = releaseConfig;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "Smoke Retry 574 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "Smoke Retry 574 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha,
    "Smoke Retry 574 final source stale",
  );
  demand(
    s.commits?.length === 2,
    "Smoke Retry 574 exact two-commit interval required (PR #574 + reconciliation PR)",
  );

  const [candidate, gov] = s.commits;
  demand(
    candidate.sha === r.candidateSha &&
      candidate.parent === r.baseline.sha &&
      candidate.pr === r.candidatePr &&
      candidate.headSha === r.candidateHeadSha &&
      same(candidate.files, r.candidateFiles),
    "Smoke Retry 574 candidate PR #574 lineage or content mismatch",
  );
  humanPr(
    s.candidatePr,
    {
      pr: r.candidatePr,
      sha: r.candidateSha,
      headSha: r.candidateHeadSha,
    },
    policy,
  );
  demand(
    s.candidatePr.head?.ref === r.candidateBranch,
    "Smoke Retry 574 candidate branch mismatch",
  );

  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.candidateSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.candidatePr &&
      SHA.test(gov.headSha ?? ""),
    "Smoke Retry 574 governance lineage mismatch",
  );
  humanPr(s.remediation, gov, policy);
  demand(
    s.remediation.head?.ref === r.governanceBranch,
    "Smoke Retry 574 governance branch mismatch",
  );

  const expectedGovPaths = [...r.governancePaths].sort();
  demand(
    same(
      gov.files?.map((f) => f.path),
      expectedGovPaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "Smoke Retry 574 governance files mismatch",
  );

  const candidatePaths = r.candidateFiles.map((f) => f.path).sort();
  const totalPaths = [...new Set([...candidatePaths, ...expectedGovPaths])].sort();
  demand(
    same(s.diff?.commits, [candidate.sha, gov.sha]) && same(s.diff?.paths, totalPaths),
    "Smoke Retry 574 interval expanded or unclassified files detected",
  );
  demand(
    !totalPaths.some((p) => FORBIDDEN_PATH.test(p)),
    "Smoke Retry 574 interval forbids migrations or product/runtime changes",
  );
  demand(
    classifyPaths(candidatePaths).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
    "Smoke Retry 574 SPECIAL classification must remain",
  );

  return canonical({
    schema: 1,
    reconciliationType: "SMOKE_RETRY_574_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    candidatePr: r.candidatePr,
    candidateHeadSha: r.candidateHeadSha,
    candidateFiles: r.candidateFiles,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeSmokeRetry574(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = SMOKE_RETRY_574,
) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "Smoke Retry 574 explicit dispatch required",
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
    "Smoke Retry 574 dispatch authority mismatch",
  );

  const payload = smokeRetry574Payload(s, policy, releaseConfig);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "SMOKE_RETRY_574_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "SMOKE_RETRY_574_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === releaseConfig.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [releaseConfig.candidatePr, payload.governancePr]),
    "Smoke Retry 574 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === smokeRetry574ScopeId(payload),
    "Smoke Retry 574 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertSmokeRetry574Manifest(manifest, fresh, releaseConfig = SMOKE_RETRY_574) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "SMOKE_RETRY_574_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    payload.candidateSha === releaseConfig.candidateSha &&
      same(payload.baseline, releaseConfig.baseline) &&
      same(payload.candidateFiles, releaseConfig.candidateFiles),
    "Smoke Retry 574 publication rejected: pinned baseline or candidate mismatch",
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
    "Smoke Retry 574 preparation/publication scope changed",
  );
}
