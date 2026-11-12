import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { policy } from "./release-plan.mjs";
import { hash } from "./release-contract.mjs";
import {
  verifyStaticAssetSmoke,
  SMOKE_MAX_ATTEMPTS,
  SMOKE_RETRY_DELAYS_MS,
  SMOKE_MAX_TOTAL_DURATION_MS,
} from "./release-publish.mjs";

// Real publisher/plan processes, local git history and fake read-only GitHub CLI.
// npx is replaced with a recording stub: these tests cannot contact Cloudflare.
test("publication orchestration fails closed before deployment and preserves no-op state", () => {
  const publisher = path.resolve("scripts/governance/release-publish.mjs");
  const configBytes = fs.readFileSync("instances/yourmeal-eatclean/wrangler.prod.json");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-publication-"));
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
    fs.writeFileSync(
      path.join(dir, "artifacts/release-manifest.json"),
      JSON.stringify({
        schema: 1,
        repository: policy.repository,
        sourceSha: sha,
        runId: "123",
        attempt: "1",
        tarSha256: digest,
        configSha256: configHash,
      }),
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
      `#!${process.execPath}\nconst fs=require('fs');fs.appendFileSync(process.env.FAKE_CALLS,process.argv.slice(2).join(' ')+'\\n');if(!process.argv.includes('upload') && process.env.FAKE_DEPLOY!=='yes')throw Error('SIMULATED DEPLOY FAILURE');fs.writeFileSync(process.env.WRANGLER_OUTPUT_FILE_PATH,process.argv.includes('upload')?process.env.FAKE_UPLOAD:JSON.stringify({type:'version-deploy',version:1,worker_name:'yourmeal-instance-eatclean',deployment_id:'11111111-1111-4111-8111-111111111111',version_traffic:{}}));`,
      { mode: 0o755 },
    );
    fs.mkdirSync(path.join(dir, ".output/public/assets"), { recursive: true });
    fs.writeFileSync(path.join(dir, ".output/public/assets/a.js"), "fixture-static-asset");
    fs.writeFileSync(
      path.join(dir, "fetch-fixture.mjs"),
      `globalThis.fetch=async(url)=> { if(String(url).startsWith('https://api.cloudflare.com/client/v4/')) { const deployment={id:'11111111-1111-4111-8111-111111111111',versions:[{version_id:'75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60',percentage:100}]};return {ok:true,json:async()=>({success:true,result:String(url).endsWith('/deployments')?{deployments:[deployment]}:deployment})}; } if(url==='https://eatclean.yourmealos.com/assets/a.js')return {status:200,arrayBuffer:async()=>Buffer.from(process.env.FAKE_SMOKE==='fail'?'different-bytes':'fixture-static-asset')};throw Error('Unexpected network request blocked'); };`,
    );
    fs.writeFileSync(path.join(dir, "event.json"), JSON.stringify({ inputs: {} }));
    const run = (data, upload = "", extra = {}) => {
      fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(data));
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
          FAKE_UPLOAD: upload,
          NODE_OPTIONS: `--import=${path.join(dir, "fetch-fixture.mjs")}`,
          ...extra,
        },
      });
      assert.equal(result.signal, null);
      return {
        status: result.status,
        calls: fs.readFileSync(path.join(dir, "calls"), "utf8"),
        report: JSON.parse(fs.readFileSync(path.join(dir, "artifacts/release-report.json"))),
      };
    };
    for (const bad of [[], [{ ...reviewer, user: { id: 1 } }], [reviewer, reviewer]]) {
      const result = run({ ...responses, "actions/runs/123/approvals": bad });
      assert.equal(result.status, 1);
      assert.equal(result.calls, "");
      assert.equal(result.report.mutationStarted, false);
    }
    for (const patch of [
      { GITHUB_RUN_ATTEMPT: "2" },
      { EXPECTED_DIGEST: "c".repeat(64) },
      { EXPECTED_ARTIFACT_ID: "100" },
    ]) {
      const result = run(responses, "", patch);
      assert.equal(result.status, 1);
      assert.equal(result.calls, "");
    }
    const stale = run({ ...responses, "git/ref/heads/main": { object: { sha: base } } });
    assert.equal(stale.status, 0);
    assert.equal(stale.report.state, "SUPERSEDED");
    assert.equal(stale.calls, "");
    const valid = {
      type: "version-upload",
      version: 1,
      worker_name: policy.worker,
      version_id: "75bfca8f-fc8c-4ef7-9cbd-c0aaaebf7e60",
    };
    for (const bad of [
      "",
      JSON.stringify(valid) + "\n" + JSON.stringify(valid),
      JSON.stringify({ ...valid, version_id: "invalid" }),
      JSON.stringify({ ...valid, worker_name: "wrong-worker" }),
    ]) {
      const result = run(responses, bad);
      assert.equal(result.status, 1);
      assert.match(result.calls, /versions upload --no-bundle/);
      assert.doesNotMatch(result.calls, /versions deploy/);
      assert.equal(result.report.state, "PUBLICATION_UNKNOWN");
      assert.equal(result.report.mutationStarted, true);
    }
    const partial = run(responses, JSON.stringify(valid));
    assert.equal(partial.status, 1);
    assert.equal(partial.report.state, "DEPLOYMENT_UNKNOWN");
    assert.equal(partial.report.versionId, valid.version_id);
    assert.match(partial.calls, new RegExp(`${valid.version_id}@100%`));
    const expectedAssetHash = hash(Buffer.from("fixture-static-asset"));
    const wrongAssetHash = hash(Buffer.from("different-bytes"));
    for (const smoke of ["pass", "fail"]) {
      const result = run(responses, JSON.stringify(valid), {
        FAKE_DEPLOY: "yes",
        FAKE_SMOKE: smoke,
      });
      assert.equal(result.status, smoke === "pass" ? 0 : 1);
      assert.equal(result.report.state, "DEPLOYED");
      assert.equal(result.report.mutationStarted, true);
      assert.equal(result.report.versionId, valid.version_id);
      assert.equal(result.report.deploymentId, "11111111-1111-4111-8111-111111111111");
      assert.equal(result.report.smoke === "PASS", smoke === "pass");
      assert.equal(result.report.smokeStatus, 200);
      assert.equal(result.report.smokeExpectedSha256, expectedAssetHash);
      assert.equal(
        result.report.smokeObservedSha256,
        smoke === "pass" ? expectedAssetHash : wrongAssetHash,
      );
      assert.equal(result.report.smokeAttempt, smoke === "pass" ? 1 : SMOKE_MAX_ATTEMPTS);
      assert.equal(result.report.smokeAttemptsCount, smoke === "pass" ? 1 : SMOKE_MAX_ATTEMPTS);
      assert.ok(Number.isSafeInteger(result.report.smokeDurationMs));
      assert.equal(result.report.smokeAttempts.length, smoke === "pass" ? 1 : SMOKE_MAX_ATTEMPTS);
      assert.equal(result.report.humanUX, "HUMAN PRODUCTION VERIFICATION REQUIRED");
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("verifyStaticAssetSmoke: 1st-attempt HTTP 200 with exact SHA-256 passes without retries", async () => {
  const bytes = Buffer.from("console.log('eatclean');");
  const expectedSha256 = hash(bytes);
  const logs = [];
  const sleeps = [];
  let t = 1000;
  const requests = [];

  const result = await verifyStaticAssetSmoke({
    url: `${policy.origin}/assets/BootstrapOrchestrator-test.js`,
    expectedBytes: bytes.length,
    expectedSha256,
    now: () => t,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
    log: (line) => logs.push(line),
    fetchImpl: async (url, init) => {
      requests.push({ url, init });
      t += 45;
      return { status: 200, arrayBuffer: async () => bytes };
    },
  });

  assert.equal(result.passed, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.attempt, 1);
  assert.equal(result.attemptsCount, 1);
  assert.equal(result.httpStatus, 200);
  assert.equal(result.expectedSha256, expectedSha256);
  assert.equal(result.observedSha256, expectedSha256);
  assert.equal(result.durationMs, 45);
  assert.deepEqual(sleeps, []);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].init.method, "GET");
  assert.equal(requests[0].init.redirect, "error");
  assert.ok(requests[0].init.signal);
  assert.match(logs[0], /attempt=1\/4 .* status=200 .* outcome=PASS/);
});

