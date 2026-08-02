/**
 * Unit tests for RELEASE-E2E E3 Incident → Billing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_E2E_E3_MAPPED_TOKENS,
  runReleaseE2eE3IncidentBilling,
} from "./release-e2e-e3-incident-billing.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-e2e-e3-"));
  execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "t@example.com"], {
    cwd: dir,
    stdio: "ignore",
  });
  execFileSync("git", ["config", "user.name", "t"], {
    cwd: dir,
    stdio: "ignore",
  });
  fs.writeFileSync(path.join(dir, "README.md"), "x\n");
  execFileSync("git", ["add", "README.md"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["tag", "flow02-pass"], { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["tag", "flow03-pass"], { cwd: dir, stdio: "ignore" });
  return dir;
}

function writeFixtures(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: {
        "test:flow02-canonical": "node x.mjs",
        "test:flow03-canonical": "node y.mjs",
      },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-02"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-03"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/flow-02/FLOW02_PASS_ACTA.md"),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/flow-03/FLOW03_PASS_ACTA.md"),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/FLOW_02_DELIVERY_INCIDENTS_SPEC.md"),
    "# Spec\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/FLOW_03_BILLING_SPEC.md"),
    "# Spec\n",
  );
}

describe("release-e2e-e3-incident-billing", () => {
  it("maps FLOW-02 T1…T3 then FLOW-03 T1…T3 tokens", () => {
    assert.equal(RELEASE_E2E_E3_MAPPED_TOKENS.length, 12);
    assert.equal(RELEASE_E2E_E3_MAPPED_TOKENS[0], "FLOW02_T1_STARTED");
    assert.equal(RELEASE_E2E_E3_MAPPED_TOKENS[5], "FLOW02_T3_COMPLETED");
    assert.equal(RELEASE_E2E_E3_MAPPED_TOKENS[6], "FLOW03_T1_STARTED");
    assert.equal(RELEASE_E2E_E3_MAPPED_TOKENS[11], "FLOW03_T3_COMPLETED");
  });

  it("PASS when FLOW-02/03 scripts, tags, actas, and specs exist", () => {
    const cwd = tempGitRepo();
    writeFixtures(cwd);

    const r = runReleaseE2eE3IncidentBilling({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("flow02_pass_tag_present"));
    assert.ok(r.checks.includes("flow03_pass_tag_present"));
    assert.ok(r.checks.includes("flow02_canonical_pipeline_intact"));
    assert.ok(r.checks.includes("flow03_canonical_pipeline_intact"));
  });

  it("FAIL when flow03-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "flow03-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeFixtures(cwd);

    const r = runReleaseE2eE3IncidentBilling({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /flow03-pass/);
  });
});
