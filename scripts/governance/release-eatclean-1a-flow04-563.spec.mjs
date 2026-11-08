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
    productPrs: r.productCommits.map((c) => humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`)),
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
    git(
      "rev-list",
      "--first-parent",
      "--reverse",
      `${r.baseline.sha}..ffff9d14019e4e71f76de126a5fccfa78b43aff7`,
    ).split("\n"),
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
    git("diff", "--name-only", "--no-renames", r.candidatePr.baseSha, r.candidatePr.headSha)
      .split("\n")
      .sort(),
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
    () =>
      authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, {
        ...r,
        candidateSha: undefined,
      }),
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
  assert.throws(() => eatclean1A563Payload(v.s, policy, badConfig), /candidateSha format invalid/);
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
  assert.throws(
    () => eatclean1A563Payload(s, policy, sealedRelease),
    /candidate PR 563 lineage\/content mismatch/,
  );
});

test("EatClean 1A FLOW-04 FAIL: candidate commit files mismatch", () => {
  const s = snapshot();
  s.commits[10].files[0].after = "0".repeat(64);
  assert.throws(
    () => eatclean1A563Payload(s, policy, sealedRelease),
    /candidate PR 563 lineage\/content mismatch/,
  );
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
  assert.throws(
    () => eatclean1A563Payload(s, policy, sealedRelease),
    /exact 12-commit interval required/,
  );
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
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, badRun, policy, sealedRelease),
    /dispatch authority mismatch/,
  );
});

test("EatClean 1A FLOW-04 FAIL: altered authorization ID", () => {
  const v = valid(sealedRelease);
  v.inputs.authorization_id = "0".repeat(64);
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease),
    /human scope mismatch/,
  );
});

test("EatClean 1A FLOW-04 FAIL: tampered exact_interval_scope", () => {
  const v = valid(sealedRelease);
  const tampered = JSON.parse(v.inputs.exact_interval_scope);
  tampered.constraints.productionWorkerApprovalGranted = true;
  v.inputs.exact_interval_scope = JSON.stringify(canonical(tampered));
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease),
    /human scope mismatch/,
  );
});

test("EatClean 1A FLOW-04 FAIL: normal mode instead of exact_interval", () => {
  const v = valid(sealedRelease);
  v.inputs.mode = "normal";
  assert.throws(
    () => authorizeEatClean1A563(v.s, v.inputs, v.ctx, run(), policy, sealedRelease),
    /explicit dispatch required/,
  );
});

test("EatClean 1A FLOW-04 publisher integrated: valid control succeeds and tampered manifest fails closed before deployment", () => {
  const repoRoot = path.resolve(".");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-eatclean-integrated-"));
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, dir]);
    execFileSync("git", ["checkout", "--quiet", "6159c437caf6903f2d1854021eb77071ad1cee50"], { cwd: dir });

    const candCommit = execFileSync(
      "git",
      [
        "commit-tree",
        "2ab3c2bc28ed7670067ee50ca11208b56aa9d117^{tree}",
        "-p",
        "ffff9d14019e4e71f76de126a5fccfa78b43aff7",
        "-m",
        "feat: candidate PR 563 synthetic squash",
      ],
      { cwd: dir, encoding: "utf8" },
    ).trim();

    const testConfig = {
      ...r,
      candidateSha: candCommit,
    };
    const testConfigFile = path.join(dir, "scripts/governance/release-eatclean-1a-flow04-563.json");
    fs.writeFileSync(testConfigFile, JSON.stringify(testConfig, null, 2) + "\n");

    execFileSync("git", ["add", "scripts/governance/release-eatclean-1a-flow04-563.json"], {
      cwd: dir,
    });
    const govTree = execFileSync("git", ["write-tree"], { cwd: dir, encoding: "utf8" }).trim();

    const govCommit = execFileSync(
      "git",
      [
        "commit-tree",
        govTree,
        "-p",
        candCommit,
        "-m",
        "chore(governance): PR 564 synthetic remediation",
      ],
      { cwd: dir, encoding: "utf8" },
    ).trim();

    execFileSync("git", ["checkout", "--quiet", govCommit], { cwd: dir });

    const fileHash = (rev, p) => {
      try {
        const entry = execFileSync("git", ["ls-tree", rev, "--", p], {
          cwd: dir,
          encoding: "utf8",
        }).trim();
        if (!entry) return null;
        const blob = /^100(?:644|755) blob ([a-f0-9]{40})\t/.exec(entry);
        if (!blob) return null;
        return hash(
          execFileSync("git", ["cat-file", "blob", blob[1]], {
            cwd: dir,
            maxBuffer: 16 * 1024 * 1024,
          }),
        );
      } catch {
        return null;
      }
    };

    const commits = [
      ...structuredClone(r.productCommits),
      {
        sha: candCommit,
        parent: r.candidatePr.baseSha,
        pr: r.candidatePr.number,
        files: structuredClone(r.candidatePr.files),
      },
      {
        sha: govCommit,
        parent: candCommit,
        pr: 564,
        headSha: "a".repeat(40),
        files: r.governancePaths.map((p) => ({
          path: p,
          before: fileHash(`${govCommit}^1`, p),
          after: fileHash(govCommit, p),
        })),
      },
    ];

    const productPaths = [
      ...new Set([
        ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
        ...r.candidatePr.files.map((f) => f.path),
      ]),
    ].sort();

    const s = {
      repository: policy.repository,
      baseline: structuredClone(r.baseline),
      targetSha: govCommit,
      currentMainSha: govCommit,
      commits,
      productPrs: r.productCommits.map((c) => humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`)),
      candidatePr: humanPr(
        r.candidatePr.number,
        candCommit,
        r.candidatePr.headSha,
        "feat/eatclean-1a-kitchen-flow04-ui",
      ),
      remediation: humanPr(564, govCommit, "a".repeat(40), r.governanceBranch),
      diff: {
        commits: commits.map((c) => c.sha),
        paths: [...new Set([...productPaths, ...r.governancePaths])].sort(),
      },
    };

    const payload = eatclean1A563Payload(s, policy, testConfig);
    const authorizationId = eatclean1A563ScopeId(payload);

    const inputs = {
      mode: "exact_interval",
      expected_base_sha: r.baseline.sha,
      expected_target_sha: govCommit,
      authorized_prs: JSON.stringify([...r.productPrs, 564]),
      authorization_id: authorizationId,
      exact_interval_scope: JSON.stringify(canonical(payload)),
      reason: "Controlled EatClean 1A FLOW-04 #563 publication",
    };

    fs.writeFileSync(path.join(dir, "event.json"), JSON.stringify({ inputs }));

    const configBytes = fs.readFileSync(
      path.join(dir, "instances/yourmeal-eatclean/wrangler.prod.json"),
    );
    const configHash = hash(configBytes);
    const digest = "b".repeat(64);

    const reconciliation = {
      reconciled: true,
      reconciliationId: hash(JSON.stringify(payload)),
      payload,
    };

    const validManifest = {
      schema: 1,
      repository: policy.repository,
      sourceSha: govCommit,
      runId: "123",
      attempt: "1",
      tarSha256: digest,
      configSha256: configHash,
      reconciliation,
      plan: {
        decision: "AUTHORIZED_RECONCILED_RELEASE",
        sourceSha: govCommit,
        reconciliation,
      },
    };

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
        workflow_run: { id: 123, head_sha: govCommit },
      },
      "actions/runs/123": {
        id: 123,
        run_attempt: 1,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: govCommit,
        path: policy.workflow,
        actor: { id: policy.reviewerId, login: policy.reviewerLogin },
        triggering_actor: { id: policy.reviewerId, login: policy.reviewerLogin },
      },
      "git/ref/heads/main": { object: { sha: govCommit } },
      [`deployments?environment=${policy.environment}`]: [{ id: 7300101642, sha: r.baseline.sha }],
      "deployments/7300101642/statuses": [
        {
          state: "success",
          log_url: `https://github.com/${policy.repository}/actions/runs/40103726985/job/1`,
        },
      ],
      "actions/runs/40103726985": {
        id: 40103726985,
        path: policy.workflow,
        head_sha: r.baseline.sha,
        head_branch: "main",
        conclusion: "success",
      },
      "actions/runs/40103726985/artifacts": {
        total_count: 1,
        artifacts: [{ name: "gate7-release-report-40103726985-1", expired: false }],
      },
    };

    r.productCommits.forEach((c) => {
      const prObj = humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`);
      responses[`commits/${c.sha}/pulls`] = [prObj];
      responses[`pulls/${c.pr}`] = prObj;
    });
    const candPrObj = humanPr(
      563,
      candCommit,
      r.candidatePr.headSha,
      "feat/eatclean-1a-kitchen-flow04-ui",
    );
    responses[`commits/${candCommit}/pulls`] = [candPrObj];
    responses[`pulls/563`] = candPrObj;

    const govPrObj = humanPr(564, govCommit, "a".repeat(40), r.governanceBranch);
    responses[`commits/${govCommit}/pulls`] = [govPrObj];
    responses[`pulls/564`] = govPrObj;

    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));

    const baselineReport = {
      schema: 1,
      repository: policy.repository,
      sourceSha: r.baseline.sha,
      runId: "40103726985",
      attempt: "1",
      state: "DEPLOYED",
      mutationStarted: true,
      versionId: r.baseline.versionId,
      deploymentId: "53b09377-9e84-4b7f-b960-925829ef54d1",
      tarSha256: "1bd23f12ff0305af2aa27493a9cbaf8856404d302bc24f8d74bdd328c7dc041e",
      configSha256: "6b430f21921697883924ee1457dd680e8bb056ac8b970d1481230e73ccddbd5c",
      artifactId: "12564385065",
    };
    fs.writeFileSync(path.join(dir, "baseline-report.json"), JSON.stringify(baselineReport));

    fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
    const ghSource = `#!${process.execPath}\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\nif (process.argv[2] === 'run' && process.argv[3] === 'download') {\n  const dirIdx = process.argv.indexOf('--dir');\n  const targetDir = process.argv[dirIdx + 1];\n  fs.copyFileSync(path.join(__dirname, '../baseline-report.json'), path.join(targetDir, 'release-report.json'));\n  process.exit(0);\n}\nconst p=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));\nconst key=process.argv[3].replace(/^repos\\/[^/]+\\/[^/]+\\//,'').replace(/[?&]per_page=100&page=1$/,'').replace(/[?&]per_page=100$/,'');\nif(!(key in p))throw Error('Unexpected API: '+key);\nconsole.log(JSON.stringify(p[key]));`;
    fs.writeFileSync(path.join(dir, "bin/gh"), ghSource, { mode: 0o755 });

    fs.writeFileSync(
      path.join(dir, "bin/npx"),
      `#!${process.execPath}\nimport fs from 'node:fs';\nfs.appendFileSync(process.env.FAKE_CALLS, process.argv.slice(2).join(' ') + '\\n');\nif (process.argv.includes('upload')) {\n  fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH, JSON.stringify({ type: 'version-upload', version: 1, worker_name: 'yourmeal-instance-eatclean', version_id: '75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60' }));\n} else {\n  fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH, JSON.stringify({ type: 'version-deploy', version: 1, worker_name: 'yourmeal-instance-eatclean', deployment_id: '11111111-1111-4111-8111-111111111111', version_traffic: {} }));\n}`,
      { mode: 0o755 },
    );

    fs.mkdirSync(path.join(dir, ".output/public/assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".output/public/assets/a.js"), "fixture-static-asset");

    fs.writeFileSync(
      path.join(dir, "fetch-fixture.mjs"),
      `globalThis.fetch=async(url)=> {\n  if(String(url).startsWith('https://api.cloudflare.com/client/v4/')) {\n    const deployment={id:'11111111-1111-4111-8111-111111111111',versions:[{version_id:'75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60',percentage:100}]};\n    return {ok:true,json:async()=>({success:true,result:String(url).endsWith('/deployments')?{deployments:[deployment]}:deployment})};\n  }\n  if(url==='https://eatclean.yourmealos.com/assets/a.js')return {status:200,arrayBuffer:async()=>Buffer.from('fixture-static-asset')};\n  throw Error('Unexpected network request: '+url);\n};`,
    );

    const publisher = path.resolve(dir, "scripts/governance/release-publish.mjs");

    const runPublisher = (m) => {
      fs.mkdirSync(path.join(dir, "artifacts"), { recursive: true });
      fs.writeFileSync(
        path.join(dir, "artifacts/release-manifest.json"),
        JSON.stringify(m, null, 2),
      );
      fs.writeFileSync(path.join(dir, "calls"), "");
      for (const f of ["gate7-upload-123.ndjson", "gate7-deploy-123.ndjson"])
        fs.rmSync(path.join(dir, f), { force: true });

      const result = spawnSync(process.execPath, [publisher], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
          GH_TOKEN: "fixture",
          GITHUB_REPOSITORY: policy.repository,
          GITHUB_REF: "refs/heads/main",
          GITHUB_SHA: govCommit,
          GITHUB_RUN_ID: "123",
          GITHUB_RUN_ATTEMPT: "1",
          GITHUB_EVENT_NAME: "workflow_dispatch",
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

      const reportPath = path.join(dir, "artifacts/release-report.json");
      const report = fs.existsSync(reportPath)
        ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
        : null;
      const calls = fs.readFileSync(path.join(dir, "calls"), "utf8");

      return {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        calls,
        report,
      };
    };

    // Case 1: Valid control case exercises full reconciliation flow and reaches deployment
    const control = runPublisher(validManifest);
    assert.equal(control.status, 0);
    assert.equal(control.report?.state, "DEPLOYED");
    assert.equal(control.report?.mutationStarted, true);
    assert.match(control.calls, /wrangler@4\.86\.0 versions upload/);
    assert.match(control.calls, /wrangler@4\.86\.0 versions deploy/);

    // Case 2: Tampered negative case alters candidatePr in reconciliation payload
    const tamperedManifest = structuredClone(validManifest);
    tamperedManifest.reconciliation.payload.candidatePr = 999;
    tamperedManifest.plan.reconciliation.payload.candidatePr = 999;
    const tampered = runPublisher(tamperedManifest);
    assert.equal(tampered.status, 1);
    assert.match(
      tampered.stderr,
      /EatClean 1A FLOW-04 #563 preparation\/publication scope changed/,
    );
    assert.equal(tampered.report?.mutationStarted, false);
    assert.equal(tampered.calls, "");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("EatClean 1A FLOW-04 regression: environment variables cannot override operational release configuration", () => {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `import { EATCLEAN_1A_563 } from "./scripts/governance/release-eatclean-1a-flow04-563.mjs";
       if (EATCLEAN_1A_563.candidateSha !== null) process.exit(2);
       process.exit(0);`,
    ],
    {
      cwd: path.resolve("."),
      env: {
        ...process.env,
        TEST_EATCLEAN_1A_563_CONFIG: "/tmp/fake-candidate-override.json",
        EATCLEAN_1A_563_CONFIG: "/tmp/fake-candidate-override.json",
      },
    },
  );
  assert.equal(result.status, 0);
});

test("EatClean 1A FLOW-04 regression: removing assertEatClean1A563Manifest causes tampered check to fail", () => {
  const repoRoot = path.resolve(".");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-eatclean-regression-"));
  try {
    execFileSync("git", ["clone", "--shared", "--quiet", repoRoot, dir]);
    execFileSync("git", ["checkout", "--quiet", "6159c437caf6903f2d1854021eb77071ad1cee50"], { cwd: dir });

    const candCommit = execFileSync(
      "git",
      [
        "commit-tree",
        "2ab3c2bc28ed7670067ee50ca11208b56aa9d117^{tree}",
        "-p",
        "ffff9d14019e4e71f76de126a5fccfa78b43aff7",
        "-m",
        "feat: candidate PR 563 synthetic squash",
      ],
      { cwd: dir, encoding: "utf8" },
    ).trim();

    const testConfig = {
      ...r,
      candidateSha: candCommit,
    };
    const testConfigFile = path.join(dir, "scripts/governance/release-eatclean-1a-flow04-563.json");
    fs.writeFileSync(testConfigFile, JSON.stringify(testConfig, null, 2) + "\n");

    // Intentionally remove assertEatClean1A563Manifest call from release-reconciliation.mjs to simulate guard removal
    const reconFile = path.join(dir, "scripts/governance/release-reconciliation.mjs");
    const origRecon = fs.readFileSync(reconFile, "utf8");
    assert.match(origRecon, /assertEatClean1A563Manifest\(manifest, fresh\);/);
    const brokenRecon = origRecon.replace(
      "assertEatClean1A563Manifest(manifest, fresh);",
      "// GUARD REMOVED FOR REGRESSION TEST",
    );
    fs.writeFileSync(reconFile, brokenRecon);

    execFileSync(
      "git",
      [
        "add",
        "scripts/governance/release-eatclean-1a-flow04-563.json",
        "scripts/governance/release-reconciliation.mjs",
      ],
      { cwd: dir },
    );
    const govTree = execFileSync("git", ["write-tree"], { cwd: dir, encoding: "utf8" }).trim();

    const govCommit = execFileSync(
      "git",
      [
        "commit-tree",
        govTree,
        "-p",
        candCommit,
        "-m",
        "chore(governance): PR 564 synthetic remediation",
      ],
      { cwd: dir, encoding: "utf8" },
    ).trim();

    execFileSync("git", ["checkout", "--quiet", govCommit], { cwd: dir });

    const fileHash = (rev, p) => {
      try {
        const entry = execFileSync("git", ["ls-tree", rev, "--", p], {
          cwd: dir,
          encoding: "utf8",
        }).trim();
        if (!entry) return null;
        const blob = /^100(?:644|755) blob ([a-f0-9]{40})\t/.exec(entry);
        if (!blob) return null;
        return hash(
          execFileSync("git", ["cat-file", "blob", blob[1]], {
            cwd: dir,
            maxBuffer: 16 * 1024 * 1024,
          }),
        );
      } catch {
        return null;
      }
    };

    const commits = [
      ...structuredClone(r.productCommits),
      {
        sha: candCommit,
        parent: r.candidatePr.baseSha,
        pr: r.candidatePr.number,
        files: structuredClone(r.candidatePr.files),
      },
      {
        sha: govCommit,
        parent: candCommit,
        pr: 564,
        headSha: "a".repeat(40),
        files: r.governancePaths.map((p) => ({
          path: p,
          before: fileHash(`${govCommit}^1`, p),
          after: fileHash(govCommit, p),
        })),
      },
    ];

    const productPaths = [
      ...new Set([
        ...r.productCommits.flatMap((c) => c.files.map((f) => f.path)),
        ...r.candidatePr.files.map((f) => f.path),
      ]),
    ].sort();

    const s = {
      repository: policy.repository,
      baseline: structuredClone(r.baseline),
      targetSha: govCommit,
      currentMainSha: govCommit,
      commits,
      productPrs: r.productCommits.map((c) => humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`)),
      candidatePr: humanPr(
        r.candidatePr.number,
        candCommit,
        r.candidatePr.headSha,
        "feat/eatclean-1a-kitchen-flow04-ui",
      ),
      remediation: humanPr(564, govCommit, "a".repeat(40), r.governanceBranch),
      diff: {
        commits: commits.map((c) => c.sha),
        paths: [...new Set([...productPaths, ...r.governancePaths])].sort(),
      },
    };

    const payload = eatclean1A563Payload(s, policy, testConfig);
    const authorizationId = eatclean1A563ScopeId(payload);

    const inputs = {
      mode: "exact_interval",
      expected_base_sha: r.baseline.sha,
      expected_target_sha: govCommit,
      authorized_prs: JSON.stringify([...r.productPrs, 564]),
      authorization_id: authorizationId,
      exact_interval_scope: JSON.stringify(canonical(payload)),
      reason: "Controlled EatClean 1A FLOW-04 #563 publication",
    };

    fs.writeFileSync(path.join(dir, "event.json"), JSON.stringify({ inputs }));

    const configBytes = fs.readFileSync(
      path.join(dir, "instances/yourmeal-eatclean/wrangler.prod.json"),
    );
    const configHash = hash(configBytes);
    const digest = "b".repeat(64);

    const reconciliation = {
      reconciled: true,
      reconciliationId: hash(JSON.stringify(payload)),
      payload,
    };

    const tamperedManifest = {
      schema: 1,
      repository: policy.repository,
      sourceSha: govCommit,
      runId: "123",
      attempt: "1",
      tarSha256: digest,
      configSha256: configHash,
      reconciliation: {
        reconciled: true,
        reconciliationId: hash(JSON.stringify(payload)),
        payload: { ...payload, candidatePr: 999 },
      },
      plan: {
        decision: "AUTHORIZED_RECONCILED_RELEASE",
        sourceSha: govCommit,
        reconciliation: {
          reconciled: true,
          reconciliationId: hash(JSON.stringify(payload)),
          payload: { ...payload, candidatePr: 999 },
        },
      },
    };

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
        workflow_run: { id: 123, head_sha: govCommit },
      },
      "actions/runs/123": {
        id: 123,
        run_attempt: 1,
        event: "workflow_dispatch",
        head_branch: "main",
        head_sha: govCommit,
        path: policy.workflow,
        actor: { id: policy.reviewerId, login: policy.reviewerLogin },
        triggering_actor: { id: policy.reviewerId, login: policy.reviewerLogin },
      },
      "git/ref/heads/main": { object: { sha: govCommit } },
      [`deployments?environment=${policy.environment}`]: [{ id: 7300101642, sha: r.baseline.sha }],
      "deployments/7300101642/statuses": [
        {
          state: "success",
          log_url: `https://github.com/${policy.repository}/actions/runs/40103726985/job/1`,
        },
      ],
      "actions/runs/40103726985": {
        id: 40103726985,
        path: policy.workflow,
        head_sha: r.baseline.sha,
        head_branch: "main",
        conclusion: "success",
      },
      "actions/runs/40103726985/artifacts": {
        total_count: 1,
        artifacts: [{ name: "gate7-release-report-40103726985-1", expired: false }],
      },
    };

    r.productCommits.forEach((c) => {
      const prObj = humanPr(c.pr, c.sha, c.headSha, `branch-${c.pr}`);
      responses[`commits/${c.sha}/pulls`] = [prObj];
      responses[`pulls/${c.pr}`] = prObj;
    });
    const candPrObj = humanPr(
      563,
      candCommit,
      r.candidatePr.headSha,
      "feat/eatclean-1a-kitchen-flow04-ui",
    );
    responses[`commits/${candCommit}/pulls`] = [candPrObj];
    responses[`pulls/563`] = candPrObj;

    const govPrObj = humanPr(564, govCommit, "a".repeat(40), r.governanceBranch);
    responses[`commits/${govCommit}/pulls`] = [govPrObj];
    responses[`pulls/564`] = govPrObj;

    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));

    const baselineReport = {
      schema: 1,
      repository: policy.repository,
      sourceSha: r.baseline.sha,
      runId: "40103726985",
      attempt: "1",
      state: "DEPLOYED",
      mutationStarted: true,
      versionId: r.baseline.versionId,
      deploymentId: "53b09377-9e84-4b7f-b960-925829ef54d1",
      tarSha256: "1bd23f12ff0305af2aa27493a9cbaf8856404d302bc24f8d74bdd328c7dc041e",
      configSha256: "6b430f21921697883924ee1457dd680e8bb056ac8b970d1481230e73ccddbd5c",
      artifactId: "12564385065",
    };
    fs.writeFileSync(path.join(dir, "baseline-report.json"), JSON.stringify(baselineReport));

    fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
    const ghSource = `#!${process.execPath}\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));\nif (process.argv[2] === 'run' && process.argv[3] === 'download') {\n  const dirIdx = process.argv.indexOf('--dir');\n  const targetDir = process.argv[dirIdx + 1];\n  fs.copyFileSync(path.join(__dirname, '../baseline-report.json'), path.join(targetDir, 'release-report.json'));\n  process.exit(0);\n}\nconst p=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));\nconst key=process.argv[3].replace(/^repos\\/[^/]+\\/[^/]+\\//,'').replace(/[?&]per_page=100&page=1$/,'').replace(/[?&]per_page=100$/,'');\nif(!(key in p))throw Error('Unexpected API: '+key);\nconsole.log(JSON.stringify(p[key]));`;
    fs.writeFileSync(path.join(dir, "bin/gh"), ghSource, { mode: 0o755 });

    fs.writeFileSync(
      path.join(dir, "bin/npx"),
      `#!${process.execPath}\nimport fs from 'node:fs';\nfs.appendFileSync(process.env.FAKE_CALLS, process.argv.slice(2).join(' ') + '\\n');\nif (process.argv.includes('upload')) {\n  fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH, JSON.stringify({ type: 'version-upload', version: 1, worker_name: 'yourmeal-instance-eatclean', version_id: '75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60' }));\n} else {\n  fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH, JSON.stringify({ type: 'version-deploy', version: 1, worker_name: 'yourmeal-instance-eatclean', deployment_id: '11111111-1111-4111-8111-111111111111', version_traffic: {} }));\n}`,
      { mode: 0o755 },
    );

    fs.mkdirSync(path.join(dir, ".output/public/assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".output/public/assets/a.js"), "fixture-static-asset");

    fs.writeFileSync(
      path.join(dir, "fetch-fixture.mjs"),
      `globalThis.fetch=async(url)=> {\n  if(String(url).startsWith('https://api.cloudflare.com/client/v4/')) {\n    const deployment={id:'11111111-1111-4111-8111-111111111111',versions:[{version_id:'75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60',percentage:100}]};\n    return {ok:true,json:async()=>({success:true,result:String(url).endsWith('/deployments')?{deployments:[deployment]}:deployment})};\n  }\n  if(url==='https://eatclean.yourmealos.com/assets/a.js')return {status:200,arrayBuffer:async()=>Buffer.from('fixture-static-asset')};\n  throw Error('Unexpected network request: '+url);\n};`,
    );

    const publisher = path.resolve(dir, "scripts/governance/release-publish.mjs");

    fs.mkdirSync(path.join(dir, "artifacts"), { recursive: true });
    fs.writeFileSync(
      path.join(dir, "artifacts/release-manifest.json"),
      JSON.stringify(tamperedManifest, null, 2),
    );
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
        GITHUB_SHA: govCommit,
        GITHUB_RUN_ID: "123",
        GITHUB_RUN_ATTEMPT: "1",
        GITHUB_EVENT_NAME: "workflow_dispatch",
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

    const reportPath = path.join(dir, "artifacts/release-report.json");
    const report = fs.existsSync(reportPath)
      ? JSON.parse(fs.readFileSync(reportPath, "utf8"))
      : null;
    const calls = fs.readFileSync(path.join(dir, "calls"), "utf8");

    // Unequivocal evidence of protection loss:
    // When assertEatClean1A563Manifest is omitted in this temporary copy, the tampered manifest
    // (candidatePr = 999) is NOT intercepted, and execution successfully proceeds past the manifest
    // checkpoint all the way through deployment (wrangler upload and deploy recorded).
    // Any prior setup, configuration or API failure would fail status 0 and calls assertion.
    assert.equal(
      result.status,
      0,
      `Expected status 0 (proceeded past missing guard) but got ${result.status} with stderr: ${result.stderr}`,
    );
    assert.equal(report?.state, "DEPLOYED");
    assert.equal(report?.mutationStarted, true);
    assert.match(calls, /wrangler@4\.86\.0 versions upload/);
    assert.match(calls, /wrangler@4\.86\.0 versions deploy/);
    assert.doesNotMatch(
      result.stderr,
      /EatClean 1A FLOW-04 #563 preparation\/publication scope changed/,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
