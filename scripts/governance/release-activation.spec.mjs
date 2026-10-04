import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ACTIVATION_MERGE,
  HISTORY_REMEDIATION_BRANCH,
  HISTORY_REMEDIATION_FILES,
  INITIAL_BASE,
  INITIAL_DEPLOYMENT,
  INITIAL_COMMITS,
  REMEDIATION_BRANCH,
  REMEDIATION_FILES,
  activationPayload,
  authorizeActivation,
  activationMode,
  assertActivationManifest,
} from "./release-activation.mjs";
import { classifyPaths, hash, assertManifest, preparationEligible } from "./release-contract.mjs";
import { changedPaths, assertMergedCommit, policy } from "./release-plan.mjs";
const target = "e".repeat(40),
  digest = "a".repeat(64);
const historical = changedPaths(INITIAL_COMMITS[1], INITIAL_COMMITS[2]).paths.filter(
  (p) => classifyPaths([p]).decision === "REQUIRES_SEPARATE_AUTHORIZATION",
);
const files = (paths) => paths.map((path) => ({ path, before: digest, after: hash(path) }));
const lastPaths = [...REMEDIATION_FILES];
const snapshot = {
  repository: policy.repository,
  baseline: { sha: INITIAL_BASE, deploymentId: INITIAL_DEPLOYMENT, versionId: null },
  targetSha: target,
  currentMainSha: target,
  commits: INITIAL_COMMITS.map((sha, i) => ({
    sha,
    pr: 486 + i,
    paths: [],
    specialFiles: i === 2 ? files(historical) : [],
  })).concat([
    {
      sha: target,
      pr: 489,
      paths: lastPaths,
      specialFiles: files(
        lastPaths.filter(
          (p) =>
            p.startsWith("scripts/") ||
            p.startsWith(".github/") ||
            p.startsWith("docs/05-architecture/"),
        ),
      ),
    },
  ]),
  remediation: {
    number: 489,
    merge_commit_sha: target,
    head: { ref: REMEDIATION_BRANCH, repo: { full_name: policy.repository } },
    merged_by: { id: policy.reviewerId },
  },
};
const payload = activationPayload(snapshot, policy);
const inputs = {
  mode: "initial_activation",
  expected_base_sha: INITIAL_BASE,
  expected_target_sha: target,
  authorized_prs: "[486,487,488,489]",
  authorization_id: hash(JSON.stringify(payload)),
};
const ctx = {
  repository: policy.repository,
  ref: "refs/heads/main",
  sha: target,
  runId: "123",
  attempt: "1",
  event: "workflow_dispatch",
};
const run = {
  id: 123,
  run_attempt: 1,
  event: "workflow_dispatch",
  head_branch: "main",
  head_sha: target,
  path: policy.workflow,
  actor: { id: policy.reviewerId },
  triggering_actor: { id: policy.reviewerId },
};
const copy = () => structuredClone(snapshot);
const authorize = (s = snapshot, i = inputs, c = ctx, r = run) =>
  authorizeActivation(s, i, c, r, policy);

test("exact initial activation prepares a distinct privileged class, never reclassifies SPECIAL", () => {
  const activation = authorize();
  assert.equal(activation.authorizationId, inputs.authorization_id);
  assert.equal(activation.runId, "123");
  assert.equal(preparationEligible("AUTHORIZED_INITIAL_ACTIVATION"), true);
  assert.equal(
    classifyPaths(snapshot.commits[3].paths).decision,
    "REQUIRES_SEPARATE_AUTHORIZATION",
  );
  assert.equal(activationMode({ reason: "approve all SPECIAL" }), false);
  assert.equal(hash(JSON.stringify(activationPayload(copy(), policy))), inputs.authorization_id);
});
for (const [name, mutate] of [
  [
    "wrong baseline",
    (s) => {
      s.baseline.sha = "a".repeat(40);
    },
  ],
  [
    "wrong target",
    (s) => {
      s.targetSha = "a".repeat(40);
    },
  ],
  [
    "extra merged PR",
    (s) => {
      s.commits.push({ ...s.commits[3], pr: 490 });
    },
  ],
  [
    "missing PR",
    (s) => {
      s.commits.splice(1, 1);
    },
  ],
  [
    "changed canonical order",
    (s) => {
      [s.commits[0], s.commits[1]] = [s.commits[1], s.commits[0]];
    },
  ],
  [
    "direct/unattributed commit",
    (s) => {
      s.commits[3].pr = null;
    },
  ],
  [
    "unknown SPECIAL file",
    (s) => {
      s.commits[3].paths.push("supabase/migrations/unsafe.sql");
    },
  ],
  [
    "main advanced",
    (s) => {
      s.currentMainSha = "a".repeat(40);
    },
  ],
  [
    "different remediation branch",
    (s) => {
      s.remediation.head.ref = "future-privileged-change";
    },
  ],
  [
    "non-human remediation merge",
    (s) => {
      s.remediation.merged_by.id = 1;
    },
  ],
  [
    "historical SPECIAL scope changed",
    (s) => {
      s.commits[2].specialFiles.pop();
    },
  ],
  [
    "SPECIAL bytes changed despite same paths",
    (s) => {
      s.commits[3].specialFiles[0].after = "f".repeat(64);
    },
  ],
  [
    "already completed activation baseline",
    (s) => {
      s.baseline = { sha: target, deploymentId: 999, versionId: "real-published-version" };
    },
  ],
  [
    "rollback to same SHA with new deployment cannot replay",
    (s) => {
      s.baseline.deploymentId = 999;
    },
  ],
])
  test(`initial activation blocks ${name}`, () => {
    const s = copy();
    mutate(s);
    assert.throws(() => authorize(s));
  });
