import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  ROLLBACK_V1 as r,
  rollbackV1Payload,
  rollbackV1ScopeId,
  authorizeRollbackV1,
  assertRollbackV1Manifest,
  verifyRollbackInstallation,
  rollbackBuildEnabled,
} from "./release-rollback-v1.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { classifyPaths, hash, assertEnvironment, assertApproval } from "./release-contract.mjs";
import { assertReconciliationManifest } from "./release-reconciliation.mjs";
const policy = {
  repository: r.repository,
  environment: r.environment,
  reviewerId: r.reviewerId,
  reviewerLogin: r.reviewerLogin,
  workflow: ".github/workflows/deploy-production.yml",
};
const final = "1".repeat(40),
  head = "2".repeat(40),
  gov = 552;
const pr = (c) => ({
  number: c.pr,
  merged_at: "2026-10-24T00:00:00Z",
  merge_commit_sha: c.sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: c.headSha, ref: r.governanceBranch, repo: { full_name: r.repository } },
});
function snapshot() {
  const commits = [
    ...structuredClone(r.productCommits),
    {
      sha: final,
      parent: r.candidateSha,
      headSha: head,
      pr: gov,
      files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
    },
  ];
  const i = r.installation;
  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPrs: commits.slice(0, 4).map(pr),
    remediation: pr(commits[4]),
    diff: {
      commits: commits.map((c) => c.sha),
      paths: [...new Set(commits.flatMap((c) => c.files.map((f) => f.path)))].sort(),
    },
    installation: {
      run: {
        id: i.runId,
        run_attempt: 1,
        event: "workflow_dispatch",
        head_sha: i.sourceSha,
        head_branch: "main",
        path: ".github/workflows/migrate-production.yml",
        conclusion: "success",
        actor: { id: r.reviewerId },
        triggering_actor: { id: r.reviewerId },
      },
      artifact: {
        id: i.artifactId,
        name: i.artifactName,
        digest: i.artifactDigest,
        expired: false,
      },
      report: structuredClone(i.report),
      reportSha256: i.reportSha256,
      reviews: [
        {
          state: "approved",
          user: { id: r.reviewerId },
          environments: [{ name: "production-db" }],
        },
      ],
    },
  };
}
function valid() {
  const s = snapshot(),
    payload = rollbackV1Payload(s, policy);
  const inputs = {
    mode: "exact_interval",
    expected_base_sha: r.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([548, 550, 549, 551, gov]),
    authorization_id: rollbackV1ScopeId(payload),
    exact_interval_scope: JSON.stringify(canonical(payload)),
  };
  const ctx = {
    repository: r.repository,
    ref: "refs/heads/main",
    sha: final,
    runId: "1",
    attempt: "1",
    event: "workflow_dispatch",
  };
  const run = {
    id: 1,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: final,
    path: policy.workflow,
    actor: { id: r.reviewerId },
    triggering_actor: { id: r.reviewerId },
  };
  return { s, payload, inputs, ctx, run };
}
test("sealed four merges and installed receipt permit only an exact new human dispatch", () => {
  const v = valid();
  assert.equal(verifyRollbackInstallation(v.s.installation).runId, 40089701179);
  const auth = authorizeRollbackV1(v.s, v.inputs, v.ctx, v.run, policy);
  assert.equal(auth.payload.reconciliationType, "ROLLBACK_V1_ACTIVATION_PREPARATION");
  assert.equal(auth.payload.constraints.rollbackFlagActivationAuthorized, true);
  const fresh = {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: final,
    reconciliation: auth,
  };
  const manifest = { sourceSha: final, reconciliation: auth, plan: { ...fresh } };
  assertRollbackV1Manifest(manifest, fresh);
  assertReconciliationManifest(manifest, fresh);
  const tampered = structuredClone(manifest);
  tampered.plan.reconciliation.payload.installation.report.operation = "preflight";
  assert.throws(() => assertRollbackV1Manifest(tampered, fresh));
});
const mutations = {
  baseline: (s) => s.baseline.deploymentId++,
  "stale main": (s) => (s.currentMainSha = "3".repeat(40)),
  "product bytes": (s) => (s.commits[0].files[0].after = "b".repeat(64)),
  "product parent": (s) => (s.commits[1].parent = "3".repeat(40)),
  "product head": (s) => (s.productPrs[2].head.sha = "3".repeat(40)),
  "merge actor": (s) => (s.productPrs[0].merged_by.id = 7),
  "foreign PR": (s) => (s.productPrs[0].head.repo.full_name = "fork/YourMeal-OS"),
  "extra commit": (s) => s.commits.push(s.commits[4]),
  "additional diff path": (s) => s.diff.paths.push("src/unauthorized.ts"),
  "additional governance path": (s) =>
    s.commits[4].files.push({ path: "src/unauthorized.ts", before: null, after: "b".repeat(64) }),
  "governance branch": (s) => (s.remediation.head.ref = "codex/other"),
  "governance lineage": (s) => (s.commits[4].parent = "3".repeat(40)),
  "receipt altered": (s) => (s.installation.report.state = "READ_ONLY_PREFLIGHT_PASS"),
  "receipt digest": (s) => (s.installation.reportSha256 = "b".repeat(64)),
  "wrong project": (s) => (s.installation.report.project = "djangucecsphnejplvic"),
  "artifact expired": (s) => (s.installation.artifact.expired = true),
  "artifact digest": (s) => (s.installation.artifact.digest = "sha256:" + "b".repeat(64)),
  "installation rerun": (s) => (s.installation.run.run_attempt = 2),
  "installation failure": (s) => (s.installation.run.conclusion = "failure"),
  "missing SQL approval": (s) => (s.installation.reviews = []),
  "wrong SQL reviewer": (s) => (s.installation.reviews[0].user.id = 7),
};
for (const [name, mutate] of Object.entries(mutations))
  test(`fail closed: ${name}`, () => {
    const s = snapshot();
    mutate(s);
    assert.throws(() => rollbackV1Payload(s, policy));
  });