test("verifyStaticAssetSmoke: recovers across transient 404/drift within bounded retries", async () => {
  const goodBytes = Buffer.from("good-static-bundle");
  const staleBytes = Buffer.from("stale-edge-bundle");
  const expectedSha256 = hash(goodBytes);
  const staleSha256 = hash(staleBytes);
  const sleeps = [];
  const logs = [];
  let t = 5000;
  let call = 0;

  const responses = [
    { status: 404, body: Buffer.from("not-found") },
    { status: 200, body: staleBytes },
    { status: 200, body: goodBytes },
  ];

  const result = await verifyStaticAssetSmoke({
    url: `${policy.origin}/assets/BootstrapOrchestrator-test.js`,
    expectedBytes: goodBytes.length,
    expectedSha256,
    now: () => t,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
    log: (line) => logs.push(line),
    fetchImpl: async () => {
      const next = responses[call++];
      t += 100;
      return { status: next.status, arrayBuffer: async () => next.body };
    },
  });

  assert.equal(result.passed, true);
  assert.equal(result.status, "PASS");
  assert.equal(result.attempt, 3);
  assert.equal(result.attemptsCount, 3);
  assert.equal(result.httpStatus, 200);
  assert.equal(result.observedSha256, expectedSha256);
  assert.deepEqual(sleeps, SMOKE_RETRY_DELAYS_MS.slice(0, 2));
  assert.equal(result.attempts[0].httpStatus, 404);
  assert.equal(result.attempts[0].passed, false);
  assert.equal(result.attempts[1].httpStatus, 200);
  assert.equal(result.attempts[1].observedSha256, staleSha256);
  assert.equal(result.attempts[1].passed, false);
  assert.equal(result.attempts[2].httpStatus, 200);
  assert.equal(result.attempts[2].observedSha256, expectedSha256);
  assert.equal(result.attempts[2].passed, true);
  assert.equal(logs.length, 3);
});