test("push automation and reruns cannot invoke activation", () => {
  assert.throws(() => authorize(snapshot, inputs, { ...ctx, event: "push" }));
  assert.throws(() => authorize(snapshot, inputs, { ...ctx, attempt: "2" }));
  assert.throws(() => authorize(snapshot, inputs, ctx, { ...run, run_attempt: 2 }));
  assert.throws(() => activationMode({ ...inputs, mode: "normal" }));
});
test("dispatch/hash are scope evidence, not sovereign approval or arbitrary actor authority", () => {
  for (const bad of [
    { ...run, actor: { id: 1 } },
    { ...run, triggering_actor: { id: 1 } },
    { ...run, head_sha: "a".repeat(40) },
    { ...run, id: 124 },
  ])
    assert.throws(() => authorize(snapshot, inputs, ctx, bad));
  for (const patch of [
    { authorization_id: "f".repeat(64) },
    { expected_base_sha: "a".repeat(40) },
    { expected_target_sha: "a".repeat(40) },
    { authorized_prs: "[486,487,488,490]" },
    { authorized_prs: "[486,488,487,489]" },
    { authorized_prs: "[486,487,488]" },
    { authorized_prs: "[486,487,488,489,490]" },
  ])
    assert.throws(() => authorize(snapshot, { ...inputs, ...patch }));
});
test("Phase 2 rejects different activation ID/scope/run/attempt and never falls back", () => {
  const activation = authorize(),
    fresh = { decision: "AUTHORIZED_INITIAL_ACTIVATION", activation },
    manifest = {
      schema: 1,
      repository: ctx.repository,
      sourceSha: target,
      runId: "123",
      attempt: "1",
      tarSha256: digest,
      configSha256: digest,
      activation,
      plan: { ...fresh },
    };
  assert.doesNotThrow(() => assertActivationManifest(manifest, fresh));
  assert.doesNotThrow(() => assertManifest(manifest, ctx, digest, digest));
  for (const key of ["authorizationId", "runId", "attempt"]) {
    const bad = structuredClone(manifest);
    bad.activation[key] = "changed";
    assert.throws(() => assertActivationManifest(bad, fresh));
  }
  const bad = structuredClone(manifest);
  bad.activation.payload.special[1].files[0].after = "f".repeat(64);
  assert.throws(() => assertActivationManifest(bad, fresh));
  assert.throws(() => assertActivationManifest(manifest, { decision: "DEPLOYABLE" }));
  assert.throws(() =>
    assertActivationManifest(
      { plan: { decision: "AUTHORIZED_INITIAL_ACTIVATION" } },
      { decision: "DEPLOYABLE" },
    ),
  );
  assert.throws(() => assertActivationManifest({ ...manifest, activation: null }, fresh));
  assert.throws(() => assertManifest({ ...manifest, runId: "124" }, ctx, digest, digest));
});
test("direct GitHub commit attribution and old SPECIAL fail-closed guard remain required", () => {
  assert.throws(() => assertMergedCommit([], target));
  const workflow = execFileSync(
    "git",
    ["show", `${INITIAL_COMMITS[2]}:.github/workflows/deploy-production.yml`],
    { encoding: "utf8" },
  );
  assert.match(workflow, /environment:\s*\n\s*name: production-worker/);
  assert.equal(preparationEligible("REQUIRES_SEPARATE_AUTHORIZATION"), false);
});

