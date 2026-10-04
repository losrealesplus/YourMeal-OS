import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import yaml from "js-yaml";
import {
  classifyPaths,
  assertContext,
  assertEnvironment,
  assertApproval,
  assertConfig,
  uploadRecord,
  deployRecord,
  assertTraffic,
  assertManifest,
} from "./release-contract.mjs";
import { changedPaths, assertMergedCommit, baselineFromReport, policy } from "./release-plan.mjs";
const sha = "a".repeat(40),
  digest = "b".repeat(64),
  configHash = "c".repeat(64);
const version = "75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60";
const deploymentId = "11111111-1111-4111-8111-111111111111";
const ctx = {
  repository: policy.repository,
  ref: "refs/heads/main",
  sha,
  runId: "123",
  attempt: "1",
  event: "push",
};
const env = {
  name: policy.environment,
  can_admins_bypass: false,
  protection_rules: [
    {
      type: "required_reviewers",
      reviewers: [{ type: "User", reviewer: { id: policy.reviewerId } }],
    },
  ],
};
const approval = {
  state: "approved",
  user: { id: policy.reviewerId },
  environments: [{ name: policy.environment }],
};
const upload = {
  type: "version-upload",
  version: 1,
  worker_name: policy.worker,
  version_id: version,
};
const deployed = {
  type: "version-deploy",
  version: 1,
  worker_name: policy.worker,
  deployment_id: deploymentId,
  version_traffic: {},
};
const traffic = { id: deploymentId, versions: [{ version_id: version, percentage: 100 }] };
const manifest = {
  schema: 1,
  repository: ctx.repository,
  sourceSha: sha,
  runId: ctx.runId,
  attempt: "1",
  tarSha256: digest,
  configSha256: configHash,
};

