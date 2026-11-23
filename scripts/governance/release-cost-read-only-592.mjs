import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { demand, hash, SHA, DIGEST, assertContext, classifyPaths } from "./release-contract.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { parseReleaseJson, jsonObject } from "./release-json.mjs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const freeze = (v) => {
  if (v && typeof v === "object") {
    Object.values(v).forEach(freeze);
    Object.freeze(v);
  }
  return v;
};

export const COST_READ_ONLY_592 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-cost-read-only-592.json", import.meta.url), "utf8")),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const costReadOnly592ScopeId = (p) => hash(JSON.stringify(canonical(p)));

const FORBIDDEN_PATH = /^(?:supabase\/migrations\/|migrations\/)|\.sql$/i;

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
    `Cost Read-Only Reconciliation PR #${c.pr} canonical human PR provenance mismatch`,
  );
}

function humanGovPr(pr, gov, policy, releaseConfig) {
  demand(
    Number.isSafeInteger(pr?.number) &&
      pr.number > releaseConfig.revertPr &&
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
    `Cost Read-Only Governance PR #${gov.pr} canonical human PR provenance mismatch`,
  );
}

export function costReadOnly592Payload(s, policy, releaseConfig = COST_READ_ONLY_592) {
  const r = releaseConfig;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "Cost Read-Only Reconciliation policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "Cost Read-Only Reconciliation baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha &&
      s.targetSha !== r.revertSha,
    "Cost Read-Only Reconciliation final source stale",
  );
  demand(
    s.commits?.length >= 3,
    "Cost Read-Only Reconciliation requires at least 3 commits (PR #591, #592 + governance PR)",
  );

  const [candidate, revertCommit, ...govCommits] = s.commits;

  // 1. Validate Candidate Commit (PR #591)
  demand(
    candidate.sha === r.candidateSha &&
      candidate.parent === r.baseline.sha &&
      candidate.pr === r.candidatePr &&
      candidate.headSha === r.candidateHeadSha &&
      same(candidate.files, r.candidateFiles),
    "Cost Read-Only Reconciliation candidate PR #591 lineage or content mismatch",
  );
  if (s.candidatePr && typeof s.candidatePr === "object") {
    humanPr(
      s.candidatePr,
      {
        pr: r.candidatePr,
        sha: r.candidateSha,
        headSha: r.candidateHeadSha,
      },
      policy,
    );
  }

  // 2. Validate Clean Revert Commit (PR #592)
  demand(
    revertCommit.sha === r.revertSha &&
      revertCommit.parent === r.candidateSha &&
      revertCommit.pr === r.revertPr &&
      revertCommit.headSha === r.revertHeadSha &&
      same(revertCommit.files, r.revertFiles),
    "Cost Read-Only Reconciliation clean revert PR #592 lineage or content mismatch",
  );
  if (s.revertPr && typeof s.revertPr === "object") {
    humanPr(
      s.revertPr,
      {
        pr: r.revertPr,
        sha: r.revertSha,
        headSha: r.revertHeadSha,
      },
      policy,
    );
  }

  // 3. Validate Governance Commits
  const expectedGovPaths = [...r.governancePaths].sort();
  for (let i = 0; i < govCommits.length; i++) {
    const c = govCommits[i];
    const expectedParent = i === 0 ? r.revertSha : govCommits[i - 1].sha;
    demand(
      c.parent === expectedParent &&
        Number.isSafeInteger(c.pr) &&
        c.pr > r.revertPr &&
        SHA.test(c.headSha ?? ""),
      `Cost Read-Only Reconciliation governance commit #${c.pr} lineage mismatch`,
    );
    demand(
      Array.isArray(c.files) &&
        c.files.length > 0 &&
        c.files.every((f) => expectedGovPaths.includes(f.path)) &&
        c.files.every(
          (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
        ),
      `Cost Read-Only Reconciliation governance commit #${c.pr} files mismatch`,
    );
  }

  const gov = govCommits.at(-1);
  demand(gov.sha === s.targetSha, "Cost Read-Only Reconciliation governance target SHA mismatch");
  if (s.remediation) {
    humanGovPr(s.remediation, gov, policy, r);
  }

  // 4. Invariant: src/services/feature-flag-service.ts in target must match baseline blob
  if (s.featureFlagServiceBlob !== undefined) {
    demand(
      s.featureFlagServiceBlob === r.featureFlagServiceBlob,
      "Cost Read-Only Reconciliation: feature-flag-service blob does not match baseline (clean revert violated)",
    );
  }

  // 5. Total paths in interval
  const candidatePaths = r.candidateFiles.map((f) => f.path).sort();
  const totalPaths = [...new Set([...candidatePaths, ...expectedGovPaths])].sort();
  demand(
    same(s.diff?.commits, s.commits.map((c) => c.sha)) && same(s.diff?.paths, totalPaths),
    "Cost Read-Only Reconciliation interval expanded or unclassified files detected",
  );
  demand(
    !totalPaths.some((p) => FORBIDDEN_PATH.test(p)),
    "Cost Read-Only Reconciliation interval forbids SQL migrations",
  );
  demand(
    classifyPaths(candidatePaths).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
    "Cost Read-Only Reconciliation SPECIAL classification must remain",
  );

  return canonical({
    schema: 1,
    reconciliationType: "COST_READ_ONLY_592_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: r.candidateSha,
    candidatePr: r.candidatePr,
    candidateHeadSha: r.candidateHeadSha,
    candidateBranch: r.candidateBranch,
    revertSha: r.revertSha,
    revertPr: r.revertPr,
    revertHeadSha: r.revertHeadSha,
    revertBranch: r.revertBranch,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    productFiles: r.productFiles,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeCostReadOnly592(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = COST_READ_ONLY_592,
) {
  assertContext(ctx, policy);
  demand(
    ctx.event === "workflow_dispatch",
    "Cost Read-Only Reconciliation explicit workflow_dispatch required",
  );
  demand(
    run.id === Number(ctx.runId) &&
      run.run_attempt === 1 &&
      run.event === "workflow_dispatch" &&
      run.head_branch === "main" &&
      run.head_sha === ctx.sha &&
      run.path?.split("@")[0] === policy.workflow &&
      (run.actor?.id === policy.reviewerId || run.triggering_actor?.id === policy.reviewerId),
    "Cost Read-Only Reconciliation dispatch authority mismatch",
  );

  const payload = costReadOnly592Payload(s, policy, releaseConfig);

  if (inputs.mode === "exact_interval") {
    const prs = parseReleaseJson(
      inputs.authorized_prs,
      "COST_READ_ONLY_592_INPUT_INVALID",
      "authorized_prs",
      "integer-pr-array",
      (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
    );
    const scope = parseReleaseJson(
      inputs.exact_interval_scope,
      "COST_READ_ONLY_592_INPUT_INVALID",
      "exact_interval_scope",
      "exact-human-scope",
      jsonObject,
    );
    const govPrs = s.commits?.length > 2 ? s.commits.slice(2).map((c) => c.pr) : [];
    const expectedPrs = govPrs.length > 0
      ? [...releaseConfig.productPrs, ...govPrs]
      : [...releaseConfig.productPrs, payload.governancePr];
    demand(
      payload.finalSourceSha === ctx.sha &&
        inputs.expected_base_sha === releaseConfig.baseline.sha &&
        inputs.expected_target_sha === ctx.sha &&
        same(prs, expectedPrs),
      "Cost Read-Only Reconciliation dispatch anchors mismatch",
    );
    demand(
      inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
        same(scope, payload) &&
        inputs.authorization_id === costReadOnly592ScopeId(payload),
      "Cost Read-Only Reconciliation human scope mismatch",
    );
  } else {
    // Mode normal with reason
    demand(
      typeof inputs.reason === "string" && inputs.reason.trim().length > 0,
      "Cost Read-Only Reconciliation requires explicit reason for release preparation",
    );
    demand(
      payload.finalSourceSha === ctx.sha,
      "Cost Read-Only Reconciliation dispatch target SHA mismatch",
    );
    if (inputs.expected_target_sha) {
      demand(
        inputs.expected_target_sha === ctx.sha,
        "Cost Read-Only Reconciliation expected target SHA mismatch",
      );
    }
  }

  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function verifyCostReadOnly592Reconciliation(
  s,
  inputs,
  ctx,
  run,
  policy,
  releaseConfig = COST_READ_ONLY_592,
) {
  assertContext(ctx, policy);
  const payload = costReadOnly592Payload(s, policy, releaseConfig);
  demand(
    payload.candidateSha === releaseConfig.candidateSha &&
      payload.revertSha === releaseConfig.revertSha &&
      same(payload.baseline, releaseConfig.baseline) &&
      same(payload.productFiles, releaseConfig.productFiles),
    "Cost Read-Only Reconciliation candidate/baseline mismatch",
  );
  if (inputs && typeof inputs.reason === "string") {
    demand(inputs.reason.trim().length > 0, "Cost Read-Only Reconciliation requires valid reason");
  }
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertCostReadOnly592Manifest(manifest, fresh, releaseConfig = COST_READ_ONLY_592) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "COST_READ_ONLY_592_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  const manifestPayload = manifest.reconciliation?.payload;
  demand(
    payload.candidateSha === releaseConfig.candidateSha &&
      manifestPayload?.candidateSha === releaseConfig.candidateSha &&
      payload.revertSha === releaseConfig.revertSha &&
      manifestPayload?.revertSha === releaseConfig.revertSha &&
      same(payload.baseline, releaseConfig.baseline) &&
      same(payload.productFiles, releaseConfig.productFiles),
    "Cost Read-Only Reconciliation publication rejected: pinned baseline or candidate mismatch",
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
    "Cost Read-Only Reconciliation preparation/publication scope changed",
  );
}