function activationProcess(historyRepair = false) {
  const root = process.cwd(),
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-activation-process-"));
  const cli = (name) => path.join(root, "scripts/governance", name);
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", root, dir], { stdio: "pipe" });
    git("checkout", "--quiet", historyRepair ? ACTIVATION_MERGE : INITIAL_COMMITS[2]);
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.test");
    for (const name of historyRepair
      ? HISTORY_REMEDIATION_FILES
      : [
          ".github/workflows/deploy-production.yml",
          ...REMEDIATION_FILES.filter(
            (p) =>
              p.startsWith("scripts/") &&
              !p.endsWith("release-publication.spec.mjs") &&
              !p.endsWith("release-contract.spec.mjs"),
          ),
        ])
      fs.copyFileSync(path.join(root, name), path.join(dir, name));
    git("add", ".");
    git("commit", "--quiet", "-m", "fixture remediation");
    const sha = git("rev-parse", "HEAD");
    fs.mkdirSync(path.join(dir, "bin"));
    fs.mkdirSync(path.join(dir, "artifacts"));
    const environment = {
      name: policy.environment,
      can_admins_bypass: false,
      protection_rules: [
        {
          type: "required_reviewers",
          reviewers: [{ type: "User", reviewer: { id: policy.reviewerId } }],
        },
      ],
    };
    const pr = (number, merge_commit_sha) => ({
      number,
      merge_commit_sha,
      merged_at: "2026-10-04",
      base: { ref: "main", repo: { full_name: policy.repository } },
    });
    const remediationPr = historyRepair ? 490 : 489;
    const responses = {
      [`environments/${policy.environment}`]: environment,
      "git/ref/heads/main": { object: { sha } },
      [`deployments?environment=${policy.environment}`]: [
        { id: INITIAL_DEPLOYMENT, sha: INITIAL_BASE },
      ],
      [`deployments/${INITIAL_DEPLOYMENT}/statuses`]: [
        {
          state: "success",
          log_url: `https://github.com/${policy.repository}/actions/runs/1/job/2`,
        },
      ],
      "actions/runs/1": {
        id: 1,
        path: policy.workflow,
        head_sha: INITIAL_BASE,
        head_branch: "main",
        conclusion: "success",
      },
      "actions/runs/123": { ...run, head_sha: sha },
      "actions/runs/123/approvals": [
        {
          state: "approved",
          user: { id: policy.reviewerId },
          environments: [{ name: policy.environment }],
        },
      ],
      "actions/artifacts/99": {
        name: "production-worker-artifact-123-1",
        expired: false,
        workflow_run: { id: 123, head_sha: sha },
      },
      [`pulls/${remediationPr}`]: {
        ...pr(remediationPr, sha),
        head: {
          ref: historyRepair ? HISTORY_REMEDIATION_BRANCH : REMEDIATION_BRANCH,
          repo: { full_name: policy.repository },
        },
        merged_by: { id: policy.reviewerId },
      },
    };
    INITIAL_COMMITS.forEach((commit, i) => {
      responses[`commits/${commit}/pulls`] = [pr(486 + i, commit)];
    });
    responses[`commits/${sha}/pulls`] = [pr(remediationPr, sha)];
    if (historyRepair) responses[`commits/${ACTIVATION_MERGE}/pulls`] = [pr(489, ACTIVATION_MERGE)];
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(
      path.join(dir, "bin/gh"),
      `#!${process.execPath}\nimport fs from 'node:fs';const data=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));const key=process.argv[3].replace(/^repos\\/[^/]+\\/[^/]+\\//,'').replace(/[?&]per_page=100&page=1$/,'');if(!(key in data))throw Error('Unexpected API: '+key);console.log(JSON.stringify(data[key]));`,
      { mode: 0o755 },
    );
    fs.writeFileSync(
      path.join(dir, "bin/npx"),
      `#!${process.execPath}\nimport fs from 'node:fs';fs.appendFileSync(process.env.FAKE_CALLS,process.argv.slice(2).join(' ')+'\\n');if(process.env.FAKE_ADVANCE_MAIN==='yes'){if(!process.argv.includes('upload'))throw Error('DEPLOY MUST NOT BE REACHED');fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH,JSON.stringify({type:'version-upload',version:1,worker_name:'yourmeal-instance-eatclean',version_id:'75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60'}));const data=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));data['git/ref/heads/main'].object.sha='edc14825d4a513880df9542b29f89e5a04f2234c';fs.writeFileSync(process.env.FAKE_RESPONSES,JSON.stringify(data));}else throw Error('OFFLINE UPLOAD SENTINEL: no Cloudflare call');`,
      { mode: 0o755 },
    );
    const env = {
      ...process.env,
      PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
      GH_TOKEN: "fixture",
      GITHUB_REPOSITORY: policy.repository,
      GITHUB_REF: "refs/heads/main",
      GITHUB_SHA: sha,
      GITHUB_RUN_ID: "123",
      GITHUB_RUN_ATTEMPT: "1",
      GITHUB_EVENT_NAME: "workflow_dispatch",
      GITHUB_OUTPUT: path.join(dir, "outputs"),
      GITHUB_STEP_SUMMARY: path.join(dir, "summary"),
      GITHUB_EVENT_PATH: path.join(dir, "event.json"),
      FAKE_RESPONSES: path.join(dir, "responses.json"),
      FAKE_CALLS: path.join(dir, "calls"),
      RUNNER_TEMP: dir,
      CLOUDFLARE_API_TOKEN: "offline-sentinel",
      CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
    };
    const execute = (script, args = [], patch = {}) =>
      spawnSync(process.execPath, [cli(script), ...args], {
        cwd: dir,
        env: { ...env, ...patch },
        encoding: "utf8",
      });
    const preview = execute("release-plan.mjs", ["--initial-activation-payload"]);
    assert.equal(preview.status, 0, preview.stderr);
    const certificate = JSON.parse(preview.stdout);
    const dispatch = {
      ...inputs,
      expected_target_sha: sha,
      authorized_prs: JSON.stringify(certificate.payload.prs),
      authorization_id: certificate.authorizationId,
    };
    fs.writeFileSync(path.join(dir, "event.json"), JSON.stringify({ inputs: dispatch }));
    const preparation = execute("release-plan.mjs");
    assert.equal(preparation.status, 0, preparation.stderr);
    assert.match(fs.readFileSync(path.join(dir, "outputs"), "utf8"), /eligible=true/);
    const plan = JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-plan.json")));
    assert.equal(plan.originalDecision, "REQUIRES_SEPARATE_AUTHORIZATION");
    assert.equal(plan.decision, "AUTHORIZED_INITIAL_ACTIVATION");
    fs.mkdirSync(path.join(dir, ".output/server"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".output/server/index.mjs"), "fixture-only");
    const packaged = execute("release-artifact.mjs", ["package"]);
    assert.equal(packaged.status, 0, packaged.stderr);
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-manifest.json")));
    assert.deepEqual(manifest.activation, plan.activation);
    Object.assign(env, {
      EXPECTED_DIGEST: manifest.tarSha256,
      EXPECTED_CONFIG_DIGEST: manifest.configSha256,
      EXPECTED_ARTIFACT_ID: "99",
    });
    fs.rmSync(path.join(dir, ".output"), { recursive: true });
    const verified = execute("release-artifact.mjs", ["verify"]);
    assert.equal(verified.status, 0, verified.stderr);
    const publish = (m = manifest, patch = {}) => {
      fs.writeFileSync(path.join(dir, "artifacts/release-manifest.json"), JSON.stringify(m));
      fs.writeFileSync(path.join(dir, "calls"), "");
      const result = execute("release-publish.mjs", [], patch);
      assert.equal(result.status, 1);
      return {
        calls: fs.readFileSync(path.join(dir, "calls"), "utf8"),
        report: JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-report.json"))),
      };
    };
    const valid = publish();
    assert.match(valid.calls, /versions upload --no-bundle/);
    assert.doesNotMatch(valid.calls, /versions deploy/);
    assert.deepEqual(valid.report.activation, plan.activation);
    const advanced = publish(manifest, { FAKE_ADVANCE_MAIN: "yes" });
    assert.equal(advanced.report.state, "VERSION_UPLOADED");
    assert.doesNotMatch(advanced.calls, /versions deploy/);
    assert.match(advanced.report.failure, /main advanced during upload/);
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    for (const change of ["id", "scope", "run"]) {
      const bad = structuredClone(manifest);
      if (change === "id") bad.activation.authorizationId = "f".repeat(64);
      if (change === "scope") bad.activation.payload.special[1].files[0].after = "f".repeat(64);
      if (change === "run") bad.runId = "124";
      const result = publish(bad);
      assert.equal(result.calls, "");
      assert.equal(result.report.mutationStarted, false);
    }
    for (const patch of [
      { GITHUB_RUN_ATTEMPT: "2" },
      { GITHUB_EVENT_NAME: "push" },
      { EXPECTED_DIGEST: "f".repeat(64) },
    ])
      assert.equal(publish(manifest, patch).calls, "");
    for (const change of ["stale", "replay", "ambiguous", "approval"]) {
      const changed = structuredClone(responses);
      if (change === "stale") changed["git/ref/heads/main"].object.sha = INITIAL_COMMITS[2];
      if (change === "replay") changed[`deployments?environment=${policy.environment}`][0].id = 999;
      if (change === "ambiguous") changed[`commits/${sha}/pulls`].push(pr(490, sha));
      if (change === "approval") changed["actions/runs/123/approvals"] = [];
      fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(changed));
      assert.equal(publish().calls, "");
    }
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(
      path.join(dir, "event.json"),
      JSON.stringify({ inputs: { mode: "normal", reason: "please allow SPECIAL" } }),
    );
    const normal = execute("release-plan.mjs", [], { GITHUB_EVENT_NAME: "push" });
    assert.equal(normal.status, 1);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-plan.json"))).decision,
      "REQUIRES_SEPARATE_AUTHORIZATION",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