test("deterministic classification: runtime, docs/tests and sensitive precedence", () => {
  assert.equal(
    classifyPaths([
      "src/routes/_authenticated/admin.orders.tsx",
      "docs/05-architecture/CR_OPS_09_B1_SCOPE_AND_REVIEW.md",
      "docs/05-architecture/evidence/CR_OPS_09_B1_390.jpg",
    ]).decision,
    "DEPLOYABLE",
  );
  assert.equal(
    classifyPaths(["src/routes/page.tsx", "docs/evidence/image.jpg"]).decision,
    "DEPLOYABLE",
  );
  assert.equal(
    classifyPaths(["docs/99-internal/journal.md", "src/components/card.spec.tsx"]).decision,
    "NON_DEPLOYABLE",
  );
  for (const special of [
    "supabase/migrations/1.sql",
    ".github/workflows/deploy-production.yml",
    "AGENTS.md",
    "FOUNDATION.md",
    "scripts/governance/release-policy.json",
    "src/auth/oauth.ts",
    "src/routes/_authenticated.tsx",
    "src/routes/auth.callback.tsx",
    "docs/05-architecture/CR_GOV_02_SCOPE_AND_REVIEW.md",
    "instances/eatclean/config.json",
    "package.json",
    "unknown-tool.mjs",
    "../src/app.ts",
    "docs/adr/new.md",
  ])
    assert.equal(
      classifyPaths(["src/routes/page.tsx", special]).decision,
      "REQUIRES_SEPARATE_AUTHORIZATION",
      special,
    );
  assert.equal(
    classifyPaths(Array.from({ length: 501 }, (_, i) => `src/ui/${i}.tsx`)).decision,
    "DEPLOYABLE",
  );
});
test("only exact canonical main first attempts are accepted", () => {
  assert.doesNotThrow(() => assertContext(ctx, policy));
  for (const change of [
    { ref: "refs/heads/branch" },
    { attempt: "2" },
    { sha: "latest" },
    { repository: "another/repo" },
    { event: "pull_request_target" },
    { runId: "../other" },
  ])
    assert.throws(() => assertContext({ ...ctx, ...change }, policy));
});
test("CI, merge or synthetic agent is never production approval", () => {
  assert.doesNotThrow(() => assertEnvironment(env, policy));
  assert.doesNotThrow(() => assertApproval([approval], policy));
  assert.throws(() => assertEnvironment({ ...env, can_admins_bypass: true }, policy));
  assert.throws(() => assertEnvironment({ ...env, protection_rules: [] }, policy));
  assert.throws(() => assertApproval([], policy));
  assert.throws(() => assertApproval([{ ...approval, user: { id: 1 } }], policy));
  assert.throws(() => assertApproval([{ ...approval, state: "rejected" }], policy));
  assert.throws(() => assertApproval([approval, approval], policy));
});
test("unattributed or ambiguous merged commits cannot prepare", () => {
  const pr = {
    number: 1,
    merged_at: "2026-10-04",
    merge_commit_sha: sha,
    base: { ref: "main", repo: { full_name: policy.repository } },
  };
  assert.equal(assertMergedCommit([pr], sha), 1);
  for (const candidates of [
    [],
    [pr, pr],
    [{ ...pr, merged_at: null }],
    [{ ...pr, merge_commit_sha: "b".repeat(40) }],
  ])
    assert.throws(() => assertMergedCommit(candidates, sha));
});
test("settings patching / inheritance cannot enter versions publication", () => {
  const config = JSON.parse(fs.readFileSync("instances/yourmeal-eatclean/wrangler.prod.json"));
  assert.doesNotThrow(() => assertConfig(config, policy));
  for (const key of [
    "logpush",
    "observability",
    "tail_consumers",
    "streaming_tail_consumers",
    "env",
    "build",
    "site",
  ])
    assert.throws(() => assertConfig({ ...config, [key]: {} }, policy));
});
test("version ID comes from exactly one valid upload NDJSON record", () => {
  assert.equal(uploadRecord(JSON.stringify(upload), policy.worker).version_id, version);
  for (const value of [
    "",
    "human log version latest",
    "{}",
    JSON.stringify(upload) + "\n" + JSON.stringify(upload),
    JSON.stringify({ ...upload, worker_name: "other" }),
    JSON.stringify({ ...upload, version_id: "invalid" }),
    JSON.stringify({ ...upload, version: 2 }),
  ])
    assert.throws(() => uploadRecord(value, policy.worker));
});
test("Wrangler Map serialization is not evidence of deployed traffic", () => {
  assert.equal(deployRecord(JSON.stringify(deployed), policy.worker).deployment_id, deploymentId);
  assert.doesNotThrow(() => assertTraffic(traffic, deploymentId, version));
  for (const bad of [
    { id: deploymentId, versions: [] },
    { ...traffic, id: version },
    { ...traffic, versions: [{ version_id: deploymentId, percentage: 100 }] },
    { ...traffic, versions: [{ version_id: version, percentage: 50 }] },
    { ...traffic, versions: [...traffic.versions, ...traffic.versions] },
  ])
    assert.throws(() => assertTraffic(bad, deploymentId, version));
  assert.throws(() =>
    deployRecord(JSON.stringify(deployed) + "\n" + JSON.stringify(deployed), policy.worker),
  );
});
test("immutable source/run/attempt/config/digest are all required", () => {
  assert.doesNotThrow(() => assertManifest(manifest, ctx, digest, configHash));
  for (const bad of [
    { sourceSha: "d".repeat(40) },
    { runId: "124" },
    { attempt: "2" },
    { tarSha256: configHash },
    { configSha256: digest },
  ])
    assert.throws(() => assertManifest({ ...manifest, ...bad }, ctx, digest, configHash));
});
test("range includes special commits even if later reverted, and both rename paths", () => {
  const cwd = process.cwd(),
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-git-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.test");
    fs.writeFileSync(path.join(dir, "README.md"), "fixture");
    git("add", "README.md");
    git("commit", "--quiet", "-m", "base");
    const base = git("rev-parse", "HEAD");
    fs.mkdirSync(path.join(dir, "migrations"));
    fs.writeFileSync(path.join(dir, "migrations/unsafe.sql"), "fixture only");
    git("add", ".");
    git("commit", "--quiet", "-m", "special");
    fs.rmSync(path.join(dir, "migrations/unsafe.sql"));
    git("add", "-u");
    git("commit", "--quiet", "-m", "revert special");
    fs.mkdirSync(path.join(dir, "src"));
    fs.writeFileSync(path.join(dir, "src/app.ts"), "fixture");
    git("add", ".");
    git("commit", "--quiet", "-m", "runtime");
    git("mv", "src/app.ts", "src/renamed.ts");
    git("commit", "--quiet", "-m", "rename");
    const target = git("rev-parse", "HEAD");
    process.chdir(dir);
    const delta = changedPaths(base, target);
    assert.ok(delta.paths.includes("migrations/unsafe.sql"));
    assert.ok(delta.paths.includes("src/app.ts") && delta.paths.includes("src/renamed.ts"));
    assert.equal(classifyPaths(delta.paths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");
    assert.throws(() => changedPaths(target, base));
  } finally {
    process.chdir(cwd);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("tar extraction rejects traversal, links, duplicates and missing entrypoint", () => {
  const validator = path.resolve("scripts/governance/verify-release-tar.py");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-tar-"));
  try {
    const make = (kind) =>
      execFileSync("python3", [
        "-c",
        `import tarfile,io,sys\nwith tarfile.open(sys.argv[1],'w:gz') as t:\n m=tarfile.TarInfo('.output/server/missing.mjs' if sys.argv[2]=='missing' else '.output/server/index.mjs');m.size=1;t.addfile(m,io.BytesIO(b'x'))\n if sys.argv[2] not in ['valid','missing']:\n  n=tarfile.TarInfo({'traversal':'.output/../../evil','duplicate':'.output/server/index.mjs','link':'.output/link'}[sys.argv[2]])\n  if sys.argv[2]=='link':n.type=tarfile.SYMTYPE;n.linkname='/tmp/escape'\n  t.addfile(n)`,
        path.join(dir, "bundle.tar.gz"),
        kind,
      ]);
    make("valid");
    execFileSync("python3", [validator, path.join(dir, "bundle.tar.gz"), dir]);
    for (const kind of ["traversal", "duplicate", "link", "missing"]) {
      make(kind);
      assert.throws(() =>
        execFileSync("python3", [validator, path.join(dir, "bundle.tar.gz"), dir], {
          stdio: "pipe",
        }),
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
test("workflow preserves human boundary, exact artifact and non-cancellable approved queue", () => {
  const w = yaml.load(fs.readFileSync(".github/workflows/deploy-production.yml", "utf8"));
  assert.deepEqual(w.on.push.branches, ["main"]);
  assert.ok(w.on.workflow_dispatch);
  assert.equal(w.jobs.deploy.environment.name, policy.environment);
  assert.equal(w.jobs.deploy.concurrency["cancel-in-progress"], false);
  assert.equal(w.jobs.deploy.concurrency.queue, "max");
  assert.equal(w.jobs.build.concurrency["cancel-in-progress"], true);
  assert.ok(Object.values(w.permissions).every((p) => p === "read"));
  assert.equal(
    w.jobs.deploy.steps.find((s) => s.uses?.startsWith("actions/download-artifact")).with[
      "artifact-ids"
    ],
    "${{ needs.build.outputs.artifact_id }}",
  );
  for (const [name, job] of Object.entries(w.jobs)) {
    for (const step of job.steps) {
      if (JSON.stringify(step).includes("secrets.")) assert.equal(name, "deploy");
      if (name === "deploy")
        assert.doesNotMatch(step.run ?? "", /npm ci|npm run build|wrangler deploy|triggers deploy/);
      if (step.uses?.startsWith("actions/checkout"))
        assert.equal(step.with.ref, "${{ github.sha }}");
    }
  }
});

test("only a consistent publication ledger can advance the baseline, even after smoke failure", () => {
  const run = { id: 123, head_sha: sha };
  const report = {
    schema: 1,
    repository: policy.repository,
    sourceSha: sha,
    runId: "123",
    attempt: "1",
    mutationStarted: true,
    state: "DEPLOYED",
    versionId: version,
    deploymentId,
    tarSha256: digest,
    configSha256: configHash,
    artifactId: "99",
    smoke: "FAIL",
  };
  assert.deepEqual(baselineFromReport(report, run, 9), {
    sha,
    versionId: version,
    deploymentId: 9,
  });
  assert.equal(
    baselineFromReport(
      {
        schema: 1,
        repository: policy.repository,
        sourceSha: sha,
        runId: "123",
        attempt: "1",
        mutationStarted: false,
        state: "SUPERSEDED",
      },
      run,
      9,
    ),
    null,
  );
  for (const patch of [
    { state: "VERSION_UPLOADED" },
    { state: "DEPLOYMENT_UNKNOWN" },
    { mutationStarted: false },
    { sourceSha: "d".repeat(40) },
    { attempt: "2" },
    { runId: "124" },
    { tarSha256: "invalid" },
    { artifactId: "latest" },
    { versionId: null },
    { configSha256: "invalid" },
  ])
    assert.throws(() => baselineFromReport({ ...report, ...patch }, run, 9));
});
