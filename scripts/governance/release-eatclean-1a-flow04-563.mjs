import fs from "node:fs";
import {
  demand,
  hash,
  SHA,
  DIGEST,
  assertContext,
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

export const EATCLEAN_1A_563 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-eatclean-1a-flow04-563.json", import.meta.url))),
);

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const eatclean1A563ScopeId = (p) => hash(JSON.stringify(canonical(p)));

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
    `EatClean 1A FLOW-04 PR #${c.pr} canonical human PR provenance mismatch`,
  );
}

export function eatclean1A563Payload(s, policy) {
  const r = EATCLEAN_1A_563;
  demand(
    policy.repository === r.repository &&
      policy.environment === r.environment &&
      policy.reviewerId === r.reviewerId &&
      policy.reviewerLogin === r.reviewerLogin &&
      s.repository === r.repository,
    "EatClean 1A FLOW-04 policy mismatch",
  );
  demand(same(s.baseline, r.baseline), "EatClean 1A FLOW-04 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha,
    "EatClean 1A FLOW-04 final source stale",
  );
  demand(
    s.commits?.length === 12,
    "EatClean 1A FLOW-04 exact 12-commit interval required (10 merged + 1 candidate PR 563 + 1 governance PR)",
  );

  // Commits 0..9 are the 10 pinned product commits on main (PR #553 - #562)
  demand(
    same(s.commits.slice(0, 10), r.productCommits),
    "EatClean 1A FLOW-04 sealed commits mismatch",
  );
  demand(s.productPrs?.length === 10, "EatClean 1A FLOW-04 product PRs missing or truncated");
  r.productCommits.forEach((c, n) => humanPr(s.productPrs[n], c, policy));

  // Commit 10 is candidate PR #563
  const candidateCommit = s.commits[10];
  demand(
    candidateCommit.parent === r.candidatePr.baseSha &&
      candidateCommit.pr === r.candidatePr.number &&
      SHA.test(candidateCommit.sha ?? "") &&
      same(candidateCommit.files, r.candidatePr.files),
    "EatClean 1A FLOW-04 candidate PR 563 lineage/content mismatch",
  );
  if (r.candidateSha) {
    demand(
      candidateCommit.sha === r.candidateSha,
      "EatClean 1A FLOW-04 candidate commit SHA mismatch with pinned release",
    );
    demand(
      s.targetSha !== r.candidateSha,
      "EatClean 1A FLOW-04 target SHA cannot be the unsealed candidate SHA",
    );
  }
  humanPr(
    s.candidatePr,
    {
      pr: r.candidatePr.number,
      sha: candidateCommit.sha,
      headSha: r.candidatePr.headSha,
    },
    policy,
  );

  // Commit 11 is governance remediation PR
  const gov = s.commits[11];
  demand(
    gov.sha === s.targetSha &&
      gov.parent === candidateCommit.sha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.candidatePr.number &&
      SHA.test(gov.headSha ?? ""),
    "EatClean 1A FLOW-04 governance lineage mismatch",
  );
  humanPr(s.remediation, gov, policy);
  demand(
    s.remediation.head?.ref === r.governanceBranch,
    "EatClean 1A FLOW-04 governance branch mismatch",
  );
  demand(
    same(
      gov.files?.map((f) => f.path),
      r.governancePaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "EatClean 1A FLOW-04 governance files mismatch",
  );

  const productPaths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.candidatePr.files.map((f) => f.path),
    ]),
  ].sort();
  demand(productPaths.length === 55, "EatClean 1A FLOW-04 must cover exactly 55 reviewed product files");

  const totalPaths = [...new Set([...productPaths, ...r.governancePaths])].sort();
  demand(
    same(
      s.diff?.commits,
      s.commits.map((c) => c.sha),
    ) && same(s.diff?.paths, totalPaths),
    "EatClean 1A FLOW-04 interval expanded or unclassified files detected",
  );
  demand(
    classifyPaths(productPaths).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
    "EatClean 1A FLOW-04 SPECIAL classification must remain",
  );

  return canonical({
    schema: 1,
    reconciliationType: "FLOW04_INCREMENT_1A_PREPARATION",
    repository: r.repository,
    baseline: r.baseline,
    candidateSha: candidateCommit.sha,
    candidatePr: r.candidatePr.number,
    candidateHeadSha: r.candidatePr.headSha,
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

export function authorizeEatClean1A563(s, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "EatClean 1A FLOW-04 explicit dispatch required",
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
    "EatClean 1A FLOW-04 dispatch authority mismatch",
  );
  const payload = eatclean1A563Payload(s, policy);
  const prs = parseReleaseJson(
    inputs.authorized_prs,
    "EATCLEAN_1A_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "EATCLEAN_1A_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === EATCLEAN_1A_563.baseline.sha &&
      inputs.expected_target_sha === ctx.sha &&
      same(prs, [...EATCLEAN_1A_563.productPrs, payload.governancePr]),
    "EatClean 1A FLOW-04 dispatch anchors mismatch",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      inputs.authorization_id === eatclean1A563ScopeId(payload),
    "EatClean 1A FLOW-04 human scope mismatch",
  );
  return { reconciled: true, reconciliationId: hash(JSON.stringify(payload)), payload };
}

export function assertEatClean1A563Manifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "FLOW04_INCREMENT_1A_PREPARATION")
    return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.constraints, EATCLEAN_1A_563.constraints) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (x) => x?.reconciliationId === reconciliationId && same(x.payload, payload),
      ) &&
      fresh.sourceSha === payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha,
    "EatClean 1A FLOW-04 #563 preparation/publication scope changed",
  );
}