test("actual Phase 1/manifest/Phase 2 processes bind the same Git scope and cannot publish mismatches", () =>
  activationProcess());
test("bounded fifth-commit repair preserves actual history, canonical payload and publication guards", () =>
  activationProcess(true));

// This extension admits one bounded history repair, never an arbitrary fifth SPECIAL.
test("history repair requires pinned #489 and the exact canonical scope", () => {
  const repaired = structuredClone(snapshot);
  repaired.commits[3].sha = ACTIVATION_MERGE;
  repaired.commits.push({
    sha: target,
    pr: 490,
    paths: HISTORY_REMEDIATION_FILES,
    specialFiles: files(
      HISTORY_REMEDIATION_FILES.filter((p) => !p.startsWith("docs/99-internal/")),
    ),
  });
  repaired.remediation.number = 490;
  repaired.remediation.head.ref = HISTORY_REMEDIATION_BRANCH;
  const canonical = activationPayload(repaired, policy);
  assert.deepEqual(canonical.prs, [486, 487, 488, 489, 490]);
  assert.equal(canonical.special.length, 3);
  assert.notEqual(hash(JSON.stringify(canonical)), inputs.authorization_id);
  assert.throws(() => authorizeActivation(repaired, inputs, ctx, run, policy));
  const repairedInputs = {
    ...inputs,
    authorized_prs: JSON.stringify(canonical.prs),
    authorization_id: hash(JSON.stringify(canonical)),
  };
  assert.equal(
    authorizeActivation(repaired, repairedInputs, ctx, run, policy).authorizationId,
    repairedInputs.authorization_id,
  );
  for (const mutate of [
    (s) => {
      s.commits[3].sha = "f".repeat(40);
    },
    (s) => {
      s.commits[3].pr = 500;
    },
    (s) => {
      s.commits[4].paths = [...s.commits[4].paths, "scripts/governance/release-policy.json"].sort();
    },
    (s) => {
      s.commits[4].paths = s.commits[4].paths.slice(1);
    },
    (s) => {
      s.commits[4].specialFiles.pop();
    },
    (s) => {
      s.remediation.head.ref = "other";
    },
    (s) => {
      s.remediation.merged_by.id = 1;
    },
    (s) => {
      s.commits.push(s.commits[4]);
    },
  ]) {
    const bad = structuredClone(repaired);
    mutate(bad);
    assert.throws(() => activationPayload(bad, policy));
  }
});
test("every Gate 7 checkout provides real history without persisted credentials", () => {
  const workflow = fs.readFileSync(".github/workflows/deploy-production.yml", "utf8");
  const checkouts = [
    ...workflow.matchAll(/uses: actions\/checkout@v4\n\s+with:\n([\s\S]*?)(?=\n      -)/g),
  ];
  assert.equal(checkouts.length, 3);
  for (const [, settings] of checkouts) {
    assert.match(settings, /fetch-depth: 0/);
    assert.match(settings, /persist-credentials: false/);
    assert.match(settings, /ref: \$\{\{ github.sha \}\}/);
  }
});