test("verifyStaticAssetSmoke: non-200 status always fails even with matching bytes and halts at maxAttempts", async () => {
  const bytes = Buffer.from("same-bytes-but-500");
  const expectedSha256 = hash(bytes);
  const sleeps = [];
  let t = 0;

  const result = await verifyStaticAssetSmoke({
    url: `${policy.origin}/assets/BootstrapOrchestrator-test.js`,
    expectedBytes: bytes.length,
    expectedSha256,
    now: () => t,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
    log: () => {},
    fetchImpl: async () => {
      t += 50;
      return { status: 500, arrayBuffer: async () => bytes };
    },
  });

  assert.equal(result.passed, false);
  assert.equal(result.status, "FAIL — INTRODUCED OR PRODUCTION DRIFT");
  assert.equal(result.attempt, SMOKE_MAX_ATTEMPTS);
  assert.equal(result.attemptsCount, SMOKE_MAX_ATTEMPTS);
  assert.equal(result.httpStatus, 500);
  assert.equal(result.observedSha256, expectedSha256);
  assert.deepEqual(sleeps, [...SMOKE_RETRY_DELAYS_MS]);
});

test("verifyStaticAssetSmoke: enforces bounded total wait budget across slow/failing requests", async () => {
  const bytes = Buffer.from("expected-bytes");
  const expectedSha256 = hash(bytes);
  const sleeps = [];
  let t = 0;

  const result = await verifyStaticAssetSmoke({
    url: `${policy.origin}/assets/BootstrapOrchestrator-test.js`,
    expectedBytes: bytes.length,
    expectedSha256,
    maxAttempts: 4,
    retryDelaysMs: [10000, 20000, 30000],
    maxTotalDurationMs: SMOKE_MAX_TOTAL_DURATION_MS,
    now: () => t,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
    log: () => {},
    fetchImpl: async () => {
      t += 16000;
      throw new Error("network timeout");
    },
  });

  assert.equal(result.passed, false);
  assert.equal(result.status, "FAIL — SMOKE REQUEST ERROR");
  assert.equal(result.httpStatus, null);
  assert.equal(result.observedSha256, null);
  assert.equal(result.attemptsCount, 2);
  assert.deepEqual(sleeps, [10000]);
  assert.equal(result.durationMs, 42000);
  assert.equal(result.attempts[0].error, "network timeout");
});