test("push, normal mode, historical scope, rerun, wrong dispatch actor and expanded authorization are rejected", () => {
  for (const change of [
    (v) => (v.ctx.event = "push"),
    (v) => (v.inputs.mode = "normal"),
    (v) => (v.ctx.attempt = "2"),
    (v) => (v.run.actor.id = 7),
    (v) => (v.run.triggering_actor.id = 7),
    (v) => (v.run.run_attempt = 2),
    (v) => (v.inputs.authorization_id = "0".repeat(64)),
    (v) => (v.inputs.expected_base_sha = "0".repeat(40)),
    (v) => (v.inputs.authorized_prs = "[506,507,508,509,510,511,512,513]"),
    (v) => (v.inputs.exact_interval_scope = "{}"),
  ]) {
    const v = valid();
    change(v);
    assert.throws(() => authorizeRollbackV1(v.s, v.inputs, v.ctx, v.run, policy));
  }
});
test("SPECIAL and worker approval boundary remain unchanged", () => {
  const paths = r.productCommits.flatMap((c) => c.files.map((f) => f.path));
  assert.equal(classifyPaths(paths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");
  assert.throws(() => assertApproval([], policy));
  assert.throws(() =>
    assertEnvironment({ name: policy.environment, can_admins_bypass: true }, policy),
  );
  const y = fs.readFileSync(".github/workflows/deploy-production.yml", "utf8");
  assert.ok(y.includes("name: production-worker"));
  assert.ok(y.includes("needs.classify.outputs.eligible == 'true'"));
  assert.ok(
    y.includes(
      "github.event_name == 'workflow_dispatch' && needs.classify.outputs.rollback_enabled == 'true' && 'true' || 'false'",
    ),
  );
});
test("sealed hashes and first-parent sequence match real reviewed Git content", () => {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  assert.deepEqual(
    git("rev-list", "--first-parent", "--reverse", `${r.baseline.sha}..${r.candidateSha}`).split(
      "\n",
    ),
    r.productCommits.map((c) => c.sha),
  );
  for (const c of r.productCommits) {
    assert.equal(git("rev-parse", `${c.sha}^1`), c.parent);
    assert.equal(git("rev-parse", `${c.sha}^2`), c.headSha);
    assert.deepEqual(
      git("diff", "--name-only", "--no-renames", c.parent, c.sha).split("\n").sort(),
      c.files.map((f) => f.path),
    );
    for (const f of c.files)
      for (const [rev, want] of [
        [c.parent, f.before],
        [c.sha, f.after],
      ]) {
        const exists = git("ls-tree", rev, "--", f.path);
        assert.equal(exists ? hash(execFileSync("git", ["show", `${rev}:${f.path}`])) : null, want);
      }
  }
});

function enabledPlan(v) {
  return {
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    repository: r.repository,
    sourceSha: final,
    runId: "1",
    attempt: "1",
    reconciliation: authorizeRollbackV1(v.s, v.inputs, v.ctx, v.run, policy),
  };
}
test("build output is true only for the new exact authorized manual plan; defaults false", () => {
  const v = valid(),
    plan = enabledPlan(v);
  assert.equal(rollbackBuildEnabled(plan, v.ctx), true);
  for (const p of [
    {},
    { decision: "DEPLOYABLE" },
    { decision: "REQUIRES_SEPARATE_AUTHORIZATION" },
    { reconciliation: { payload: { reconciliationType: "ROLLBACK_V1_PREPARATION" } } },
  ])
    assert.equal(rollbackBuildEnabled(p, v.ctx), false);
  for (const change of [
    (p) => (p.decision = "DEPLOYABLE"),
    (p) => (p.repository = "fork/YourMeal-OS"),
    (p) => (p.reconciliation.reconciled = false),
    (p) => (p.sourceSha = "0".repeat(40)),
    (p) => (p.reconciliation.payload.constraints.rollbackFlagActivationAuthorized = false),
    (p) => (p.reconciliation.reconciliationId = "0".repeat(64)),
  ]) {
    const p = structuredClone(plan);
    change(p);
    assert.throws(() => rollbackBuildEnabled(p, v.ctx));
  }
  assert.throws(() => rollbackBuildEnabled(plan, { ...v.ctx, event: "push" }));
  assert.throws(() => rollbackBuildEnabled(plan, { ...v.ctx, attempt: "2" }));
});
test("previous scope and authorization ID never authorize activation", () => {
  const v = valid();
  const previous = "b29b13a694b9ad84478fe2686ad46081acefb23b5b2868c2b4ffcb1af41d738d";
  assert.notEqual(v.inputs.authorization_id, previous);
  assert.throws(() =>
    authorizeRollbackV1(v.s, { ...v.inputs, authorization_id: previous }, v.ctx, v.run, policy),
  );
  assert.throws(() =>
    authorizeRollbackV1(
      v.s,
      { ...v.inputs, authorized_prs: "[548,550,549,551]" },
      v.ctx,
      v.run,
      policy,
    ),
  );
  const old = JSON.parse(v.inputs.exact_interval_scope);
  old.constraints.rollbackFlagActivationAuthorized = false;
  assert.throws(() =>
    authorizeRollbackV1(
      v.s,
      { ...v.inputs, exact_interval_scope: JSON.stringify(canonical(old)) },
      v.ctx,
      v.run,
      policy,
    ),
  );
});
test("workflow preserves fail-closed build flag and unchanged application source", () => {
  const y = fs.readFileSync(".github/workflows/deploy-production.yml", "utf8");
  assert.ok(y.includes("rollback_enabled: ${{ steps.plan.outputs.rollback_enabled }}"));
  assert.ok(
    y.includes(
      "VITE_OPERATIONAL_ROLLBACK_ENABLED: ${{ github.event_name == 'workflow_dispatch' && needs.classify.outputs.rollback_enabled == 'true' && 'true' || 'false' }}",
    ),
  );
  assert.equal(
    execFileSync("git", ["diff", "--name-only", r.candidateSha, "fcc7801548fe60c3994f08fa18dc5f11431c6138", "--", "src"], {
      encoding: "utf8",
    }).trim(),
    "",
  );
});
test("authorized/unauthorized calculated flag embeds into browser and SSR despite opposite runtime", async () => {
  const { build } = await import("vite");
  const os = await import("node:os"),
    path = await import("node:path");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rollback-activation-build-"));
  const prior = process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED,
    nodeEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    for (const authorized of [false, true])
      for (const ssr of [false, true]) {
        const v = valid(),
          enabled = rollbackBuildEnabled(authorized ? enabledPlan(v) : {}, v.ctx);
        process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = String(enabled);
        const entry = path.resolve("src/modules/operations/domain/operational-status.ts");
        const result = await build({
          configFile: false,
          root,
          envDir: false,
          logLevel: "silent",
          define: { "process.env.NODE_ENV": JSON.stringify("production") },
          build: {
            write: false,
            minify: false,
            ...(ssr ? { ssr: entry } : { lib: { entry, formats: ["es"] } }),
          },
        });
        const out = (Array.isArray(result) ? result[0] : result).output;
        const code = out.find((x) => x.type === "chunk").code;
        process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = String(!enabled);
        const mod = await import(
          "data:text/javascript;base64," + Buffer.from(code).toString("base64")
        );
        assert.equal(
          mod.isOperationalRollbackEnabled(),
          enabled,
          `authorized=${authorized},ssr=${ssr}`,
        );
      }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    if (prior === undefined) delete process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED;
    else process.env.VITE_OPERATIONAL_ROLLBACK_ENABLED = prior;
    if (nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = nodeEnv;
  }
});
