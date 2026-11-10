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

export const B1_SPATIAL_567 = freeze(
  JSON.parse(fs.readFileSync(new URL("./release-b1-spatial-567.json", import.meta.url), "utf8")),
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
      pr.number > releaseConfig.priorGovernancePrs.at(-1) &&
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

const isPriorGovernancePath = (p) =>
  p.startsWith("scripts/governance/") ||
  p.startsWith("docs/05-architecture/") ||
  p.startsWith(".github/workflows/");

export function verifyB1Gate6Evidence(geSnapshot, policy, releaseConfig = B1_SPATIAL_567) {
  const ge = releaseConfig.gate6Evidence;
  demand(ge && geSnapshot, "B1 Spatial 567 Gate 6 evidence missing");
  for (const stageKey of ["preflight", "install", "backfill"]) {
    const exp = ge[stageKey];
    const stage = geSnapshot[stageKey];
    demand(exp && stage, `B1 Spatial 567 Gate 6 ${stageKey} evidence missing`);
    const run = stage.run;
    demand(
      run?.id === exp.runId &&
        run.status === "completed" &&
        run.conclusion === "success" &&
        run.run_attempt === 1 &&
        run.event === "workflow_dispatch" &&
        run.head_branch === "main" &&
        run.head_sha === ge.sourceSha &&
        run.path?.split("@")[0] === ge.workflow &&
        run.actor?.id === policy.reviewerId &&
        run.triggering_actor?.id === policy.reviewerId,
      `B1 Spatial 567 Gate 6 ${stageKey} run mismatch`,
    );
    const artifact = stage.artifact;
    demand(
      artifact?.id === exp.artifactId &&
        artifact.name === exp.artifactName &&
        !artifact.expired &&
        artifact.digest === exp.artifactDigest &&
        (!artifact.workflow_run ||
          (artifact.workflow_run.id === exp.runId &&
            artifact.workflow_run.head_sha === ge.sourceSha &&
            artifact.workflow_run.head_branch === "main")),
      `B1 Spatial 567 Gate 6 ${stageKey} artifact mismatch`,
    );
    const report = stage.report;
    demand(
      DIGEST.test(stage.reportSha256 ?? "") &&
        stage.reportSha256 === exp.reportSha256 &&
        jsonObject(report) &&
        report.state === exp.expectedState &&
        report.sourceSha === ge.sourceSha &&
        report.project === ge.project &&
        report.manifestSha256 === ge.manifestSha256,
      `B1 Spatial 567 Gate 6 ${stageKey} report receipt mismatch`,
    );
    assertApproval(stage.reviews, { environment: ge.environment, reviewerId: policy.reviewerId });
  }

  const pre = geSnapshot.preflight.report;
  demand(
    pre.publishedBaseSha === ge.publishedBaseSha &&
      pre.observedLedgerHead === ge.preflight.expectedObservedLedgerHead &&
      pre.observedLedgerCount === ge.preflight.expectedObservedLedgerCount &&
      pre.ledgerDigest === ge.preflight.expectedLedgerDigest &&
      jsonObject(pre.verifiedPrerequisites) &&
      Object.keys(pre.verifiedPrerequisites).length >= 10 &&
      Object.values(pre.verifiedPrerequisites).every((v) => v === true) &&
      jsonObject(pre.b1ObjectsAbsent) &&
      Object.keys(pre.b1ObjectsAbsent).length >= 17 &&
      Object.values(pre.b1ObjectsAbsent).every((v) => v === true),
    "B1 Spatial 567 Gate 6 preflight verification invariants failed",
  );

  const inst = geSnapshot.install.report;
  demand(
    inst.preflightRunId === ge.install.expectedPreflightRunId &&
      inst.preflightDigest === ge.install.expectedPreflightDigest &&
      inst.installedMigrationsCount === 3 &&
      same(inst.installedVersions, ge.install.expectedInstalledVersions),
    "B1 Spatial 567 Gate 6 install verification invariants failed",
  );

  const back = geSnapshot.backfill.report;
  demand(
    back.installRunId === ge.backfill.expectedInstallRunId &&
      back.installReportSha256 === ge.backfill.expectedInstallReportSha256 &&
      back.backfillOutput?.backfillResult?.success === true &&
      back.backfillOutput?.discrepanciesCount === 0,
    "B1 Spatial 567 Gate 6 backfill verification invariants failed",
  );

  return ge;
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
  demand(
    SHA.test(r.priorGovernanceHeadSha ?? "") &&
      Array.isArray(r.priorGovernancePrs) &&
      r.priorGovernancePrs.length === 4 &&
      Array.isArray(r.priorGovernanceCommits) &&
      r.priorGovernanceCommits.length === 4 &&
      r.priorGovernanceCommits[3].sha === r.priorGovernanceHeadSha,
    "B1 Spatial 567 prior governance interval config invalid",
  );
  demand(same(s.baseline, r.baseline), "B1 Spatial 567 baseline mismatch");
  demand(
    SHA.test(s.targetSha ?? "") &&
      s.targetSha === s.currentMainSha &&
      s.targetSha !== r.candidateSha &&
      s.targetSha !== r.priorGovernanceHeadSha,
    "B1 Spatial 567 final source stale",
  );
  demand(
    s.commits?.length === 20,
    "B1 Spatial 567 exact 20-commit interval required (15 product + 4 prior governance + 1 governance PR)",
  );

  // Commits 0..14 are the 15 pinned product commits on main (PR #553 - #567)
  demand(same(s.commits.slice(0, 15), r.productCommits), "B1 Spatial 567 sealed commits mismatch");
  demand(s.productPrs?.length === 15, "B1 Spatial 567 product PRs missing or truncated");
  r.productCommits.forEach((c, n) => humanPr(s.productPrs[n], c, policy));

  // Candidate commit is index 14 (PR #567)
  const candidateCommit = s.commits[14];
  demand(
    candidateCommit.sha === r.candidateSha && candidateCommit.pr === r.candidatePr,
    "B1 Spatial 567 candidate commit mismatch",
  );

  // Commits 15..18 are the 4 pinned prior governance commits on main (PR #568 - #571)
  demand(
    same(s.commits.slice(15, 19), r.priorGovernanceCommits),
    "B1 Spatial 567 prior governance commits mismatch",
  );
  demand(
    s.priorGovernancePrs?.length === 4,
    "B1 Spatial 567 prior governance PRs missing or truncated",
  );
  r.priorGovernanceCommits.forEach((c, n) => {
    const expectedParent = n === 0 ? candidateCommit.sha : r.priorGovernanceCommits[n - 1].sha;
    demand(
      c.pr === r.priorGovernancePrs[n] && c.parent === expectedParent,
      "B1 Spatial 567 prior governance lineage mismatch",
    );
    humanPr(s.priorGovernancePrs[n], c, policy);
    demand(
      s.priorGovernancePrs[n].head?.ref === r.priorGovernanceBranches?.[String(c.pr)],
      `B1 Spatial 567 Prior Governance PR #${c.pr} branch mismatch`,
    );
    demand(
      Array.isArray(c.files) &&
        c.files.length > 0 &&
        c.files.every((f) => isPriorGovernancePath(f.path)),
      `B1 Spatial 567 Prior Governance PR #${c.pr} contains disallowed paths`,
    );
  });

  const gate6ManifestEntry = r.priorGovernanceCommits[3].files?.find(
    (f) => f.path === r.gate6Evidence?.manifestPath,
  );
  demand(
    gate6ManifestEntry?.after === r.gate6Evidence?.manifestSha256,
    "B1 Spatial 567 Gate 6 manifest digest mismatch",
  );
  const gate6Evidence = verifyB1Gate6Evidence(s.gate6Evidence, policy, r);

  // Commit 19 is the terminal Gate 7 governance PR
  const gov = s.commits[19];
  demand(
    gov.sha === s.targetSha &&
      gov.parent === r.priorGovernanceHeadSha &&
      Number.isSafeInteger(gov.pr) &&
      gov.pr > r.priorGovernancePrs.at(-1) &&
      SHA.test(gov.headSha ?? ""),
    "B1 Spatial 567 governance lineage mismatch",
  );
  humanGovPr(s.remediation, gov, policy, r);
  const expectedGovPaths = [...r.governancePaths].sort();
  demand(
    same(
      gov.files?.map((f) => f.path),
      expectedGovPaths,
    ) &&
      gov.files.every(
        (f) => (f.before === null || DIGEST.test(f.before ?? "")) && DIGEST.test(f.after ?? ""),
      ),
    "B1 Spatial 567 governance files mismatch",
  );

  const productPaths = [
    ...new Set(r.productCommits.flatMap((c) => c.files.map((f) => f.path))),
  ].sort();
  demand(productPaths.length === 93, "B1 Spatial 567 must cover exactly 93 reviewed product files");

  const priorGovPaths = [
    ...new Set(r.priorGovernanceCommits.flatMap((c) => c.files.map((f) => f.path))),
  ].sort();
  const totalPaths = [...new Set([...productPaths, ...priorGovPaths, ...r.governancePaths])].sort();
  demand(totalPaths.length === 101, "B1 Spatial 567 total interval path count mismatch");
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
    priorGovernanceHeadSha: r.priorGovernanceHeadSha,
    priorGovernancePrs: r.priorGovernancePrs,
    priorGovernanceCommits: r.priorGovernanceCommits,
    gate6Evidence,
    governancePr: gov.pr,
    governanceHeadSha: gov.headSha,
    governanceFiles: gov.files,
    finalSourceSha: s.targetSha,
    authority: { id: r.reviewerId, login: r.reviewerLogin },
    constraints: r.constraints,
  });
}

export function authorizeB1Spatial567(s, inputs, ctx, run, policy, releaseConfig = B1_SPATIAL_567) {
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
      same(prs, [
        ...releaseConfig.productPrs,
        ...releaseConfig.priorGovernancePrs,
        payload.governancePr,
      ]),
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
  if (fresh.reconciliation?.payload?.reconciliationType !== "B1_SPATIAL_567_PREPARATION") return;
  const { payload, reconciliationId } = fresh.reconciliation;
  demand(
    payload.candidateSha === releaseConfig.candidateSha,
    "B1 Spatial 567 publication rejected: candidateCommit does not match sealed candidateSha",
  );
  demand(
    reconciliationId === hash(JSON.stringify(payload)) &&
      same(payload.priorGovernanceCommits, releaseConfig.priorGovernanceCommits) &&
      same(payload.gate6Evidence, releaseConfig.gate6Evidence) &&
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
