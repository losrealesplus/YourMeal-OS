/**
 * Unit tests for RELEASE-CROSSFLOW C4 Inventory Consumption.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_CROSSFLOW_C4_MAPPED_TOKENS,
  runReleaseCrossflowC4Inventory,
} from "./release-crossflow-c4-inventory.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-crossflow-c4-"));
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
  execFileSync("git", ["tag", "flow04-pass"], { cwd: dir, stdio: "ignore" });
  return dir;
}

function writeSurfaces(cwd) {
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "test:flow04-canonical": "node x.mjs" },
    }),
  );
  fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-04"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
  fs.writeFileSync(
    path.join(cwd, "docs/10-validation/flow-04/FLOW04_PASS_ACTA.md"),
    "# PASS\n",
  );
  fs.writeFileSync(
    path.join(cwd, "docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md"),
    "# Spec\n",
  );
}

describe("release-crossflow-c4-inventory", () => {
  it("maps FLOW-04 T1…T3 tokens", () => {
    assert.equal(RELEASE_CROSSFLOW_C4_MAPPED_TOKENS.length, 6);
    assert.equal(RELEASE_CROSSFLOW_C4_MAPPED_TOKENS[0], "FLOW04_T1_STARTED");
    assert.equal(
      RELEASE_CROSSFLOW_C4_MAPPED_TOKENS[5],
      "FLOW04_T3_COMPLETED",
    );
  });

  it("PASS when FLOW-04 script, tag, acta, and spec exist", () => {
    const cwd = tempGitRepo();
    writeSurfaces(cwd);
    const r = runReleaseCrossflowC4Inventory({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("flow04_pass_tag_present"));
  });

  it("FAIL when flow04-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "flow04-pass"], {
      cwd,
      stdio: "ignore",
    });
    writeSurfaces(cwd);
    const r = runReleaseCrossflowC4Inventory({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /flow04-pass/);
  });
});