test("post-deploy smoke failure with state=DEPLOYED becomes authoritative baseline over older success deployment", () => {
  const planModuleUrl = pathToFileURL(path.resolve("scripts/governance/release-plan.mjs")).href;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gate7-smoke-baseline-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
  try {
    git("init", "--quiet");
    git("config", "user.name", "Fixture");
    git("config", "user.email", "fixture@example.test");
    fs.mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
    fs.writeFileSync(path.join(dir, policy.workflow), "name: Gate 7\n# gate7-release-report-\n");
    git("add", ".");
    git("commit", "--quiet", "-m", "legacy deployed commit fcc78015");
    const oldSha = git("rev-parse", "HEAD");
    fs.writeFileSync(path.join(dir, "README.md"), "new deployed commit f585c653\n");
    git("add", ".");
    git("commit", "--quiet", "-m", "deployed commit with post-deploy smoke failure");
    const deployedSha = git("rev-parse", "HEAD");

    const failedRunId = 42885576096;
    const deployedVersionId = "f467a3b2-b5bc-4672-ac9b-379e4da936d0";
    const deployedCfId = "7dd0fb4f-a849-4aae-a3a9-b04500c8214c";
    const deployedReport = {
      schema: 1,
      repository: policy.repository,
      sourceSha: deployedSha,
      runId: String(failedRunId),
      attempt: "1",
      state: "DEPLOYED",
      mutationStarted: true,
      versionId: deployedVersionId,
      deploymentId: deployedCfId,
      tarSha256: "a".repeat(64),
      configSha256: "b".repeat(64),
      artifactId: "13795707925",
      smoke: "FAIL — INTRODUCED OR PRODUCTION DRIFT",
    };

    const responses = {
      [`deployments?environment=${policy.environment}`]: [
        { id: 7692130125, sha: deployedSha },
        { id: 7300101642, sha: oldSha },
      ],
      "deployments/7692130125/statuses": [
        {
          state: "failure",
          log_url: `https://github.com/${policy.repository}/actions/runs/${failedRunId}/job/130074380386`,
        },
      ],
      [`actions/runs/${failedRunId}`]: {
        id: failedRunId,
        path: policy.workflow,
        head_sha: deployedSha,
        head_branch: "main",
        conclusion: "failure",
      },
      [`actions/runs/${failedRunId}/artifacts`]: {
        total_count: 1,
        artifacts: [{ name: `gate7-release-report-${failedRunId}-1`, expired: false }],
      },
    };

    fs.mkdirSync(path.join(dir, "bin"), { recursive: true });
    fs.writeFileSync(path.join(dir, "deployed-report.json"), JSON.stringify(deployedReport));
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(
      path.join(dir, "bin/gh"),
      `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
if (process.argv[2] === "run" && process.argv[3] === "download") {
  const targetDir = process.argv[process.argv.indexOf("--dir") + 1];
  fs.copyFileSync(path.join(${JSON.stringify(dir)}, "deployed-report.json"), path.join(targetDir, "release-report.json"));
  process.exit(0);
}
const responses = JSON.parse(fs.readFileSync(path.join(${JSON.stringify(dir)}, "responses.json"), "utf8"));
const key = process.argv[3].replace(/^repos\\/[^/]+\\/[^/]+\\//, "").replace(/[?&]per_page=100(?:&page=1)?$/, "");
if (!(key in responses)) throw new Error("Unexpected API: " + key);
console.log(JSON.stringify(responses[key]));
`,
      { mode: 0o755 },
    );

    const probe = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { baseline } from ${JSON.stringify(planModuleUrl)}; console.log(JSON.stringify(baseline({ runId: "" })));`,
      ],
      {
        cwd: dir,
        encoding: "utf8",
        env: { ...process.env, PATH: `${path.join(dir, "bin")}:${process.env.PATH}` },
      },
    );
    assert.equal(probe.status, 0, probe.stderr);
    assert.deepEqual(JSON.parse(probe.stdout), {
      sha: deployedSha,
      versionId: deployedVersionId,
      deploymentId: 7692130125,
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
