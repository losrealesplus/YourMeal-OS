import fs from "node:fs";
import { demand, hash, SHA, DIGEST, assertContext, classifyPaths } from "./release-contract.mjs";
import { parseReleaseJson, jsonObject } from "./release-json.mjs";

// One sealed interval, not an authority record for its pending DB migrations.
export const EXACT_INTERVAL = Object.freeze({
  repository: "losrealesplus/YourMeal-OS",
  baselineSha: "8283d56092affa0e7aaa6bf26551a7098c82f561",
  baselineDeploymentId: 6893440998,
  baselineVersionId: "75deb91a-638c-456e-b835-81603d114442",
  candidateSha: "b88aaf91a3be06a515e298c0079f80a5706dd0ef",
  planSha256: "0ecf1b33e6a1471d42d86a7ae9165031cc3ae14518c403ec5069b2a9c72aa8e4",
  manifestSha256: "94ed27e0683433413a52dd5c325d6776bc7f9680eab1365704ef8b0e471c4595",
  prs: Object.freeze([506, 507, 508, 509, 510, 511, 512, 513]),
  branch: "codex/gate7-exact-interval-reconciliation",
});
export const EXACT_GOVERNANCE_FILES = Object.freeze(
  [
    ".github/workflows/deploy-production.yml",
    "docs/05-architecture/GATE7_EXACT_INTERVAL_RECONCILIATION.md",
    "docs/99-internal/development-journal/2026-10-10-gate7-exact-interval.md",
    "scripts/governance/release-activation.mjs",
    "scripts/governance/release-exact-interval-manifest.json",
    "scripts/governance/release-exact-interval-plan.json",
    "scripts/governance/release-exact-interval.mjs",
    "scripts/governance/release-exact-interval.spec.mjs",
    "scripts/governance/release-json.spec.mjs",
    "scripts/governance/release-plan.mjs",
    "scripts/governance/release-reconciliation.mjs",
  ].sort(),
);
export const EXACT_CONSTRAINTS = Object.freeze({
  productionSqlAuthorized: false,
  migrationExecutionAuthorized: false,
  productionWorkerApprovalGranted: false,
  a5: "HARD_DISABLED",
  a4b: "CLOSED",
  oauthActivationAuthorized: false,
});
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical(value[k])]),
    );
  return value;
}
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
export const exactScopeId = (value) => hash(JSON.stringify(canonical(value)));

export function readExactEvidence() {
  return {
    manifestBytes: fs.readFileSync(
      new URL("./release-exact-interval-manifest.json", import.meta.url),
    ),
    planBytes: fs.readFileSync(new URL("./release-exact-interval-plan.json", import.meta.url)),
  };
}
export function verifyExactEvidence({ manifestBytes, planBytes }) {
  const r = EXACT_INTERVAL;
  demand(hash(manifestBytes) === r.manifestSha256, "Exact interval manifest bytes changed");
  demand(hash(planBytes) === r.planSha256, "Exact interval release-plan bytes changed");
  const manifest = JSON.parse(manifestBytes);
  const plan = JSON.parse(planBytes);
  demand(
    manifest.baseline === r.baselineSha && manifest.target === r.candidateSha,
    "Exact interval manifest anchors changed",
  );
  demand(
    plan.repository === r.repository &&
      plan.sourceSha === r.candidateSha &&
      plan.baseline.sha === r.baselineSha &&
      same(plan.prs, r.prs),
    "Exact interval plan binding changed",
  );
  const paths = manifest.paths.map((p) => p.path);
  demand(
    paths.length === 113 && same(paths, [...new Set(paths)].sort()) && same(paths, plan.paths),
    "Exact interval paths changed",
  );
  const classification = classifyPaths(paths);
  demand(
    classification.decision === "REQUIRES_SEPARATE_AUTHORIZATION" &&
      classification.special.length === 47 &&
      same(classification.special, plan.special),
    "Exact interval SPECIAL classification changed",
  );
  return { manifest, plan, paths, commits: manifest.commits.map((c) => c.split(" ")[0]) };
}

