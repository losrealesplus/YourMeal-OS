import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { policy } from "./release-plan.mjs";
import { hash } from "./release-contract.mjs";

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
    for (const smoke of ["pass", "fail"]) {
      const result = run(responses, JSON.stringify(valid), {
        FAKE_DEPLOY: "yes",
        FAKE_SMOKE: smoke,
      });
      assert.equal(result.status, smoke === "pass" ? 0 : 1);
      assert.equal(result.report.state, "DEPLOYED");
      assert.equal(result.report.versionId, valid.version_id);
      assert.equal(result.report.deploymentId, "11111111-1111-4111-8111-111111111111");
      assert.equal(result.report.smoke === "PASS", smoke === "pass");
      assert.equal(result.report.humanUX, "HUMAN PRODUCTION VERIFICATION REQUIRED");
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
