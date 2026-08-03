/**
 * Unit tests for RELEASE-01 P1 Platform Foundation.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  RELEASE_01_P1_PRECONDITIONS,
  runRelease01P1PlatformFoundation,
} from "./release-01-p1-platform-foundation.mjs";

function writeP1Fixtures(cwd) {
  const files = [
    "src/auth/session.ts",
    "docs/adr/0003-multi-tenant.md",
    "src/permissions/index.ts",
    "src/routes/_authenticated/app.settings.profile.tsx",
    "src/i18n/index.ts",
    "src/routes/_authenticated/app.settings.tsx",
  ];
  for (const rel of files) {
    const p = path.join(cwd, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, "// fixture\n");
  }
}

describe("release-01-p1-platform-foundation", () => {
  it("lists expected platform check ids", () => {
    assert.equal(RELEASE_01_P1_PRECONDITIONS.length, 6);
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("authentication_present"));
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("tenant_system_present"));
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("rbac_present"));
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("profiles_present"));
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("localization_present"));
    assert.ok(RELEASE_01_P1_PRECONDITIONS.includes("settings_present"));
  });

  it("PASS when all six platform anchors exist", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p1-"));
    writeP1Fixtures(cwd);
    const r = runRelease01P1PlatformFoundation({ cwd });
    assert.equal(r.ok, true);
    assert.deepEqual(r.checks, [...RELEASE_01_P1_PRECONDITIONS]);
    assert.deepEqual(r.mapped_tokens, [
      "RELEASE_01_P1_STARTED",
      "RELEASE_01_P1_COMPLETED",
    ]);
  });

  it("FAIL when authentication anchor missing", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "release-01-p1-"));
    writeP1Fixtures(cwd);
    fs.unlinkSync(path.join(cwd, "src/auth/session.ts"));
    const r = runRelease01P1PlatformFoundation({ cwd });
    assert.equal(r.ok, false);
    assert.match(r.reason, /Authentication|session\.ts/);
  });
});
