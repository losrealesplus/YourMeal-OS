import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import {
  EATCLEAN_1A_563 as r,
  eatclean1A563Payload,
  eatclean1A563ScopeId,
  authorizeEatClean1A563,
  assertEatClean1A563Manifest,
} from "./release-eatclean-1a-flow04-563.mjs";
import { canonical } from "./release-exact-interval.mjs";
import { classifyPaths, hash } from "./release-contract.mjs";
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
  candSha = "3".repeat(40),
  gov = 564;

const sealedRelease = Object.freeze({
  ...r,
  candidateSha: candSha,
});

const humanPr = (number, sha, headSha, ref) => ({
  number,
  merged_at: "2026-10-28T18:00:00Z",
  merge_commit_sha: sha,
  merged_by: { id: r.reviewerId, login: r.reviewerLogin },
  base: { ref: "main", repo: { full_name: r.repository } },
  head: { sha: headSha, ref, repo: { full_name: r.repository } },
});

function snapshot() {
  const commits = [
    ...structuredClone(r.productCommits),
    {
      sha: candSha,
      parent: r.candidatePr.baseSha,
      pr: r.candidatePr.number,
      files: structuredClone(r.candidatePr.files),
    },
    {
      sha: final,
      parent: candSha,
      pr: gov,
      headSha: head,
      files: r.governancePaths.map((path) => ({ path, before: null, after: "a".repeat(64) })),
    },
  ];

  const productPaths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.candidatePr.files.map((f) => f.path),
    ]),
  ].sort();

  return {
    repository: r.repository,
    baseline: structuredClone(r.baseline),
    targetSha: final,
    currentMainSha: final,
    commits,
    productPrs: r.productCommits.map((c) =>
      humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`),
    ),
    candidatePr: humanPr(
      r.candidatePr.number,
      candSha,
      r.candidatePr.headSha,
      "feat/eatclean-1a-kitchen-flow04-ui",
    ),
    remediation: humanPr(gov, final, head, r.governanceBranch),
    diff: {
      commits: commits.map((c) => c.sha),
      paths: [...new Set([...productPaths, ...r.governancePaths])].sort(),
    },
  };
}

function run(id = 1) {
  return {
    id,
    run_attempt: 1,
    event: "workflow_dispatch",
    head_branch: "main",
    head_sha: final,
    path: policy.workflow,
    actor: { id: r.reviewerId, login: r.reviewerLogin },
    triggering_actor: { id: r.reviewerId, login: r.reviewerLogin },
  };
}

function valid(releaseConfig = sealedRelease) {
  const s = snapshot();
  const payload = eatclean1A563Payload(s, policy, releaseConfig);
  const authorization_id = eatclean1A563ScopeId(payload);
  const inputs = {
    mode: "exact_interval",
    expected_base_sha: releaseConfig.baseline.sha,
    expected_target_sha: final,
    authorized_prs: JSON.stringify([...releaseConfig.productPrs, gov]),
    authorization_id,
    exact_interval_scope: JSON.stringify(canonical(payload)),
    reason: "Controlled EatClean 1A FLOW-04 #563 publication",
  };
  const ctx = {
    repository: policy.repository,
    ref: "refs/heads/main",
    sha: final,
    runId: "1",
    attempt: "1",
    event: "workflow_dispatch",
  };
  const fresh = {
    schema: 1,
    decision: "AUTHORIZED_RECONCILED_RELEASE",
    sourceSha: final,
    runId: "1",
    attempt: "1",
    reconciliation: {
      reconciled: true,
      reconciliationId: hash(JSON.stringify(payload)),
      payload,
    },
  };
  const manifest = {
    schema: 1,
    sourceSha: final,
    runId: "1",
    attempt: "1",
    repository: policy.repository,
    tarSha256: "b".repeat(64),
    configSha256: "c".repeat(64),
    reconciliation: fresh.reconciliation,
    plan: {
      decision: "AUTHORIZED_RECONCILED_RELEASE",
      sourceSha: final,
      reconciliation: fresh.reconciliation,
    },
  };
  return { s, payload, authorization_id, inputs, ctx, fresh, manifest };
}

test("EatClean 1A FLOW-04 sealed interval PASS and immutable record", () => {
  const v = valid(sealedRelease);
  assert.equal(r.productCommits.length, 10);
  assert.equal(r.candidatePr.files.length, 9);
  assert.equal(r.governancePaths.length, 8);

  const productPaths = [
    ...new Set([
      ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
      ...r.candidatePr.files.map((f) => f.path),
    ]),
  ];
  assert.equal(productPaths.length, 55);
  assert.equal(classifyPaths(productPaths).decision, "REQUIRES_SEPARATE_AUTHORIZATION");

  const payload = eatclean1A563Payload(v.s, policy, sealedRelease);
  assert.equal(payload.candidateSha, candSha);
  assert.equal(payload.candidatePr, 563);
  assert.equal(payload.governancePr, gov);

  const auth = authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease);
  assert.equal(auth.reconciled, true);
  assert.equal(auth.reconciliationId, hash(JSON.stringify(payload)));

  assertEatClean1A563Manifest(v.manifest, v.fresh, sealedRelease);
});

test("sealed hashes and first-parent sequence match real reviewed Git content", () => {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  assert.deepEqual(
    git("rev-list", "--first-parent", "--reverse", `${r.baseline.sha}..ffff9d14019e4e71f76de126a5fccfa78b43aff7`).split("\n"),
    r.productCommits.map((c) => c.sha),
  );

  for (const c of r.productCommits) {
    assert.equal(git("rev-parse", `${c.sha}^1`), c.parent);
    assert.deepEqual(
      git("diff", "--name-only", "--no-renames", c.parent, c.sha).split("\n").sort(),
      c.files.map((f) => f.path),
    );
    for (const f of c.files) {
      for (const [rev, want] of [
        [c.parent, f.before],
        [c.sha, f.after],
      ]) {
        const exists = git("ls-tree", rev, "--", f.path);
        assert.equal(exists ? hash(execFileSync("git", ["show", `${rev}:${f.path}`])) : null, want);
      }
    }
  }

  // Verify candidate PR 563 file diff matches Git content between base and head
  assert.deepEqual(
    git("diff", "--name-only", "--no-renames", r.candidatePr.baseSha, r.candidatePr.headSha).split("\n").sort(),
    r.candidatePr.files.map((f) => f.path),
  );
  for (const f of r.candidatePr.files) {
    for (const [rev, want] of [
      [r.candidatePr.baseSha, f.before],
      [r.candidatePr.headSha, f.after],
    ]) {
      const exists = git("ls-tree", rev, "--", f.path);
      assert.equal(exists ? hash(execFileSync("git", ["show", `${rev}:${f.path}`])) : null, want);
    }
  }
});

test("EatClean 1A FLOW-04 FAIL: candidateSha unsealed or null rejects closed", () => {
  const v = valid(sealedRelease);
  // Default EATCLEAN_1A_563 has candidateSha === null
  assert.equal(r.candidateSha, null);
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy),
    /candidateSha is unsealed\/null/,
  );
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, { ...r, candidateSha: null }),
    /candidateSha is unsealed\/null/,
  );
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, { ...r, candidateSha: undefined }),
    /candidateSha is unsealed\/null/,
  );
  assert.throws(
    () => assertEatClean1A563Manifest(v.manifest, v.fresh),
    /candidateSha is unsealed\/null/,
  );
  assert.throws(
    () => assertEatClean1A563Manifest(v.manifest, v.fresh, { ...r, candidateSha: null }),
    /candidateSha is unsealed\/null/,
  );
  // assertReconciliationManifest delegates to assertEatClean1A563Manifest with default unsealed config
  assert.throws(
    () => assertReconciliationManifest(v.manifest, v.fresh),
    /candidateSha is unsealed\/null/,
  );
});

test("EatClean 1A FLOW-04 FAIL: candidateSha invalid format rejects closed", () => {
  const v = valid(sealedRelease);
  const badConfig = { ...r, candidateSha: "not-a-valid-sha" };
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, badConfig),
    /not a valid 40-character SHA/,
  );
  assert.throws(
    () => assertEatClean1A563Manifest(v.manifest, v.fresh, badConfig),
    /not a valid 40-character SHA/,
  );
  assert.throws(
    () => eatclean1A563Payload(v.s, policy, badConfig),
    /candidateSha format invalid/,
  );
});

test("EatClean 1A FLOW-04 FAIL: candidateCommit mismatch with sealed candidateSha rejects closed", () => {
  const v = valid(sealedRelease);
  const mismatchedConfig = { ...r, candidateSha: "9".repeat(40) };
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, mismatchedConfig),
    /candidate commit SHA mismatch/,
  );
  assert.throws(
    () => assertEatClean1A563Manifest(v.manifest, v.fresh, mismatchedConfig),
    /candidateCommit does not match sealed candidateSha/,
  );
  assert.throws(
    () => eatclean1A563Payload(v.s, policy, mismatchedConfig),
    /candidate commit SHA mismatch/,
  );
});

test("EatClean 1A FLOW-04 FAIL: baseline mismatch", () => {
  const s = snapshot();
  s.baseline.sha = "0".repeat(40);
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /baseline mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: candidate commit parent mismatch", () => {
  const s = snapshot();
  s.commits[10].parent = "0".repeat(40);
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /candidate PR 563 lineage\/content mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: candidate commit files mismatch", () => {
  const s = snapshot();
  s.commits[10].files[0].after = "0".repeat(64);
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /candidate PR 563 lineage\/content mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: sealed product commit hash altered", () => {
  const s = snapshot();
  s.commits[0].files[0].after = "0".repeat(64);
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /sealed commits mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: additional unauthorized commit", () => {
  const s = snapshot();
  s.commits.splice(5, 0, {
    sha: "4".repeat(40),
    parent: s.commits[4].sha,
    pr: 999,
    files: [],
  });
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /exact 12-commit interval required/);
});

test("EatClean 1A FLOW-04 FAIL: foreign PR in sequence", () => {
  const s = snapshot();
  s.productPrs[0].number = 999;
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /provenance mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: expanded diff path", () => {
  const s = snapshot();
  s.diff.paths.push("src/unauthorized.ts");
  s.diff.paths.sort();
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /interval expanded/);
});

test("EatClean 1A FLOW-04 FAIL: governance branch mismatch", () => {
  const s = snapshot();
  s.remediation.head.ref = "main";
  assert.throws(() => eatclean1A563Payload(s, policy, sealedRelease), /governance branch mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: wrong dispatch actor", () => {
  const v = valid(sealedRelease);
  const badRun = run();
  badRun.actor.id = 999;
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, badRun, policy, sealedRelease), /dispatch authority mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: altered authorization ID", () => {
  const v = valid(sealedRelease);
  v.inputs.authorization_id = "0".repeat(64);
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease), /human scope mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: tampered exact_interval_scope", () => {
  const v = valid(sealedRelease);
  const tampered = JSON.parse(v.inputs.exact_interval_scope);
  tampered.constraints.productionWorkerApprovalGranted = true;
  v.inputs.exact_interval_scope = JSON.stringify(canonical(tampered));
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease), /human scope mismatch/);
});

test("EatClean 1A FLOW-04 FAIL: normal mode instead of exact_interval", () => {
  const v = valid(sealedRelease);
  v.inputs.mode = "normal";
  assert.throws(() => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease), /explicit dispatch required/);
});

test("EatClean 1A FLOW-04 publisher integrated: tampered manifest fails closed before deployment (mutationStarted: false, 0 external calls)", () => {
  const publisher = path.resolve("scripts/governance/release-publish.mjs");
  const configBytes = fs.readFileSync("instances/yourmeal-eatclean/wrangler.prod.json");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-eatclean-tamper-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.test");
    fs.mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
    fs.writeFileSync(path.join(dir, policy.workflow), "name: legacy Gate 7\n");
    git("add", ".");
    git("commit", "--quiet", "-m", "published baseline");
    const base = git("rev-parse", "HEAD");
    fs.mkdirSync(path.join(dir, "src"));
    fs.writeFileSync(path.join(dir, "src/app.ts"), "fixture");
    git("add", ".");
    git("commit", "--quiet", "-m", "merged runtime");
    const sha = git("rev-parse", "HEAD");
    fs.mkdirSync(path.join(dir, "instances/yourmeal-eatclean"), { recursive: true });
    fs.writeFileSync(path.join(dir, "instances/yourmeal-eatclean/wrangler.prod.json"), configBytes);
    fs.mkdirSync(path.join(dir, "artifacts"));
    fs.mkdirSync(path.join(dir, "bin"));
    const digest = "b".repeat(64),
      configHash = hash(configBytes);
    const v = valid(sealedRelease);
    // Tampered manifest with altered reconciliationId
    const tamperedManifest = {
      schema: 1,
      repository: policy.repository,
      sourceSha: sha,
      runId: "123",
      attempt: "1",
      tarSha256: digest,
      configSha256: configHash,
      reconciliation: {
        reconciled: true,
        reconciliationId: "tampered-reconciliation-id-0000000000000000000000000000000000000",
        payload: v.payload,
      },
      plan: {
        decision: "AUTHORIZED_RECONCILED_RELEASE",
        sourceSha: sha,
        reconciliation: {
          reconciled: true,
          reconciliationId: "tampered-reconciliation-id-0000000000000000000000000000000000000",
          payload: v.payload,
        },
      },
    };
    fs.writeFileSync(
      path.join(dir, "artifacts/release-manifest.json"),
      JSON.stringify(tamperedManifest),
    );
    const reviewer = {
      state: "approved",
      user: { id: policy.reviewerId },
      environments: [{ name: policy.environment }],
    };
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
    const responses = {
      [`environments/${policy.environment}`]: environment,
      "actions/runs/123/approvals": [reviewer],
      "actions/artifacts/99": {
        expired: false,
        name: "production-worker-artifact-123-1",
        workflow_run: { id: 123, head_sha: sha },
      },
      "git/ref/heads/main": { object: { sha } },
      [`deployments?environment=${policy.environment}`]: [{ id: 9, sha: base }],
      "deployments/9/statuses": [
        {
          state: "success",
          log_url: `https://github.com/${policy.repository}/actions/runs/1/job/2`,
        },
      ],
      "actions/runs/1": {
        id: 1,
        path: policy.workflow,
        head_sha: base,
        head_branch: "main",
        conclusion: "success",
      },
      [`commits/${sha}/pulls`]: [
        {
          number: 1,
          merged_at: "2026-10-04",
          merge_commit_sha: sha,
          base: { ref: "main", repo: { full_name: policy.repository } },
        },
      ],
    };
    const ghSource = `#!${process.execPath}\nconst fs=require('fs'); const p=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));const key=process.argv[3].replace(/^repos\\/[^/]+\\/[^/]+\\//,'').replace(/[?&]per_page=100&page=1$/,''); if(!(key in p))throw Error('Unexpected API: '+key);console.log(JSON.stringify(p[key]));`;
    fs.writeFileSync(path.join(dir, "bin/gh"), ghSource, { mode: 0o755 });
    fs.writeFileSync(
      path.join(dir, "bin/npx"),
      `#!${process.execPath}\nconst fs=require('fs');fs.appendFileSync(process.env.FAKE_CALLS,process.argv.slice(2).join(' ')+'\\n');throw Error('NPX CALLED WHEN BLOCKED');`,
      { mode: 0o755 },
    );
    fs.mkdirSync(path.join(dir, ".output/public/assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".output/public/assets/a.js"), "fixture-static-asset");
    fs.writeFileSync(
      path.join(dir, "fetch-fixture.mjs"),
      `globalThis.fetch=async()=> { throw Error('Network request blocked'); };`,
    );
    fs.writeFileSync(path.join(dir, "event.json"), JSON.stringify({ inputs: {} }));
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(path.join(dir, "calls"), "");

    const result = spawnSync(process.execPath, [publisher], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
        GH_TOKEN: "fixture",
        GITHUB_REPOSITORY: policy.repository,
        GITHUB_REF: "refs/heads/main",
        GITHUB_SHA: sha,
        GITHUB_RUN_ID: "123",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_EVENT_NAME: "push",
        GITHUB_EVENT_PATH: path.join(dir, "event.json"),
        GITHUB_STEP_SUMMARY: path.join(dir, "summary"),
        RUNNER_TEMP: dir,
        EXPECTED_DIGEST: digest,
        EXPECTED_CONFIG_DIGEST: configHash,
        EXPECTED_ARTIFACT_ID: "99",
        CLOUDFLARE_API_TOKEN: "fixture-no-network",
        CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
        FAKE_RESPONSES: path.join(dir, "responses.json"),
        FAKE_CALLS: path.join(dir, "calls"),
        NODE_OPTIONS: `--import=${path.join(dir, "fetch-fixture.mjs")}`,
      },
    });

    // Verification 1: publication failed closed with exit status 1
    assert.equal(result.status, 1);
    // Verification 2: zero external deployment calls were made (calls file empty)
    const calls = fs.readFileSync(path.join(dir, "calls"), "utf8");
    assert.equal(calls, "");
    // Verification 3: release report was created but mutationStarted is strictly false
    const reportPath = path.join(dir, "artifacts/release-report.json");
    assert.equal(fs.existsSync(reportPath), true);
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    assert.equal(report.mutationStarted, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
