/**
 * Unit tests for RELEASE-DEPLOY D2 Publish / Apply.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_DEPLOY_D2_PRECONDITIONS,
  runReleaseDeployD2PublishApply,
} from "./release-deploy-d2-publish-apply.mjs";

function writeD2Fixtures(cwd, { certified = true } = {}) {
  fs.mkdirSync(path.join(cwd, "docs/10-validation/release-deploy"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({
      scripts: { "build:web": "vite build" },
    }),
  );
  fs.writeFileSync(path.join(cwd, "vite.config.ts"), "export default {}\n");
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_001_D1_ACTA.md",
    ),
    certified
      ? "# ACTA\n**Estado:** ✅ **CERTIFIED desde `main`**\n"
      : "# ACTA\n**Estado:** ▶ este PR\n",
  );
  fs.writeFileSync(
    path.join(
      cwd,
      "docs/10-validation/release-deploy/RELEASE_DEPLOY_PUBLISH.md",
    ),
    [
      "# Publish",
      "## Canonical steps",
      "build:web",
      "RELEASE_DEPLOY_D2_STARTED",
      "RELEASE_DEPLOY_D2_COMPLETED",
      "",
    ].join("\n"),
  );
}

describe("release-deploy-d2-publish-apply", () => {
  it("lists expected precondition check ids", () => {
    assert.equal(RELEASE_DEPLOY_D2_PRECONDITIONS.length, 4);
    assert.ok(
      RELEASE_DEPLOY_D2_PRECONDITIONS.includes(
        "release_deploy_publish_procedure_present",
      ),
    );
  });

  it("PASS when D1 CERTIFIED, publish procedure, build:web and vite exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-deploy-d2-"));
    writeD2Fixtures(cwd);
    const r = runReleaseDeployD2PublishApply({ cwd });
    assert.equal(r.ok, true);
    assert.ok(r.checks.includes("release_deploy_d1_acta_certified"));
    assert.ok(r.checks.includes("release_deploy_build_web_script_present"));
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_DEPLOY_D2_STARTED",
      "RELEASE_DEPLOY_D2_COMPLETED",
    ]);
  });

  it("FAIL when D1 acta is not CERTIFIED from main", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-deploy-d2-"));
    writeD2Fixtures(cwd, { certified: false });
    const r = runReleaseDeployD2PublishApply({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /CERTIFIED/);
  });
});
