import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseReleaseJson, jsonObject, githubResponseShape } from "./release-json.mjs";
const boundaries = [
  [
    "ACTIVATION_INPUT_INVALID",
    "authorized_prs",
    "json-array-of-integer-pr-numbers",
    (v) => Array.isArray(v) && v.every(Number.isSafeInteger),
  ],
  [
    "EVENT_PAYLOAD_INVALID",
    "github_event",
    "json-object-with-optional-inputs-object",
    (v) => jsonObject(v) && (v.inputs === undefined || jsonObject(v.inputs)),
  ],
  ["RELEASE_POLICY_INVALID", "release_policy", "json-object", jsonObject],
  ["GITHUB_API_RESPONSE_INVALID", "deployments", "json-array", Array.isArray],
  ["RELEASE_REPORT_INVALID", "release_report", "json-object", jsonObject],
];
for (const [code, source, expected, accepts] of boundaries)
  test(`distinct fail-closed ${source} diagnostic without values`, () => {
    for (const raw of [
      "486,487,488,489,490",
      "BROKEN_token_SECRET_authorization",
      '"credential" trailing',
      "null",
    ]) {
      assert.throws(
        () => parseReleaseJson(raw, code, source, expected, accepts),
        (error) => {
          assert.equal(
            error.message,
            `${code}: source=${source} expected=${expected} result=FAIL_CLOSED`,
          );
          assert.equal(error.cause, undefined);
          assert.equal(error.message.includes(raw), false);
          return true;
        },
      );
    }
  });
test("valid parsing preserves values and rejects wrong semantic shapes", () => {
  assert.deepEqual(
    parseReleaseJson("[486,487,488,489,490]", ...boundaries[0]),
    [486, 487, 488, 489, 490],
  );
  assert.throws(() => parseReleaseJson('["486"]', ...boundaries[0]));
  assert.throws(() => parseReleaseJson('{"inputs":[]}', ...boundaries[1]));
  assert.equal(githubResponseShape("actions/runs/123/approvals").array, true);
  assert.equal(githubResponseShape("actions/runs/123/artifacts").array, false);
  assert.equal(githubResponseShape("deployments?environment=SECRET").source, "deployments");
});
test("CLI policy, event and API diagnostics emit no raw payload or secrets", () => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "gate7-json-")));
  try {
    const source = path.join(dir, "scripts/governance");
    fs.mkdirSync(source, { recursive: true });
    for (const f of [
      "release-plan.mjs",
      "release-contract.mjs",
      "release-activation.mjs",
      "release-reconciliation.mjs",
      "release-json.mjs",
      "release-policy.json",
    ])
      fs.copyFileSync(`scripts/governance/${f}`, path.join(source, f));
    fs.mkdirSync(path.join(dir, "bin"));
    const event = path.join(dir, "event.json");
    const secret = "SECRET_AUTHORIZATION_SENTINEL";
    fs.writeFileSync(
      path.join(dir, "bin/gh"),
      `#!${process.execPath}\nconsole.log(process.env.FAKE_JSON);`,
      { mode: 0o755 },
    );
    const environment = {
      name: "production-worker",
      can_admins_bypass: false,
      protection_rules: [
        { type: "required_reviewers", reviewers: [{ type: "User", reviewer: { id: 292604102 } }] },
      ],
    };
    const run = () =>
      spawnSync(process.execPath, [path.join(source, "release-plan.mjs")], {
        cwd: dir,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
          GITHUB_REPOSITORY: "losrealesplus/YourMeal-OS",
          GITHUB_REF: "refs/heads/main",
          GITHUB_SHA: "a".repeat(40),
          GITHUB_RUN_ID: "123",
          GITHUB_RUN_ATTEMPT: "1",
          GITHUB_EVENT_NAME: "workflow_dispatch",
          GITHUB_EVENT_PATH: event,
          FAKE_JSON: JSON.stringify(environment),
          GH_TOKEN: secret,
        },
      });
    fs.writeFileSync(event, secret);
    let result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /EVENT_PAYLOAD_INVALID/);
    assert.equal(result.stderr.includes(secret), false);
    fs.writeFileSync(path.join(source, "release-policy.json"), secret);
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /RELEASE_POLICY_INVALID/);
    assert.equal(result.stderr.includes(secret), false);
    fs.copyFileSync(
      "scripts/governance/release-policy.json",
      path.join(source, "release-policy.json"),
    );
    fs.writeFileSync(
      path.join(dir, "bin/gh"),
      `#!${process.execPath}\nconsole.log('486,487 SECRET_AUTHORIZATION_SENTINEL');`,
      { mode: 0o755 },
    );
    result = run();
    assert.equal(result.status, 1);
    assert.match(result.stderr, /GITHUB_API_RESPONSE_INVALID: source=production_environment/);
    assert.equal(result.stderr.includes(secret), false);
    assert.equal(fs.existsSync(path.join(dir, "artifacts/release-plan.json")), false);
    // Exercise the real downloaded-ledger parser with real historical Git objects.
    const root = process.cwd();
    const sha = "4ac3fddb0b1fd855beab39dbbcb4d70c81919592";
    const responses = {
      "deployments?environment=production-worker&per_page=100&page=1": [{ id: 1, sha }],
      "deployments/1/statuses?per_page=100&page=1": [
        {
          state: "success",
          log_url: "https://github.com/losrealesplus/YourMeal-OS/actions/runs/1/job/2",
        },
      ],
      "actions/runs/1": {
        id: 1,
        path: ".github/workflows/deploy-production.yml",
        head_sha: sha,
        head_branch: "main",
      },
      "actions/runs/1/artifacts?per_page=100": {
        total_count: 1,
        artifacts: [{ name: "gate7-release-report-1-1", expired: false }],
      },
    };
    fs.writeFileSync(path.join(dir, "responses.json"), JSON.stringify(responses));
    fs.writeFileSync(
      path.join(dir, "bin/gh"),
      `#!${process.execPath}\nconst fs=require('fs');if(process.argv[2]==='run'){fs.writeFileSync(require('path').join(process.argv[process.argv.indexOf('--dir')+1],'release-report.json'),'BROKEN_SECRET_AUTHORIZATION_SENTINEL')}else{const key=process.argv[3].replace(/^repos\\/losrealesplus\\/YourMeal-OS\\//,'');const data=JSON.parse(fs.readFileSync(process.env.FAKE_RESPONSES));if(!(key in data))throw Error('Unexpected fixture endpoint');console.log(JSON.stringify(data[key]));}`,
      { mode: 0o755 },
    );
    result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import {baseline} from ${JSON.stringify(new URL("file://" + path.join(root, "scripts/governance/release-plan.mjs")).href)};try{baseline({runId:'123'})}catch(e){console.error(e.message);process.exitCode=1}`,
      ],
      {
        cwd: root,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${path.join(dir, "bin")}:${process.env.PATH}`,
          FAKE_RESPONSES: path.join(dir, "responses.json"),
        },
      },
    );
    assert.equal(result.status, 1, result.stderr);
    assert.match(
      result.stderr,
      /RELEASE_REPORT_INVALID: source=release_report expected=json-object result=FAIL_CLOSED/,
    );
    assert.equal(result.stderr.includes(secret), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
