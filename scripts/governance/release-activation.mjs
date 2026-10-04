import { assertContext, demand, hash, SHA, DIGEST } from "./release-contract.mjs";

// Bootstrap only: immutable historical anchor, never a generic SPECIAL allowlist.
export const INITIAL_BASE = "752234f406366bdf2fcec18750092b6f0fd44039";
export const INITIAL_DEPLOYMENT = 6841438048;
export const INITIAL_COMMITS = [
  "dd03d2c85da6acf320a1c1d8498133168b68d451",
  "820eefb38331026e4e5e70f8ce00294ad6de62d6",
  "edc14825d4a513880df9542b29f89e5a04f2234c",
];
export const REMEDIATION_BRANCH = "codex/gate7-initial-activation-lane";
const existingScope = [
  ".github/workflows/deploy-production.yml",
  "AGENTS.md",
  "docs/05-architecture/ENGINEERING_OPERATING_PROTOCOL.md",
  "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
  "docs/adr/0101-post-merge-preparation-human-production-authority.md",
  ...[
    "release-artifact.mjs",
    "release-contract.mjs",
    "release-contract.spec.mjs",
    "release-plan.mjs",
    "release-policy.json",
    "release-publication.spec.mjs",
    "release-publish.mjs",
    "verify-release-tar.py",
  ].map((p) => `scripts/governance/${p}`),
].sort();
export const REMEDIATION_FILES = [
  ".github/workflows/deploy-production.yml",
  ...[
    "release-activation.mjs",
    "release-activation.spec.mjs",
    "release-artifact.mjs",
    "release-contract.mjs",
    "release-contract.spec.mjs",
    "release-plan.mjs",
    "release-publication.spec.mjs",
    "release-publish.mjs",
  ].map((p) => `scripts/governance/${p}`),
  "docs/05-architecture/GATE7_POST_MERGE_AUTOMATION.md",
  "docs/99-internal/development-journal/2026-10-04-gate7-initial-activation-lane.md",
].sort();
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function activationMode(inputs = {}) {
  const mode = inputs.mode ?? "normal";
  demand(["normal", "initial_activation"].includes(mode), "Unknown preparation mode");
  if (mode === "normal")
    demand(
      ["expected_base_sha", "expected_target_sha", "authorized_prs", "authorization_id"].every(
        (k) => !inputs[k],
      ),
      "Activation inputs cannot fall back to normal mode",
    );
  return mode === "initial_activation";
}
export function activationPayload(snapshot, policy) {
  const { baseline, commits, currentMainSha, targetSha, repository, remediation } = snapshot;
  demand(
    repository === policy.repository && SHA.test(targetSha) && targetSha === currentMainSha,
    "Activation source is stale or noncanonical",
  );
  demand(
    baseline.sha === INITIAL_BASE &&
      baseline.deploymentId === INITIAL_DEPLOYMENT &&
      baseline.versionId === null,
    "Initial baseline changed or activation already consumed",
  );
  demand(
    commits.length === 4 &&
      same(
        commits.slice(0, 3).map((c) => c.sha),
        INITIAL_COMMITS,
      ) &&
      same(
        commits.slice(0, 3).map((c) => c.pr),
        [486, 487, 488],
      ) &&
      commits[3].sha === targetSha,
    "Unexpected/direct/extra activation interval",
  );
  const last = commits[3];
  demand(
    Number.isSafeInteger(last.pr) &&
      last.pr > 488 &&
      remediation.number === last.pr &&
      remediation.merge_commit_sha === targetSha &&
      remediation.head?.ref === REMEDIATION_BRANCH &&
      remediation.head?.repo?.full_name === policy.repository &&
      remediation.merged_by?.id === policy.reviewerId,
    "Remediation must be the exact human-merged canonical activation PR",
  );
  demand(
    last.paths.length > 0 &&
      last.paths.every((p) => REMEDIATION_FILES.includes(p)) &&
      [
        ".github/workflows/deploy-production.yml",
        "scripts/governance/release-activation.mjs",
        "scripts/governance/release-activation.spec.mjs",
        "scripts/governance/release-plan.mjs",
        "scripts/governance/release-publish.mjs",
        "scripts/governance/release-artifact.mjs",
        "scripts/governance/release-contract.mjs",
      ].every((p) => last.paths.includes(p)),
    "Remediation includes unauthorized files",
  );
  demand(
    same(
      commits[2].specialFiles.map((f) => f.path),
      existingScope,
    ),
    "Historical SPECIAL scope differs",
  );
  for (const commit of [commits[2], last]) {
    const files = commit.specialFiles;
    demand(
      same(
        files.map((f) => f.path),
        [...new Set(files.map((f) => f.path))].sort(),
      ) &&
        files.every(
          (f) =>
            (f.before === null || DIGEST.test(f.before)) &&
            (f.after === null || DIGEST.test(f.after)) &&
            (f.before !== null || f.after !== null),
        ),
      "Invalid SPECIAL content evidence",
    );
  }
  demand(
    same(
      last.specialFiles.map((f) => f.path),
      last.paths
        .filter(
          (p) =>
            p !==
            "docs/99-internal/development-journal/2026-10-04-gate7-initial-activation-lane.md",
        )
        .sort(),
    ),
    "SPECIAL paths missing from remediation evidence",
  );
  return {
    schema: 1,
    mode: "initial_activation",
    repository,
    baselineSha: INITIAL_BASE,
    baselineDeploymentId: INITIAL_DEPLOYMENT,
    targetSha,
    prs: commits.map((c) => c.pr),
    special: [commits[2], last].map((c) => ({
      commit: c.sha,
      pr: c.pr,
      files: c.specialFiles.map((f) => ({ path: f.path, before: f.before, after: f.after })),
    })),
  };
}
export function authorizeActivation(snapshot, inputs, ctx, run, policy) {
  assertContext(ctx, policy);
  demand(
    activationMode(inputs) && ctx.event === "workflow_dispatch",
    "Initial activation is dispatch-only, never push automation",
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
    "Untrusted activation initiator/run",
  );
  const payload = activationPayload(snapshot, policy);
  demand(
    payload.targetSha === ctx.sha &&
      inputs.expected_base_sha === payload.baselineSha &&
      inputs.expected_target_sha === payload.targetSha &&
      same(JSON.parse(inputs.authorized_prs), payload.prs),
    "Activation inputs do not match reconciled scope",
  );
  const authorizationId = hash(JSON.stringify(payload));
  demand(inputs.authorization_id === authorizationId, "Activation authorization ID mismatch");
  return { payload, authorizationId, runId: ctx.runId, attempt: ctx.attempt };
}
export function assertActivationManifest(manifest, fresh) {
  if (fresh.decision === "AUTHORIZED_INITIAL_ACTIVATION") {
    demand(
      fresh.activation &&
        fresh.activation.authorizationId === hash(JSON.stringify(fresh.activation.payload)) &&
        manifest.plan?.decision === fresh.decision &&
        same(manifest.activation, fresh.activation) &&
        same(manifest.plan.activation, fresh.activation),
      "Phase 1 / Phase 2 activation scope changed",
    );
  } else
    demand(
      !manifest.activation &&
        !manifest.plan?.activation &&
        manifest.plan?.decision !== "AUTHORIZED_INITIAL_ACTIVATION",
      "Activation cannot fall back to normal publication",
    );
}