// Snapshot contains fresh Git content, merged-PR provenance and current baseline.
// Validating content alone NEVER creates authority or an eligible release plan.
export function exactIntervalPayload(snapshot, policy) {
  const r = EXACT_INTERVAL;
  const evidence = verifyExactEvidence(snapshot);
  demand(
    policy.repository === r.repository && snapshot.repository === r.repository,
    "Exact interval repository mismatch",
  );
  demand(
    snapshot.baseline.sha === r.baselineSha &&
      snapshot.baseline.deploymentId === r.baselineDeploymentId &&
      snapshot.baseline.versionId === r.baselineVersionId,
    "Exact interval baseline mismatch",
  );
  demand(
    snapshot.candidateSha === r.candidateSha &&
      SHA.test(snapshot.finalSourceSha) &&
      snapshot.finalSourceSha !== r.candidateSha &&
      snapshot.currentMainSha === snapshot.finalSourceSha,
    "Exact interval final source mismatch",
  );
  demand(
    same(snapshot.sealedCommits, evidence.commits) &&
      same(snapshot.sealedPrs, r.prs) &&
      same(snapshot.sealedPaths, evidence.paths) &&
      same(snapshot.sealedFiles, evidence.manifest.paths),
    "Exact sealed interval content mismatch",
  );
  demand(
    snapshot.governanceParent === r.candidateSha &&
      same(snapshot.governanceCommits, [snapshot.finalSourceSha]),
    "Only one exact governance merge may follow the candidate",
  );
  const pr = snapshot.remediation;
  demand(
    Number.isSafeInteger(pr?.number) &&
      pr.number > 513 &&
      pr.merged === true &&
      pr.state === "closed" &&
      pr.base?.ref === "main" &&
      pr.base?.repo?.full_name === r.repository &&
      pr.head?.repo?.full_name === r.repository &&
      pr.head?.ref === r.branch &&
      SHA.test(pr.head?.sha) &&
      pr.merge_commit_sha === snapshot.finalSourceSha &&
      snapshot.governanceHead === pr.head.sha &&
      pr.merged_by?.id === policy.reviewerId,
    "Exact governance PR must be canonical and human merged",
  );
  demand(
    same(snapshot.fullCommits, [...evidence.commits, snapshot.finalSourceSha]) &&
      same(snapshot.fullPrs, [...r.prs, pr.number]),
    "Exact interval PR/commit sequence mismatch",
  );
  demand(
    same(snapshot.governancePaths, EXACT_GOVERNANCE_FILES) &&
      same(
        snapshot.governanceFiles.map((p) => p.path),
        EXACT_GOVERNANCE_FILES,
      ) &&
      snapshot.governanceFiles.every(
        (p) => (p.before === null || DIGEST.test(p.before)) && DIGEST.test(p.after),
      ),
    "Exact governance delta paths or hashes invalid",
  );
  demand(
    same(snapshot.fullPaths, [...new Set([...evidence.paths, ...EXACT_GOVERNANCE_FILES])].sort()),
    "Exact interval contains an additional or missing path",
  );
  return {
    schema: 1,
    reconciliationType: "EXACT_506_513_PREPARATION",
    repository: r.repository,
    baseline: snapshot.baseline,
    candidateSha: r.candidateSha,
    finalSourceSha: snapshot.finalSourceSha,
    planSha256: r.planSha256,
    manifestSha256: r.manifestSha256,
    sealedPrs: [...r.prs],
    sealedCommits: evidence.commits,
    sealedPaths: evidence.paths,
    sealedFiles: snapshot.sealedFiles,
    governancePr: pr.number,
    governanceHead: pr.head.sha,
    governanceFiles: snapshot.governanceFiles,
    constraints: { ...EXACT_CONSTRAINTS },
  };
}

export function authorizeExactInterval(snapshot, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    inputs.mode === "exact_interval" && ctx.event === "workflow_dispatch",
    "Exact interval requires a new explicit human dispatch",
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
    "Exact interval dispatch authority mismatch",
  );
  const payload = exactIntervalPayload(snapshot, policy);
  const authorizedPrs = parseReleaseJson(
    inputs.authorized_prs,
    "EXACT_INPUT_INVALID",
    "authorized_prs",
    "integer-pr-array",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  );
  const scope = parseReleaseJson(
    inputs.exact_interval_scope,
    "EXACT_INPUT_INVALID",
    "exact_interval_scope",
    "exact-human-scope",
    jsonObject,
  );
  demand(
    payload.finalSourceSha === ctx.sha &&
      inputs.expected_base_sha === EXACT_INTERVAL.baselineSha &&
      inputs.expected_target_sha === ctx.sha &&
      same(authorizedPrs, [...EXACT_INTERVAL.prs, payload.governancePr]),
    "Exact interval dispatch anchors or PRs changed",
  );
  demand(
    inputs.exact_interval_scope === JSON.stringify(canonical(scope)) &&
      same(scope, payload) &&
      DIGEST.test(inputs.authorization_id ?? "") &&
      inputs.authorization_id === exactScopeId(payload),
    "Exact interval human scope or hash changed",
  );
  return { reconciled: true, reconciliationId: exactScopeId(payload), payload };
}

export function assertExactIntervalManifest(manifest, fresh) {
  if (fresh.reconciliation?.payload?.reconciliationType !== "EXACT_506_513_PREPARATION") return;
  const { reconciliation } = fresh;
  demand(
    reconciliation.reconciliationId === exactScopeId(reconciliation.payload) &&
      [manifest.reconciliation, manifest.plan?.reconciliation].every(
        (item) =>
          item &&
          item.reconciliationId === reconciliation.reconciliationId &&
          same(item.payload, reconciliation.payload),
      ) &&
      fresh.sourceSha === reconciliation.payload.finalSourceSha &&
      manifest.sourceSha === fresh.sourceSha &&
      manifest.plan?.sourceSha === fresh.sourceSha &&
      same(reconciliation.payload.constraints, EXACT_CONSTRAINTS),
    "Exact interval preparation/publication scope changed",
  );
}
