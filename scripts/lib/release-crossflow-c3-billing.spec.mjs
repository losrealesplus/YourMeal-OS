/**
 * Unit tests for RELEASE-CROSSFLOW C3 Billing.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_CROSSFLOW_C3_MAPPED_TOKENS,
  runReleaseCrossflowC3Billing,
} from "./release-crossflow-c3-billing.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-crossflow-c3-"));
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
  execFileSync("git", ["tag", "flow03-pass"], { cwd: dir, stdio: "ignore" });
  return dir;
}

function writeSurfaces(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:flow03-canonical": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-03"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/flow-03/FLOW03_PASS_ACTA.md"),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/FLOW_03_BILLING_SPEC.md"),
    "# Spec\n",
  );
}

describe("release-crossflow-c3-billing", () => {
  it("maps FLOW-03 T1…T3 tokens", () => {
    assert.equal(RELEASE_CROSSFLOW_C3_MAPPED_TOKENS.length, 6);
    assert.equal(RELEASE_CROSSFLOW_C3_MAPPED_TOKENS[0], "FLOW03_T1_STARTED");
    assert.equal(
      RELEASE_CROSSFLOW_C3_MAPPED_TOKENS[5],
      "FLOW03_T3_COMPLETED",
    );
  });

  it("PASS when FLOW-03 script, tag, acta, and spec exist", () => {
    const cwd = tempGitRepo();
    writeSurfaces(cwd);
    const r = runReleaseCrossflowC3Billing({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("flow03_pass_tag_present"));
  });

  it("FAIL when flow03-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "flow03-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeSurfaces(cwd);
    const r = runReleaseCrossflowC3Billing({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /flow03-pass/);
  });
});
