/**
 * Unit tests for RELEASE-CROSSFLOW C1 Kitchen → Delivery.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  RELEASE_CROSSFLOW_C1_MAPPED_TOKENS,
  runReleaseCrossflowC1KitchenDelivery,
} from "./release-crossflow-c1-kitchen-delivery.mjs";

function tempGitRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "release-crossflow-c1-"));
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
  execFileSync("git", ["tag", "flow01-pass"], { cwd: dir, stdio: "ignore" });
  return dir;
}

describe("release-crossflow-c1-kitchen-delivery", () => {
  it("maps FLOW-01 T1…T4 tokens", () => {
    assert.equal(RELEASE_CROSSFLOW_C1_MAPPED_TOKENS.length, 8);
    assert.equal(RELEASE_CROSSFLOW_C1_MAPPED_TOKENS[0], "FLOW01_T1_STARTED");
    assert.equal(
      RELEASE_CROSSFLOW_C1_MAPPED_TOKENS[7],
      "FLOW01_T4_COMPLETED",
    );
  });

  it("PASS when FLOW-01 script, tag, acta, and spec exist", () => {
    const cwd = tempGitRepo();
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:flow01-canonical": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-01"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "docs/10-validation/flow-01/FLOW01_PASS_ACTA.md"),
      "# PASS\n",
    );
    fs.writeFileSync(
      path.join(cwd, "docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md"),
      "# Spec\n",
    );

    const r = runReleaseCrossflowC1KitchenDelivery({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("flow01_pass_tag_present"));
    assert.ok(r.checks.includes("flow01_canonical_pipeline_intact"));
  });

  it("FAIL when flow01-pass tag missing", () => {
    const cwd = tempGitRepo();
    execFileSync("git", ["tag", "-d", "flow01-pass"], {
      cwd,
      stdio: "ignore",
    });
    fs.writeFileSync(
      path.join(cwd, "package.json"),
      JSON.stringify({
        scripts: { "test:flow01-canonical": "node x.mjs" },
      }),
    );
    fs.mkdirSync(path.join(cwd, "docs/10-validation/flow-01"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(cwd, "docs/00-status"), { recursive: true });
    fs.writeFileSync(
      path.join(cwd, "docs/10-validation/flow-01/FLOW01_PASS_ACTA.md"),
      "# PASS\n",
    );
    fs.writeFileSync(
      path.join(cwd, "docs/00-status/FLOW_01_KITCHEN_DELIVERY_SPEC.md"),
      "# Spec\n",
    );

    const r = runReleaseCrossflowC1KitchenDelivery({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /flow01-pass/);
  });
});
